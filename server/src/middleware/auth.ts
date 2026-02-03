import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, listings, violationChecks } from '../db/schema.js';
import type { SubscriptionTier } from '../db/schema.js';
import { UnauthorizedError, ForbiddenError } from './errorHandler.js';

export interface JwtPayload {
  userId: string;
  email: string;
  type?: 'access' | 'refresh';
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    emailVerified: boolean;
    subscriptionTier: SubscriptionTier;
  };
}

// Middleware to verify JWT token
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as JwtPayload;

    // Check if it's an access token (not a refresh token)
    if (decoded.type === 'refresh') {
      throw UnauthorizedError('Invalid token type');
    }

    // Fetch user from database to ensure they still exist and get current subscription
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
      columns: {
        id: true,
        email: true,
        emailVerified: true,
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      throw UnauthorizedError('User not found');
    }

    if (user.subscriptionStatus === 'CANCELLED') {
      throw ForbiddenError('Subscription cancelled. Please renew to continue.');
    }

    req.user = {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      subscriptionTier: user.subscriptionTier,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};

// Middleware to require email verification
export const requireVerifiedEmail = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(UnauthorizedError('Authentication required'));
  }

  if (!req.user.emailVerified) {
    return next(
      ForbiddenError('Please verify your email address to access this feature')
    );
  }

  next();
};

// Middleware to check subscription tier
export const requireSubscription = (allowedTiers: SubscriptionTier[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(UnauthorizedError('Authentication required'));
    }

    if (!allowedTiers.includes(req.user.subscriptionTier)) {
      return next(
        ForbiddenError(
          `This feature requires a ${allowedTiers.join(' or ')} subscription`
        )
      );
    }

    next();
  };
};

// Middleware to check if user owns a resource
export const requireOwnership = (resourceType: 'listing' | 'check') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw UnauthorizedError('Authentication required');
      }

      const resourceId = req.params.id;

      if (!resourceId) {
        return next();
      }

      let isOwner = false;

      if (resourceType === 'listing') {
        const listing = await db.query.listings.findFirst({
          where: eq(listings.id, resourceId),
          columns: { userId: true },
        });
        isOwner = listing?.userId === req.user.id;
      } else if (resourceType === 'check') {
        const check = await db.query.violationChecks.findFirst({
          where: eq(violationChecks.id, resourceId),
          with: {
            listing: {
              columns: { userId: true },
            },
          },
        });
        isOwner = check?.listing?.userId === req.user.id;
      }

      if (!isOwner) {
        throw ForbiddenError('You do not have access to this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
