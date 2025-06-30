/**
 * Migration: Add Company Support to Listings
 *
 * Adds company_id column to listed_cars table to support company-owned listings
 */

exports.up = function(knex) {
  return knex.schema
    .hasColumn('listed_cars', 'company_id')
    .then(exists => {
      if (!exists) {
        return knex.schema.alterTable('listed_cars', table => {
          // Add company_id column to track which company owns the listing
          table.uuid('company_id').nullable();

          // Add foreign key constraint
          table.foreign('company_id').references('id').inTable('companies').onDelete('SET NULL');

          // Add index for performance
          table.index('company_id');
        });
      }
    })
    .then(() => {
      // Update existing listings to inherit company_id from their sellers
      return knex.raw(`
        UPDATE listed_cars 
        SET company_id = s.company_id
        FROM sellers s 
        WHERE listed_cars.seller_id = s.id 
          AND s.company_id IS NOT NULL
          AND listed_cars.company_id IS NULL;
      `);
    });
};

exports.down = function(knex) {
  return knex.schema.hasColumn('listed_cars', 'company_id').then(exists => {
    if (exists) {
      return knex.schema.alterTable('listed_cars', table => {
        table.dropForeign('company_id');
        table.dropIndex('company_id');
        table.dropColumn('company_id');
      });
    }
  });
};
