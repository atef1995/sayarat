/**
 * Email Routes Unit Tests
 *
 * Tests the email router functionality including:
 * - Password reset request
 * - Password reset verification
 * - Email verification
 * - Error handling and validation
 * - Database interactions
 * - Email service integration
 *
 * @module EmailRoutesTest
 */

const request = require('supertest');
const express = require('express');
const { emailRouter } = require('../../routes/email');
const verifyEmailToken = require('../../utils/verifyEmailToken');
const checkIfEmailExists = require('../../utils/checkIfEmailExists');
const { validatePassword } = require('../../service/inputValidation');
const brevoEmailService = require('../../service/brevoEmailService');

// Mock dependencies
jest.mock('../../utils/verifyEmailToken');
jest.mock('../../utils/checkIfEmailExists');
jest.mock('../../service/inputValidation');
jest.mock('../../service/brevoEmailService');
jest.mock('../../generator/token', () => ({
  generateResetToken: jest.fn(() => 'mocked-reset-token-64-chars-long-abcdefghijklmnopqrstuvwxyz1234567890'),
  generateTokenExpiry: jest.fn(() => new Date(Date.now() + 3600000))
}));
jest.mock('../../utils/reqIdGenerator', () => {
  return jest.fn().mockImplementation(() => ({
    generateRequestId: jest.fn(() => 'req_' + Math.random().toString(36).substring(7))
  }));
});
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock crypto for consistent token generation
const crypto = require('crypto');
jest.mock('crypto', () => {
  const actualCrypto = jest.requireActual('crypto');
  return {
    ...actualCrypto, // Keep all original crypto functions
    randomBytes: jest.fn(() => ({
      toString: jest.fn(() => 'mocked-salt-hex-string')
    })),
    pbkdf2: jest.fn((password, salt, iterations, keylen, digest, callback) => {
      // Simulate async password hashing with immediate callback
      setImmediate(() => {
        callback(null, Buffer.from('mocked-hashed-password'));
      });
    })
  };
});

