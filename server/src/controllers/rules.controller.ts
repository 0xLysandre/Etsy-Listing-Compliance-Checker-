import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse } from '../types/index.js';

// Get all policy rules
export const getPolicyRules = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { category, severity } = req.query;

    const where: { category?: string; severity?: string; isActive: boolean } = {
      isActive: true,
    };

    if (category && typeof category === 'string') {
      where.category = category;
    }

    if (severity && typeof severity === 'string') {
      where.severity = severity.toUpperCase();
    }

    const rules = await prisma.policyRule.findMany({
      where,
      orderBy: [{ category: 'asc' }, { severity: 'desc' }],
      select: {
        id: true,
        category: true,
        ruleName: true,
        ruleText: true,
        severity: true,
        keywords: true,
      },
    });

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
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const rule = await prisma.policyRule.findUnique({
      where: { id: req.params.id },
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
