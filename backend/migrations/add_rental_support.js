/**
 * Migration to add rental support to listed_cars table
 */

exports.up = function(knex) {
  return knex.schema.alterTable('listed_cars', function(table) {
    // Add listing type column (sale or rental)
    table.string('listing_type').defaultTo('sale');
    
    // Add rental-specific columns
    table.boolean('is_rental').defaultTo(false);
    table.jsonb('rental_details').nullable();
    
    // Add index for better query performance
    table.index('listing_type');
    table.index('is_rental');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('listed_cars', function(table) {
    table.dropColumn('listing_type');
    table.dropColumn('is_rental');
    table.dropColumn('rental_details');
  });
};