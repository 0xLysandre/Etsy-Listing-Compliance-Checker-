import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { BadRequestError, ConflictError, UnauthorizedError, NotFoundError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import {
  generateToken as generateRandomToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/email.service.js';

// Password validation regex: min 8 chars, 1 uppercase, 1 number, 1 special char
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one number, and one special character'
    ),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one number, and one special character'
    ),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Generate JWT access token
const generateAccessToken = (userId: string, email: string, expiresIn: string = '15m'): string => {
  return jwt.sign(
    { userId, email, type: 'access' },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn }
  );
};

// Generate JWT refresh token
const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default-refresh-secret',
    { expiresIn: '7d' }
  );
};

// Register new user
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      throw BadRequestError(validation.error.errors[0].message);
    }

    const { email, password } = validation.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      throw ConflictError('Email already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate email verification token
    const emailVerificationToken = generateRandomToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        emailVerified: false,
        emailVerificationToken,
        emailVerificationExpires,
      })
      .returning({
        id: users.id,
        email: users.email,
        emailVerified: users.emailVerified,
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus,
      });

    // Send verification email
    await sendVerificationEmail(email, emailVerificationToken);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db
      .update(users)
      .set({ refreshToken, refreshTokenExpires })
      .where(eq(users.id, user.id));

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
        message: 'Registration successful. Please check your email to verify your account.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify email
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = verifyEmailSchema.safeParse(req.body);
    if (!validation.success) {
      throw BadRequestError(validation.error.errors[0].message);
    }

    const { token } = validation.data;

    // Find user with valid token
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.emailVerificationToken, token),
        gt(users.emailVerificationExpires, new Date())
      ),
    });

    if (!user) {
      throw BadRequestError('Invalid or expired verification token');
    }

    // Update user as verified
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    res.json({
      success: true,
      data: {
        message: 'Email verified successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Resend verification email
export const resendVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user!.id),
    });

    if (!user) {
      throw UnauthorizedError('User not found');
    }

    if (user.emailVerified) {
      throw BadRequestError('Email is already verified');
    }

    // Generate new verification token
    const emailVerificationToken = generateRandomToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db
      .update(users)
      .set({
        emailVerificationToken,
        emailVerificationExpires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Send verification email
    await sendVerificationEmail(user.email, emailVerificationToken);

    res.json({
      success: true,
      data: {
        message: 'Verification email sent',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      throw BadRequestError(validation.error.errors[0].message);
    }

    const { email, password, rememberMe } = validation.data;

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw UnauthorizedError('Invalid email or password');
    }

    // Generate access token (shorter expiry if not "remember me")
    const accessTokenExpiry = rememberMe ? '1d' : '15m';
    const accessToken = generateAccessToken(user.id, user.email, accessTokenExpiry);

    // Generate refresh token
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenExpires = new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
    ); // 30 days if remember me, else 7 days

    // Store refresh token
    await db
      .update(users)
      .set({
        refreshToken,
        refreshTokenExpires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh access token
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw BadRequestError('Refresh token is required');
    }

    // Verify refresh token
    let decoded: { userId: string; type: string };
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default-refresh-secret'
      ) as { userId: string; type: string };
    } catch {
      throw UnauthorizedError('Invalid refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw UnauthorizedError('Invalid token type');
    }

    // Find user with valid refresh token
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.id, decoded.userId),
        eq(users.refreshToken, token),
        gt(users.refreshTokenExpires, new Date())
      ),
    });

    if (!user) {
      throw UnauthorizedError('Invalid or expired refresh token');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user.id, user.email);

    // Optionally rotate refresh token
    const newRefreshToken = generateRefreshToken(user.id);
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db
      .update(users)
      .set({
        refreshToken: newRefreshToken,
        refreshTokenExpires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password - request reset
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      throw BadRequestError(validation.error.errors[0].message);
    }

    const { email } = validation.data;

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({
        success: true,
        data: {
          message: 'If an account exists with that email, a password reset link has been sent.',
        },
      });
      return;
    }

    // Generate reset token
    const passwordResetToken = generateRandomToken();
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db
      .update(users)
      .set({
        passwordResetToken,
        passwordResetExpires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Send reset email
    await sendPasswordResetEmail(email, passwordResetToken);

    res.json({
      success: true,
      data: {
        message: 'If an account exists with that email, a password reset link has been sent.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reset password with token
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      throw BadRequestError(validation.error.errors[0].message);
    }

    const { token, password } = validation.data;

    // Find user with valid reset token
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.passwordResetToken, token),
        gt(users.passwordResetExpires, new Date())
      ),
    });

    if (!user) {
      throw BadRequestError('Invalid or expired reset token');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update password and clear reset token
    await db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        // Invalidate all refresh tokens for security
        refreshToken: null,
        refreshTokenExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    res.json({
      success: true,
      data: {
        message: 'Password reset successfully. Please log in with your new password.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout - invalidate refresh token
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user) {
      await db
        .update(users)
        .set({
          refreshToken: null,
          refreshTokenExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.user.id));
    }

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user!.id),
      with: {
        listings: true,
      },
    });

    if (!user) {
      throw UnauthorizedError('User not found');
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        createdAt: user.createdAt,
        _count: {
          listings: user.listings?.length || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const updateSchema = z.object({
      email: z.string().email('Invalid email address').optional(),
      currentPassword: z.string().optional(),
      newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
          passwordRegex,
          'Password must contain at least one uppercase letter, one number, and one special character'
        )
        .optional(),
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

      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user!.id),
      });

      if (!user) {
        throw UnauthorizedError('User not found');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw UnauthorizedError('Current password is incorrect');
      }
    }

    // Prepare update data
    const updateData: {
      email?: string;
      passwordHash?: string;
      emailVerified?: boolean;
      emailVerificationToken?: string;
      emailVerificationExpires?: Date;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (email && email !== req.user!.email) {
      // Check if email is already taken
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      if (existingUser && existingUser.id !== req.user!.id) {
        throw ConflictError('Email already in use');
      }
      updateData.email = email;
      // Require re-verification for new email
      updateData.emailVerified = false;
      updateData.emailVerificationToken = generateRandomToken();
      updateData.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Send verification email for new address
      await sendVerificationEmail(email, updateData.emailVerificationToken);
    }

    if (newPassword) {
      const salt = await bcrypt.genSalt(12);
      updateData.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, req.user!.id))
      .returning({
        id: users.id,
        email: users.email,
        emailVerified: users.emailVerified,
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus,
      });

    res.json({
      success: true,
      data: {
        user: updatedUser,
        message: email && email !== req.user!.email
          ? 'Profile updated. Please verify your new email address.'
          : 'Profile updated successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};
