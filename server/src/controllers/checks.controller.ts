import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse, SUBSCRIPTION_LIMITS } from '../types/index.js';
import { runComplianceCheck as runCheck } from '../services/compliance.service.js';

// Run a compliance check on a listing
export const runComplianceCheck = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { listingId } = req.params;

    // Verify the listing exists and belongs to the user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
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

    const checksThisMonth = await prisma.violationCheck.count({
      where: {
        listing: { userId: req.user!.id },
        checkDate: { gte: startOfMonth },
      },
    });

    const limits = SUBSCRIPTION_LIMITS[req.user!.subscriptionTier];
    if (limits.maxChecksPerMonth !== -1 && checksThisMonth >= limits.maxChecksPerMonth) {
      throw ForbiddenError(
        `You have reached your monthly check limit (${limits.maxChecksPerMonth}). Upgrade your subscription for more checks.`
      );
    }

    // Run the compliance check
    const result = await runCheck(listingId);

    // Get full check details
    const check = await prisma.violationCheck.findUnique({
      where: { id: result.checkId },
      include: {
        violations: {
          include: {
            policyRule: {
              select: {
                id: true,
                ruleName: true,
                category: true,
              },
            },
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
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { listingId } = req.params;

    // Verify the listing exists and belongs to the user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
    });

    if (!listing) {
      throw NotFoundError('Listing not found');
    }

    if (listing.userId !== req.user!.id) {
      throw ForbiddenError('You do not have access to this listing');
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [checks, total] = await Promise.all([
      prisma.violationCheck.findMany({
        where: { listingId },
        skip,
        take: limit,
        orderBy: { checkDate: 'desc' },
        include: {
          violations: {
            select: {
              id: true,
              severity: true,
              violationText: true,
            },
          },
        },
      }),
      prisma.violationCheck.count({
        where: { listingId },
      }),
    ]);

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
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const check = await prisma.violationCheck.findUnique({
      where: { id: req.params.id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            userId: true,
          },
        },
        violations: {
          include: {
            policyRule: {
              select: {
                id: true,
                ruleName: true,
                category: true,
                ruleText: true,
              },
            },
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
