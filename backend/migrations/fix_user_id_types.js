/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Update user_subscriptions table to use VARCHAR for user_id
  await knex.raw(`
    ALTER TABLE user_subscriptions 
    ALTER COLUMN user_id TYPE VARCHAR(255);
  `);
  // Update subscription_features table to use VARCHAR for user_id
  await knex.raw(`
    ALTER TABLE subscription_features 
    ALTER COLUMN user_id TYPE VARCHAR(255);
  `);

  // Add index on user_id for better performance
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id_varchar 
    ON user_subscriptions(user_id);
  `);

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_subscription_features_user_id_varchar 
    ON subscription_features(user_id);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Drop indexes
  await knex.raw(`
    DROP INDEX IF EXISTS idx_user_subscriptions_user_id_varchar;
  `);

  await knex.raw(`
    DROP INDEX IF EXISTS idx_subscription_features_user_id_varchar;
  `);

  // Revert user_id columns back to INTEGER (this might fail if there are UUID values)
  await knex.raw(`
    ALTER TABLE user_subscriptions 
    ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER;
  `);

  await knex.raw(`
    ALTER TABLE subscription_features 
    ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER;
  `);
};
