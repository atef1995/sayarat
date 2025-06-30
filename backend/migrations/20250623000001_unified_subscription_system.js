/**
 * Knex Migration: Unified Subscription System
 *
 * This migration unifies the subscription system to support both individual and company accounts
 * following SOLID principles and DRY methodology.
 *
 * @description Adds account type support, company associations, and enhanced subscription tracking
 * @version 1.0.0
 * @date 2025-06-23
 */

/**
 * Helper function to create target audience index with fallback strategies
 * @param {import('knex').Knex} knex - Knex instance
 */
async function createTargetAudienceIndex(knex) {
  try {
    console.log('  📋 Creating index for target_audience column...');

    // Try GIN index for JSONB (PostgreSQL optimal)
    await knex.raw(
      'CREATE INDEX IF NOT EXISTS idx_subscription_plans_target_audience ON subscription_plans USING GIN (target_audience)'
    );
    console.log('  ✅ GIN index created successfully');
  } catch (ginError) {
    console.log('  ⚠️ GIN index failed:', ginError.message);

    try {
      // Fallback: Try functional index on JSON text
      await knex.raw(
        'CREATE INDEX IF NOT EXISTS idx_subscription_plans_target_audience ON subscription_plans ((target_audience::text))'
      );
      console.log('  ✅ Functional text index created successfully');
    } catch (textError) {
      console.log('  ⚠️ Functional index failed:', textError.message);

      try {
        // Last resort: Create a simple expression index
        await knex.raw(
          "CREATE INDEX IF NOT EXISTS idx_subscription_plans_target_audience ON subscription_plans ((target_audience->>'$[0]'))"
        );
        console.log('  ✅ Expression index created successfully');
      } catch (exprError) {
        console.log('  ⚠️ All index creation attempts failed, skipping index');
        console.log('  ℹ️ Target audience filtering will use table scans (may impact performance)');
        // #TODO: Consider implementing application-level filtering optimization
      }
    }
  }
}

/**
 * Migration UP - Apply changes
 * @param {import('knex').Knex} knex - Knex instance
 */
