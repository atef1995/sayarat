-- Migration: Add is_admin column to sellers table
-- This migration adds admin functionality to the sellers table
-- instead of using a separate admin system

-- Add is_admin column to sellers table
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_sellers_is_admin 
ON sellers(is_admin);

-- Optional: Create a default admin user (uncomment and modify as needed)
-- UPDATE sellers SET is_admin = TRUE WHERE email = 'admin@yoursite.com';

-- Add comments for documentation
COMMENT ON COLUMN sellers.is_admin IS 'Indicates if the seller has admin privileges';
