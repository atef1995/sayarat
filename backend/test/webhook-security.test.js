const request = require('supertest');
const app = require('../server');
const WebhookController = require('../controllers/webhookController');
const { validateWebhookSignature, validateEventStructure } = require('../middleware/webhookSecurity');

// Mock dependencies
jest.mock('../service/email');
jest.mock('../dbQueries/listed_cars');

describe('Webhook Security Tests', () => {
  describe('Security Middleware', () => {
    test('should reject webhook without signature', async() => {
      const response = await request(app).post('/api/payment/webhook').send({ test: 'data' }).expect(401);

      expect(response.body.code).toBe('MISSING_SIGNATURE');
    });

    test('should reject webhook with invalid signature', async() => {
      const response = await request(app)
        .post('/api/payment/webhook')
        .set('stripe-signature', 'invalid_signature')
        .send({ test: 'data' })
        .expect(400);

      expect(response.body.code).toBe('INVALID_SIGNATURE');
    });

    test('should reject webhook with malformed payload', async() => {
      const response = await request(app)
        .post('/api/payment/webhook')
        .set('stripe-signature', 'v1=invalid')
        .send('invalid json')
        .expect(400);
    });

    test('should validate event structure', () => {
      const validEvent = {
        id: 'evt_test',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test' } }
      };

      const invalidEvent = {
        id: 'evt_test'
        // missing type and data
      };

      const validResult = validateEventStructure(validEvent, 'req_test');
      const invalidResult = validateEventStructure(invalidEvent, 'req_test');

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.code).toBe('INVALID_EVENT');
    });
  });

  describe('Rate Limiting', () => {
    test('should handle rate limiting', async() => {
      // Send many requests to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 105; i++) {
        promises.push(
          request(app)
            .post('/api/payment/webhook')
            .send({ test: `data_${i}` })
        );
      }

      const responses = await Promise.all(promises);

      // Should have some 429 (rate limited) responses
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Webhook Controller', () => {
    let mockKnex;
    let controller;

    beforeEach(() => {
      mockKnex = {
        transaction: jest.fn(),
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        where: jest.fn(() => mockKnex),
        first: jest.fn(),
        returning: jest.fn(() => mockKnex)
      };
      controller = new WebhookController(mockKnex);
    });

    test('should generate unique request IDs', () => {
      const id1 = controller.generateRequestId();
      const id2 = controller.generateRequestId();

      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    test('should create proper success response', () => {
      const result = { status: 'processed' };
      const event = { id: 'evt_test', type: 'payment_intent.succeeded' };
      const requestId = 'req_test';
      const totalTime = 150;

      const response = controller.createSuccessResponse(result, event, requestId, totalTime);

      expect(response).toEqual({
        received: true,
        eventId: 'evt_test',
        eventType: 'payment_intent.succeeded',
        processingTimeMs: 150,
        requestId: 'req_test',
        status: 'processed'
      });
    });

    test('should create proper error response', () => {
      const error = new Error('Test error');
      const requestId = 'req_test';

      const response = controller.createErrorResponse(error, requestId);

      expect(response).toEqual({
        error: 'Webhook processing failed',
        code: 'PROCESSING_ERROR',
        requestId: 'req_test',
        message: 'Test error'
      });
    });
  });
});

// Manual test for webhook endpoint
async function testWebhookEndpoint() {
  console.log('Testing webhook endpoint manually...');

  try {
    // Test 1: Missing signature
    console.log('Test 1: Missing signature');
    const response1 = await request(app).post('/api/payment/webhook').send({ test: 'data' });
    console.log('Response:', response1.status, response1.body);

    // Test 2: Invalid signature
    console.log('\\nTest 2: Invalid signature');
    const response2 = await request(app)
      .post('/api/payment/webhook')
      .set('stripe-signature', 'invalid')
      .send({ test: 'data' });
    console.log('Response:', response2.status, response2.body);

    console.log('\\nWebhook security tests completed!');
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Performance test
async function performanceTest() {
  console.log('Running performance test...');

  const startTime = Date.now();
  const promises = [];

  // Send 50 concurrent invalid requests
  for (let i = 0; i < 50; i++) {
    promises.push(
      request(app)
        .post('/api/payment/webhook')
        .send({ test: `data_${i}` })
    );
  }

  await Promise.all(promises);
  const endTime = Date.now();

  console.log(`Processed 50 requests in ${endTime - startTime}ms`);
  console.log(`Average: ${(endTime - startTime) / 50}ms per request`);
}

// Run manual test if this file is executed directly
if (require.main === module) {
  testWebhookEndpoint()
    .then(() => performanceTest())
    .catch(console.error);
}

module.exports = {
  testWebhookEndpoint,
  performanceTest
};
