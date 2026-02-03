-- Create enums
CREATE TYPE subscription_tier AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIALING');
CREATE TYPE severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE check_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  subscription_tier subscription_tier NOT NULL DEFAULT 'FREE',
  subscription_status subscription_status NOT NULL DEFAULT 'ACTIVE',
  stripe_customer_id TEXT UNIQUE,
  -- Email verification fields
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verification_token TEXT,
  email_verification_expires TIMESTAMP,
  -- Password reset fields
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP,
  -- Refresh token for "remember me"
  refresh_token TEXT,
  refresh_token_expires TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create listings table
CREATE TABLE listings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  materials TEXT[] NOT NULL DEFAULT '{}',
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  etsy_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX listings_user_id_idx ON listings(user_id);

-- Create policy_rules table
CREATE TABLE policy_rules (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  rule_text TEXT NOT NULL,
  severity severity NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX policy_rules_category_idx ON policy_rules(category);
CREATE INDEX policy_rules_severity_idx ON policy_rules(severity);

-- Create violation_checks table
CREATE TABLE violation_checks (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  check_date TIMESTAMP NOT NULL DEFAULT NOW(),
  violations_found INTEGER NOT NULL DEFAULT 0,
  status check_status NOT NULL DEFAULT 'PENDING',
  completed_at TIMESTAMP
);
CREATE INDEX violation_checks_listing_id_idx ON violation_checks(listing_id);
CREATE INDEX violation_checks_check_date_idx ON violation_checks(check_date);

-- Create violations table
CREATE TABLE violations (
  id TEXT PRIMARY KEY,
  check_id TEXT NOT NULL REFERENCES violation_checks(id) ON DELETE CASCADE,
  policy_rule_id TEXT NOT NULL REFERENCES policy_rules(id),
  violation_text TEXT NOT NULL,
  severity severity NOT NULL,
  suggestion TEXT NOT NULL,
  matched_text TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX violations_check_id_idx ON violations(check_id);
CREATE INDEX violations_policy_rule_id_idx ON violations(policy_rule_id);
