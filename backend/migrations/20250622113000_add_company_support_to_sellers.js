/**
 * Migration: Add Company Support to Sellers
 *
 * Adds company_id and member-related columns to sellers table
 */

exports.up = function(knex) {
  return knex.schema.hasColumn('sellers', 'company_id').then(exists => {
    if (!exists) {
      return knex.schema.alterTable('sellers', table => {
        // Add company membership columns
        table.uuid('company_id').nullable();
        table.string('role').defaultTo('member'); // 'owner', 'admin', 'member'
        table.string('member_status').defaultTo('active'); // 'active', 'inactive', 'suspended'

        // Add foreign key constraint
        table.foreign('company_id').references('id').inTable('companies').onDelete('SET NULL');

        // Add indexes for performance
        table.index('company_id');
        table.index(['company_id', 'member_status']);
      });
    }
  });
};

exports.down = function(knex) {
  return knex.schema.hasColumn('sellers', 'company_id').then(exists => {
    if (exists) {
      return knex.schema.alterTable('sellers', table => {
        table.dropForeign('company_id');
        table.dropIndex('company_id');
        table.dropIndex(['company_id', 'member_status']);
        table.dropColumn('company_id');
        table.dropColumn('role');
        table.dropColumn('member_status');
      });
    }
  });
};
