/**
 * Email Integration Tests
 *
 * Tests email functionality with real Brevo API integration
 * These tests require valid BREVO_API_KEY and will send real emails
 *
 * Run with: npm run test:integration:email
 *
 * #TODO: Add webhook testing for delivery/bounce notifications
 * #TODO: Add bulk email testing
 * #TODO: Add rate limiting tests
 */

const BrevoEmailService = require('../../service/brevoEmailService');
const fs = require('fs').promises;
const path = require('path');

// Skip these tests if no API key is provided
const skipIntegrationTests = !process.env.BREVO_API_KEY || process.env.NODE_ENV === 'test';

// Use conditional describe to skip entire test suite
const describeOrSkip = skipIntegrationTests ? describe.skip : describe;

describeOrSkip('Email Integration Tests', () => {
  let emailService;
  const testEmail = process.env.TEST_EMAIL || 'test@carsbids.com';
  beforeAll(async() => {
    emailService = new BrevoEmailService();

    // Ensure test email templates exist
    await createTestTemplates();
  });

  describe('Real Email Delivery', () => {
    it('should send test email and receive success response', async() => {
      const requestId = `integration-test-${Date.now()}`;

      const result = await emailService.sendTestEmail(testEmail, requestId);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.requestId).toBe(requestId);

      console.log(`✅ Test email sent successfully: ${result.messageId}`);
    }, 30000); // 30 second timeout

    it('should send verification email with real token', async() => {
      const verificationToken = `test-token-${Math.random().toString(36).substring(7)}`;
      const requestId = `verify-test-${Date.now()}`;

      const result = await emailService.sendVerificationEmail(testEmail, 'Test User', requestId, verificationToken);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();

      console.log(`✅ Verification email sent: ${result.messageId}`);
    }, 30000);

    it('should send payment success email with real data', async() => {
      const mockPaymentIntent = {
        id: `pi_test_${Date.now()}`,
        amount: 15000, // $150.00
        currency: 'usd',
        metadata: {
          name: 'Ahmed Test',
          email: testEmail,
          listingType: 'إعلان مميز'
        }
      };

      const requestId = `payment-test-${Date.now()}`;

      const result = await emailService.sendPaymentSuccessEmail(mockPaymentIntent, requestId);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();

      console.log(`✅ Payment success email sent: ${result.messageId}`);
    }, 30000);

    it('should send company welcome email', async() => {
      const adminData = {
        email: testEmail,
        firstName: 'أحمد',
        lastName: 'محمد'
      };

      const companyData = {
        name: 'شركة الاختبار المتكاملة',
        city: 'دمشق',
        address: 'شارع الاختبار، مبنى رقم 100'
      };

      const requestId = `company-welcome-${Date.now()}`;

      const result = await emailService.sendCompanyWelcomeEmail(adminData, companyData, requestId);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();

      console.log(`✅ Company welcome email sent: ${result.messageId}`);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle invalid email address', async() => {
      const invalidEmail = 'invalid-email-format';
      const requestId = `error-test-${Date.now()}`;

      const result = await emailService.sendTestEmail(invalidEmail, requestId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.requestId).toBe(requestId);

      console.log(`✅ Invalid email error handled: ${result.error}`);
    });

    it('should handle API rate limiting gracefully', async() => {
      const requests = [];
      const requestId = `rate-limit-test-${Date.now()}`;

      // Send multiple emails rapidly to test rate limiting
      for (let i = 0; i < 5; i++) {
        requests.push(emailService.sendTestEmail(`test+${i}@carsbids.com`, `${requestId}-${i}`));
      }

      const results = await Promise.allSettled(requests);

      // At least some should succeed
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

      expect(successCount).toBeGreaterThan(0);

      console.log(`✅ Rate limiting test completed: ${successCount}/5 succeeded`);
    }, 60000);
  });

  describe('Template Validation', () => {
    it('should load and process all email templates', async() => {
      const templateDir = path.join(__dirname, '../../email-templates');

      try {
        const files = await fs.readdir(templateDir);
        const htmlFiles = files.filter(f => f.endsWith('.html'));

        expect(htmlFiles.length).toBeGreaterThan(0);

        for (const file of htmlFiles) {
          const templateName = file.replace('.html', '');
          const template = await emailService.loadTemplate(templateName);

          expect(template).toBeDefined();
          expect(template.length).toBeGreaterThan(0);
          expect(template).toMatch(/<html.*?>.*<\/html>/s);

          console.log(`✅ Template loaded: ${templateName}`);
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('⚠️  Email templates directory not found - creating test templates');
          await createTestTemplates();
        } else {
          throw error;
        }
      }
    });
  });
});

/**
 * Create test email templates for integration testing
 */
async function createTestTemplates() {
  const templateDir = path.join(__dirname, '../../email-templates');

  try {
    await fs.access(templateDir);
  } catch {
    await fs.mkdir(templateDir, { recursive: true });
  }

  const templates = {
    'test-email': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Test Email</title>
</head>
<body>
    <h1>Test Email من Cars Bids</h1>
    <p>هذا اختبار للتأكد من عمل خدمة البريد الإلكتروني بشكل صحيح.</p>
    <p>التاريخ: {{currentDate}}</p>
    <p>الوقت: {{currentTime}}</p>
    <p>معرف الطلب: {{requestId}}</p>
</body>
</html>`,

    'verify-email': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>تحقق من البريد الإلكتروني</title>
</head>
<body>
    <h1>مرحباً بك في Cars Bids</h1>
    <p>يرجى الضغط على الرابط التالي للتحقق من بريدك الإلكتروني:</p>
    <a href="{{verificationUrl}}">تحقق من البريد الإلكتروني</a>
    <p>إذا لم تقم بإنشاء حساب، يرجى تجاهل هذه الرسالة.</p>
    <p>فريق Cars Bids</p>
</body>
</html>`,

    'success-payment': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>تم الدفع بنجاح</title>
</head>
<body>
    <h1>تم الدفع بنجاح</h1>
    <p>عزيزي {{customerName}},</p>
    <p>تم استلام دفعتك بنجاح بمبلغ {{amount}} {{currency}}.</p>
    <p>معرف العملية: {{paymentId}}</p>
    <p>نوع الإعلان: {{listingType}}</p>
    <p>تاريخ الدفع: {{paymentDate}}</p>
    <p>شكراً لاستخدام Cars Bids</p>
</body>
</html>`,

    'company-welcome': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>مرحباً بك في Cars Bids</title>
</head>
<body>
    <h1>مرحباً بك {{adminName}}</h1>
    <p>تم إنشاء حساب الشركة بنجاح!</p>
    <p><strong>اسم الشركة:</strong> {{companyName}}</p>
    <p><strong>المدينة:</strong> {{companyCity}}</p>
    <p><strong>العنوان:</strong> {{companyAddress}}</p>
    <p>يمكنك الآن البدء في استخدام منصة Cars Bids.</p>
    <p>فريق Cars Bids</p>
</body>
</html>`
  };

  for (const [name, content] of Object.entries(templates)) {
    const filePath = path.join(templateDir, `${name}.html`);
    await fs.writeFile(filePath, content.trim(), 'utf8');
  }

  console.log('✅ Test email templates created');
}

module.exports = {
  createTestTemplates
};
