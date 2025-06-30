-- Enhanced Company Member Management Schema Update
-- Adds proper member status tracking, audit trail, and listing management

-- Add member status and tracking fields to sellers table
DO $$ 
BEGIN
    -- Add member_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'member_status') THEN
        ALTER TABLE sellers ADD COLUMN member_status TEXT DEFAULT 'active' 
        CHECK (member_status IN ('active', 'pending', 'removed', 'suspended'));
    END IF;
    
    -- Add removal tracking fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'removal_date') THEN
        ALTER TABLE sellers ADD COLUMN removal_date TIMESTAMP NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'removal_reason') THEN
        ALTER TABLE sellers ADD COLUMN removal_reason TEXT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'removed_by') THEN
        ALTER TABLE sellers ADD COLUMN removed_by UUID REFERENCES sellers(id) NULL;
    END IF;
    
    -- Add reactivation tracking fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'reactivated_by') THEN
        ALTER TABLE sellers ADD COLUMN reactivated_by UUID REFERENCES sellers(id) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sellers' AND column_name = 'reactivated_at') THEN
        ALTER TABLE sellers ADD COLUMN reactivated_at TIMESTAMP NULL;
    END IF;
END $$;

-- Add new listing status for suspended listings
ALTER TABLE listed_cars DROP CONSTRAINT IF EXISTS listed_cars_status_check;
ALTER TABLE listed_cars ADD CONSTRAINT listed_cars_status_check 
CHECK (status IN ('active', 'sold', 'removed', 'expired', 'suspended', 'suspended_member_removed'));

-- Create company member audit trail table
CREATE TABLE IF NOT EXISTS company_member_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    member_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('added', 'removed', 'reactivated', 'role_changed', 'status_changed')),
    performed_by UUID NOT NULL,
    reason TEXT,
    metadata JSONB, -- Store additional context like original role, listing actions, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_audit_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_member FOREIGN KEY (member_id) REFERENCES sellers(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_performer FOREIGN KEY (performed_by) REFERENCES sellers(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sellers_member_status ON sellers(member_status);
CREATE INDEX IF NOT EXISTS idx_sellers_company_status ON sellers(company_id, member_status);
CREATE INDEX IF NOT EXISTS idx_sellers_removal_date ON sellers(removal_date);
CREATE INDEX IF NOT EXISTS idx_listed_cars_seller_status ON listed_cars(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_company_member ON company_member_audit(company_id, member_id);
CREATE INDEX IF NOT EXISTS idx_audit_action_date ON company_member_audit(action, created_at);

-- Update existing data
-- Set default member_status for existing records
UPDATE sellers 
SET member_status = 'active' 
WHERE member_status IS NULL AND company_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN sellers.member_status IS 'Status of member within company: active, pending, removed, suspended';
COMMENT ON COLUMN sellers.removal_date IS 'Date when member was removed from company';
COMMENT ON COLUMN sellers.removal_reason IS 'Reason for member removal';
COMMENT ON COLUMN sellers.removed_by IS 'ID of user who removed this member';
COMMENT ON COLUMN sellers.reactivated_by IS 'ID of user who reactivated this member';
COMMENT ON COLUMN sellers.reactivated_at IS 'Date when member was reactivated';

COMMENT ON TABLE company_member_audit IS 'Audit trail for all company member management actions';
COMMENT ON COLUMN company_member_audit.metadata IS 'JSON metadata for additional context (original role, listing actions, etc.)';

-- Create a view for active company members (for easier querying)
CREATE OR REPLACE VIEW active_company_members AS
SELECT 
    s.*,
    c.name as company_name,
    COUNT(lc.id) as active_listings_count
FROM sellers s
LEFT JOIN companies c ON s.company_id = c.id
LEFT JOIN listed_cars lc ON s.id = lc.seller_id AND lc.status = 'active'
WHERE s.company_id IS NOT NULL 
AND s.member_status = 'active'
GROUP BY s.id, c.name;

-- Create a function to get member statistics
CREATE OR REPLACE FUNCTION get_member_statistics(company_uuid UUID)
RETURNS TABLE (
    total_members BIGINT,
    active_members BIGINT,
    pending_members BIGINT,
    removed_members BIGINT,
    total_listings BIGINT,
    active_listings BIGINT,
    suspended_listings BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_members,
        COUNT(*) FILTER (WHERE member_status = 'active') as active_members,
        COUNT(*) FILTER (WHERE member_status = 'pending') as pending_members,
        COUNT(*) FILTER (WHERE member_status = 'removed') as removed_members,
        (SELECT COUNT(*) FROM listed_cars lc 
         JOIN sellers s ON lc.seller_id = s.id 
         WHERE s.company_id = company_uuid) as total_listings,
        (SELECT COUNT(*) FROM listed_cars lc 
         JOIN sellers s ON lc.seller_id = s.id 
         WHERE s.company_id = company_uuid AND lc.status = 'active') as active_listings,
        (SELECT COUNT(*) FROM listed_cars lc 
         JOIN sellers s ON lc.seller_id = s.id 
         WHERE s.company_id = company_uuid AND lc.status LIKE 'suspended%') as suspended_listings
    FROM sellers 
    WHERE company_id = company_uuid;
END;
$$ LANGUAGE plpgsql;

COMMIT;
