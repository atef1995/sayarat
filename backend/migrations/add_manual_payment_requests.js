/**
 * Manual Payment Requests Table Migration
 * Creates table to store manual payment requests for users who prefer offline payment methods
 */

const logger = require('../utils/logger');

const up = async knex => {
  logger.info('Creating manual_payment_requests table...');

  const tableExists = await knex.schema.hasTable('manual_payment_requests');
  if (tableExists) {
    logger.warn('manual_payment_requests table already exists, skipping...');
    return;
  }

  await knex.schema.createTable('manual_payment_requests', table => {
    table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
    table.uuid('seller_id').notNullable();
    table.string('full_name', 255).notNullable();
    table.string('phone', 20).notNullable();
    table.string('email', 255).notNullable();
    table.enum('payment_method', ['bank_transfer', 'cash', 'mobile_wallet']).notNullable();
    table.enum('preferred_contact', ['phone', 'email', 'whatsapp']).notNullable();
    table.text('notes').nullable();
    table.string('plan_name', 100).notNullable();
    table.decimal('plan_price', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.enum('status', ['pending', 'contacted', 'completed', 'cancelled']).defaultTo('pending');
    table.timestamp('contacted_at').nullable();
    table.timestamp('completed_at').nullable();
    table.uuid('processed_by').nullable(); // Admin who processed the request
    table.text('admin_notes').nullable();
    table.timestamps(true, true); // created_at, updated_at

    // Foreign key constraints
    table.foreign('seller_id').references('id').inTable('sellers').onDelete('CASCADE');
    table.foreign('processed_by').references('id').inTable('sellers').onDelete('SET NULL');

    // Indexes
    table.index('seller_id');
    table.index('status');
    table.index('created_at');
    table.index('payment_method');
  });

  logger.info('manual_payment_requests table created successfully');
};

const down = async knex => {
  logger.info('Dropping manual_payment_requests table...');

  const tableExists = await knex.schema.hasTable('manual_payment_requests');
  if (!tableExists) {
    logger.warn('manual_payment_requests table does not exist, skipping...');
    return;
  }

  await knex.schema.dropTable('manual_payment_requests');
  logger.info('manual_payment_requests table dropped successfully');
};

module.exports = { up, down };
