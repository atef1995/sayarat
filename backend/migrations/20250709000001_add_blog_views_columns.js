/**
 * Migration to add user_agent and referrer columns to blog_views table
 * 
 * This migration adds the missing columns that are referenced in the code
 * but don't exist in the current database schema.
 */

exports.up = function (knex) {
  return knex.schema.table('blog_views', table => {
    table.text('user_agent').nullable();
    table.string('referrer', 500).nullable();

    // Add index for better performance
    table.index('referrer');
  });
};

exports.down = function (knex) {
  return knex.schema.table('blog_views', table => {
    table.dropColumn('user_agent');
    table.dropColumn('referrer');
  });
};
