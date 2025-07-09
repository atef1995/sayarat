require('@dotenvx/dotenvx').config();
const fs = require('fs');

const config = {
  development: {
    client: 'pg',
    connection: {
      host: 'cars-cars-bids.c.aivencloud.com',
      port: 14931,
      user: 'avnadmin',
      password: process.env.DATABASE_PASSWORD,
      database: 'defaultdb',
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync('./ca.pem').toString()
      },
      client_encoding: 'UTF8'
    },
    migrations: {
      directory: './migrations'
    }
  },
  production: {
    client: 'pg',
    connection: {
      host: 'cars-cars-bids.c.aivencloud.com',
      port: 14931,
      user: 'avnadmin',
      password: process.env.DATABASE_PASSWORD,
      database: 'defaultdb',
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync('./ca.pem').toString()
      },
      client_encoding: 'UTF8'
    },
    migrations: {
      directory: './migrations'
    }
  }
};

module.exports = config;
