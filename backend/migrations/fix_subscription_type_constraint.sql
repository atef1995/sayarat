-- Database Migration: Allow 'pending' subscription type
-- This allows companies to be created without an immediate subscription
-- which aligns with the business flow where subscription is selected after company creation

ALTER TABLE companies 
DROP CONSTRAINT IF EXISTS companies_subscription_type_check;

ALTER TABLE companies 
ADD CONSTRAINT companies_subscription_type_check 
CHECK (subscription_type = ANY (ARRAY['monthly'::text, 'yearly'::text, 'pending'::text]));

-- Update any existing records that might have null subscription_type
UPDATE companies 
SET subscription_type = 'pending' 
WHERE subscription_type IS NULL;

-- Make subscription_type NOT NULL to ensure data consistency
ALTER TABLE companies 
ALTER COLUMN subscription_type SET NOT NULL;

-- Add default value for new records
ALTER TABLE companies 
ALTER COLUMN subscription_type SET DEFAULT 'pending';
