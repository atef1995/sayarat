-- Company Management Schema Update
-- This file contains the necessary database changes to support the company member management system

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    city TEXT,
    tax_id TEXT,
    website TEXT,
    logo_url TEXT,
    header_image_url TEXT,
    subscription_type TEXT DEFAULT 'basic',
    subscription_status TEXT DEFAULT 'active',
    subscription_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add company-related fields to sellers table
DO $$ 
BEGIN 
    -- Add company_id field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'company_id') THEN
        ALTER TABLE sellers ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
    END IF;
    
    -- Add role field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'role') THEN
        ALTER TABLE sellers ADD COLUMN role TEXT DEFAULT 'individual' CHECK (role IN ('individual', 'owner', 'admin', 'member'));
    END IF;
    
    -- Add is_company field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'is_company') THEN
        ALTER TABLE sellers ADD COLUMN is_company BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add is_premium field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'is_premium') THEN
        ALTER TABLE sellers ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add account_type field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'account_type') THEN
        ALTER TABLE sellers ADD COLUMN account_type TEXT DEFAULT 'individual' CHECK (account_type IN ('individual', 'company'));
    END IF;
    
    -- Update email_verified to have proper default
    ALTER TABLE sellers ALTER COLUMN email_verified SET DEFAULT FALSE;
    
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sellers_company_id ON sellers(company_id);
CREATE INDEX IF NOT EXISTS idx_sellers_role ON sellers(role);
CREATE INDEX IF NOT EXISTS idx_sellers_email_verified ON sellers(email_verified);
CREATE INDEX IF NOT EXISTS idx_sellers_is_company ON sellers(is_company);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_status ON companies(subscription_status);

-- Create audit table for company member changes (for future use)
CREATE TABLE IF NOT EXISTS company_member_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('added', 'removed', 'role_changed', 'status_changed')),
    old_values JSONB,
    new_values JSONB,
    performed_by UUID REFERENCES sellers(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_company_audit_company_id ON company_member_audit(company_id);
CREATE INDEX IF NOT EXISTS idx_company_audit_member_id ON company_member_audit(member_id);
CREATE INDEX IF NOT EXISTS idx_company_audit_performed_at ON company_member_audit(performed_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for companies table
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE companies IS 'Company profiles and information';
COMMENT ON TABLE company_member_audit IS 'Audit trail for company member management actions';
COMMENT ON COLUMN sellers.company_id IS 'Reference to the company this seller belongs to (if any)';
COMMENT ON COLUMN sellers.role IS 'Role within the company (individual, owner, admin, member)';
COMMENT ON COLUMN sellers.is_company IS 'Whether this seller represents a company account';
COMMENT ON COLUMN sellers.account_type IS 'Type of account (individual or company)';

-- Insert sample data (optional - for development/testing)
-- Uncomment the following lines if you want to create sample data

/*
-- Sample company
INSERT INTO companies (name, description, city) 
VALUES ('شركة السيارات المتقدمة', 'شركة متخصصة في بيع وشراء السيارات المستعملة', 'دمشق')
ON CONFLICT DO NOTHING;

-- Sample company owner (update existing user or create new one)
-- This is just an example - adjust the email to match an existing user
UPDATE sellers 
SET company_id = (SELECT id FROM companies WHERE name = 'شركة السيارات المتقدمة' LIMIT 1),
    role = 'owner',
    is_company = TRUE,
    account_type = 'company'
WHERE email = 'owner@example.com' -- Replace with actual email
AND company_id IS NULL;
*/
