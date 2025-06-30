exports.up = async function(knex) {
  // Add stripe_customer_id column to sellers table if it doesn't exist
  const hasStripeCustomerId = await knex.schema.hasColumn('sellers', 'stripe_customer_id');
  if (!hasStripeCustomerId) {
    await knex.schema.table('sellers', table => {
      table.string('stripe_customer_id', 100);
    });
  }
};

exports.down = async function(knex) {
  // Remove stripe_customer_id column from sellers table if it exists
  const hasStripeCustomerId = await knex.schema.hasColumn('sellers', 'stripe_customer_id');
  if (hasStripeCustomerId) {
    await knex.schema.table('sellers', table => {
      table.dropColumn('stripe_customer_id');
    });
  }
};
