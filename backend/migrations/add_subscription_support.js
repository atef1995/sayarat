/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex
    .raw(
      `
    -- Subscription Plans Table
    CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        interval VARCHAR(20) NOT NULL CHECK (interval IN ('month', 'year')),
        features JSONB,
        stripe_price_id VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        order_number INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    -- User Subscriptions Table
    CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        plan_id INTEGER REFERENCES subscription_plans(id),
        stripe_subscription_id VARCHAR(100) UNIQUE,
        stripe_customer_id VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete')),
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        canceled_at TIMESTAMP,
        trial_start TIMESTAMP,
        trial_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Subscription Features Table (for tracking feature usage)
    CREATE TABLE IF NOT EXISTS subscription_features (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        feature_name VARCHAR(100) NOT NULL,
        usage_count INTEGER DEFAULT 0,
        usage_limit INTEGER,
        reset_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, feature_name)
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_subscription_features_user_id ON subscription_features(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscription_features_feature_name ON subscription_features(feature_name);
  `
    )
    .then(() => {
      // Add subscription-related columns to sellers table
      return knex.raw(`
      DO $$
      BEGIN
          -- Add premium status column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'is_premium') THEN
              ALTER TABLE sellers ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
          END IF;
          
          -- Add company status column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'is_company') THEN
              ALTER TABLE sellers ADD COLUMN is_company BOOLEAN DEFAULT FALSE;
          END IF;
          
          -- Add subscription ID reference
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'current_subscription_id') THEN
              ALTER TABLE sellers ADD COLUMN current_subscription_id INTEGER REFERENCES user_subscriptions(id);
          END IF;
      END
      $$;
    `);
    })
    .then(() => {
      // Insert default subscription plans
      return knex.raw(`
      INSERT INTO subscription_plans (name, display_name, description, price, interval, features, stripe_price_id, order_number) VALUES
      ('premium-monthly', 'Premium شهري', 'خطة شهرية تتضمن جميع الميزات المميزة', 29.99, 'month', 
       '["المساعد الذكي لتحليل السيارات", "إبراز الإعلانات", "إحصائيات متقدمة", "دعم أولوية", "إعلانات غير محدودة"]', 
       'price_premium_monthly', 1),
      ('premium-yearly', 'Premium سنوي', 'خطة سنوية بخصم 20% - أفضل قيمة', 299.99, 'year', 
       '["المساعد الذكي لتحليل السيارات", "إبراز الإعلانات", "إحصائيات متقدمة", "دعم أولوية", "إعلانات غير محدودة", "خصم 20% على الخطة السنوية"]', 
       'price_premium_yearly', 2),
      ('pro-monthly', 'Pro شهري', 'للمستخدمين المحترفين والشركات الصغيرة', 59.99, 'month', 
       '["جميع ميزات Premium", "علامة تجارية مخصصة", "حتى 5 أعضاء فريق", "تقارير مفصلة", "API مخصص"]', 
       'price_pro_monthly', 3)
      ON CONFLICT (name) DO NOTHING;
    `);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    -- Remove subscription-related columns from sellers table
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'current_subscription_id') THEN
            ALTER TABLE sellers DROP COLUMN current_subscription_id;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'is_company') THEN
            ALTER TABLE sellers DROP COLUMN is_company;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'is_premium') THEN
            ALTER TABLE sellers DROP COLUMN is_premium;
        END IF;
    END
    $$;
    
    -- Drop indexes
    DROP INDEX IF EXISTS idx_subscription_features_feature_name;
    DROP INDEX IF EXISTS idx_subscription_features_user_id;
    DROP INDEX IF EXISTS idx_user_subscriptions_status;
    DROP INDEX IF EXISTS idx_user_subscriptions_user_id;
    
    -- Drop tables in reverse order due to foreign key constraints
    DROP TABLE IF EXISTS subscription_features;
    DROP TABLE IF EXISTS user_subscriptions;
    DROP TABLE IF EXISTS subscription_plans;
  `);
};
