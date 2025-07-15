/**
 * Simple Email Route Test Script
 * 
 * This script performs basic testing of the email routes without Jest
 * to help debug the actual route behavior with the enhanced logging.
 */

const express = require('express');
const { emailRouter } = require('./routes/email');

// Mock Knex for basic testing
const mockKnex = {
  select: () => mockKnex,
  where: () => mockKnex,
  andWhere: () => mockKnex,
  first: () => Promise.resolve({
    id: 1,
    email: 'test@sayarat.autos',
    first_name: 'أحمد',
    username: 'ahmed_test',
    email_verification_token: 'test-token-123',
    email_token_expiry: new Date(Date.now() + 3600000)
  }),
  update: () => Promise.resolve(1)
};

const app = express();
app.use(express.json());
app.use('/api', emailRouter(mockKnex));

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log('📧 Available endpoints:');
  console.log('  POST /api/verify-email');
  console.log('  POST /api/reset-password-request');
  console.log('  POST /api/reset-password');
  console.log('');
  console.log('🔍 Test email verification with:');
  console.log('curl -X POST http://localhost:3001/api/verify-email \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"token":"test-token-123"}\'');
  console.log('');
  console.log('📋 Check the server logs to see the detailed verification process.');
  console.log('💡 This helps debug the 400 status issue you\'re experiencing.');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Test server shutting down...');
  process.exit(0);
});
