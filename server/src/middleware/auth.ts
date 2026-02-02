import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { UnauthorizedError, ForbiddenError } from './errorHandler.js';
import { SubscriptionTier } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
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

    // Fetch user from database to ensure they still exist and get current subscription
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
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
        const listing = await prisma.listing.findUnique({
          where: { id: resourceId },
          select: { userId: true },
        });
        isOwner = listing?.userId === req.user.id;
      } else if (resourceType === 'check') {
        const check = await prisma.violationCheck.findUnique({
          where: { id: resourceId },
          include: { listing: { select: { userId: true } } },
        });
        isOwner = check?.listing.userId === req.user.id;
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
