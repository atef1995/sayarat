const knex = require('knex')(require('./knexfile.js').development);
knex('information_schema.columns')
  .select('column_name', 'data_type', 'is_nullable')
  .where('table_name', 'user_subscriptions')
  .orderBy('ordinal_position')
  .then(columns => {
    console.log('Columns in user_subscriptions table:');
    console.table(columns);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error querying table structure:', error.message);
    process.exit(1);
  });
