-- Fix Role Constraint Issue for Company Member Management
-- This script diagnoses and fixes the sellers_role_check constraint

-- 1. Check current role constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'sellers'::regclass 
AND conname LIKE '%role%';

-- 2. Check existing role values in the database
SELECT 
    role, 
    COUNT(*) as count,
    CASE 
        WHEN company_id IS NOT NULL THEN 'company_member'
        ELSE 'individual'
    END as user_type
FROM sellers 
WHERE role IS NOT NULL
GROUP BY role, (company_id IS NOT NULL)
ORDER BY role;

-- 3. Check for any NULL role values
SELECT COUNT(*) as null_role_count
FROM sellers 
WHERE role IS NULL;

-- 4. Drop the existing role constraint if it exists
DO $$ 
BEGIN
    -- Check if constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'sellers'::regclass 
        AND conname LIKE '%role%'
    ) THEN
        ALTER TABLE sellers DROP CONSTRAINT IF EXISTS sellers_role_check;
        RAISE NOTICE 'Dropped existing role constraint';
    END IF;
END $$;

-- 5. Add the correct role constraint that allows all necessary values
ALTER TABLE sellers 
ADD CONSTRAINT sellers_role_check 
CHECK (role IN ('individual', 'owner', 'admin', 'member') OR role IS NULL);

-- 6. Verify the new constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'sellers'::regclass 
AND conname = 'sellers_role_check';

-- 7. Test the constraint by trying to update a user (this should work now)
-- Note: Replace 'test_user_id' with an actual user ID from your database
-- UPDATE sellers 
-- SET role = NULL, company_id = NULL 
-- WHERE id = 'test_user_id';

-- 8. Optional: Update any users with invalid roles to NULL
-- This is commented out for safety - uncomment if needed
-- UPDATE sellers 
-- SET role = NULL 
-- WHERE role NOT IN ('individual', 'owner', 'admin', 'member');

-- 9. Create an index on role if it doesn't exist (for performance)
CREATE INDEX IF NOT EXISTS idx_sellers_role ON sellers(role);
CREATE INDEX IF NOT EXISTS idx_sellers_company_role ON sellers(company_id, role);

-- 10. Show final state
SELECT 
    'Role values after fix:' as status,
    role, 
    COUNT(*) as count
FROM sellers 
GROUP BY role
ORDER BY role;

COMMIT;