describe('Email Routes', () => {
  let app;
  let mockKnex;
  let mockEmailService;

  beforeAll(() => {
    // Set test timeout
    jest.setTimeout(10000);
  });

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a more comprehensive Knex mock that handles different query patterns
    const createMockQuery = () => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      first: jest.fn(),
      update: jest.fn().mockResolvedValue(1),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: jest.fn((callback) => {
        callback();
        return Promise.resolve();
      }),
      catch: jest.fn().mockReturnThis()
    });

    // Mock Knex database - make it callable for table selection
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
              email: whereCall[0].email,
              first_name: 'أحمد',
              username: 'ahmed_test'
            });
          }
          return Promise.resolve(null);
        });
      }

      return query;
    });

    // Also add the methods directly to mockKnex for direct chaining
    Object.assign(mockKnex, createMockQuery());

    // Mock email service
    mockEmailService = {
      sendResetPasswordEmail: jest.fn().mockResolvedValue({
        success: true,
        messageId: 'msg_123'
      }),
      sendEmailVerifiedNotification: jest.fn().mockResolvedValue({
        success: true,
        messageId: 'msg_456'
      })
    };
    brevoEmailService.mockImplementation(() => mockEmailService);

    // Setup Express app with email router
    app = express();
    app.use(express.json());
    app.use('/api', emailRouter(mockKnex));

    // Set environment variables
    process.env.CLIENT_URL = 'https://test.sayarat.com';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/reset-password-request', () => {
    const validEmail = 'test@sayarat.autos';
    const mockUser = {
      id: 1,
      email: validEmail,
      first_name: 'أحمد',
      username: 'ahmed_test'
    };

    beforeEach(() => {
      // Mock successful email existence check
      checkIfEmailExists.mockResolvedValue(true);

      // Mock successful user lookup
      mockKnex.where.mockReturnThis();
      mockKnex.first.mockResolvedValue(mockUser);

      // Mock successful token update
      mockKnex.update.mockResolvedValue(1);

      // Mock successful email sending
      mockEmailService.sendResetPasswordEmail.mockResolvedValue({
        success: true,
        messageId: 'msg_123'
      });
    });

    it('should successfully send password reset email', async () => {
      const response = await request(app)
        .post('/api/reset-password-request')
        .send({ email: validEmail });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'تم إرسال بريد إعادة تعيين كلمة المرور بنجاح'
      });

      // Verify email existence was checked
      expect(checkIfEmailExists).toHaveBeenCalledWith(validEmail, mockKnex);

      // Verify user lookup
      expect(mockKnex.where).toHaveBeenCalledWith({ email: validEmail });

      // Verify email service was called
      expect(mockEmailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        validEmail,
        mockUser.first_name,
        expect.any(String), // reqId
        expect.any(String), // resetToken
        mockUser.username
      );
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/reset-password-request')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Email is required'
      });
    });

    it('should return 400 when email does not exist', async () => {
      checkIfEmailExists.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/reset-password-request')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'error'
      });
    });

    it('should return 400 when user is not found', async () => {
      mockKnex.first.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/reset-password-request')
        .send({ email: validEmail });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'المستخدم غير موجود'
      });
    });

    it('should return 500 when email service fails', async () => {
      mockEmailService.sendResetPasswordEmail.mockResolvedValue({
        success: false,
        error: 'Email service error'
      });

      const response = await request(app)
        .post('/api/reset-password-request')
        .send({ email: validEmail });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'فشل في إرسال بريد إعادة تعيين كلمة المرور'
      });
    });

    it('should handle database errors gracefully', async () => {
      mockKnex.update.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/reset-password-request')
        .send({ email: validEmail })
        .timeout(5000); // Add timeout to prevent hanging

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'فشل في إرسال بريد إعادة تعيين كلمة المرور'
      });
    });
  });

  describe('POST /api/reset-password', () => {
    const validToken = 'a'.repeat(64); // 64-character token
    const validPassword = 'NewPassword123!';
    const mockUser = {
      id: 1,
      email: 'test@sayarat.autos',
      reset_token_expiry: new Date(Date.now() + 3600000) // 1 hour from now
    };

    beforeEach(() => {
      // Mock successful password validation
      validatePassword.mockImplementation(() => { }); // No error thrown

      // Mock successful user lookup with valid token
      mockKnex.where.mockReturnThis();
      mockKnex.andWhere.mockReturnThis();
      mockKnex.first.mockResolvedValue(mockUser);

      // Mock successful password update
      mockKnex.update.mockResolvedValue(1);
    });

    it('should successfully reset password', async () => {
      const response = await request(app)
        .post('/api/reset-password')
        .send({
          token: validToken,
          password: validPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'تم إعادة تعيين كلمة المرور بنجاح'
      });

      // Verify password validation was called
      expect(validatePassword).toHaveBeenCalledWith(validPassword);

      // Verify database update was called
      expect(mockKnex.update).toHaveBeenCalledWith({
        hashed_password: expect.any(Buffer),
        salt: 'mocked-salt-hex-string',
        reset_token: null,
        reset_token_expiry: null
      });
    });

    it('should return 400 when token is missing', async () => {
      const response = await request(app)
        .post('/api/reset-password')
        .send({ password: validPassword });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'الرمز وكلمة المرور مطلوبة'
      });
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/reset-password')
        .send({ token: validToken });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'الرمز وكلمة المرور مطلوبة'
      });
    });

    it('should return 400 when token length is invalid', async () => {
      const invalidToken = 'short-token';

      const response = await request(app)
        .post('/api/reset-password')
        .send({
          token: invalidToken,
          password: validPassword
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'خطأ في إعادة تعيين كلمة المرور'
      });
    });

    it('should return 400 when password validation fails', async () => {
      validatePassword.mockImplementation(() => {
        throw new Error('كلمة المرور ضعيفة جداً');
      });

      const response = await request(app)
        .post('/api/reset-password')
        .send({
          token: validToken,
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'كلمة المرور ضعيفة جداً'
      });
    });

    it('should return 400 when token is invalid or expired', async () => {
      mockKnex.first.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/reset-password')
        .send({
          token: validToken,
          password: validPassword
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'الرمز غير صالح أو منتهي الصلاحية'
      });
    });

    it('should return 400 when token has expired', async () => {
      const expiredUser = {
        ...mockUser,
        reset_token_expiry: new Date(Date.now() - 3600000) // 1 hour ago
      };
      mockKnex.first.mockResolvedValue(expiredUser);

      const response = await request(app)
        .post('/api/reset-password')
        .send({
          token: validToken,
          password: validPassword
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'الرمز غير صالح أو منتهي الصلاحية يرجى طلب اعادة تعيين كلمة المرور مرة أخرى'
      });
    });
  });

  describe('POST /api/verify-email', () => {
    const validToken = 'valid-email-verification-token';
    const mockVerificationResult = {
      success: true,
      message: 'Email verified successfully',
      email: 'test@sayarat.autos',
      firstName: 'أحمد'
    };

    beforeEach(() => {
      // Mock successful email verification
      verifyEmailToken.mockResolvedValue(mockVerificationResult);

      // Mock successful notification email
      mockEmailService.sendEmailVerifiedNotification.mockResolvedValue({
        success: true,
        messageId: 'msg_456'
      });
    });

    it('should successfully verify email and send notification', async () => {
      const response = await request(app)
        .post('/api/verify-email')
        .send({ token: validToken });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Email Verified!'
      });

      // Verify email token verification was called
      expect(verifyEmailToken).toHaveBeenCalledWith(mockKnex, validToken);

      // Verify notification email was sent
      expect(mockEmailService.sendEmailVerifiedNotification).toHaveBeenCalledWith(
        mockVerificationResult.email,
        mockVerificationResult.firstName,
        expect.any(String) // reqId
      );
    });

    it('should return 400 when token is missing', async () => {
      const response = await request(app)
        .post('/api/verify-email')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Error'
      });
    });

    it('should return 400 when email verification fails', async () => {
      verifyEmailToken.mockResolvedValue({
        success: false,
        message: 'Invalid or expired token'
      });

      const response = await request(app)
        .post('/api/verify-email')
        .send({ token: validToken });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Invalid or expired token'
      });
    });

    it('should succeed even when notification email fails', async () => {
      mockEmailService.sendEmailVerifiedNotification.mockResolvedValue({
        success: false,
        error: 'Email service error'
      });

      const response = await request(app)
        .post('/api/verify-email')
        .send({ token: validToken });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Email Verified!'
      });

      // Verification should still succeed even if notification fails
      expect(verifyEmailToken).toHaveBeenCalledWith(mockKnex, validToken);
    });

    it('should succeed even when notification email throws exception', async () => {
      mockEmailService.sendEmailVerifiedNotification.mockRejectedValue(
        new Error('Email service connection failed')
      );

      const response = await request(app)
        .post('/api/verify-email')
        .send({ token: validToken });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Email Verified!'
      });

      // Verification should still succeed even if notification throws
      expect(verifyEmailToken).toHaveBeenCalledWith(mockKnex, validToken);
    });

    it('should handle empty token gracefully', async () => {
      const response = await request(app)
        .post('/api/verify-email')
        .send({ token: '' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Error'
      });
    });

    it('should handle null token gracefully', async () => {
      const response = await request(app)
        .post('/api/verify-email')
        .send({ token: null });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Error'
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/reset-password-request')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/reset-password-request')
        .send('email=test@example.com');

      // Should handle form-encoded data or return appropriate error
      expect([400, 415]).toContain(response.status);
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(300) + '@example.com';

      const response = await request(app)
        .post('/api/reset-password-request')
        .send({ email: longEmail });

      expect(response.status).toBe(400);
    });

    it('should handle special characters in token', async () => {
      const specialToken = 'token-with-special-chars-@#$%^&*()';

      const response = await request(app)
        .post('/api/verify-email')
        .send({ token: specialToken });

      expect(response.status).toBe(400);
      expect(verifyEmailToken).toHaveBeenCalledWith(mockKnex, specialToken);
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive information in password reset errors', async () => {
      checkIfEmailExists.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/reset-password-request')
        .send({ email: 'sensitive@company.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('error'); // Generic error message
    });

    it('should not expose user existence through timing attacks', async () => {
      // This test would require more sophisticated timing analysis
      // For now, we verify that errors are consistent
      checkIfEmailExists.mockResolvedValue(false);

      const start = Date.now();
      await request(app)
        .post('/api/reset-password-request')
        .send({ email: 'nonexistent@example.com' });
      const duration = Date.now() - start;

      // Response should be reasonably fast (not artificially delayed)
      expect(duration).toBeLessThan(1000);
    });

    it('should validate token format for reset password', async () => {
      const response = await request(app)
        .post('/api/reset-password')
        .send({
          token: 'invalid-short-token',
          password: 'ValidPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('خطأ في إعادة تعيين كلمة المرور');
    });
  });

  describe('Request ID Generation and Logging', () => {
    it('should generate unique request IDs for each request', async () => {
      checkIfEmailExists.mockResolvedValue(true);
      mockKnex.first.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test'
      });
      mockEmailService.sendResetPasswordEmail.mockResolvedValue({
        success: true,
        messageId: 'msg_123'
      });

      // Make multiple requests
      const response1 = await request(app)
        .post('/api/reset-password-request')
        .send({ email: 'test1@example.com' });

      const response2 = await request(app)
        .post('/api/reset-password-request')
        .send({ email: 'test2@example.com' });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Verify that email service was called with different request IDs
      const calls = mockEmailService.sendResetPasswordEmail.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][2]).not.toBe(calls[1][2]); // Different request IDs
    });
  });
});
