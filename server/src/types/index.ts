import { SubscriptionTier, SubscriptionStatus, Severity, CheckStatus } from '@prisma/client';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    stack?: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Auth types
export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    subscriptionTier: SubscriptionTier;
    subscriptionStatus: SubscriptionStatus;
  };
  token: string;
}

// Listing types
export interface CreateListingInput {
  title: string;
  description: string;
  tags: string[];
  category: string;
  price: number;
  materials: string[];
  imageUrls?: string[];
  etsyUrl?: string;
}

export interface UpdateListingInput {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  price?: number;
  materials?: string[];
  imageUrls?: string[];
  etsyUrl?: string;
}

// Compliance check types
export interface ComplianceCheckResult {
  checkId: string;
  listingId: string;
  status: CheckStatus;
  violationsFound: number;
  violations: ViolationResult[];
  checkDate: Date;
}

export interface ViolationResult {
  id: string;
  policyRuleId: string;
  ruleName: string;
  ruleCategory: string;
  violationText: string;
  severity: Severity;
  suggestion: string;
  matchedText?: string;
}

// Subscription types
export interface SubscriptionLimits {
  maxListings: number;
  maxChecksPerMonth: number;
  features: string[];
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  FREE: {
    maxListings: 5,
    maxChecksPerMonth: 10,
    features: ['basic_check'],
  },
  BASIC: {
    maxListings: 50,
    maxChecksPerMonth: 100,
    features: ['basic_check', 'detailed_reports'],
  },
  PRO: {
    maxListings: 500,
    maxChecksPerMonth: 1000,
    features: ['basic_check', 'detailed_reports', 'bulk_check', 'api_access'],
  },
  ENTERPRISE: {
    maxListings: -1, // Unlimited
    maxChecksPerMonth: -1, // Unlimited
    features: ['basic_check', 'detailed_reports', 'bulk_check', 'api_access', 'priority_support', 'custom_rules'],
  },
};

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
