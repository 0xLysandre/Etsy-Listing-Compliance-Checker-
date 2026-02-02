import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { BadRequestError, ConflictError, UnauthorizedError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse, AuthResponse } from '../types/index.js';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Generate JWT token
const generateToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register new user
export const register = async (
  req: Request,
  res: Response<ApiResponse<AuthResponse>>,
  next: NextFunction
) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      throw BadRequestError(validation.error.errors[0].message);
    }

    const { email, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw ConflictError('Email already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    });

    // Generate token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (
  req: Request,
  res: Response<ApiResponse<AuthResponse>>,
  next: NextFunction
) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      throw BadRequestError(validation.error.errors[0].message);
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
export const getProfile = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const updateSchema = z.object({
      email: z.string().email('Invalid email address').optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
    });

    const validation = updateSchema.safeParse(req.body);
    if (!validation.success) {
      throw BadRequestError(validation.error.errors[0].message);
    }

    const { email, currentPassword, newPassword } = validation.data;

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        throw BadRequestError('Current password is required to change password');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      const isPasswordValid = await bcrypt.compare(currentPassword, user!.passwordHash);
      if (!isPasswordValid) {
        throw UnauthorizedError('Current password is incorrect');
      }
    }

    // Prepare update data
    const updateData: { email?: string; passwordHash?: string } = {};

    if (email) {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser && existingUser.id !== req.user!.id) {
        throw ConflictError('Email already in use');
      }
      updateData.email = email;
    }

    if (newPassword) {
      const salt = await bcrypt.genSalt(12);
      updateData.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
