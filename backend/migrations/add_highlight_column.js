/**
 * Migration: Add highlight column to listed_cars table
 *
 * This migration adds a highlight column to support the new highlighting system
 * while maintaining backward compatibility with the existing products field.
 */

exports.up = function(knex) {
  return knex.schema
    .hasColumn('listed_cars', 'highlight')
    .then(exists => {
      if (!exists) {
        return knex.schema.alterTable('listed_cars', table => {
          // Add highlight column if it doesn't exist
          table.boolean('highlight').defaultTo(false);

          // Add index for better query performance
          table.index(['highlight', 'status', 'created_at'], 'idx_listings_highlight_status_created');
        });
      }
    })
    .then(() => {
      // Migrate existing highlighted listings from products field
      return knex('listed_cars').where('products', 'تمييز الإعلان').update({ highlight: true });
    });
};

exports.down = function(knex) {
  return knex.schema.alterTable('listed_cars', table => {
    // Remove the index first
    table.dropIndex(['highlight', 'status', 'created_at'], 'idx_listings_highlight_status_created');

    // Remove the highlight column
    table.dropColumn('highlight');
  });
};
