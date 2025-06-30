/**
 * Email Delivery Test Script
 * Tests the company member removal notification email delivery
 * Run with: npx dotenvx -- run -f .env.development -- node test-email-delivery.js
 */

const logger = require('../utils/logger');
const BrevoEmailService = require('../service/brevoEmailService');
const CompanyEmailService = require('../service/email/companyEmailService');
const ReqIdGenerator = require('../utils/reqIdGenerator');

async function testEmailSending() {
  try {
    console.log('🧪 Testing email sending to pcbygg.se@gmail.com...');

    // Check environment variables first
    console.log('\n📋 Environment Check:');
    console.log('- BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'Present ✅' : 'Missing ❌');
    console.log('- FROM_EMAIL:', process.env.FROM_EMAIL || 'Not set ⚠️');
    console.log('- EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME || 'Not set ⚠️');
    console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set ⚠️');

    if (!process.env.BREVO_API_KEY) {
      throw new Error('❌ BREVO_API_KEY is required but not found in environment variables');
    } // Create services with proper dependency injection
    console.log('\n🔧 Initializing services...');
    const brevoService = new BrevoEmailService();
    const reqIdGenerator = new ReqIdGenerator();
    const companyEmailService = new CompanyEmailService(brevoService, {
      reqIdGenerator: reqIdGenerator
    });
    console.log('✅ Services initialized successfully');

    // Test email data (similar to what would be sent in removal notification)
    const testRemovalData = {
      member: {
        id: 'test-member-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'pcbygg.se@gmail.com'
      },
      company: {
        id: 'test-company-id',
        name: 'Test Company شركة الاختبار'
      },
      removedBy: {
        id: 'test-admin-id',
        firstName: 'Admin',
        lastName: 'User'
      },
      reason: 'Testing email delivery'
    };

    console.log('\n📧 Sending test removal notification...');
    console.log('- To:', testRemovalData.member.email);
    console.log('- Company:', testRemovalData.company.name);

    const result = await companyEmailService.sendMemberRemovalNotification(testRemovalData);

    console.log('✅ Email sent successfully!');
    console.log('- Message ID:', result.messageId);
    console.log('- Success:', result.success);
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('- Message:', error.message);
    console.error('- Type:', error.constructor.name);

    if (error.response) {
      console.error('- API Response Status:', error.response.status);
      console.error('- API Response Data:', error.response.data);
    }

    if (error.originalError) {
      console.error('- Original Error:', error.originalError.message);
      if (error.originalError.response) {
        console.error('- Original Response:', error.originalError.response.data);
      }
    }

    console.error('- Stack:', error.stack);
  }
}

// Also test a simple email to verify Brevo is working
async function testSimpleEmail() {
  try {
    console.log('\n🔍 Testing simple Brevo email...');

    const brevoService = new BrevoEmailService();
    const reqIdGenerator = new ReqIdGenerator();

    console.log('- Sending test email to pcbygg.se@gmail.com');
    const result = await brevoService.sendTestEmail('pcbygg.se@gmail.com', reqIdGenerator.generateRequestId());

    console.log('✅ Simple email sent successfully!');
    console.log('- Message ID:', result.messageId);
    console.log('- Provider:', result.provider);
  } catch (error) {
    console.error('❌ Simple email failed:');
    console.error('- Message:', error.message);
    if (error.response) {
      console.error('- Response:', error.response.data);
    }
  }
}

async function checkTemplate() {
  try {
    console.log('\n🔍 Checking email template...');
    const brevoService = new BrevoEmailService();

    const template = await brevoService.loadTemplate('company-member-removal');
    console.log('✅ Template "company-member-removal" found');
    console.log('- Template length:', template.length, 'characters');
    console.log('- Template preview:', `${template.substring(0, 100)}...`);
  } catch (error) {
    console.error('❌ Template check failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Email Delivery Tests for pcbygg.se@gmail.com');
  console.log('='.repeat(60));

  await checkTemplate();
  await testSimpleEmail();
  await testEmailSending();

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎯 Debugging Tips:');
  console.log('1. Check Brevo dashboard for delivery status');
  console.log('2. Check spam/junk folder in Gmail');
  console.log('3. The dot (.) in email addresses is valid and not the issue');
  console.log('4. Check if your domain is blacklisted by Gmail');
  console.log('5. Verify DKIM/SPF records for your domain');
  console.log('='.repeat(60));
}

runTests();
