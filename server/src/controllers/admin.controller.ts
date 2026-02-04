import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { eq, desc, asc, ilike, or, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { policyRules } from '../db/schema.js';
import type { Severity } from '../db/schema.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

// Validation schemas
const createPolicyRuleSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  ruleName: z.string().min(1, 'Rule name is required'),
  ruleText: z.string().min(1, 'Rule text is required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  keywords: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

const updatePolicyRuleSchema = z.object({
  category: z.string().min(1).optional(),
  ruleName: z.string().min(1).optional(),
  ruleText: z.string().min(1).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  keywords: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// Get all policy rules with filtering and pagination
export const getAllPolicyRules = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = '1',
      limit = '50',
      category,
      severity,
      isActive,
      search,
      sortBy = 'category',
      sortOrder = 'asc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const conditions = [];

    if (category) {
      conditions.push(eq(policyRules.category, category as string));
    }

    if (severity) {
      conditions.push(eq(policyRules.severity, severity as Severity));
    }

    if (isActive !== undefined) {
      conditions.push(eq(policyRules.isActive, isActive === 'true'));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(policyRules.ruleName, searchTerm),
          ilike(policyRules.ruleText, searchTerm),
          ilike(policyRules.category, searchTerm)
        )
      );
    }

    // Build order by
    const orderColumn = sortBy === 'severity'
      ? policyRules.severity
      : sortBy === 'ruleName'
        ? policyRules.ruleName
        : sortBy === 'createdAt'
          ? policyRules.createdAt
          : policyRules.category;

    const orderDirection = sortOrder === 'desc' ? desc : asc;

    // Execute query
    const rules = await db.query.policyRules.findMany({
      where: conditions.length > 0 ? sql`${conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`)}` : undefined,
      orderBy: orderDirection(orderColumn),
      limit: limitNum,
      offset: offset,
    });

    // Get total count
    const allRules = await db.query.policyRules.findMany({
      where: conditions.length > 0 ? sql`${conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`)}` : undefined,
    });
    const total = allRules.length;

    // Get category and severity counts for filters
    const allRulesForStats = await db.query.policyRules.findMany();
    const categories = [...new Set(allRulesForStats.map(r => r.category))];
    const severityCounts = {
      CRITICAL: allRulesForStats.filter(r => r.severity === 'CRITICAL').length,
      HIGH: allRulesForStats.filter(r => r.severity === 'HIGH').length,
      MEDIUM: allRulesForStats.filter(r => r.severity === 'MEDIUM').length,
      LOW: allRulesForStats.filter(r => r.severity === 'LOW').length,
    };

    res.json({
      success: true,
      data: rules,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        categories,
        severityCounts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single policy rule by ID
export const getPolicyRuleById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const rule = await db.query.policyRules.findFirst({
      where: eq(policyRules.id, id),
    });

    if (!rule) {
      throw NotFoundError('Policy rule not found');
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

// Create new policy rule
export const createPolicyRule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = createPolicyRuleSchema.safeParse(req.body);
    if (!validation.success) {
      throw BadRequestError(validation.error.errors[0].message);
    }

    const { category, ruleName, ruleText, severity, keywords, isActive } = validation.data;

    const [rule] = await db
      .insert(policyRules)
      .values({
        category,
        ruleName,
        ruleText,
        severity,
        keywords,
        isActive,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Policy rule created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Update policy rule
export const updatePolicyRule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const validation = updatePolicyRuleSchema.safeParse(req.body);
    if (!validation.success) {
      throw BadRequestError(validation.error.errors[0].message);
    }

    // Check if rule exists
    const existingRule = await db.query.policyRules.findFirst({
      where: eq(policyRules.id, id),
    });

    if (!existingRule) {
      throw NotFoundError('Policy rule not found');
    }

    const updateData = {
      ...validation.data,
      updatedAt: new Date(),
    };

    const [updatedRule] = await db
      .update(policyRules)
      .set(updateData)
      .where(eq(policyRules.id, id))
      .returning();

    res.json({
      success: true,
      data: updatedRule,
      message: 'Policy rule updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Toggle policy rule active status
export const togglePolicyRuleStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const existingRule = await db.query.policyRules.findFirst({
      where: eq(policyRules.id, id),
    });

    if (!existingRule) {
      throw NotFoundError('Policy rule not found');
    }

    const [updatedRule] = await db
      .update(policyRules)
      .set({
        isActive: !existingRule.isActive,
        updatedAt: new Date(),
      })
      .where(eq(policyRules.id, id))
      .returning();

    res.json({
      success: true,
      data: updatedRule,
      message: `Policy rule ${updatedRule.isActive ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// Delete policy rule
export const deletePolicyRule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const existingRule = await db.query.policyRules.findFirst({
      where: eq(policyRules.id, id),
    });

    if (!existingRule) {
      throw NotFoundError('Policy rule not found');
    }

    await db.delete(policyRules).where(eq(policyRules.id, id));

    res.json({
      success: true,
      message: 'Policy rule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Bulk update policy rules (enable/disable multiple)
export const bulkUpdatePolicyRules = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw BadRequestError('Please provide an array of rule IDs');
    }

    if (typeof isActive !== 'boolean') {
      throw BadRequestError('Please provide isActive status (true/false)');
    }

    let updatedCount = 0;
    for (const id of ids) {
      const result = await db
        .update(policyRules)
        .set({
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(policyRules.id, id));
      updatedCount++;
    }

    res.json({
      success: true,
      message: `${updatedCount} policy rules ${isActive ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// Get policy rule statistics
export const getPolicyRuleStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const allRules = await db.query.policyRules.findMany();

    const stats = {
      total: allRules.length,
      active: allRules.filter(r => r.isActive).length,
      inactive: allRules.filter(r => !r.isActive).length,
      bySeverity: {
        CRITICAL: allRules.filter(r => r.severity === 'CRITICAL').length,
        HIGH: allRules.filter(r => r.severity === 'HIGH').length,
        MEDIUM: allRules.filter(r => r.severity === 'MEDIUM').length,
        LOW: allRules.filter(r => r.severity === 'LOW').length,
      },
      byCategory: {} as Record<string, number>,
      totalKeywords: allRules.reduce((sum, r) => sum + r.keywords.length, 0),
    };

    // Count by category
    for (const rule of allRules) {
      stats.byCategory[rule.category] = (stats.byCategory[rule.category] || 0) + 1;
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