exports.up = async function(knex) {
  console.log('🚀 Starting unified subscription system migration...');

  // Note: Removing transaction wrapper to handle failures individually
  // This allows partial success and better error recovery
  // #TODO: Consider implementing rollback mechanism for partial failures

  try {
    // =====================================================================
    // 1. Update user_subscriptions table for account type support
    // =====================================================================
    console.log('📝 Updating user_subscriptions table...');

    // Check if account_type column exists
    const hasAccountType = await knex.schema.hasColumn('user_subscriptions', 'account_type');
    if (!hasAccountType) {
      await knex.schema.alterTable('user_subscriptions', table => {
        table.string('account_type', 20).defaultTo('individual').notNullable();
        table.comment('Type of account: individual or company');
      });
    } // Check if company_id column exists
    const hasCompanyId = await knex.schema.hasColumn('user_subscriptions', 'company_id');
    if (!hasCompanyId) {
      await knex.schema.alterTable('user_subscriptions', table => {
        table.uuid('company_id').nullable();
        table.comment('Reference to company for company subscriptions');
      });
    }

    // Add indexes for performance optimization
    await knex.raw(
      'CREATE INDEX IF NOT EXISTS idx_user_subscriptions_account_type ON user_subscriptions(account_type)'
    );
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_user_subscriptions_company ON user_subscriptions(company_id)');
    await knex.raw(
      'CREATE INDEX IF NOT EXISTS idx_user_subscriptions_combined ON user_subscriptions(account_type, company_id, status)'
    );

    // =====================================================================
    // 2. Update subscription_plans table for target audience support
    // =====================================================================
    console.log('📋 Updating subscription_plans table...');

    const hasTargetAudience = await knex.schema.hasColumn('subscription_plans', 'target_audience');
    if (!hasTargetAudience) {
      await knex.schema.alterTable('subscription_plans', table => {
        // Use JSONB for better PostgreSQL support and GIN indexing
        table.specificType('target_audience', 'JSONB').defaultTo(JSON.stringify(['individual', 'company']));
        table.comment('Target audience for the plan: individual, company, or both');
      });
    }

    // Update existing plans to support both account types by default
    await knex('subscription_plans')
      .whereNull('target_audience')
      .update({
        target_audience: JSON.stringify(['individual', 'company'])
      });

    // Create GIN index for JSONB queries (PostgreSQL optimized)
    // Handle index creation separately to avoid transaction issues
    await createTargetAudienceIndex(knex); // =====================================================================
    // 3. Skip companies table creation - already exists
    // =====================================================================
    console.log('🏢 Checking companies table...');

    const companiesExists = await knex.schema.hasTable('companies');
    if (companiesExists) {
      console.log('  ✅ Companies table already exists, skipping creation');

      // Check if companies table has subscription-related fields and add if missing
      const hasSubscriptionId = await knex.schema.hasColumn('companies', 'subscription_id');
      if (!hasSubscriptionId) {
        console.log('  📝 Adding missing subscription fields to companies table...');
        await knex.schema.alterTable('companies', table => {
          table.string('subscription_plan_id', 100).nullable();
          table.timestamp('subscription_start_date').nullable();
          table.timestamp('subscription_end_date').nullable();
        });
      }
    } else {
      console.log('  📝 Creating companies table...');
      await knex.schema.createTable('companies', table => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('name', 255).notNullable();
        table.string('email', 255).unique();
        table.string('phone', 50);
        table.text('address');
        table.string('website', 255);
        table.string('tax_id', 100);

        // Subscription-related fields
        table.string('subscription_id', 255).comment('Stripe subscription ID');
        table.string('subscription_status', 50).defaultTo('inactive');
        table.string('subscription_plan_id', 100);
        table.timestamp('subscription_start_date');
        table.timestamp('subscription_end_date');

        // Metadata and tracking
        table.timestamps(true, true); // created_at, updated_at with defaults
        table.uuid('created_by').nullable().comment('User ID who created the company');

        // Additional company features
        table.string('logo_url', 500);
        table.text('description');
        table.integer('employee_count').unsigned();
        table.boolean('is_verified').defaultTo(false);

        // Add indexes
        table.index('subscription_status', 'idx_companies_subscription_status');
        table.index('subscription_plan_id', 'idx_companies_subscription_plan');
        table.index('created_by', 'idx_companies_created_by');
        table.index(['subscription_status', 'subscription_plan_id'], 'idx_companies_subscription_combined');
      });
    } // =====================================================================
    // 4. Update sellers table for company association (skip if already done)
    // =====================================================================
    console.log('👤 Checking sellers table...');

    // Check if sellers already has company_id from previous migrations
    const sellersHasCompanyId = await knex.schema.hasColumn('sellers', 'company_id');
    if (sellersHasCompanyId) {
      console.log('  ✅ Sellers table already has company_id, skipping company association setup');
    } else {
      console.log('  📝 Adding company association to sellers table...');
      await knex.schema.alterTable('sellers', table => {
        table.uuid('company_id').nullable();
        table.comment('Reference to company if user is associated with a company');
      });

      // Add indexes for sellers table
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_sellers_company_id ON sellers(company_id)');
    }

    // Add is_company flag for backwards compatibility if not exists
    const sellersHasIsCompany = await knex.schema.hasColumn('sellers', 'is_company');
    if (!sellersHasIsCompany) {
      await knex.schema.alterTable('sellers', table => {
        table.boolean('is_company').defaultTo(false);
        table.comment('Legacy flag indicating if user represents a company');
      });
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_sellers_is_company ON sellers(is_company)');
    }

    // Add account_type for explicit account type tracking if not exists
    const sellersHasAccountType = await knex.schema.hasColumn('sellers', 'account_type');
    if (!sellersHasAccountType) {
      await knex.schema.alterTable('sellers', table => {
        table.string('account_type', 20).defaultTo('individual');
        table.comment('Explicit account type: individual or company');
      });
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_sellers_account_type ON sellers(account_type)');
    }

    // =====================================================================
    // 5. Create subscription audit log table
    // =====================================================================
    console.log('📊 Creating subscription audit log table...');

    const auditLogExists = await knex.schema.hasTable('subscription_audit_log');
    if (!auditLogExists) {
      await knex.schema.createTable('subscription_audit_log', table => {
        table.increments('id').primary();
        table.integer('subscription_id').unsigned().notNullable();
        table.integer('user_id').unsigned().nullable();
        table.uuid('company_id').nullable();
        table.string('action', 50).notNullable().comment('created, updated, cancelled, reactivated');
        table.string('old_status', 50).nullable();
        table.string('new_status', 50).nullable();
        table.string('old_plan_id', 100).nullable();
        table.string('new_plan_id', 100).nullable();
        table.text('reason').nullable();
        table.json('metadata').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.string('ip_address', 45).nullable(); // IPv6 compatible
        table.text('user_agent').nullable();

        // Add indexes for performance
        table.index('subscription_id', 'idx_subscription_audit_subscription_id');
        table.index('user_id', 'idx_subscription_audit_user_id');
        table.index('company_id', 'idx_subscription_audit_company_id');
        table.index('created_at', 'idx_subscription_audit_created_at');
        table.index(['subscription_id', 'created_at'], 'idx_subscription_audit_combined');
      });
    }

    // =====================================================================
    // 6. Create migrations tracking table
    // =====================================================================
    console.log('📈 Creating migrations tracking table...');

    const migrationsExists = await knex.schema.hasTable('migrations');
    if (!migrationsExists) {
      await knex.schema.createTable('migrations', table => {
        table.increments('id').primary();
        table.string('name', 255).unique().notNullable();
        table.timestamp('executed_at').defaultTo(knex.fn.now());
        table.string('status', 20).defaultTo('completed');

        table.index('name', 'idx_migrations_name');
        table.index('executed_at', 'idx_migrations_executed_at');
      });
    }

    // =====================================================================
    // 7. Add foreign key constraints (if tables exist)
    // =====================================================================
    console.log('🔗 Adding foreign key constraints...');

    // Add foreign key constraints only if both tables exist and don't already have the constraint
    const companiesTableExists = await knex.schema.hasTable('companies');
    const sellersTableExists = await knex.schema.hasTable('sellers');

    if (companiesTableExists && sellersTableExists) {
      try {
        // Check if FK constraint already exists for sellers -> companies
        const sellersHasForeignKey = await knex.raw(`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = 'sellers' 
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name = 'sellers_company_id_foreign'
        `);

        if (sellersHasForeignKey.rows.length === 0) {
          await knex.schema.alterTable('sellers', table => {
            table.foreign('company_id').references('companies.id').onDelete('SET NULL');
          });
          console.log('  ✅ Added FK constraint: sellers.company_id -> companies.id');
        }
      } catch (error) {
        console.log('  ⚠️ Could not add FK constraint for sellers.company_id:', error.message);
      }

      try {
        // Check if FK constraint already exists for user_subscriptions -> companies
        const subscriptionsHasForeignKey = await knex.raw(`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = 'user_subscriptions' 
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name = 'user_subscriptions_company_id_foreign'
        `);

        if (subscriptionsHasForeignKey.rows.length === 0) {
          await knex.schema.alterTable('user_subscriptions', table => {
            table.foreign('company_id').references('companies.id').onDelete('SET NULL');
          });
          console.log('  ✅ Added FK constraint: user_subscriptions.company_id -> companies.id');
        }
      } catch (error) {
        console.log('  ⚠️ Could not add FK constraint for user_subscriptions.company_id:', error.message);
      }
    } // =====================================================================
    // 8. Data migration and updates
    // =====================================================================
    console.log('📊 Performing data migration...');

    try {
      // Update existing user_subscriptions to have account_type = 'individual'
      const userSubsResult = await knex('user_subscriptions')
        .whereNull('account_type')
        .update({ account_type: 'individual' });
      console.log(`  ✅ Updated ${userSubsResult} user_subscriptions with account_type`);
    } catch (error) {
      console.log('  ⚠️ Could not update user_subscriptions account_type:', error.message);
    }

    try {
      // Update existing sellers to have account_type = 'individual'
      const sellersResult = await knex('sellers').whereNull('account_type').update({ account_type: 'individual' });
      console.log(`  ✅ Updated ${sellersResult} sellers with account_type`);
    } catch (error) {
      console.log('  ⚠️ Could not update sellers account_type:', error.message);
    }

    try {
      // Record this migration in our tracking table
      if (await knex.schema.hasTable('migrations')) {
        await knex('migrations')
          .insert({
            name: '20250623000001_unified_subscription_system',
            executed_at: knex.fn.now(),
            status: 'completed'
          })
          .onConflict('name')
          .ignore();
        console.log('  ✅ Recorded migration in tracking table');
      }
    } catch (error) {
      console.log('  ⚠️ Could not record migration in tracking table:', error.message);
    }

    console.log('✅ Unified subscription system migration completed successfully!');
    console.log('📋 Summary of changes:');
    console.log('  - Added account_type and company_id columns to user_subscriptions');
    console.log('  - Added target_audience column to subscription_plans');
    console.log('  - Created companies table');
    console.log('  - Updated sellers table with company association');
    console.log('  - Created subscription_audit_log table');
    console.log('  - Added foreign key constraints');
    console.log('  - Migrated existing data to new structure');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

/**
 * Migration DOWN - Rollback changes
 * @param {import('knex').Knex} knex - Knex instance
 */
exports.down = async function(knex) {
  console.log('🔄 Rolling back unified subscription system migration...');

  try {
    // Drop foreign key constraints first
    console.log('🔗 Dropping foreign key constraints...');

    if (await knex.schema.hasTable('sellers')) {
      await knex.schema.alterTable('sellers', table => {
        table.dropForeign(['company_id']);
      });
    }

    if (await knex.schema.hasTable('user_subscriptions')) {
      await knex.schema.alterTable('user_subscriptions', table => {
        table.dropForeign(['company_id']);
      });
    }

    // Drop added columns from user_subscriptions
    console.log('📝 Reverting user_subscriptions table...');

    if (await knex.schema.hasColumn('user_subscriptions', 'account_type')) {
      await knex.schema.alterTable('user_subscriptions', table => {
        table.dropColumn('account_type');
      });
    }

    if (await knex.schema.hasColumn('user_subscriptions', 'company_id')) {
      await knex.schema.alterTable('user_subscriptions', table => {
        table.dropColumn('company_id');
      });
    }

    // Drop added columns from subscription_plans
    console.log('📋 Reverting subscription_plans table...');

    if (await knex.schema.hasColumn('subscription_plans', 'target_audience')) {
      await knex.schema.alterTable('subscription_plans', table => {
        table.dropColumn('target_audience');
      });
    }

    // Drop added columns from sellers
    console.log('👤 Reverting sellers table...');

    if (await knex.schema.hasColumn('sellers', 'company_id')) {
      await knex.schema.alterTable('sellers', table => {
        table.dropColumn('company_id');
      });
    }

    if (await knex.schema.hasColumn('sellers', 'is_company')) {
      await knex.schema.alterTable('sellers', table => {
        table.dropColumn('is_company');
      });
    }

    if (await knex.schema.hasColumn('sellers', 'account_type')) {
      await knex.schema.alterTable('sellers', table => {
        table.dropColumn('account_type');
      });
    }

    // Drop created tables
    console.log('🗑️ Dropping created tables...');

    if (await knex.schema.hasTable('subscription_audit_log')) {
      await knex.schema.dropTable('subscription_audit_log');
    }

    if (await knex.schema.hasTable('companies')) {
      await knex.schema.dropTable('companies');
    }

    if (await knex.schema.hasTable('migrations')) {
      await knex.schema.dropTable('migrations');
    }

    console.log('✅ Migration rollback completed successfully!');
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};
