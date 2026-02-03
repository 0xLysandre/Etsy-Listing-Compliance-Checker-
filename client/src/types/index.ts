// User types
export type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CheckStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  message?: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface MessageResponse {
  message: string;
}

// Listing types
export interface Listing {
  id: string;
  userId: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  price: number;
  materials: string[];
  imageUrls: string[];
  etsyUrl?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    violationChecks: number;
  };
  violationChecks?: ViolationCheckSummary[];
}

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

// Violation check types
export interface ViolationCheckSummary {
  id: string;
  checkDate: string;
  violationsFound: number;
  status: CheckStatus;
}

export interface ViolationCheck {
  id: string;
  listingId: string;
  checkDate: string;
  violationsFound: number;
  status: CheckStatus;
  completedAt?: string;
  violations: Violation[];
  listing?: {
    id: string;
    title: string;
    userId: string;
  };
}

export interface Violation {
  id: string;
  checkId: string;
  policyRuleId: string;
  violationText: string;
  severity: Severity;
  suggestion: string;
  matchedText?: string;
  policyRule?: {
    id: string;
    ruleName: string;
    category: string;
    ruleText?: string;
  };
}

// Policy rule types
export interface PolicyRule {
  id: string;
  category: string;
  ruleName: string;
  ruleText: string;
  severity: Severity;
  keywords: string[];
  isActive?: boolean;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard stats
export interface DashboardStats {
  totalListings: number;
  totalChecks: number;
  activeViolations: number;
  complianceRate: number;
}
