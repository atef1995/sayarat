/**
 * Add is_admin column to sellers table
 * Migration to add admin privileges support to the sellers table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('sellers', table => {
    // Add is_admin column if it doesn't exist
    table.boolean('is_admin').defaultTo(false).notNullable().index();

    // Add comment to the column for documentation
    table.comment('Admin privileges for sellers - allows access to admin features');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('sellers', table => {
    table.dropColumn('is_admin');
  });
};
