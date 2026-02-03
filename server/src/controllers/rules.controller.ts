import { Response, NextFunction } from 'express';
import { eq, and, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { policyRules } from '../db/schema.js';
import type { Severity } from '../db/schema.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

// Get all policy rules
export const getPolicyRules = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, severity } = req.query;

    let rules;

    if (category && severity) {
      rules = await db.query.policyRules.findMany({
        where: and(
          eq(policyRules.isActive, true),
          eq(policyRules.category, category as string),
          eq(policyRules.severity, (severity as string).toUpperCase() as Severity)
        ),
        orderBy: [asc(policyRules.category)],
      });
    } else if (category) {
      rules = await db.query.policyRules.findMany({
        where: and(
          eq(policyRules.isActive, true),
          eq(policyRules.category, category as string)
        ),
        orderBy: [asc(policyRules.category)],
      });
    } else if (severity) {
      rules = await db.query.policyRules.findMany({
        where: and(
          eq(policyRules.isActive, true),
          eq(policyRules.severity, (severity as string).toUpperCase() as Severity)
        ),
        orderBy: [asc(policyRules.category)],
      });
    } else {
      rules = await db.query.policyRules.findMany({
        where: eq(policyRules.isActive, true),
        orderBy: [asc(policyRules.category)],
      });
    }

    // Group rules by category
    const groupedRules = rules.reduce(
      (acc, rule) => {
        if (!acc[rule.category]) {
          acc[rule.category] = [];
        }
        acc[rule.category].push(rule);
        return acc;
      },
      {} as Record<string, typeof rules>
    );

    res.json({
      success: true,
      data: {
        rules,
        grouped: groupedRules,
        total: rules.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific policy rule
export const getPolicyRule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const rule = await db.query.policyRules.findFirst({
      where: eq(policyRules.id, req.params.id),
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
