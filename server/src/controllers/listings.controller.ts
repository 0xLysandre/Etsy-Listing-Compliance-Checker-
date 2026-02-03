import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { listings, violationChecks } from '../db/schema.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { SUBSCRIPTION_LIMITS } from '../types/index.js';

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
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = createListingSchema.safeParse(req.body);
    if (!validation.success) {
      throw BadRequestError(validation.error.errors[0].message);
    }

    // Check subscription limits
    const listingCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .where(eq(listings.userId, req.user!.id));

    const listingCount = listingCountResult[0]?.count || 0;

    const limits = SUBSCRIPTION_LIMITS[req.user!.subscriptionTier];
    if (limits.maxListings !== -1 && listingCount >= limits.maxListings) {
      throw ForbiddenError(
        `You have reached your listing limit (${limits.maxListings}). Upgrade your subscription to add more listings.`
      );
    }

    const [listing] = await db
      .insert(listings)
      .values({
        ...validation.data,
        price: validation.data.price.toString(),
        userId: req.user!.id,
      })
      .returning();

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
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const userListings = await db.query.listings.findMany({
      where: eq(listings.userId, req.user!.id),
      offset,
      limit,
      orderBy: desc(listings.createdAt),
      with: {
        violationChecks: {
          limit: 1,
          orderBy: desc(violationChecks.checkDate),
        },
      },
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .where(eq(listings.userId, req.user!.id));

    const total = totalResult[0]?.count || 0;

    // Transform to include _count
    const listingsWithCount = userListings.map(listing => ({
      ...listing,
      _count: {
        violationChecks: listing.violationChecks?.length || 0,
      },
    }));

    res.json({
      success: true,
      data: listingsWithCount,
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
  res: Response,
  next: NextFunction
) => {
  try {
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, req.params.id),
      with: {
        violationChecks: {
          limit: 5,
          orderBy: desc(violationChecks.checkDate),
          with: {
            violations: {
              with: {
                policyRule: true,
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
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = updateListingSchema.safeParse(req.body);
    if (!validation.success) {
      throw BadRequestError(validation.error.errors[0].message);
    }

    const updateData = {
      ...validation.data,
      price: validation.data.price?.toString(),
      updatedAt: new Date(),
    };

    const [listing] = await db
      .update(listings)
      .set(updateData)
      .where(eq(listings.id, req.params.id))
      .returning();

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
  res: Response,
  next: NextFunction
) => {
  try {
    await db.delete(listings).where(eq(listings.id, req.params.id));

    res.json({
      success: true,
      data: { message: 'Listing deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};
