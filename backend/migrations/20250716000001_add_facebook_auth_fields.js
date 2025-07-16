/**
 * Migration to add Facebook authentication fields to sellers table
 */

exports.up = async function (knex) {
  await knex.schema.table('sellers', table => {
    // Facebook user ID for OAuth integration
    table.string('facebook_id').nullable().unique();

    // Store the authentication provider (local, facebook, etc.)
    table.string('auth_provider').defaultTo('local');

    // Store the Facebook profile picture URL
    table.text('facebook_picture_url').nullable();

    // Store additional Facebook profile data (JSON)
    table.json('facebook_profile_data').nullable();

    // Track when Facebook account was linked
    table.timestamp('facebook_linked_at').nullable();
  });

  // Create index for faster Facebook ID lookups
  await knex.raw('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sellers_facebook_id ON sellers(facebook_id)');
  await knex.raw('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sellers_auth_provider ON sellers(auth_provider)');
};

exports.down = async function (knex) {
  await knex.schema.table('sellers', table => {
    table.dropColumn('facebook_id');
    table.dropColumn('auth_provider');
    table.dropColumn('facebook_picture_url');
    table.dropColumn('facebook_profile_data');
    table.dropColumn('facebook_linked_at');
  });

  // Drop the indexes
  await knex.raw('DROP INDEX IF EXISTS idx_sellers_facebook_id');
  await knex.raw('DROP INDEX IF EXISTS idx_sellers_auth_provider');
};
