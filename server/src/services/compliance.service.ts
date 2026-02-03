import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { listings, policyRules, violationChecks, violations } from '../db/schema.js';
import type { Severity, CheckStatus, Listing, PolicyRule } from '../db/schema.js';

export interface ViolationMatch {
  policyRuleId: string;
  violationText: string;
  severity: Severity;
  suggestion: string;
  matchedText: string;
}

// Check a listing against all active policy rules
export async function checkListingCompliance(listing: Listing): Promise<ViolationMatch[]> {
  const foundViolations: ViolationMatch[] = [];

  // Get all active policy rules
  const rules = await db.query.policyRules.findMany({
    where: eq(policyRules.isActive, true),
  });

  // Combine all text content to check
  const textToCheck = [
    listing.title,
    listing.description,
    ...(listing.tags || []),
    ...(listing.materials || []),
  ]
    .join(' ')
    .toLowerCase();

  for (const rule of rules) {
    const matchedKeywords = checkKeywords(textToCheck, rule.keywords || []);

    if (matchedKeywords.length > 0) {
      foundViolations.push({
        policyRuleId: rule.id,
        violationText: rule.ruleText,
        severity: rule.severity,
        suggestion: generateSuggestion(rule, matchedKeywords),
        matchedText: matchedKeywords.join(', '),
      });
    }
  }

  return foundViolations;
}

// Check for keyword matches
function checkKeywords(text: string, keywords: string[]): string[] {
  const matchedKeywords: string[] = [];

  for (const keyword of keywords) {
    // Use word boundary matching for more accurate detection
    const regex = new RegExp(`\\b${escapeRegex(keyword.toLowerCase())}\\b`, 'i');
    if (regex.test(text)) {
      matchedKeywords.push(keyword);
    }
  }

  return matchedKeywords;
}

// Escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Generate a helpful suggestion based on the rule and matched keywords
function generateSuggestion(rule: PolicyRule, matchedKeywords: string[]): string {
  const suggestions: Record<string, string> = {
    prohibited_items: `Remove references to prohibited items (${matchedKeywords.join(', ')}). Consider alternative product descriptions that don't include restricted content.`,
    intellectual_property: `Remove or replace trademarked/copyrighted terms (${matchedKeywords.join(', ')}). Use generic descriptions or ensure you have proper licensing.`,
    listing_requirements: `Update your listing to meet Etsy's requirements. The following terms may need attention: ${matchedKeywords.join(', ')}.`,
    safety: `Review safety guidelines for your product category. Ensure proper warnings and compliance information are included.`,
    prohibited_services: `Restructure your listing to focus on a tangible product rather than a service. Consider offering a physical or digital deliverable.`,
  };

  return suggestions[rule.category] || `Review and update content containing: ${matchedKeywords.join(', ')}.`;
}

// Run a full compliance check and save results
export async function runComplianceCheck(listingId: string): Promise<{
  checkId: string;
  violationsFound: number;
  status: CheckStatus;
}> {
  // Get the listing
  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  // Create the violation check record
  const [check] = await db
    .insert(violationChecks)
    .values({
      listingId,
      status: 'IN_PROGRESS',
    })
    .returning();

  try {
    // Run the compliance check
    const foundViolations = await checkListingCompliance(listing);

    // Save violations
    if (foundViolations.length > 0) {
      await db.insert(violations).values(
        foundViolations.map((v) => ({
          checkId: check.id,
          policyRuleId: v.policyRuleId,
          violationText: v.violationText,
          severity: v.severity,
          suggestion: v.suggestion,
          matchedText: v.matchedText,
        }))
      );
    }

    // Update the check with results
    const [updatedCheck] = await db
      .update(violationChecks)
      .set({
        violationsFound: foundViolations.length,
        status: 'COMPLETED' as CheckStatus,
        completedAt: new Date(),
      })
      .where(eq(violationChecks.id, check.id))
      .returning();

    return {
      checkId: updatedCheck.id,
      violationsFound: updatedCheck.violationsFound,
      status: updatedCheck.status,
    };
  } catch (error) {
    // Mark check as failed
    await db
      .update(violationChecks)
      .set({
        status: 'FAILED' as CheckStatus,
      })
      .where(eq(violationChecks.id, check.id));

    throw error;
  }
}
