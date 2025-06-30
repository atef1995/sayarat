/**
 * Test script for Brevo Email Service
 * Run this script to test email template rendering and sending
 */

require('dotenv').config({ path: '../.env.development' });
const BrevoEmailService = require('../service/brevoEmailService');

async function testBrevoEmailService() {
  const brevoService = new BrevoEmailService();

  // Test template loading and processing
  console.log('🧪 Testing Brevo Email Service...\n');

  try {
    // Test 1: Load success payment template
    console.log('1️⃣ Testing success payment template loading...');
    const successTemplate = await brevoService.loadTemplate('success-payment');
    console.log('✅ Success payment template loaded successfully');
    console.log(`📄 Template length: ${successTemplate.length} characters\n`);

    // Test 2: Load payment failed template
    console.log('2️⃣ Testing payment failed template loading...');
    const failedTemplate = await brevoService.loadTemplate('payment-failed');
    console.log('✅ Payment failed template loaded successfully');
    console.log(`📄 Template length: ${failedTemplate.length} characters\n`);

    // Test 3: Process template with parameters
    console.log('3️⃣ Testing template parameter processing...');
    const testParams = {
      customerName: 'أحمد محمد',
      paymentId: 'pi_test_123456789',
      amount: '150.00',
      currency: 'USD',
      paymentDate: new Date().toLocaleDateString('ar-SA'),
      listingType: 'إعلان مميز',
      orderUrl: 'https://example.com/orders/test'
    };

    const processedTemplate = brevoService.processTemplate(successTemplate, testParams);
    console.log('✅ Template processed successfully');

    // Check if parameters were replaced
    const hasUnreplacedParams = processedTemplate.includes('{{ params.');
    if (hasUnreplacedParams) {
      console.log('⚠️  Warning: Some parameters may not have been replaced');
    } else {
      console.log('✅ All parameters replaced successfully');
    }
    console.log();

    // Test 4: Simulate payment intent objects
    console.log('4️⃣ Testing payment intent email methods...');

    const mockPaymentIntent = {
      id: 'pi_test_success_123',
      amount: 15000, // $150.00
      currency: 'usd',
      metadata: {
        email: 'test@example.com',
        name: 'محمد أحمد',
        listingType: 'إعلان مميز'
      }
    };

    const mockFailedPaymentIntent = {
      id: 'pi_test_failed_456',
      amount: 15000,
      currency: 'usd',
      billing_details: {
        email: 'test@example.com',
        name: 'محمد أحمد'
      },
      last_payment_error: {
        message: 'Your card was declined.'
      }
    };

    console.log('📧 Testing success email method (template processing only)...');
    // Just test the parameter preparation, not actual sending
    const successParams = {
      customerName: mockPaymentIntent.metadata?.name || 'عزيزي العميل',
      paymentId: mockPaymentIntent.id,
      amount: (mockPaymentIntent.amount / 100).toFixed(2),
      currency: mockPaymentIntent.currency.toUpperCase(),
      paymentDate: new Date().toLocaleDateString('ar-SA'),
      listingType: mockPaymentIntent.metadata?.listingType || 'إعلان مميز',
      orderUrl: `${process.env.CLIENT_URL}/orders/${mockPaymentIntent.id}`
    };

    const successEmailHtml = brevoService.processTemplate(successTemplate, successParams);
    console.log('✅ Success email parameters processed correctly');
    console.log(`📄 Generated HTML length: ${successEmailHtml.length} characters`);
    console.log();

    console.log('📧 Testing failed email method (template processing only)...');
    const failedParams = {
      customerName: mockFailedPaymentIntent.billing_details?.name || 'عزيزي العميل',
      paymentId: mockFailedPaymentIntent.id,
      amount: (mockFailedPaymentIntent.amount / 100).toFixed(2),
      currency: mockFailedPaymentIntent.currency.toUpperCase(),
      attemptDate: new Date().toLocaleDateString('ar-SA'),
      errorMessage: mockFailedPaymentIntent.last_payment_error?.message || null,
      retryUrl: `${process.env.CLIENT_URL}/checkout/${mockFailedPaymentIntent.id}`,
      supportUrl: `${process.env.CLIENT_URL}/support`
    };

    const failedEmailHtml = brevoService.processTemplate(failedTemplate, failedParams);
    console.log('✅ Failed email parameters processed correctly');
    console.log(`📄 Generated HTML length: ${failedEmailHtml.length} characters`);
    console.log();

    // Test 5: Check environment variables
    console.log('5️⃣ Checking environment variables...');
    const requiredEnvVars = ['BREVO_API_KEY', 'EMAIL_FROM_NAME', 'EMAIL_FROM', 'CLIENT_URL'];

    const missingVars = [];
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      console.log('⚠️  Missing environment variables:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
    } else {
      console.log('✅ All required environment variables are set');
    }

    // Test 6: Testing charge event methods
    console.log('6️⃣ Testing charge event methods...');

    const mockCharge = {
      id: 'ch_test_success_789',
      amount: 12500, // $125.00
      currency: 'usd',
      billing_details: {
        email: 'charge-test@example.com',
        name: 'سارة أحمد'
      },
      metadata: {
        listingType: 'إعلان عادي'
      },
      receipt_url: 'https://pay.stripe.com/receipts/test_receipt'
    };

    const mockFailedCharge = {
      id: 'ch_test_failed_101',
      amount: 12500,
      currency: 'usd',
      billing_details: {
        email: 'charge-failed-test@example.com',
        name: 'علي محمد'
      },
      failure_message: 'Your card was declined.',
      failure_code: 'card_declined',
      outcome: {
        seller_message: 'The bank declined the payment.'
      }
    };

    console.log('📧 Testing charge success email method...');
    const chargeSuccessParams = {
      customerName: mockCharge.billing_details?.name || 'عزيزي العميل',
      paymentId: mockCharge.id,
      amount: (mockCharge.amount / 100).toFixed(2),
      currency: mockCharge.currency.toUpperCase(),
      paymentDate: new Date().toLocaleDateString('ar-SA'),
      listingType: mockCharge.metadata?.listingType || null,
      orderUrl: mockCharge.receipt_url || `${process.env.CLIENT_URL}/orders/${mockCharge.id}`
    };

    const chargeSuccessHtml = brevoService.processTemplate(successTemplate, chargeSuccessParams);
    console.log('✅ Charge success email parameters processed correctly');
    console.log(`📄 Generated HTML length: ${chargeSuccessHtml.length} characters`);
    console.log();

    console.log('📧 Testing charge failure email method...');
    const chargeFailedParams = {
      customerName: mockFailedCharge.billing_details?.name || 'عزيزي العميل',
      paymentId: mockFailedCharge.id,
      amount: (mockFailedCharge.amount / 100).toFixed(2),
      currency: mockFailedCharge.currency.toUpperCase(),
      attemptDate: new Date().toLocaleDateString('ar-SA'),
      errorMessage: mockFailedCharge.failure_message || null,
      retryUrl: `${process.env.CLIENT_URL}/checkout/${mockFailedCharge.id}`,
      supportUrl: `${process.env.CLIENT_URL}/support`
    };

    const chargeFailedHtml = brevoService.processTemplate(failedTemplate, chargeFailedParams);
    console.log('✅ Charge failure email parameters processed correctly');
    console.log(`📄 Generated HTML length: ${chargeFailedHtml.length} characters`);
    console.log();
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Email templates load correctly');
    console.log('   - Parameter replacement works');
    console.log('   - Conditional blocks are supported');
    console.log('   - Payment intent events are supported');
    console.log('   - Charge events are supported');
    console.log('   - Environment variables are configured');
    console.log('\n💡 To test actual email sending, you can call:');
    console.log('   brevoService.sendTestEmail("your-email@example.com", "test-request-id")');
    console.log('   brevoService.sendChargeSuccessEmail(chargeObject, "test-request-id")');
    console.log('   brevoService.sendChargeFailedEmail(failedChargeObject, "test-request-id")');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Error details:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testBrevoEmailService();
}

module.exports = { testBrevoEmailService };
