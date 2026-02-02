import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse, SUBSCRIPTION_LIMITS } from '../types/index.js';

// Validation schemas
const createListingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(140, 'Title must be less than 140 characters'),
  description: z.string().min(1, 'Description is required'),
  tags: z.array(z.string()).max(13, 'Maximum 13 tags allowed'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive'),
  materials: z.array(z.string()).optional().default([]),
  imageUrls: z.array(z.string().url()).optional().default([]),
  etsyUrl: z.string().url().optional(),
});

const updateListingSchema = createListingSchema.partial();

// Create a new listing
export const createListing = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const validation = createListingSchema.safeParse(req.body);
    if (!validation.success) {
      throw BadRequestError(validation.error.errors[0].message);
    }

    // Check subscription limits
    const listingCount = await prisma.listing.count({
      where: { userId: req.user!.id },
    });

    const limits = SUBSCRIPTION_LIMITS[req.user!.subscriptionTier];
    if (limits.maxListings !== -1 && listingCount >= limits.maxListings) {
      throw ForbiddenError(
        `You have reached your listing limit (${limits.maxListings}). Upgrade your subscription to add more listings.`
      );
    }

    const listing = await prisma.listing.create({
      data: {
        ...validation.data,
        userId: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};

// Get all listings for the current user
export const getListings = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where: { userId: req.user!.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              violationChecks: true,
            },
          },
          violationChecks: {
            take: 1,
            orderBy: { checkDate: 'desc' },
            select: {
              id: true,
              checkDate: true,
              violationsFound: true,
              status: true,
            },
          },
        },
      }),
      prisma.listing.count({
        where: { userId: req.user!.id },
      }),
    ]);

    res.json({
      success: true,
      data: listings,
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

// Get a single listing
export const getListing = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        violationChecks: {
          orderBy: { checkDate: 'desc' },
          take: 5,
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
        },
      },
    });

    if (!listing) {
      throw NotFoundError('Listing not found');
    }

    res.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};

// Update a listing
export const updateListing = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const validation = updateListingSchema.safeParse(req.body);
    if (!validation.success) {
      throw BadRequestError(validation.error.errors[0].message);
    }

    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data: validation.data,
    });

    res.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a listing
export const deleteListing = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    await prisma.listing.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      data: { message: 'Listing deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};
