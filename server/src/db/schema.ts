import {
  pgTable,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Enums
export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'FREE',
  'BASIC',
  'PRO',
  'ENTERPRISE',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'ACTIVE',
  'CANCELLED',
  'PAST_DUE',
  'TRIALING',
]);

export const severityEnum = pgEnum('severity', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const checkStatusEnum = pgEnum('check_status', [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
]);

// Users table
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('FREE').notNull(),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('ACTIVE').notNull(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  // Email verification fields
  emailVerified: boolean('email_verified').default(false).notNull(),
  emailVerificationToken: text('email_verification_token'),
  emailVerificationExpires: timestamp('email_verification_expires'),
  // Password reset fields
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestamp('password_reset_expires'),
  // Refresh token for "remember me"
  refreshToken: text('refresh_token'),
  refreshTokenExpires: timestamp('refresh_token_expires'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Listings table
export const listings = pgTable(
  'listings',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    tags: text('tags').array().notNull().default([]),
    category: text('category').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    materials: text('materials').array().notNull().default([]),
    imageUrls: text('image_urls').array().notNull().default([]),
    etsyUrl: text('etsy_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('listings_user_id_idx').on(table.userId),
  })
);

// Policy rules table
export const policyRules = pgTable(
  'policy_rules',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    category: text('category').notNull(),
    ruleName: text('rule_name').notNull(),
    ruleText: text('rule_text').notNull(),
    severity: severityEnum('severity').notNull(),
    keywords: text('keywords').array().notNull().default([]),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index('policy_rules_category_idx').on(table.category),
    severityIdx: index('policy_rules_severity_idx').on(table.severity),
  })
);

// Violation checks table
export const violationChecks = pgTable(
  'violation_checks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    checkDate: timestamp('check_date').defaultNow().notNull(),
    violationsFound: integer('violations_found').default(0).notNull(),
    status: checkStatusEnum('status').default('PENDING').notNull(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    listingIdIdx: index('violation_checks_listing_id_idx').on(table.listingId),
    checkDateIdx: index('violation_checks_check_date_idx').on(table.checkDate),
  })
);

// Violations table
export const violations = pgTable(
  'violations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    checkId: text('check_id')
      .notNull()
      .references(() => violationChecks.id, { onDelete: 'cascade' }),
    policyRuleId: text('policy_rule_id')
      .notNull()
      .references(() => policyRules.id),
    violationText: text('violation_text').notNull(),
    severity: severityEnum('severity').notNull(),
    suggestion: text('suggestion').notNull(),
    matchedText: text('matched_text'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    checkIdIdx: index('violations_check_id_idx').on(table.checkId),
    policyRuleIdIdx: index('violations_policy_rule_id_idx').on(table.policyRuleId),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  user: one(users, {
    fields: [listings.userId],
    references: [users.id],
  }),
  violationChecks: many(violationChecks),
}));

export const policyRulesRelations = relations(policyRules, ({ many }) => ({
  violations: many(violations),
}));

export const violationChecksRelations = relations(violationChecks, ({ one, many }) => ({
  listing: one(listings, {
    fields: [violationChecks.listingId],
    references: [listings.id],
  }),
  violations: many(violations),
}));

export const violationsRelations = relations(violations, ({ one }) => ({
  check: one(violationChecks, {
    fields: [violations.checkId],
    references: [violationChecks.id],
  }),
  policyRule: one(policyRules, {
    fields: [violations.policyRuleId],
    references: [policyRules.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type PolicyRule = typeof policyRules.$inferSelect;
export type NewPolicyRule = typeof policyRules.$inferInsert;
export type ViolationCheck = typeof violationChecks.$inferSelect;
export type NewViolationCheck = typeof violationChecks.$inferInsert;
export type Violation = typeof violations.$inferSelect;
export type NewViolation = typeof violations.$inferInsert;

// Enum type exports
export type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CheckStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
