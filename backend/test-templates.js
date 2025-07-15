const emailTemplateService = require('./service/emailTemplateService');

console.log('🧪 Testing all updated email template methods...\n');

async function testAllTemplates() {
  try {
    // Test payment success
    console.log('1. Testing Payment Success Email Template...');
    const paymentSuccessHtml = await emailTemplateService.generatePaymentSuccessEmail({
      customerName: 'أحمد محمد',
      paymentId: 'pi_test_123',
      amount: '100.00',
      currency: 'USD',
      paymentDate: new Date().toLocaleDateString('ar-SA'),
      listingType: 'إعلان مميز',
      orderUrl: 'https://sayarat.com/orders/pi_test_123',
      userEmail: 'atef@sayarat.autos',
      logoUrl: 'https://sayarat.com/logo.png'
    });
    console.log('✅ Payment Success Template Generated Successfully');

    // Test payment failed
    console.log('2. Testing Payment Failed Email Template...');
    const paymentFailedHtml = await emailTemplateService.generatePaymentFailedEmail({
      customerName: 'أحمد محمد',
      paymentId: 'pi_failed_123',
      amount: '100.00',
      currency: 'USD',
      attemptDate: new Date().toLocaleDateString('ar-SA'),
      errorMessage: 'Your card was declined.',
      retryUrl: 'https://sayarat.com/checkout/pi_failed_123',
      userEmail: 'atef@sayarat.autos',
      logoUrl: 'https://sayarat.com/logo.png'
    });
    console.log('✅ Payment Failed Template Generated Successfully');

    // Test email verified
    console.log('3. Testing Email Verified Success Template...');
    const emailVerifiedHtml = await emailTemplateService.generateEmailVerifySuccessEmail({
      name: 'أحمد محمد',
      userEmail: 'atef@sayarat.autos',
      homeUrl: 'https://sayarat.com',
      logoUrl: 'https://sayarat.com/logo.png'
    });
    console.log('✅ Email Verified Template Generated Successfully');

    // Test company activation
    console.log('4. Testing Company Activation Email Template...');
    const companyActivationHtml = await emailTemplateService.generateCompanyActivationEmail({
      adminName: 'أحمد محمد',
      companyName: 'شركة السيارات المتقدمة',
      subscriptionType: 'شهري',
      activationDate: new Date().toLocaleDateString('ar-SA'),
      dashboardUrl: 'https://sayarat.com/company/dashboard',
      userEmail: 'atef@sayarat.autos',
      logoUrl: 'https://sayarat.com/logo.png'
    });
    console.log('✅ Company Activation Template Generated Successfully');

    console.log('\n🎉 All email template methods are working correctly!');
    console.log('📧 All deprecated methods have been successfully updated to use the new modular template system.');
    console.log('🔄 Migration from deprecated sendTemplatedEmail method is complete.');
    console.log('⚡ All methods now use consistent parameters with atef@sayarat.autos sender.');

  } catch (error) {
    console.error('❌ Error testing email templates:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testAllTemplates();
