import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ApiError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factory functions
export const BadRequestError = (message: string) => new ApiError(400, message);
export const UnauthorizedError = (message = 'Unauthorized') => new ApiError(401, message);
export const ForbiddenError = (message = 'Forbidden') => new ApiError(403, message);
export const NotFoundError = (message = 'Resource not found') => new ApiError(404, message);
export const ConflictError = (message: string) => new ApiError(409, message);
export const InternalError = (message = 'Internal server error') => new ApiError(500, message, false);

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
};

// Global error handler
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  // Log error for debugging (in production, use a proper logging service)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      statusCode,
      message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    // In production, only log server errors
    if (statusCode >= 500) {
      console.error('Server Error:', {
        statusCode,
        message,
        path: req.path,
        method: req.method,
      });
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
