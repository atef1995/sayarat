/**
 * Email Service Unit Tests
 *
 * Tests the BrevoEmailService functionality including:
 * - Template loading and processing
 * - Email sending (mocked)
 * - Error handling
 * - Parameter substitution
 *
 * #TODO: Add integration tests with real Brevo API in separate file
 * #TODO: Add performance tests for bulk email sending
 */

const fs = require('fs').promises;
const path = require('path');
const BrevoEmailService = require('../../service/brevoEmailService');

// Mock axios for API calls
jest.mock('axios');
const axios = require('axios');

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock fs for file operations
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    access: jest.fn()
  }
}));

describe('BrevoEmailService', () => {
  let emailService;
  const mockApiKey = 'test-api-key-12345';

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Set environment variables
    process.env.BREVO_API_KEY = mockApiKey;
    process.env.CLIENT_URL = 'https://test.carsbids.com';
    process.env.SUPPORT_URL = 'https://support.carsbids.com';

    // Initialize service
    emailService = new BrevoEmailService();
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.BREVO_API_KEY;
    delete process.env.CLIENT_URL;
    delete process.env.SUPPORT_URL;
  });

  describe('Constructor', () => {
    it('should initialize with valid API key', () => {
      expect(emailService.apiKey).toBe(mockApiKey);
      expect(emailService.baseUrl).toBe('https://api.brevo.com/v3');
      expect(emailService.templateCache).toBeInstanceOf(Map);
    });
    it('should throw error without API key', () => {
      delete process.env.BREVO_API_KEY;
      expect(() => new BrevoEmailService()).toThrow('BREVO_API_KEY environment variable is required');
    });
  });

  describe('Template Loading', () => {
    it('should load template from file system', async() => {
      const mockTemplate = '<html><body>Hello {{name}}!</body></html>';
      fs.readFile.mockResolvedValue(mockTemplate);

      const result = await emailService.loadTemplate('welcome');

      expect(fs.readFile).toHaveBeenCalledWith(path.join(__dirname, '../../email-templates/welcome.html'), 'utf8');
      expect(result).toBe(mockTemplate);
      expect(emailService.templateCache.get('welcome')).toBe(mockTemplate);
    });

    it('should return cached template on subsequent calls', async() => {
      const mockTemplate = '<html><body>Cached template</body></html>';
      emailService.templateCache.set('test', mockTemplate);

      const result = await emailService.loadTemplate('test');

      expect(fs.readFile).not.toHaveBeenCalled();
      expect(result).toBe(mockTemplate);
    });

    it('should throw error when template file not found', async() => {
      fs.readFile.mockRejectedValue(new Error('ENOENT: no such file'));
      await expect(emailService.loadTemplate('nonexistent')).rejects.toThrow('Email template not found: nonexistent');
    });
  });

  describe('Template Processing', () => {
    it('should replace simple parameters', () => {
      const template = '<h1>Hello {{name}}!</h1><p>Welcome to {{platform}}</p>';
      const params = { name: 'أحمد', platform: 'Cars Bids' };

      const result = emailService.processTemplate(template, params);

      expect(result).toBe('<h1>Hello أحمد!</h1><p>Welcome to Cars Bids</p>');
    });

    it('should replace Brevo-style parameters', () => {
      const template = '<h1>Hello {{ params.name }}!</h1><p>Amount: {{ params.amount }}</p>';
      const params = { name: 'محمد', amount: '1500.00' };

      const result = emailService.processTemplate(template, params);

      expect(result).toBe('<h1>Hello محمد!</h1><p>Amount: 1500.00</p>');
    });

    it('should handle conditional blocks correctly', () => {
      const template = `
        <h1>Welcome!</h1>
        {{#if params.isVip}}
        <p>You are a VIP member!</p>
        {{/if}}
        <p>Thank you for joining.</p>
      `;
      const params = { isVip: true };

      const result = emailService.processTemplate(template, params);

      expect(result.trim()).toContain('You are a VIP member!');
    });

    it('should hide conditional blocks when condition is false', () => {
      const template = `
        <h1>Welcome!</h1>
        {{#if params.isVip}}
        <p>You are a VIP member!</p>
        {{/if}}
        <p>Thank you for joining.</p>
      `;
      const params = { isVip: false };

      const result = emailService.processTemplate(template, params);

      expect(result).not.toContain('You are a VIP member!');
      expect(result).toContain('Thank you for joining.');
    });
  });

  describe('Email Sending', () => {
    beforeEach(() => {
      // Mock successful API response
      axios.post.mockResolvedValue({
        status: 201,
        data: {
          messageId: 'test-message-id-123'
        }
      });

      // Mock template loading
      fs.readFile.mockResolvedValue('<html><body>Test email to {{name}}</body></html>');
    });

    it('should send templated email successfully', async() => {
      const emailOptions = {
        templateName: 'welcome',
        to: { email: 'test@example.com', name: 'أحمد محمد' },
        subject: 'مرحباً بك',
        params: { name: 'أحمد' },
        requestId: 'req-123'
      };

      const result = await emailService.sendTemplatedEmail(emailOptions);
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/smtp/email',
        {
          to: [{ email: 'test@example.com', name: 'أحمد محمد' }],
          subject: 'مرحباً بك',
          htmlContent: '<html><body>Test email to أحمد</body></html>',
          sender: { name: 'Cars Bids', email: 'noreply@carsbids.com' },
          tags: ['welcome', 'webhook', 'automated'],
          headers: {
            'X-Request-ID': 'req-123'
          }
        },
        {
          headers: {
            Accept: 'application/json',
            'api-key': mockApiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toEqual({
        success: true,
        messageId: 'test-message-id-123',
        provider: 'brevo'
      });
    });
    it('should handle API errors gracefully', async() => {
      const apiError = {
        response: {
          status: 400,
          data: { message: 'Invalid email address' }
        }
      };

      axios.post.mockRejectedValue(apiError);

      const emailOptions = {
        templateName: 'welcome',
        to: { email: 'invalid-email', name: 'Test' },
        subject: 'Test',
        params: {},
        requestId: 'req-456'
      };

      await expect(emailService.sendTemplatedEmail(emailOptions)).rejects.toEqual(apiError);
    });
  });

  describe('Payment Success Email', () => {
    it('should send payment success email with correct parameters', async() => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        amount: 15000, // 150.00 in cents
        currency: 'usd',
        metadata: {
          name: 'أحمد محمد',
          email: 'ahmed@example.com',
          listingType: 'إعلان مميز'
        }
      };

      // Mock template and API response
      fs.readFile.mockResolvedValue('<html><body>Payment success for {{customerName}}</body></html>');
      axios.post.mockResolvedValue({
        status: 201,
        data: { messageId: 'payment-success-123' }
      });

      const result = await emailService.sendPaymentSuccessEmail(mockPaymentIntent, 'req-789');

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          to: [{ email: 'ahmed@example.com', name: 'أحمد محمد' }],
          subject: 'تم الدفع بنجاح - Cars Bids',
          htmlContent: expect.stringContaining('أحمد محمد')
        }),
        expect.any(Object)
      );
    });

    it('should handle missing metadata gracefully', async() => {
      const mockPaymentIntent = {
        id: 'pi_test_456',
        amount: 25000,
        currency: 'usd',
        metadata: {} // Empty metadata
      };

      fs.readFile.mockResolvedValue('<html><body>Payment success for {{customerName}}</body></html>');
      axios.post.mockResolvedValue({
        status: 201,
        data: { messageId: 'payment-success-456' }
      });

      const result = await emailService.sendPaymentSuccessEmail(mockPaymentIntent, 'req-101');

      expect(result.success).toBe(true);
      // Should use default customer name
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          htmlContent: expect.stringContaining('عزيزي العميل')
        }),
        expect.any(Object)
      );
    });
  });

  describe('Verification Email', () => {
    it('should send verification email with correct verification URL', async() => {
      const email = 'user@example.com';
      const firstName = 'محمد';
      const verificationToken = 'verify-token-123';
      const requestId = 'req-verify-1';

      fs.readFile.mockResolvedValue('<html><body>Verify: {{verificationUrl}}</body></html>');
      axios.post.mockResolvedValue({
        status: 201,
        data: { messageId: 'verify-email-123' }
      });

      const result = await emailService.sendVerificationEmail(email, firstName, requestId, verificationToken);

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          to: [{ email, name: firstName }],
          subject: 'تحقق من بريدك الإلكتروني - Cars Bids',
          htmlContent: expect.stringContaining(`https://test.carsbids.com/verify-email?token=${verificationToken}`)
        }),
        expect.any(Object)
      );
    });
  });

  describe('Company Welcome Email', () => {
    it('should send company welcome email with admin and company data', async() => {
      const adminData = {
        email: 'admin@company.com',
        firstName: 'أحمد',
        lastName: 'محمد'
      };

      const companyData = {
        name: 'شركة السيارات المتحدة',
        city: 'دمشق',
        address: 'شارع الثورة، مبنى رقم 123'
      };

      fs.readFile.mockResolvedValue('<html><body>Welcome {{adminName}} to {{companyName}}</body></html>');
      axios.post.mockResolvedValue({
        status: 201,
        data: { messageId: 'company-welcome-123' }
      });

      const result = await emailService.sendCompanyWelcomeEmail(adminData, companyData, 'req-company-1');

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          to: [{ email: adminData.email, name: `${adminData.firstName} ${adminData.lastName}` }],
          subject: `مرحباً بكم في Cars Bids - ${companyData.name}`,
          htmlContent: expect.stringContaining(companyData.name)
        }),
        expect.any(Object)
      );
    });
  });

  describe('Test Email', () => {
    it('should send test email for configuration verification', async() => {
      const testEmail = 'test@carsbids.com';
      const requestId = 'req-test-1';

      fs.readFile.mockResolvedValue('<html><body>Test email content</body></html>');
      axios.post.mockResolvedValue({
        status: 201,
        data: { messageId: 'test-email-123' }
      });

      const result = await emailService.sendTestEmail(testEmail, requestId);

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          to: [{ email: testEmail, name: 'مستخدم تجريبي' }],
          subject: '[TEST] تم الدفع بنجاح - Cars Bids',
          htmlContent: expect.stringContaining('Test email content')
        }),
        expect.any(Object)
      );
    });
  });
});

// Export for use in integration tests
module.exports = {
  BrevoEmailService
};
