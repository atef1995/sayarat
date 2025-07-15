/**
 * Simplified Email Routes Tests
 * 
 * Basic tests for email routes to verify core functionality
 * without complex mocking that might cause hanging issues.
 */

const request = require('supertest');
const express = require('express');
const { emailRouter } = require('../../routes/email');

// Simple mocks
jest.mock('../../utils/verifyEmailToken', () => jest.fn());
jest.mock('../../utils/checkIfEmailExists', () => jest.fn());
jest.mock('../../service/inputValidation', () => ({
  validatePassword: jest.fn()
}));
jest.mock('../../service/brevoEmailService', () => {
  return jest.fn().mockImplementation(() => ({
    sendResetPasswordEmail: jest.fn().mockResolvedValue({
      success: true,
      messageId: 'test_msg_123'
    }),
    sendEmailVerifiedNotification: jest.fn().mockResolvedValue({
      success: true,
      messageId: 'test_msg_456'
    })
  }));
});
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock token generation
jest.mock('../../generator/token', () => ({
  generateResetToken: () => 'a'.repeat(64),
  generateTokenExpiry: () => new Date(Date.now() + 3600000)
}));

describe('Email Routes - Basic Tests', () => {
  let app;
  let mockKnex;
  const verifyEmailToken = require('../../utils/verifyEmailToken');
  const checkIfEmailExists = require('../../utils/checkIfEmailExists');
  const { validatePassword } = require('../../service/inputValidation');

  beforeAll(() => {
    jest.setTimeout(10000);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a more comprehensive Knex mock
    const createMockQuery = () => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      first: jest.fn(),
      update: jest.fn().mockResolvedValue(1),
      then: jest.fn((callback) => {
        callback();
        return Promise.resolve();
      }),
      catch: jest.fn().mockReturnThis()
    });

    // Mock for different query scenarios
    mockKnex = jest.fn((tableName) => {
      const query = createMockQuery();

      if (tableName === 'sellers') {
        // Setup different responses based on the query context
        query.first.mockImplementation(() => {
          const whereCall = query.where.mock.calls[0];
          if (whereCall && whereCall[0] && whereCall[0].email && whereCall[0].reset_token) {
            // This is the existing token check - should return null (no existing token)
            return Promise.resolve(null);
          } else if (whereCall && whereCall[0] && whereCall[0].email) {
            // This is the user lookup - return user object
            return Promise.resolve({
              id: 1,
              email: 'test@sayarat.autos',
              first_name: 'Test User',
              username: 'testuser'
            });
          }
          return Promise.resolve(null);
        });
      }

      return query;
    });

    // Also add the methods directly to mockKnex for chaining
    Object.assign(mockKnex, createMockQuery());

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api', emailRouter(mockKnex));

    process.env.CLIENT_URL = 'https://test.sayarat.com';
  });

  describe('POST /api/verify-email', () => {
    it('should return 400 when no token provided', async () => {
      const response = await request(app)
        .post('/api/verify-email')
        .send({})
        .timeout(5000);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Error'
      });
    });

    it('should return 400 when token is empty string', async () => {
      const response = await request(app)
        .post('/api/verify-email')
        .send({ token: '' })
        .timeout(5000);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Error'
      });
    });

    it('should verify email successfully when token is valid', async () => {
      verifyEmailToken.mockResolvedValue({
        success: true,
        message: 'Email verified successfully',
        email: 'test@sayarat.autos',
        firstName: 'Test User'
      });

      const response = await request(app)
        .post('/api/verify-email')
        .send({ token: 'valid-token-123' })
        .timeout(5000);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Email Verified!'
      });
    });

    it('should return 400 when verification fails', async () => {
      verifyEmailToken.mockResolvedValue({
        success: false,
        message: 'Invalid or expired token'
      });

      const response = await request(app)
        .post('/api/verify-email')
        .send({ token: 'invalid-token' })
        .timeout(5000);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid or expired token'
      });
    });
  });

  describe('POST /api/reset-password-request', () => {
    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/reset-password-request')
        .send({})
        .timeout(5000);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Email is required'
      });
    });

    it('should return 400 when email does not exist', async () => {
      checkIfEmailExists.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/reset-password-request')
        .send({ email: 'nonexistent@example.com' })
        .timeout(5000);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'error'
      });
    });

    it('should send reset email successfully', async () => {
      checkIfEmailExists.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/reset-password-request')
        .send({ email: 'test@sayarat.autos' })
        .timeout(5000);

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'تم إرسال بريد إعادة تعيين كلمة المرور بنجاح'
      });
    });
  });

  describe('POST /api/reset-password', () => {
    it('should return 400 when token is missing', async () => {
      const response = await request(app)
        .post('/api/reset-password')
        .send({ password: 'NewPassword123!' })
        .timeout(5000);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'الرمز وكلمة المرور مطلوبة'
      });
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/reset-password')
        .send({ token: 'a'.repeat(64) })
        .timeout(5000);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'الرمز وكلمة المرور مطلوبة'
      });
    });

    it('should return 400 when token is too short', async () => {
      const response = await request(app)
        .post('/api/reset-password')
        .send({
          token: 'short-token',
          password: 'NewPassword123!'
        })
        .timeout(5000);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'خطأ في إعادة تعيين كلمة المرور'
      });
    });
  });
});

// Add a simple smoke test
describe('Email Routes - Smoke Test', () => {
  it('should load the email router without errors', () => {
    expect(typeof emailRouter).toBe('function');
  });
});
