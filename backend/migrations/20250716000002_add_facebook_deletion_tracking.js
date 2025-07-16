/**
 * Migration: Add Facebook data deletion tracking field
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('sellers', function (table) {
    table.timestamp('facebook_data_deleted_at').nullable().comment('Timestamp when Facebook data was deleted for compliance');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('sellers', function (table) {
    table.dropColumn('facebook_data_deleted_at');
  });
};
