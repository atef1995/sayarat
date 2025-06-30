#!/usr/bin/env node

/**
 * Health Check Script for Docker Container
 * Checks if the backend service is healthy and responding
 */

const http = require('http');
const logger = require('../utils/logger');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    logger.info('Health check passed');
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  } else {
    logger.error(`Health check failed with status: ${res.statusCode}`);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
});

req.on('error', (err) => {
  logger.error(`Health check failed: ${err.message}`);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});

req.on('timeout', () => {
  logger.error('Health check timed out');
  req.destroy();
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});

req.end();
