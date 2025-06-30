/**
 * Migration to add company support
 * Creates companies table and updates users table for company accounts
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('companies', table => {
      table.uuid('id').primary();
      table.string('name').notNullable().unique();
      table.text('description').notNullable();
      table.string('address').notNullable();
      table.string('city').notNullable();
      table.string('tax_id').notNullable();
      table.string('website').nullable();
      table.string('logo_url').nullable();
      table.string('header_image_url').nullable();
      table.enum('subscription_type', ['monthly', 'yearly']).notNullable();
      table.enum('subscription_status', ['pending', 'active', 'inactive', 'cancelled']).defaultTo('pending');
      table.string('subscription_id').nullable(); // Stripe subscription ID
      table.timestamps(true, true);

      // Indexes
      table.index('name');
      table.index('city');
      table.index('subscription_status');
    })
    .then(() => {
      return knex.schema.hasColumn('sellers', 'account_type');
    })
    .then(exists => {
      if (!exists) {
        return knex.schema.alterTable('sellers', table => {
          table.enum('account_type', ['personal', 'company']).defaultTo('personal');
          table.uuid('company_id').nullable().references('id').inTable('companies').onDelete('SET NULL');
          table.enum('role', ['owner', 'admin', 'member']).nullable(); // For company users

          // Indexes
          table.index('account_type');
          table.index('company_id');
        });
      }
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('sellers', table => {
      table.dropColumn('account_type');
      table.dropColumn('company_id');
      table.dropColumn('role');
    })
    .then(() => {
      return knex.schema.dropTable('companies');
    });
};
