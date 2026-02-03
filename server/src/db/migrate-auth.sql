-- Migration: Add authentication fields to users table
-- Run this if you have an existing database

-- Add email verification fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;

-- Add password reset fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- Add refresh token fields for "remember me"
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_expires TIMESTAMP;

-- Create indexes for token lookups
CREATE INDEX IF NOT EXISTS users_email_verification_token_idx ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS users_password_reset_token_idx ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS users_refresh_token_idx ON users(refresh_token);
