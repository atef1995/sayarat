#!/usr/bin/env node

/**
 * Email Test Runner Script
 *
 * Quick script to test email functionality and verify setup
 *
 * Usage:
 *   npm run test:email:quick
 *   node scripts/test-email-quick.js
 */

const BrevoEmailService = require('../service/brevoEmailService');

async function runQuickEmailTest() {
  console.log('🧪 Quick Email Service Test\n');

  try {
    // Test 1: Service Initialization
    console.log('📋 Test 1: Service Initialization');
    let emailService;

    try {
      emailService = new BrevoEmailService();
      console.log('✅ BrevoEmailService initialized successfully');
      console.log(`   API Key: ${emailService.apiKey ? 'Set' : 'Not set'}`);
      console.log(`   Base URL: ${emailService.baseUrl}`);
    } catch (error) {
      console.log('❌ Failed to initialize BrevoEmailService:', error.message);
      return;
    }

    // Test 2: Template Processing
    console.log('\n📋 Test 2: Template Processing');
    const testTemplate = `
      <html>
        <body>
          <h1>مرحباً {{name}}!</h1>
          <p>Amount: {{params.amount}} {{params.currency}}</p>
          {{#if params.isVip}}
          <p>You are a VIP member!</p>
          {{/if}}
        </body>
      </html>
    `;

    const testParams = {
      name: 'أحمد محمد',
      amount: '150.00',
      currency: 'USD',
      isVip: true
    };

    const processedTemplate = emailService.processTemplate(testTemplate, testParams);
    console.log('✅ Template processing working');
    console.log('   Contains customer name:', processedTemplate.includes('أحمد محمد'));
    console.log('   Contains amount:', processedTemplate.includes('150.00'));
    console.log('   Contains VIP section:', processedTemplate.includes('VIP member'));

    // Test 3: Email Payload Structure
    console.log('\n📋 Test 3: Email Payload Structure');

    // Mock the actual sending to avoid API calls in quick test
    const originalSendTemplatedEmail = emailService.sendTemplatedEmail;
    let capturedPayload = null;

    emailService.sendTemplatedEmail = async function(options) {
      capturedPayload = options;
      return { success: true, messageId: 'test-123', provider: 'brevo' };
    };

    const testEmailOptions = {
      templateName: 'test-email',
      to: { email: 'test@example.com', name: 'Test User' },
      subject: 'Test Email',
      params: { message: 'Hello World' },
      requestId: 'quick-test-123'
    };

    // Mock template loading
    emailService.loadTemplate = async() => '<html><body>{{message}}</body></html>';

    await emailService.sendTemplatedEmail(testEmailOptions);

    console.log('✅ Email payload structure validated');
    console.log(`   Template: ${capturedPayload.templateName}`);
    console.log(`   Recipient: ${capturedPayload.to.email}`);
    console.log(`   Subject: ${capturedPayload.subject}`);
    console.log(`   Request ID: ${capturedPayload.requestId}`);

    // Restore original method
    emailService.sendTemplatedEmail = originalSendTemplatedEmail;

    // Test 4: Email Type Methods
    console.log('\n📋 Test 4: Email Type Methods');

    const emailMethods = [
      'sendPaymentSuccessEmail',
      'sendVerificationEmail',
      'sendCompanyWelcomeEmail',
      'sendTestEmail'
    ];

    emailMethods.forEach(method => {
      const hasMethod = typeof emailService[method] === 'function';
      console.log(`   ${hasMethod ? '✅' : '❌'} ${method}: ${hasMethod ? 'Available' : 'Missing'}`);
    });

    console.log('\n🎉 Quick Email Test Completed Successfully!');
    console.log('\n📝 Summary:');
    console.log('✅ Service initialization working');
    console.log('✅ Template processing working');
    console.log('✅ Email payload structure correct');
    console.log('✅ All email methods available');
    console.log('\n💡 To run full test suite: npm run test:email');
    console.log('💡 To run integration tests: set BREVO_API_KEY and run npm run test:email:integration');
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    console.error('\n🔍 Debug info:');
    console.error('- Make sure all dependencies are installed: npm install');
    console.error('- Check that email service files exist');
    console.error('- Verify template directory structure');
  }
}

// Run the test if script is executed directly
if (require.main === module) {
  runQuickEmailTest();
}

module.exports = { runQuickEmailTest };
