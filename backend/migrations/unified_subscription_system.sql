-- Database Migration Script for Unified Subscription System
-- Run this script to update the database schema for the unified subscription system

-- Migration: Add account type support to user_subscriptions table
-- =====================================================================

-- Add account_type column to track individual vs company subscriptions
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'individual';

-- Add company_id column to link company subscriptions
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS company_id INTEGER;

-- Add foreign key constraint for company_id (if companies table exists)
-- Uncomment the next line if you have a companies table
-- ALTER TABLE user_subscriptions ADD CONSTRAINT fk_user_subscriptions_company 
-- FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_account_type 
ON user_subscriptions(account_type);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_company 
ON user_subscriptions(company_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_combined 
ON user_subscriptions(account_type, company_id, status);

-- Migration: Update subscription_plans table for target audience support
-- =====================================================================

-- Add target_audience column to define which account types can use each plan
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '["individual", "company"]'::JSONB;

-- Update existing plans to support both account types by default
UPDATE subscription_plans 
SET target_audience = '["individual", "company"]'::JSONB 
WHERE target_audience IS NULL;

-- Create index for target_audience queries
CREATE INDEX IF NOT EXISTS idx_subscription_plans_target_audience 
ON subscription_plans USING GIN (target_audience);

-- Migration: Optional - Create companies table if not exists
-- =====================================================================

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    tax_id VARCHAR(100),
    
    -- Subscription-related fields
    subscription_id VARCHAR(255), -- Stripe subscription ID
    subscription_status VARCHAR(50) DEFAULT 'inactive',
    subscription_plan_id VARCHAR(100),
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    
    -- Metadata and tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER, -- User ID who created the company
    
    -- Additional company features
    logo_url VARCHAR(500),
    description TEXT,
    employee_count INTEGER,
    is_verified BOOLEAN DEFAULT FALSE
);

-- Add indexes for companies table
CREATE INDEX IF NOT EXISTS idx_companies_subscription_status 
ON companies(subscription_status);

CREATE INDEX IF NOT EXISTS idx_companies_subscription_plan 
ON companies(subscription_plan_id);

CREATE INDEX IF NOT EXISTS idx_companies_created_by 
ON companies(created_by);

-- Migration: Update sellers table for company association
-- =====================================================================

-- Add company_id to sellers table if not exists
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS company_id INTEGER;

-- Add is_company flag for backwards compatibility
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS is_company BOOLEAN DEFAULT FALSE;

-- Add account_type for explicit account type tracking
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'individual';

-- Add foreign key constraint for company association
-- ALTER TABLE sellers ADD CONSTRAINT fk_sellers_company 
-- FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Add indexes for sellers table
CREATE INDEX IF NOT EXISTS idx_sellers_company_id 
ON sellers(company_id);

CREATE INDEX IF NOT EXISTS idx_sellers_account_type 
ON sellers(account_type);

CREATE INDEX IF NOT EXISTS idx_sellers_is_company 
ON sellers(is_company);

-- Migration: Data migration for existing subscriptions
-- =====================================================================

-- Update existing user subscriptions to set account_type based on user data
UPDATE user_subscriptions 
SET account_type = CASE 
    WHEN EXISTS (
        SELECT 1 FROM sellers 
        WHERE sellers.id = user_subscriptions.seller_id 
        AND (sellers.is_company = TRUE OR sellers.account_type = 'company')
    ) THEN 'company'
    ELSE 'individual'
END
WHERE account_type = 'individual'; -- Only update default values

-- Update company_id for subscriptions where user is associated with a company
UPDATE user_subscriptions 
SET company_id = (
    SELECT sellers.company_id 
    FROM sellers 
    WHERE sellers.id = user_subscriptions.seller_id 
    AND sellers.company_id IS NOT NULL
)
WHERE company_id IS NULL AND account_type = 'company';

-- Migration: Create audit log table for subscription changes
-- =====================================================================

CREATE TABLE IF NOT EXISTS subscription_audit_log (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER NOT NULL,
    user_id INTEGER,
    company_id INTEGER,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'cancelled', 'reactivated'
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    old_plan_id VARCHAR(100),
    new_plan_id VARCHAR(100),
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Add indexes for audit log
CREATE INDEX IF NOT EXISTS idx_subscription_audit_subscription_id 
ON subscription_audit_log(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_audit_user_id 
ON subscription_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_audit_company_id 
ON subscription_audit_log(company_id);

CREATE INDEX IF NOT EXISTS idx_subscription_audit_created_at 
ON subscription_audit_log(created_at DESC);

-- Migration: Create function to automatically update updated_at timestamps
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Migration verification queries
-- =====================================================================

-- Check account type distribution
-- SELECT account_type, COUNT(*) FROM user_subscriptions GROUP BY account_type;

-- Check company subscriptions
-- SELECT c.name, c.subscription_status, COUNT(us.id) as subscription_count
-- FROM companies c
-- LEFT JOIN user_subscriptions us ON c.id = us.company_id
-- GROUP BY c.id, c.name, c.subscription_status;

-- Check for orphaned subscriptions
-- SELECT COUNT(*) FROM user_subscriptions 
-- WHERE account_type = 'company' AND company_id IS NULL;

-- Migration completion notice
-- =====================================================================

-- Add a migration record to track completion
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'completed'
);

INSERT INTO migrations (name, status) 
VALUES ('unified_subscription_system_v1', 'completed')
ON CONFLICT (name) DO UPDATE SET executed_at = CURRENT_TIMESTAMP;

-- Grant necessary permissions (adjust as needed for your user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
