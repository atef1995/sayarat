/**
 * Migration to add subscription payments tracking table
 * This table tracks all payment events for subscriptions and one-time payments
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    -- Subscription Payments Table
    CREATE TABLE IF NOT EXISTS subscription_payments (
        id SERIAL PRIMARY KEY,
        stripe_subscription_id VARCHAR(100),
        stripe_payment_intent_id VARCHAR(100),
        stripe_invoice_id VARCHAR(100),
        stripe_customer_id VARCHAR(100),
        stripe_checkout_session_id VARCHAR(100),
        amount INTEGER NOT NULL, -- Amount in smallest currency unit (cents)
        currency VARCHAR(3) NOT NULL DEFAULT 'usd',
        status VARCHAR(50) NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'canceled')),
        paid_at TIMESTAMP,
        failed_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_subscription_payments_stripe_subscription_id ON subscription_payments(stripe_subscription_id);
    CREATE INDEX IF NOT EXISTS idx_subscription_payments_stripe_payment_intent_id ON subscription_payments(stripe_payment_intent_id);
    CREATE INDEX IF NOT EXISTS idx_subscription_payments_stripe_invoice_id ON subscription_payments(stripe_invoice_id);
    CREATE INDEX IF NOT EXISTS idx_subscription_payments_stripe_customer_id ON subscription_payments(stripe_customer_id);
    CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
    CREATE INDEX IF NOT EXISTS idx_subscription_payments_created_at ON subscription_payments(created_at);

    -- Add foreign key constraint to existing user_subscriptions table if it exists
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
            -- Add foreign key constraint for subscription payments
            ALTER TABLE subscription_payments 
            ADD CONSTRAINT fk_subscription_payments_subscription 
            FOREIGN KEY (stripe_subscription_id) 
            REFERENCES user_subscriptions(stripe_subscription_id) 
            ON DELETE SET NULL;
        END IF;
    END
    $$;

    -- Add additional columns to user_subscriptions if they don't exist
    DO $$
    BEGIN
        -- Add checkout session ID tracking
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_checkout_session_id') THEN
            ALTER TABLE user_subscriptions ADD COLUMN stripe_checkout_session_id VARCHAR(100);
        END IF;
        
        -- Add metadata column for additional Stripe data
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'metadata') THEN
            ALTER TABLE user_subscriptions ADD COLUMN metadata JSONB DEFAULT '{}';
        END IF;
        
        -- Add payment failure tracking
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'payment_failed_at') THEN
            ALTER TABLE user_subscriptions ADD COLUMN payment_failed_at TIMESTAMP;
        END IF;
        
        -- Expand status enum to include more Stripe statuses
        ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;
        ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_status_check 
        CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing'));
    END
    $$;

    -- Create webhook events table for idempotency and audit trail
    CREATE TABLE IF NOT EXISTS webhook_events (
        id SERIAL PRIMARY KEY,
        stripe_event_id VARCHAR(100) UNIQUE NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        processed_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'ignored')),
        error_message TEXT,
        processing_time_ms INTEGER,
        request_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
    );

    -- Create index for webhook events
    CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
    CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
    CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    -- Drop webhook events table
    DROP TABLE IF EXISTS webhook_events;
    
    -- Remove additional columns from user_subscriptions
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'payment_failed_at') THEN
            ALTER TABLE user_subscriptions DROP COLUMN payment_failed_at;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'metadata') THEN
            ALTER TABLE user_subscriptions DROP COLUMN metadata;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_checkout_session_id') THEN
            ALTER TABLE user_subscriptions DROP COLUMN stripe_checkout_session_id;
        END IF;
    END
    $$;
    
    -- Drop subscription payments table and its indexes
    DROP INDEX IF EXISTS idx_subscription_payments_created_at;
    DROP INDEX IF EXISTS idx_subscription_payments_status;
    DROP INDEX IF EXISTS idx_subscription_payments_stripe_customer_id;
    DROP INDEX IF EXISTS idx_subscription_payments_stripe_invoice_id;
    DROP INDEX IF EXISTS idx_subscription_payments_stripe_payment_intent_id;
    DROP INDEX IF EXISTS idx_subscription_payments_stripe_subscription_id;
    
    DROP TABLE IF EXISTS subscription_payments;
  `);
};
