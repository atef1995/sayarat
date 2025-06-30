/**
 * Migration to fix subscription database schema issues
 *
 * FIXES:
 * 1. Change plan_id from INTEGER to VARCHAR to store Stripe price IDs
 * 2. Add missing charge-related columns to subscription_payments table
 * 3. Add proper indexes for performance
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    -- Fix 1: Change plan_id in user_subscriptions to VARCHAR to store Stripe price IDs
    DO $$
    BEGIN
        -- Check if plan_id is currently INTEGER and change to VARCHAR
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_subscriptions' 
            AND column_name = 'plan_id' 
            AND data_type = 'integer'
        ) THEN
            -- Drop the foreign key constraint first if it exists
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name LIKE '%plan_id%' 
                AND table_name = 'user_subscriptions'
            ) THEN
                ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_plan_id_fkey;
            END IF;
            
            -- Change the column type to VARCHAR
            ALTER TABLE user_subscriptions ALTER COLUMN plan_id TYPE VARCHAR(100);
            
            -- Add comment to clarify this now stores Stripe price IDs
            COMMENT ON COLUMN user_subscriptions.plan_id IS 'Stripe price ID (e.g., price_1RbhnwPIR1o3pZmObQQrJgs2)';
        END IF;
        
        -- Ensure the column exists and is VARCHAR if it was missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_subscriptions' 
            AND column_name = 'plan_id'
        ) THEN
            ALTER TABLE user_subscriptions ADD COLUMN plan_id VARCHAR(100);
            COMMENT ON COLUMN user_subscriptions.plan_id IS 'Stripe price ID (e.g., price_1RbhnwPIR1o3pZmObQQrJgs2)';
        END IF;
    END
    $$;

    -- Fix 2: Add missing charge-related columns to subscription_payments table
    DO $$
    BEGIN
        -- Add stripe_charge_id column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'subscription_payments' 
            AND column_name = 'stripe_charge_id'
        ) THEN
            ALTER TABLE subscription_payments ADD COLUMN stripe_charge_id VARCHAR(100);
        END IF;
        
        -- Add charged_at timestamp
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'subscription_payments' 
            AND column_name = 'charged_at'
        ) THEN
            ALTER TABLE subscription_payments ADD COLUMN charged_at TIMESTAMP;
        END IF;
        
        -- Add charge_failed_at timestamp
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'subscription_payments' 
            AND column_name = 'charge_failed_at'
        ) THEN
            ALTER TABLE subscription_payments ADD COLUMN charge_failed_at TIMESTAMP;
        END IF;
        
        -- Add charge_status
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'subscription_payments' 
            AND column_name = 'charge_status'
        ) THEN
            ALTER TABLE subscription_payments ADD COLUMN charge_status VARCHAR(50) 
            CHECK (charge_status IN ('succeeded', 'failed', 'pending'));
        END IF;
        
        -- Add charge_failure_reason
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'subscription_payments' 
            AND column_name = 'charge_failure_reason'
        ) THEN
            ALTER TABLE subscription_payments ADD COLUMN charge_failure_reason TEXT;
        END IF;
        
        -- Add failure_reason column for payment intent failures
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'subscription_payments' 
            AND column_name = 'failure_reason'
        ) THEN
            ALTER TABLE subscription_payments ADD COLUMN failure_reason TEXT;
        END IF;
    END
    $$;

    -- Fix 3: Add indexes for new columns
    CREATE INDEX IF NOT EXISTS idx_subscription_payments_stripe_charge_id 
    ON subscription_payments(stripe_charge_id);
    
    CREATE INDEX IF NOT EXISTS idx_subscription_payments_charge_status 
    ON subscription_payments(charge_status);
    
    CREATE INDEX IF NOT EXISTS idx_subscription_payments_charged_at 
    ON subscription_payments(charged_at);
    
    CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id 
    ON user_subscriptions(plan_id);

    -- Fix 4: Add missing columns to user_subscriptions if they don't exist
    DO $$
    BEGIN
        -- Add stripe_checkout_session_id if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_subscriptions' 
            AND column_name = 'stripe_checkout_session_id'
        ) THEN
            ALTER TABLE user_subscriptions ADD COLUMN stripe_checkout_session_id VARCHAR(100);
        END IF;
        
        -- Add metadata column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_subscriptions' 
            AND column_name = 'metadata'
        ) THEN
            ALTER TABLE user_subscriptions ADD COLUMN metadata JSONB DEFAULT '{}';
        END IF;
        
        -- Ensure status column has all the values we need
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_subscriptions' 
            AND column_name = 'status'
        ) THEN
            -- Drop existing constraint if it exists
            ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;
            
            -- Add updated constraint with all status values
            ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_status_check 
            CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'));
        END IF;
    END
    $$;

    -- Create index for stripe_checkout_session_id
    CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_checkout_session_id 
    ON user_subscriptions(stripe_checkout_session_id);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    -- Revert charge-related columns from subscription_payments
    ALTER TABLE subscription_payments DROP COLUMN IF EXISTS stripe_charge_id;
    ALTER TABLE subscription_payments DROP COLUMN IF EXISTS charged_at;
    ALTER TABLE subscription_payments DROP COLUMN IF EXISTS charge_failed_at;
    ALTER TABLE subscription_payments DROP COLUMN IF EXISTS charge_status;
    ALTER TABLE subscription_payments DROP COLUMN IF EXISTS charge_failure_reason;
    ALTER TABLE subscription_payments DROP COLUMN IF EXISTS failure_reason;
    
    -- Revert plan_id back to INTEGER (this will require data migration if there's data)
    -- WARNING: This will lose data if Stripe price IDs are stored
    -- ALTER TABLE user_subscriptions ALTER COLUMN plan_id TYPE INTEGER USING NULL;
    
    -- Drop indexes
    DROP INDEX IF EXISTS idx_subscription_payments_stripe_charge_id;
    DROP INDEX IF EXISTS idx_subscription_payments_charge_status;
    DROP INDEX IF EXISTS idx_subscription_payments_charged_at;
    DROP INDEX IF EXISTS idx_user_subscriptions_plan_id;
    DROP INDEX IF EXISTS idx_user_subscriptions_stripe_checkout_session_id;
    
    -- Remove additional columns from user_subscriptions
    ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS stripe_checkout_session_id;
    ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS metadata;
  `);
};
