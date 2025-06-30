/**
 * Migration: Enhanced Messaging System - Listing Ownership Tracking
 *
 * Adds ownership tracking to listings for proper message routing
 * when company members are removed/transferred.
 */

exports.up = function(knex) {
  return knex.schema
    .hasColumn('listed_cars', 'current_owner_id')
    .then(exists => {
      if (!exists) {
        return knex.schema.alterTable('listed_cars', table => {
          // Add columns to track current listing ownership
          table.uuid('current_owner_id').nullable();
          table.string('current_owner_type').defaultTo('seller').checkIn(['seller', 'company']);
          table.uuid('original_seller_id').nullable();

          // Add foreign key constraints
          table.foreign('current_owner_id').references('id').inTable('sellers');
          table.foreign('original_seller_id').references('id').inTable('sellers'); // Add indexes for message routing performance
          table.index(['current_owner_id', 'current_owner_type']);
          table.index(['seller_id', 'current_owner_id']);
        });
      }
    })
    .then(() => {
      // Migrate existing data: set current owner to existing seller
      return knex.raw(`
        UPDATE listed_cars 
        SET current_owner_id = seller_id, 
            current_owner_type = 'seller',
            original_seller_id = seller_id
        WHERE current_owner_id IS NULL;
      `);
    })
    .then(() => {
      // Make current_owner_id required after migration
      return knex.schema.alterTable('listed_cars', table => {
        table.uuid('current_owner_id').notNullable().alter();
      });
    });
};

exports.down = function(knex) {
  return knex.schema.hasColumn('listed_cars', 'current_owner_id').then(exists => {
    if (exists) {
      return knex.schema.alterTable('listed_cars', table => {
        table.dropForeign('current_owner_id');
        table.dropForeign('original_seller_id');
        table.dropIndex(['current_owner_id', 'current_owner_type']);
        table.dropIndex(['seller_id', 'current_owner_id']);
        table.dropColumn('current_owner_id');
        table.dropColumn('current_owner_type');
        table.dropColumn('original_seller_id');
      });
    }
  });
};
