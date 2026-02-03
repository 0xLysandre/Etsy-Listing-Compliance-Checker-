import { Response, NextFunction } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { listings, violationChecks } from '../db/schema.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { SUBSCRIPTION_LIMITS } from '../types/index.js';
import { runComplianceCheck as runCheck } from '../services/compliance.service.js';

// Run a compliance check on a listing
export const runComplianceCheck = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { listingId } = req.params;

    // Verify the listing exists and belongs to the user
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, listingId),
      columns: { userId: true },
    });

    if (!listing) {
      throw NotFoundError('Listing not found');
    }

    if (listing.userId !== req.user!.id) {
      throw ForbiddenError('You do not have access to this listing');
    }

    // Check subscription limits for monthly checks
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get all user's listings to count checks
    const userListings = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.userId, req.user!.id));

    const listingIds = userListings.map(l => l.id);

    let checksThisMonth = 0;
    if (listingIds.length > 0) {
      const checksResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(violationChecks)
        .where(
          sql`${violationChecks.listingId} = ANY(${listingIds}) AND ${violationChecks.checkDate} >= ${startOfMonth}`
        );
      checksThisMonth = checksResult[0]?.count || 0;
    }

    const limits = SUBSCRIPTION_LIMITS[req.user!.subscriptionTier];
    if (limits.maxChecksPerMonth !== -1 && checksThisMonth >= limits.maxChecksPerMonth) {
      throw ForbiddenError(
        `You have reached your monthly check limit (${limits.maxChecksPerMonth}). Upgrade your subscription for more checks.`
      );
    }

    // Run the compliance check
    const result = await runCheck(listingId);

    // Get full check details
    const check = await db.query.violationChecks.findFirst({
      where: eq(violationChecks.id, result.checkId),
      with: {
        violations: {
          with: {
            policyRule: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: check,
    });
  } catch (error) {
    next(error);
  }
};

// Get check history for a listing
export const getCheckHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { listingId } = req.params;

    // Verify the listing exists and belongs to the user
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, listingId),
      columns: { userId: true },
    });

    if (!listing) {
      throw NotFoundError('Listing not found');
    }

    if (listing.userId !== req.user!.id) {
      throw ForbiddenError('You do not have access to this listing');
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const checks = await db.query.violationChecks.findMany({
      where: eq(violationChecks.listingId, listingId),
      offset,
      limit,
      orderBy: desc(violationChecks.checkDate),
      with: {
        violations: {
          columns: {
            id: true,
            severity: true,
            violationText: true,
          },
        },
      },
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(violationChecks)
      .where(eq(violationChecks.listingId, listingId));

    const total = totalResult[0]?.count || 0;

    res.json({
      success: true,
      data: checks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get specific check result
export const getCheckResult = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const check = await db.query.violationChecks.findFirst({
      where: eq(violationChecks.id, req.params.id),
      with: {
        listing: {
          columns: {
            id: true,
            title: true,
            userId: true,
          },
        },
        violations: {
          with: {
            policyRule: true,
          },
        },
      },
    });

    if (!check) {
      throw NotFoundError('Check not found');
    }

    res.json({
      success: true,
      data: check,
    });
  } catch (error) {
    next(error);
  }
};
