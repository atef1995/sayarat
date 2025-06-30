/**
 * Migration to add subscription cancellation and reactivation fields
 *
 * ADDS:
 * 1. cancel_at_period_end column for tracking subscriptions set to cancel
 * 2. cancel_at column for storing when cancellation will occur
 * 3. cancellation_reason column for audit purposes
 * 4. reactivation_count column for tracking reactivations
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    -- Add cancellation and reactivation fields to user_subscriptions table
    DO $$
    BEGIN
        -- Add cancel_at_period_end column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_subscriptions' 
            AND column_name = 'cancel_at_period_end'
        ) THEN
            ALTER TABLE user_subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;
            COMMENT ON COLUMN user_subscriptions.cancel_at_period_end IS 'Whether subscription is set to cancel at period end';
        END IF;
        
        -- Add cancel_at column for storing when cancellation will occur
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_subscriptions' 
            AND column_name = 'cancel_at'
        ) THEN
            ALTER TABLE user_subscriptions ADD COLUMN cancel_at TIMESTAMPTZ;
            COMMENT ON COLUMN user_subscriptions.cancel_at IS 'When the subscription will be canceled (from Stripe)';
        END IF;
        
        -- Add cancellation_reason column for audit purposes
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_subscriptions' 
            AND column_name = 'cancellation_reason'
        ) THEN
            ALTER TABLE user_subscriptions ADD COLUMN cancellation_reason VARCHAR(100);
            COMMENT ON COLUMN user_subscriptions.cancellation_reason IS 'Reason for subscription cancellation';
        END IF;
        
        -- Add reactivation_count column for tracking reactivations
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_subscriptions' 
            AND column_name = 'reactivation_count'
        ) THEN
            ALTER TABLE user_subscriptions ADD COLUMN reactivation_count INTEGER DEFAULT 0;
            COMMENT ON COLUMN user_subscriptions.reactivation_count IS 'Number of times subscription has been reactivated';
        END IF;
        
        -- Add trial_start and trial_end columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_subscriptions' 
            AND column_name = 'trial_start'
        ) THEN
            ALTER TABLE user_subscriptions ADD COLUMN trial_start TIMESTAMPTZ;
            COMMENT ON COLUMN user_subscriptions.trial_start IS 'Trial period start date';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_subscriptions' 
            AND column_name = 'trial_end'
        ) THEN
            ALTER TABLE user_subscriptions ADD COLUMN trial_end TIMESTAMPTZ;
            COMMENT ON COLUMN user_subscriptions.trial_end IS 'Trial period end date';
        END IF;
        
        -- Add plan_name column for easier access to plan information
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_subscriptions' 
            AND column_name = 'plan_name'
        ) THEN
            ALTER TABLE user_subscriptions ADD COLUMN plan_name VARCHAR(100);
            COMMENT ON COLUMN user_subscriptions.plan_name IS 'Human-readable plan name';
        END IF;
        
        -- Add plan_display_name column for UI display
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_subscriptions' 
            AND column_name = 'plan_display_name'
        ) THEN
            ALTER TABLE user_subscriptions ADD COLUMN plan_display_name VARCHAR(150);
            COMMENT ON COLUMN user_subscriptions.plan_display_name IS 'Localized plan display name';
        END IF;
    END
    $$;

    -- Create indexes for new columns for better query performance
    CREATE INDEX IF NOT EXISTS idx_user_subscriptions_cancel_at_period_end 
    ON user_subscriptions(cancel_at_period_end) WHERE cancel_at_period_end = TRUE;
    
    CREATE INDEX IF NOT EXISTS idx_user_subscriptions_cancel_at 
    ON user_subscriptions(cancel_at) WHERE cancel_at IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_user_subscriptions_cancellation_reason 
    ON user_subscriptions(cancellation_reason) WHERE cancellation_reason IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_user_subscriptions_trial_end 
    ON user_subscriptions(trial_end) WHERE trial_end IS NOT NULL;
    
    -- Add composite index for common queries
    CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status_cancel 
    ON user_subscriptions(status, cancel_at_period_end, seller_id);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    -- Remove the columns we added
    ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS cancel_at_period_end;
    ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS cancel_at;
    ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS cancellation_reason;
    ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS reactivation_count;
    ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS trial_start;
    ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS trial_end;
    ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS plan_name;
    ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS plan_display_name;
    
    -- Drop the indexes
    DROP INDEX IF EXISTS idx_user_subscriptions_cancel_at_period_end;
    DROP INDEX IF EXISTS idx_user_subscriptions_cancel_at;
    DROP INDEX IF EXISTS idx_user_subscriptions_cancellation_reason;
    DROP INDEX IF EXISTS idx_user_subscriptions_trial_end;
    DROP INDEX IF EXISTS idx_user_subscriptions_status_cancel;
  `);
};
