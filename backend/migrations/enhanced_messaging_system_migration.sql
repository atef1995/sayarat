-- Enhanced Messaging System Database Migration
-- Addresses messaging routing when company members are removed/transferred

-- ================================
-- 1. Enhance listed_cars table for ownership tracking
-- ================================

-- Add columns to track current listing ownership
ALTER TABLE listed_cars 
ADD COLUMN IF NOT EXISTS current_owner_id UUID,
ADD COLUMN IF NOT EXISTS current_owner_type VARCHAR(20) DEFAULT 'seller',
ADD COLUMN IF NOT EXISTS original_seller_id UUID;

-- Add constraints
ALTER TABLE listed_cars 
ADD CONSTRAINT IF NOT EXISTS fk_current_owner 
    FOREIGN KEY (current_owner_id) REFERENCES sellers(id),
ADD CONSTRAINT IF NOT EXISTS fk_original_seller 
    FOREIGN KEY (original_seller_id) REFERENCES sellers(id),
ADD CONSTRAINT IF NOT EXISTS check_owner_type 
    CHECK (current_owner_type IN ('seller', 'company'));

-- Migrate existing data: set current owner to existing seller
UPDATE listed_cars 
SET current_owner_id = seller_id, 
    current_owner_type = 'seller',
    original_seller_id = seller_id
WHERE current_owner_id IS NULL;

-- Make current_owner_id required after migration
ALTER TABLE listed_cars 
ALTER COLUMN current_owner_id SET NOT NULL;

-- ================================
-- 2. Create conversation ownership tracking
-- ================================

