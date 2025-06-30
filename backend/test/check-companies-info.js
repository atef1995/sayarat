const knex = require('knex')(require('../knexFile.js').development);
knex.schema
  .hasTable('companies')
  .then(exists => {
    console.log('Companies table exists:', exists);
    if (exists) {
      return knex('companies').columnInfo();
    }
  })
  .then(info => {
    if (info) {
      console.log('Companies columns:', Object.keys(info));
    }
    return knex.destroy();
  })
  .catch(err => {
    console.error(err);
    knex.destroy();
  });
