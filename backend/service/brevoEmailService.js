const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Brevo Email Service for sending templated emails
 */
class BrevoEmailService {
  /**
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.apiKey = process.env.BREVO_API_KEY;
    this.baseUrl = 'https://api.brevo.com/v3';
    this.templateCache = new Map();

    // Validate required dependencies
    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY environment variable is required');
    }
  }

  /**
   * Load and cache email template
   * @param {string} templateName - Name of the template file
   * @returns {Promise<string>} Template content
   */
  async loadTemplate(templateName) {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    try {
      const templatePath = path.join(__dirname, '../email-templates', `${templateName}.html`);
      const templateContent = await fs.readFile(templatePath, 'utf8');

      // Cache the template for future use
      this.templateCache.set(templateName, templateContent);

      return templateContent;
    } catch (error) {
      logger.error(`Failed to load email template: ${templateName}`, error);
      throw new Error(`Email template not found: ${templateName}`);
    }
  }

  /**
   * Replace template parameters with actual values
   * @param {string} template - HTML template content
   * @param {Object} params - Parameters to replace
   * @returns {string} Processed template
   */ processTemplate(template, params) {
    let processedTemplate = template;

    // Replace Brevo-style parameters {{ params.key }}
    Object.keys(params).forEach(key => {
      const regex = new RegExp(`{{\\s*params\\.${key}\\s*}}`, 'g');
      processedTemplate = processedTemplate.replace(regex, params[key] || '');
    });

    // Replace simple parameters {{ key }}
    Object.keys(params).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processedTemplate = processedTemplate.replace(regex, params[key] || '');
    });

    // Handle conditional blocks {{#if params.key}}...{{/if}}
    processedTemplate = processedTemplate.replace(
      /\{\{#if\s+params\.(\w+)\}\}(.*?)\{\{\/if\}\}/gs,
      (match, key, content) => {
        return params[key] ? content : '';
      }
    );

    return processedTemplate;
  }

  /**
   * Send email using Brevo API with template
   * @param {Object} options - Email options
   * @param {string} options.templateName - Name of the template to use
   * @param {Object} options.to - Recipient information
   * @param {string} options.subject - Email subject
   * @param {Object} options.params - Template parameters
   * @param {string} options.requestId - Request tracking ID
   * @returns {Promise<Object>} Email send result
   */
  async sendTemplatedEmail({ templateName, to, subject, params, requestId }) {
    try {
      // Load and process template
      const template = await this.loadTemplate(templateName);
      const htmlContent = this.processTemplate(template, {
        ...params,
        currentYear: new Date().getFullYear()
      });

      // Prepare email data
      const emailData = {
        sender: {
          name: process.env.EMAIL_FROM_NAME || 'sayarat',
          email: process.env.EMAIL_FROM || 'noreply@carsbids.com'
        },
        to: [
          {
            email: to.email,
            name: to.name || to.email
          }
        ],
        subject: subject,
        htmlContent: htmlContent,
        tags: [templateName, 'webhook', 'automated'],
        headers: {
          'X-Request-ID': requestId
        }
      };

      // Send email via Brevo API
      const response = await axios.post(`${this.baseUrl}/smtp/email`, emailData, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        }
      });

      logger.info('Email sent successfully via Brevo', {
        requestId,
        templateName,
        recipient: to.email,
        messageId: response.data.messageId
      });

      return {
        success: true,
        messageId: response.data.messageId,
        provider: 'brevo'
      };
    } catch (error) {
      logger.error('Failed to send email via Brevo', {
        requestId,
        templateName,
        recipient: to.email,
        error: error.message,
        response: error.response?.data
      });

      throw error;
    }
  }

  /**
   * Send payment success email
   * @param {Object} paymentIntent - Stripe payment intent
   * @param {string} requestId - Request tracking ID
   * @returns {Promise<Object>} Email send result
   */
  async sendPaymentSuccessEmail(paymentIntent, requestId) {
    const customerName = paymentIntent.metadata?.name || paymentIntent.metadata?.customerName || 'عزيزي العميل';

    const params = {
      customerName,
      paymentId: paymentIntent.id,
      amount: (paymentIntent.amount / 100).toFixed(2),
      currency: paymentIntent.currency.toUpperCase(),
      paymentDate: new Date().toLocaleDateString('ar-SA'),
      listingType: paymentIntent.metadata?.listingType || 'إعلان مميز',
      orderUrl: `${process.env.CLIENT_URL}/orders/${paymentIntent.id}`
    };

    return await this.sendTemplatedEmail({
      templateName: 'success-payment',
      to: {
        email: paymentIntent.metadata.email,
        name: customerName
      },
      subject: 'تم الدفع بنجاح - sayarat',
      params,
      requestId
    });
  }

  /**
   * Send payment failed email
   * @param {Object} failedPaymentIntent - Stripe failed payment intent
   * @param {string} requestId - Request tracking ID
   * @returns {Promise<Object>} Email send result
   */
  async sendPaymentFailedEmail(failedPaymentIntent, requestId) {
    const customerName =
      failedPaymentIntent.billing_details?.name || failedPaymentIntent.metadata?.name || 'عزيزي العميل';

    const params = {
      customerName,
      paymentId: failedPaymentIntent.id,
      amount: (failedPaymentIntent.amount / 100).toFixed(2),
      currency: failedPaymentIntent.currency.toUpperCase(),
      attemptDate: new Date().toLocaleDateString('ar-SA'),
      errorMessage: failedPaymentIntent.last_payment_error?.message || null,
      retryUrl: `${process.env.CLIENT_URL}/checkout/${failedPaymentIntent.id}`,
      supportUrl: `${process.env.SUPPORT_URL}`
    };

    const email = failedPaymentIntent.billing_details?.email || failedPaymentIntent.metadata?.email;

    if (!email) {
      throw new Error('No email address found for failed payment notification');
    }

    return await this.sendTemplatedEmail({
      templateName: 'payment-failed',
      to: {
        email,
        name: customerName
      },
      subject: 'فشل الدفع - sayarat',
      params,
      requestId
    });
  }

  /**
   * Send charge success email
   * @param {Object} charge - Stripe charge object
   * @param {string} requestId - Request tracking ID
   * @returns {Promise<Object>} Email send result
   */
  async sendChargeSuccessEmail(charge, requestId) {
    const customerName = charge.billing_details?.name || charge.metadata?.name || 'عزيزي العميل';

    const params = {
      customerName,
      paymentId: charge.id,
      amount: (charge.amount / 10000).toFixed(2),
      currency: charge.currency.toUpperCase(),
      paymentDate: new Date().toLocaleDateString('ar-SA'),
      listingType: charge.metadata?.listingType || null,
      orderUrl: charge.receipt_url || `${process.env.CLIENT_URL}/orders/${charge.id}`
    };

    const email = charge.billing_details?.email || charge.metadata?.email;
    if (!email) {
      throw new Error('No email address found for charge success notification');
    }

    return await this.sendTemplatedEmail({
      templateName: 'success-payment',
      to: {
        email,
        name: customerName
      },
      subject: 'تم الدفع بنجاح - sayarat',
      params,
      requestId
    });
  }

  /**
   * Send charge failed email
   * @param {Object} charge - Stripe failed charge object
   * @param {string} requestId - Request tracking ID
   * @returns {Promise<Object>} Email send result
   */
  async sendChargeFailedEmail(charge, requestId) {
    const customerName = charge.billing_details?.name || charge.metadata?.name || 'عزيزي العميل';

    const params = {
      customerName,
      paymentId: charge.id,
      amount: (charge.amount / 100).toFixed(2),
      currency: charge.currency.toUpperCase(),
      attemptDate: new Date().toLocaleDateString('ar-SA'),
      errorMessage: charge.failure_message || charge.outcome?.seller_message || null,
      retryUrl: `${process.env.CLIENT_URL}/checkout/${charge.id}`,
      supportUrl: `${process.env.SUPPORT_URL}`
    };

    const email = charge.billing_details?.email || charge.metadata?.email;
    if (!email) {
      throw new Error('No email address found for charge failure notification');
    }

    return await this.sendTemplatedEmail({
      templateName: 'payment-failed',
      to: {
        email,
        name: customerName
      },
      subject: 'فشل الدفع - sayarat',
      params,
      requestId
    });
  }

  /**
   * Send email to verify email address
   * @param {string} email - Email address to verify
   * @param {string} requestId - Request tracking ID
   * @param {string} verificationToken - Verification token
   * @return {Promise<Object>} Email send result
   * */
  async sendVerificationEmail(email, firstName, requestId, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    const params = {
      verificationUrl,
      supportUrl: `${process.env.SUPPORT_URL}`,
      currentYear: new Date().getFullYear()
    };

    return await this.sendTemplatedEmail({
      templateName: 'verify-email',
      to: {
        email,
        name: firstName || 'عزيزي العميل'
      },
      subject: 'تحقق من بريدك الإلكتروني - sayarat',
      params,
      requestId
    });
  }

  /**
   * Send email to reset password
   * @param {string} email - Email address to send reset link
   * @param {string} requestId - Request tracking ID
   * @param {string} resetToken - Reset token
   * @return {Promise<Object>} Email send result
   *
   */
  async sendResetPasswordEmail(email, firstName, requestId, resetToken, username) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const params = {
      resetUrl,
      supportUrl: `${process.env.SUPPORT_URL}`,
      currentYear: new Date().getFullYear(),
      username: username
    };

    return await this.sendTemplatedEmail({
      templateName: 'reset-password',
      to: {
        email,
        name: firstName || 'عزيزي العميل'
      },
      subject: 'إعادة تعيين كلمة المرور - sayarat',
      params,
      requestId
    });
  }

  /**
   * Send email verified success notification
   * @param {string} email - Email address that was verified
   * @param {string} firstName - First name of the user
   * @return {Promise<Object>} Email send result
   *
   */
  async sendEmailVerifiedNotification(email, firstName, requestId) {
    const params = {
      name: firstName || 'عزيزي العميل',
      homeUrl: process.env.CLIENT_URL,
      supportUrl: `${process.env.SUPPORT_URL}`,
      currentYear: new Date().getFullYear()
    };

    return await this.sendTemplatedEmail({
      templateName: 'email-verify-success',
      to: {
        email,
        name: firstName || 'عزيزي العميل'
      },
      subject: 'تم التحقق من بريدك الإلكتروني - sayarat',
      params,
      requestId
    });
  }

  /**
   * Send test email to verify configuration
   * @param {string} testEmail - Test email address
   * @param {string} requestId - Request tracking ID
   * @returns {Promise<Object>} Email send result
   */
  async sendTestEmail(testEmail, requestId) {
    const testParams = {
      customerName: 'مستخدم تجريبي',
      paymentId: 'pi_test_123456789',
      amount: '100.00',
      currency: 'USD',
      paymentDate: new Date().toLocaleDateString('ar-SA'),
      listingType: 'إعلان مميز تجريبي',
      orderUrl: `${process.env.CLIENT_URL}/orders/test`
    };

    return await this.sendTemplatedEmail({
      templateName: 'success-payment',
      to: {
        email: testEmail,
        name: 'مستخدم تجريبي'
      },
      subject: '[TEST] تم الدفع بنجاح - sayarat',
      params: testParams,
      requestId
    });
  }
  /**
   * Send welcome email to company admin
   * @param {Object} adminData - Admin user data
   * @param {Object} companyData - Company data
   * @param {string} requestId - Request tracking ID
   * @return {Promise<Object>} Email send result
   */
  async sendCompanyWelcomeEmail(adminData, companyData, requestId) {
    const params = {
      adminName: `${adminData.firstName} ${adminData.lastName}`,
      companyName: companyData.name,
      subscriptionType: companyData.subscriptionType === 'monthly' ? 'شهري' : 'سنوي',
      loginUrl: `${process.env.CLIENT_URL}/login`,
      dashboardUrl: `${process.env.CLIENT_URL}/dashboard`,
      supportUrl: `${process.env.SUPPORT_URL}`,
      currentYear: new Date().getFullYear()
    };

    return await this.sendTemplatedEmail({
      templateName: 'company-welcome',
      to: {
        email: adminData.email,
        name: `${adminData.firstName} ${adminData.lastName}`
      },
      subject: `مرحباً بكم في sayarat - ${companyData.name}`,
      params,
      requestId
    });
  }

  /**
   * Send company subscription activation email
   * @param {Object} adminData - Admin user data
   * @param {Object} companyData - Company data
   * @param {string} requestId - Request tracking ID
   * @return {Promise<Object>} Email send result
   */
  async sendCompanyActivationEmail(adminData, companyData, requestId) {
    const params = {
      adminName: `${adminData.firstName} ${adminData.lastName}`,
      companyName: companyData.name,
      subscriptionType: companyData.subscriptionType === 'monthly' ? 'شهري' : 'سنوي',
      activationDate: new Date().toLocaleDateString('ar-SA'),
      dashboardUrl: `${process.env.CLIENT_URL}/dashboard`,
      createListingUrl: `${process.env.CLIENT_URL}/create-listing`,
      supportUrl: `${process.env.SUPPORT_URL}`,
      currentYear: new Date().getFullYear()
    };

    return await this.sendTemplatedEmail({
      templateName: 'company-activation',
      to: {
        email: adminData.email,
        name: `${adminData.firstName} ${adminData.lastName}`
      },
      subject: `تم تفعيل اشتراك شركة ${companyData.name} - sayarat`,
      params,
      requestId
    });
  }
}

module.exports = BrevoEmailService;
