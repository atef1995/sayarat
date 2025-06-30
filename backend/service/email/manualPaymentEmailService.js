const logger = require('../../utils/logger');

class ManualPaymentEmailService {
  /**
   * Initialize the service with template name, payment data, and email data
   * @param {Object} emailService - Email service instance
   * @param {string} templateName - Template name for the email
   * @param {Object} paymentData - Payment data to include in the email
   * @param {Object} emailData - Additional email data
   */
  constructor(emailService, templateName, paymentData, emailData, requestId) {
    this.emailService = emailService;
    this.templateName = templateName || 'manual_payment';
    this.paymentData = paymentData || {};
    this.emailData = emailData || {};
    this.requestId = requestId || 'unknown';
    this.validatePaymentData();
  }
  /**
   * Send manual payment email
   * @returns {Promise<void>}
   */
  async sendManualPaymentEmail() {
    const { fullName, email } = this.paymentData;

    logger.info('Sending manual payment email', {
      requestId: this.requestId,
      to: email,
      template: this.templateName
    });

    // Prepare all parameters needed for the template
    const emailParams = {
      // Customer information
      customerName: fullName || 'عزيزي العميل',

      // Plan and payment details from emailData.params
      planName: this.emailData.params?.planName || 'خطة الاشتراك',
      planPrice: this.emailData.params?.planPrice || '0',
      currency: this.emailData.params?.currency || 'USD',
      plan: this.emailData.params?.planName || 'خطة الاشتراك',
      referenceId: this.emailData.params?.referenceId || `REF-${Date.now()}`,
      referenceNumber: this.emailData.params?.referenceId || `REF-${Date.now()}`,

      // Bank information from environment variables
      bankName: process.env.BANK_NAME || 'البنك التجاري السوري',
      accountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
      accountHolder: process.env.ACCOUNT_HOLDER_NAME || 'Cars Bids',
      iban: process.env.BANK_IBAN || 'SY21 1234 5678 9012 3456 7890',
      swiftCode: process.env.BANK_SWIFT || 'CBSYSYDA',

      // Office and contact information
      officeAddress: process.env.OFFICE_ADDRESS || 'دمشق، سوريا',
      workingHours: process.env.WORKING_HOURS || 'الأحد - الخميس: 9:00 ص - 5:00 م',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@carsbids.com',
      supportPhone: process.env.SUPPORT_PHONE || '+963-11-1234567',
      supportHours: process.env.SUPPORT_HOURS || 'الأحد - الخميس: 9:00 ص - 5:00 م',

      // Additional params from emailData
      ...this.emailData.params
    };

    logger.info('Email parameters', {
      requestId: this.requestId,
      params: emailParams,
      template: this.templateName
    });

    await this.emailService.sendTemplatedEmail({
      templateName: this.templateName,
      to: { email, name: fullName || 'Customer' },
      subject: this.emailData.subject || 'تعليمات الدفع اليدوي',
      params: emailParams,
      requestId: this.requestId
    });

    logger.info('Manual payment email sent', {
      requestId: this.requestId,
      to: email,
      template: this.templateName
    });
  }
  /**
   * Sends email to admin for manual payment request
   * @returns {Promise<void>}
   */
  async sendAdminManualPaymentEmail() {
    const { fullName, email } = this.paymentData;

    // Prepare admin email parameters
    const adminParams = {
      // Customer information
      customerName: fullName || 'غير محدد',
      customerEmail: email || 'غير محدد',
      customerPhone: this.emailData.params?.phone || 'غير محدد',
      accountType: this.emailData.params?.accountType || 'فردي',

      // Payment details
      amount: this.emailData.params?.planPrice || '0',
      currency: this.emailData.params?.currency || 'USD',
      subscriptionType: this.emailData.params?.planName || 'خطة الاشتراك',
      subscriptionDuration: this.emailData.params?.subscriptionDuration || 'شهري',
      referenceNumber: this.emailData.params?.referenceId || `REF-${Date.now()}`,
      requestDate: this.emailData.params?.requestDate || new Date().toLocaleDateString('ar-SY'),

      // Admin dashboard links
      adminDashboardUrl: process.env.ADMIN_DASHBOARD_URL || `${process.env.FRONTEND_URL}/admin`,
      customerProfileUrl: process.env.ADMIN_DASHBOARD_URL || `${process.env.FRONTEND_URL}/admin/customers`,
      currentDateTime: new Date().toLocaleString('ar-SY'),

      // Additional params from emailData
      ...this.emailData.params
    };

    await this.emailService.sendTemplatedEmail({
      templateName: 'admin_manual_payment',
      to: { email: process.env.ADMIN_EMAIL, name: 'Admin' },
      subject: this.emailData.subject || 'طلب دفع يدوي جديد - Cars Bids',
      params: adminParams,
      requestId: this.requestId
    });

    logger.info('Admin manual payment email sent', {
      requestId: this.requestId,
      to: process.env.ADMIN_EMAIL,
      template: 'admin_manual_payment'
    });
  }

  /**
   * Validate payment data
   * @returns {boolean} - True if valid, throws error otherwise
   */
  validatePaymentData() {
    if (!this.paymentData || !this.paymentData.fullName || !this.paymentData.email) {
      throw new Error('Invalid payment data: fullName and email are required');
    }
    return true;
  }
}

module.exports = ManualPaymentEmailService;
