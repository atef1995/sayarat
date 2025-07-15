/**
 * Jest unit tests for Email Service
 * Tests Brevo email service functionality
 */

const BrevoEmailService = require('../service/brevoEmailService');

// Mock fetch for testing
global.fetch = jest.fn();

describe('BrevoEmailService', () => {
  let emailService;

  beforeEach(() => {
    // Clear all mocks before each test
    fetch.mockClear();

    // Set up environment variable mock
    process.env.BREVO_API_KEY = 'test-api-key';

    emailService = new BrevoEmailService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    test('should initialize with API key from environment', () => {
      expect(emailService.apiKey).toBe('test-api-key');
      expect(emailService.baseUrl).toBe('https://api.brevo.com/v3');
    });

    test('should throw error if API key is missing', () => {
      delete process.env.BREVO_API_KEY;

      expect(() => {
        new BrevoEmailService();
      }).toThrow('Brevo API key is required');
    });
  });

  describe('sendEmail', () => {
    test('should send email successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
      };
      fetch.mockResolvedValue(mockResponse);

      const emailData = {
        to: [{ email: 'test@example.com', name: 'Test User' }],
        subject: 'Test Email',
        htmlContent: '<h1>Test</h1>',
        sender: { email: 'noreply@sayarat.autos', name: 'Sayarat' }
      };

      const result = await emailService.sendEmail(emailData);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/smtp/email',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'api-key': 'test-api-key',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(emailData)
        })
      );

      expect(result).toEqual({ messageId: 'test-message-id' });
    });

    test('should handle email sending failure', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Bad Request')
      };
      fetch.mockResolvedValue(mockResponse);

      const emailData = {
        to: [{ email: 'invalid-email', name: 'Test User' }],
        subject: 'Test Email',
        htmlContent: '<h1>Test</h1>'
      };

      await expect(emailService.sendEmail(emailData)).rejects.toThrow('HTTP error! status: 400');
    });
  });

  describe('sendWelcomeEmail', () => {
    test('should send welcome email with correct template', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ messageId: 'welcome-message-id' })
      };
      fetch.mockResolvedValue(mockResponse);

      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User'
      };

      const result = await emailService.sendWelcomeEmail(userData);

      expect(fetch).toHaveBeenCalled();
      const callArgs = fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.to[0].email).toBe(userData.email);
      expect(requestBody.subject).toContain('Welcome');
      expect(requestBody.htmlContent).toContain(userData.username);
      expect(result).toEqual({ messageId: 'welcome-message-id' });
    });
  });

  describe('sendPasswordResetEmail', () => {
    test('should send password reset email with reset link', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ messageId: 'reset-message-id' })
      };
      fetch.mockResolvedValue(mockResponse);

      const userData = {
        email: 'user@example.com',
        username: 'testuser',
        resetToken: 'abc123reset456'
      };

      const result = await emailService.sendPasswordResetEmail(userData);

      expect(fetch).toHaveBeenCalled();
      const callArgs = fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.to[0].email).toBe(userData.email);
      expect(requestBody.subject).toContain('Password Reset');
      expect(requestBody.htmlContent).toContain(userData.resetToken);
      expect(result).toEqual({ messageId: 'reset-message-id' });
    });
  });

  describe('sendEmailVerification', () => {
    test('should send email verification with verification link', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ messageId: 'verify-message-id' })
      };
      fetch.mockResolvedValue(mockResponse);

      const userData = {
        email: 'verify@example.com',
        username: 'verifyuser',
        verificationToken: 'verify123token456'
      };

      const result = await emailService.sendEmailVerification(userData);

      expect(fetch).toHaveBeenCalled();
      const callArgs = fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.to[0].email).toBe(userData.email);
      expect(requestBody.subject).toContain('Verify');
      expect(requestBody.htmlContent).toContain(userData.verificationToken);
      expect(result).toEqual({ messageId: 'verify-message-id' });
    });
  });

  describe('sendCarListingNotification', () => {
    test('should send car listing notification to interested users', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ messageId: 'listing-message-id' })
      };
      fetch.mockResolvedValue(mockResponse);

      const notificationData = {
        userEmail: 'buyer@example.com',
        userName: 'Buyer User',
        carTitle: 'Toyota Camry 2023',
        carPrice: '$25,000',
        carLocation: 'Damascus',
        listingUrl: 'https://sayarat.autos/car-listing/123'
      };

      const result = await emailService.sendCarListingNotification(notificationData);

      expect(fetch).toHaveBeenCalled();
      const callArgs = fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.to[0].email).toBe(notificationData.userEmail);
      expect(requestBody.subject).toContain('New Car Listing');
      expect(requestBody.htmlContent).toContain(notificationData.carTitle);
      expect(result).toEqual({ messageId: 'listing-message-id' });
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const emailData = {
        to: [{ email: 'test@example.com', name: 'Test User' }],
        subject: 'Test Email',
        htmlContent: '<h1>Test</h1>'
      };

      await expect(emailService.sendEmail(emailData)).rejects.toThrow('Network error');
    });

    test('should handle invalid email data', async () => {
      const invalidEmailData = {
        // Missing required fields
        subject: 'Test Email'
      };

      await expect(emailService.sendEmail(invalidEmailData)).rejects.toThrow();
    });
  });

  describe('Email Templates', () => {
    test('should generate Arabic-friendly email templates', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ messageId: 'arabic-message-id' })
      };
      fetch.mockResolvedValue(mockResponse);

      const userData = {
        email: 'arabic@example.com',
        username: 'arabicuser',
        firstName: 'أحمد',
        lastName: 'محمد'
      };

      await emailService.sendWelcomeEmail(userData);

      const callArgs = fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      // Check if Arabic text is properly handled
      expect(requestBody.htmlContent).toContain(userData.firstName);
      expect(requestBody.htmlContent).toContain('سيارات'); // Arabic for "cars"
    });

    test('should include proper branding in all emails', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ messageId: 'brand-message-id' })
      };
      fetch.mockResolvedValue(mockResponse);

      const userData = {
        email: 'brand@example.com',
        username: 'branduser'
      };

      await emailService.sendWelcomeEmail(userData);

      const callArgs = fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.sender.name).toBe('سيارات - Sayarat');
      expect(requestBody.htmlContent).toContain('sayarat.autos');
    });
  });
});