-- Track conversation ownership changes for audit trail
CREATE TABLE IF NOT EXISTS conversation_ownership_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    old_owner_id UUID,
    new_owner_id UUID NOT NULL,
    owner_type VARCHAR(20) DEFAULT 'seller' NOT NULL,
    change_reason VARCHAR(100),
    changed_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_conversation_ownership_conversation 
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_ownership_old_owner 
        FOREIGN KEY (old_owner_id) REFERENCES sellers(id),
    CONSTRAINT fk_conversation_ownership_new_owner 
        FOREIGN KEY (new_owner_id) REFERENCES sellers(id),
    CONSTRAINT fk_conversation_ownership_changed_by 
        FOREIGN KEY (changed_by) REFERENCES sellers(id),
    CONSTRAINT check_conversation_owner_type 
        CHECK (owner_type IN ('seller', 'company'))
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_conversation_ownership_log_conversation_id 
    ON conversation_ownership_log(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_ownership_log_created_at 
    ON conversation_ownership_log(created_at);

-- ================================
-- 3. Create company message handlers
-- ================================

-- Define which company members can handle messages for transferred/suspended listings
CREATE TABLE IF NOT EXISTS company_message_handlers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    member_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    can_handle_transferred_listings BOOLEAN DEFAULT true,
    priority_order INTEGER DEFAULT 1, -- For multiple handlers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_company_message_handlers_company 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_company_message_handlers_member 
        FOREIGN KEY (member_id) REFERENCES sellers(id) ON DELETE CASCADE,
    
    -- Ensure one entry per company-member pair
    UNIQUE(company_id, member_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_company_message_handlers_company_active 
    ON company_message_handlers(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_company_message_handlers_member 
    ON company_message_handlers(member_id);

-- ================================
-- 4. Enhanced views for messaging system
-- ================================

-- View for listing ownership with active member status
CREATE OR REPLACE VIEW listing_message_routing AS
SELECT 
    lc.id as listing_id,
    lc.current_owner_id,
    lc.current_owner_type,
    lc.original_seller_id,
    lc.company_id,
    lc.title as listing_title,
    
    -- Current owner info
    co.first_name as current_owner_name,
    co.email as current_owner_email,
    
    -- Check if current owner is active (for company members)
    CASE 
        WHEN lc.current_owner_type = 'seller' AND lc.company_id IS NULL THEN true
        WHEN lc.current_owner_type = 'seller' AND lc.company_id IS NOT NULL THEN 
            COALESCE(cm.member_status = 'active', false)
        ELSE true
    END as is_current_owner_active,
    
    -- Original seller info
    os.first_name as original_seller_name,
    
    -- Company info
    c.name as company_name
    
FROM listed_cars lc
LEFT JOIN sellers co ON lc.current_owner_id = co.id
LEFT JOIN sellers os ON lc.original_seller_id = os.id
LEFT JOIN companies c ON lc.company_id = c.id
LEFT JOIN company_members cm ON (lc.company_id = cm.company_id AND lc.current_owner_id = cm.seller_id);

-- View for active company message handlers
CREATE OR REPLACE VIEW active_company_message_handlers AS
SELECT 
    cmh.company_id,
    cmh.member_id,
    cmh.priority_order,
    s.first_name as handler_name,
    s.email as handler_email,
    cm.role as member_role,
    cm.member_status
FROM company_message_handlers cmh
JOIN sellers s ON cmh.member_id = s.id
JOIN company_members cm ON (cmh.company_id = cm.company_id AND cmh.member_id = cm.seller_id)
WHERE cmh.is_active = true 
  AND cmh.can_handle_transferred_listings = true
  AND cm.member_status = 'active'
ORDER BY cmh.company_id, cmh.priority_order;

-- ================================
-- 5. Create functions for message routing
-- ================================

-- Function to get the appropriate message recipient for a listing
CREATE OR REPLACE FUNCTION get_listing_message_recipient(listing_id_param UUID)
RETURNS TABLE(
    recipient_id UUID,
    recipient_type VARCHAR(20),
    recipient_name VARCHAR(255),
    recipient_email VARCHAR(255),
    is_original_seller BOOLEAN,
    company_name VARCHAR(255)
) AS $$
DECLARE
    listing_info RECORD;
    handler_info RECORD;
BEGIN
    -- Get listing and current owner info
    SELECT * INTO listing_info
    FROM listing_message_routing 
    WHERE listing_id = listing_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing not found: %', listing_id_param;
    END IF;
    
    -- If current owner is active, route to them
    IF listing_info.is_current_owner_active THEN
        RETURN QUERY SELECT 
            listing_info.current_owner_id,
            listing_info.current_owner_type,
            listing_info.current_owner_name,
            listing_info.current_owner_email,
            (listing_info.current_owner_id = listing_info.original_seller_id),
            listing_info.company_name;
        RETURN;
    END IF;
    
    -- If current owner is inactive and it's a company listing, find a handler
    IF listing_info.company_id IS NOT NULL THEN
        SELECT * INTO handler_info
        FROM active_company_message_handlers 
        WHERE company_id = listing_info.company_id
        ORDER BY priority_order
        LIMIT 1;
        
        IF FOUND THEN
            RETURN QUERY SELECT 
                handler_info.member_id,
                'company'::VARCHAR(20),
                handler_info.handler_name,
                handler_info.handler_email,
                false,
                listing_info.company_name;
            RETURN;
        END IF;
    END IF;
    
    -- No valid recipient found
    RAISE EXCEPTION 'No active recipient found for listing: %', listing_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation ownership
CREATE OR REPLACE FUNCTION update_conversation_ownership(
    listing_id_param UUID,
    new_owner_id_param UUID,
    change_reason_param VARCHAR(100),
    changed_by_param UUID
) RETURNS INTEGER AS $$
DECLARE
    conv_record RECORD;
    current_seller_id UUID;
    updated_count INTEGER := 0;
BEGIN
    -- Find all conversations for this listing
    FOR conv_record IN 
        SELECT id FROM conversations WHERE car_listing_id = listing_id_param
    LOOP
        -- Get current seller participant
        SELECT user_id INTO current_seller_id
        FROM conversation_participants 
        WHERE conversation_id = conv_record.id AND role = 'seller';
        
        -- Only update if the seller is different
        IF current_seller_id IS NOT NULL AND current_seller_id != new_owner_id_param THEN
            -- Log the ownership change
            INSERT INTO conversation_ownership_log (
                conversation_id, old_owner_id, new_owner_id, 
                owner_type, change_reason, changed_by
            ) VALUES (
                conv_record.id, current_seller_id, new_owner_id_param,
                'seller', change_reason_param, changed_by_param
            );
            
            -- Update conversation participant
            UPDATE conversation_participants 
            SET user_id = new_owner_id_param
            WHERE conversation_id = conv_record.id AND role = 'seller';
            
            updated_count := updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- 6. Setup default message handlers for existing companies
-- ================================

-- Create default message handlers for existing company admins
INSERT INTO company_message_handlers (company_id, member_id, priority_order)
SELECT DISTINCT 
    cm.company_id,
    cm.seller_id,
    1 as priority_order
FROM company_members cm
WHERE cm.role IN ('admin', 'owner')
  AND cm.member_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM company_message_handlers cmh 
    WHERE cmh.company_id = cm.company_id
  )
ON CONFLICT (company_id, member_id) DO NOTHING;

-- ================================
-- 7. Create indexes for performance
-- ================================

-- Indexes on listed_cars for message routing
CREATE INDEX IF NOT EXISTS idx_listed_cars_current_owner 
    ON listed_cars(current_owner_id, current_owner_type);
CREATE INDEX IF NOT EXISTS idx_listed_cars_company_owner 
    ON listed_cars(company_id, current_owner_id) 
    WHERE current_owner_type = 'seller';

-- Index on conversation_participants for seller role lookups
CREATE INDEX IF NOT EXISTS idx_conversation_participants_seller 
    ON conversation_participants(conversation_id, role) 
    WHERE role = 'seller';

-- ================================
-- 8. Add helpful comments
-- ================================

COMMENT ON TABLE conversation_ownership_log IS 'Tracks changes in conversation ownership when listings are transferred between company members';
COMMENT ON TABLE company_message_handlers IS 'Defines which company members can handle messages for transferred or company-managed listings';
COMMENT ON COLUMN listed_cars.current_owner_id IS 'The current owner who receives messages for this listing';
COMMENT ON COLUMN listed_cars.current_owner_type IS 'Type of current owner: seller (individual) or company (company-managed)';
COMMENT ON COLUMN listed_cars.original_seller_id IS 'The original seller who created the listing (for audit trail)';

-- ================================
-- Migration Complete
-- ================================

-- Verify the migration
DO $$
DECLARE
    listing_count INTEGER;
    handler_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO listing_count FROM listed_cars WHERE current_owner_id IS NOT NULL;
    SELECT COUNT(*) INTO handler_count FROM company_message_handlers;
    
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '  - Updated % listings with ownership tracking', listing_count;
    RAISE NOTICE '  - Created % company message handlers', handler_count;
    RAISE NOTICE '  - Added conversation ownership logging';
    RAISE NOTICE '  - Created message routing functions';
END $$;
