const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const emailTemplateService = require('./emailTemplateService');

/**
 * Brevo Email Service for sending templated emails
 */
class BrevoEmailService {
  /**
   * @param {Object} options - Configuration options
   */
  constructor(_options = {}) {
    this.apiKey = process.env.BREVO_API_KEY;
    this.baseUrl = 'https://api.brevo.com/v3';
    this.templateCache = new Map();

    // Validate required dependencies
    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY environment variable is required');
    }
  }

  /**
   * Load and generate email template using the new template service
   * @param {string} templateName - Name of the template to use
   * @param {Object} params - Template parameters
   * @returns {Promise<string>} Generated HTML content
   */
  async loadTemplate(templateName, params = {}) {
    try {
      // Use the new email template service to generate HTML
      return await emailTemplateService.generateEmail(templateName, params);
    } catch (error) {
      logger.error(`Failed to generate email template: ${templateName}`, error);

      // Fallback to old template system if new system fails
      if (this.templateCache.has(templateName)) {
        return this.templateCache.get(templateName);
      }

      try {
        const templatePath = path.join(__dirname, '../email-templates', `${templateName}.html`);
        const templateContent = await fs.readFile(templatePath, 'utf8');
        this.templateCache.set(templateName, templateContent);
        return templateContent;
      } catch (fallbackError) {
        logger.error(`Fallback template loading also failed: ${templateName}`, fallbackError);
        throw new Error(`Email template not found: ${templateName}`);
      }
    }
  }

  /**
   * Replace template parameters with actual values
   * @deprecated This method is deprecated. Use emailTemplateService.generateEmail() instead.
   * @param {string} template - HTML template content
   * @param {Object} params - Parameters to replace
   * @returns {string} Processed template
   */
  processTemplate(template, params) {
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
   * @deprecated This method is deprecated. All email methods now use emailTemplateService directly for better consistency and maintainability.
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
      // Generate HTML content using the new template service
      const htmlContent = await this.loadTemplate(templateName, {
        ...params,
        currentYear: new Date().getFullYear(),
        siteUrl: process.env.CLIENT_URL || 'https://sayarat.com',
        supportEmail: 'atef@sayarat.autos',
        logoUrl: `${process.env.LOGO_URL || 'https://sayarat.com'}/logo.png`,
        userEmail: to.email,
      });

      // Prepare email data
      const emailData = {
        sender: {
          name: process.env.EMAIL_FROM_NAME || 'sayarat',
          email: process.env.EMAIL_FROM || 'atef@sayarat.autos'
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
    try {
      const customerName = paymentIntent.metadata?.name || paymentIntent.metadata?.customerName || 'عزيزي العميل';

      // Use the new template service for payment success emails
      const htmlContent = await emailTemplateService.generatePaymentSuccessEmail({
        customerName,
        paymentId: paymentIntent.id,
        amount: (paymentIntent.amount / 100).toFixed(2),
        currency: paymentIntent.currency.toUpperCase(),
        paymentDate: new Date().toLocaleDateString('ar-SA'),
        listingType: paymentIntent.metadata?.listingType || 'إعلان مميز',
        orderUrl: `${process.env.CLIENT_URL || 'https://sayarat.com'}/orders/${paymentIntent.id}`,
        userEmail: paymentIntent.metadata.email,
        logoUrl: `${process.env.LOGO_URL || 'https://sayarat.com'}/logo.png`
      });

      // Prepare email data
      const emailData = {
        sender: {
          name: 'سيارات',
          email: 'atef@sayarat.autos'
        },
        to: [
          {
            email: paymentIntent.metadata.email,
            name: customerName
          }
        ],
        subject: 'تم الدفع بنجاح - سيارات',
        htmlContent,
        tags: ['payment-success', 'automated'],
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

      logger.info('Payment success email sent successfully', {
        requestId,
        recipient: paymentIntent.metadata.email,
        paymentId: paymentIntent.id,
        messageId: response.data.messageId
      });

      return {
        success: true,
        messageId: response.data.messageId,
        provider: 'brevo'
      };
    } catch (error) {
      logger.error('Failed to send payment success email', {
        requestId,
        recipient: paymentIntent.metadata.email,
        paymentId: paymentIntent.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send payment failed email
   * @param {Object} failedPaymentIntent - Stripe failed payment intent
   * @param {string} requestId - Request tracking ID
   * @returns {Promise<Object>} Email send result
   */
  async sendPaymentFailedEmail(failedPaymentIntent, requestId) {
    try {
      const customerName =
        failedPaymentIntent.billing_details?.name || failedPaymentIntent.metadata?.name || 'عزيزي العميل';

      const email = failedPaymentIntent.billing_details?.email || failedPaymentIntent.metadata?.email;

      if (!email) {
        throw new Error('No email address found for failed payment notification');
      }

      // Use the new template service for payment failed emails
      const htmlContent = await emailTemplateService.generatePaymentFailedEmail({
        customerName,
        paymentId: failedPaymentIntent.id,
        amount: (failedPaymentIntent.amount / 100).toFixed(2),
        currency: failedPaymentIntent.currency.toUpperCase(),
        attemptDate: new Date().toLocaleDateString('ar-SA'),
        errorMessage: failedPaymentIntent.last_payment_error?.message || 'خطأ في معالجة الدفع',
        retryUrl: `${process.env.CLIENT_URL || 'https://sayarat.com'}/checkout/${failedPaymentIntent.id}`,
        userEmail: email,
        logoUrl: `${process.env.LOGO_URL || 'https://sayarat.com'}/logo.png`
      });

      // Prepare email data
      const emailData = {
        sender: {
          name: 'سيارات',
          email: 'atef@sayarat.autos'
        },
        to: [
          {
            email,
            name: customerName
          }
        ],
        subject: 'فشل الدفع - سيارات',
        htmlContent,
        tags: ['payment-failed', 'automated'],
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

      logger.info('Payment failed email sent successfully', {
        requestId,
        recipient: email,
        paymentId: failedPaymentIntent.id,
        messageId: response.data.messageId
      });

      return {
        success: true,
        messageId: response.data.messageId,
        provider: 'brevo'
      };
    } catch (error) {
      logger.error('Failed to send payment failed email', {
        requestId,
        recipient: failedPaymentIntent.billing_details?.email || failedPaymentIntent.metadata?.email,
        paymentId: failedPaymentIntent.id,
        error: error.message
      });
      throw error;
    }
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
    try {
      const verificationUrl = `${process.env.CLIENT_URL || 'https://sayarat.com'}/verify-email?token=${verificationToken}`;

      // Use the new template service for verification emails
      const htmlContent = await emailTemplateService.generateVerificationEmail({
        userName: firstName || 'عزيزي العميل',
        verificationUrl,
        userEmail: email,
        logoUrl: `${process.env.LOGO_URL || 'https://sayarat.com'}/logo.png`
      });

      // Prepare email data
      const emailData = {
        sender: {
          name: 'سيارات',
          email: 'atef@sayarat.autos'
        },
        to: [
          {
            email,
            name: firstName || 'عزيزي العميل'
          }
        ],
        subject: 'تأكيد البريد الإلكتروني - سيارات',
        htmlContent,
        tags: ['verify-email', 'automated'],
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

      logger.info('Verification email sent successfully', {
        requestId,
        recipient: email,
        messageId: response.data.messageId
      });

      return {
        success: true,
        messageId: response.data.messageId,
        provider: 'brevo'
      };
    } catch (error) {
      logger.error('Failed to send verification email', {
        requestId,
        recipient: email,
        error: error.message
      });
      throw error;
    }
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
    try {
      const resetUrl = `${process.env.CLIENT_URL || 'https://sayarat.com'}/reset-password/${resetToken}`;

      // Use the new template service for password reset emails
      const htmlContent = await emailTemplateService.generatePasswordResetEmail({
        userName: firstName || username || 'عزيزي العميل',
        resetUrl,
        userEmail: email,
        expirationTime: '30 دقيقة',
        logoUrl: `${process.env.LOGO_URL || 'https://sayarat.com'}/logo.png`
      });

      // Prepare email data
      const emailData = {
        sender: {
          name: 'سيارات',
          email: 'atef@sayarat.autos'
        },
        to: [
          {
            email,
            name: firstName || username || 'عزيزي العميل'
          }
        ],
        subject: 'إعادة تعيين كلمة المرور - سيارات',
        htmlContent,
        tags: ['password-reset', 'automated'],
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

      logger.info('Password reset email sent successfully', {
        requestId,
        recipient: email,
        messageId: response.data.messageId
      });

      return {
        success: true,
        messageId: response.data.messageId,
        provider: 'brevo'
      };
    } catch (error) {
      logger.error('Failed to send password reset email', {
        requestId,
        recipient: email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send email verified success notification
   * @param {string} email - Email address that was verified
   * @param {string} firstName - First name of the user
   * @param {string} requestId - Request tracking ID
   * @return {Promise<Object>} Email send result
   */
  async sendEmailVerifiedNotification(email, firstName, requestId) {
    try {
      // Use the new template service for email verified success emails
      const htmlContent = await emailTemplateService.generateEmailVerifySuccessEmail({
        userName: firstName || 'عزيزي العميل',
        userEmail: email,
        homeUrl: process.env.CLIENT_URL || 'https://sayarat.com',
        logoUrl: `${process.env.LOGO_URL || 'https://sayarat.com'}/logo.png`
      });

      // Prepare email data
      const emailData = {
        sender: {
          name: 'سيارات',
          email: 'atef@sayarat.autos'
        },
        to: [
          {
            email,
            name: firstName || 'عزيزي العميل'
          }
        ],
        subject: 'تم التحقق من بريدك الإلكتروني - سيارات',
        htmlContent,
        tags: ['email-verified', 'automated'],
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

      logger.info('Email verified notification sent successfully', {
        requestId,
        recipient: email,
        messageId: response.data.messageId
      });

      return {
        success: true,
        messageId: response.data.messageId,
        provider: 'brevo'
      };
    } catch (error) {
      logger.error('Failed to send email verified notification', {
        requestId,
        recipient: email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send test email to verify configuration
   * @param {string} testEmail - Test email address
   * @param {string} requestId - Request tracking ID
   * @returns {Promise<Object>} Email send result
   */
  async sendTestEmail(testEmail, requestId) {
    try {
      // Use the new template service for test emails
      const htmlContent = await emailTemplateService.generatePaymentSuccessEmail({
        customerName: 'مستخدم تجريبي',
        paymentId: 'pi_test_123456789',
        amount: '100.00',
        currency: 'USD',
        paymentDate: new Date().toLocaleDateString('ar-SA'),
        listingType: 'إعلان مميز تجريبي',
        orderUrl: `${process.env.CLIENT_URL || 'https://sayarat.com'}/orders/test`,
        userEmail: testEmail,
        logoUrl: `${process.env.LOGO_URL || 'https://sayarat.com'}/logo.png`
      });

      // Prepare email data
      const emailData = {
        sender: {
          name: 'سيارات',
          email: 'atef@sayarat.autos'
        },
        to: [
          {
            email: testEmail,
            name: 'مستخدم تجريبي'
          }
        ],
        subject: '[TEST] تم الدفع بنجاح - سيارات',
        htmlContent,
        tags: ['test-email', 'automated'],
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

      logger.info('Test email sent successfully', {
        requestId,
        recipient: testEmail,
        messageId: response.data.messageId
      });

      return {
        success: true,
        messageId: response.data.messageId,
        provider: 'brevo'
      };
    } catch (error) {
      logger.error('Failed to send test email', {
        requestId,
        recipient: testEmail,
        error: error.message
      });
      throw error;
    }
  }
  /**
   * Send welcome email to company admin
   * @param {Object} adminData - Admin user data
   * @param {Object} companyData - Company data
   * @param {string} requestId - Request tracking ID
   * @return {Promise<Object>} Email send result
   */
  async sendCompanyWelcomeEmail(adminData, companyData, requestId) {
    try {
      // Use the new template service for company welcome emails
      const htmlContent = await emailTemplateService.generateCompanyWelcomeEmail({
        userName: `${adminData.firstName} ${adminData.lastName}`,
        companyName: companyData.name,
        userEmail: adminData.email,
        subscriptionType: companyData.subscriptionType === 'monthly' ? 'شهري' : 'سنوي',
        dashboardUrl: `${process.env.CLIENT_URL || 'https://sayarat.com'}/company/dashboard`
      });

      // Prepare email data
      const emailData = {
        sender: {
          name: 'سيارات',
          email: 'atef@sayarat.autos'
        },
        to: [
          {
            email: adminData.email,
            name: `${adminData.firstName} ${adminData.lastName}`
          }
        ],
        subject: `مرحباً بشركة ${companyData.name} في سيارات! 🏢`,
        htmlContent,
        tags: ['company-welcome', 'automated'],
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

      logger.info('Company welcome email sent successfully', {
        requestId,
        recipient: adminData.email,
        company: companyData.name,
        messageId: response.data.messageId
      });

      return {
        success: true,
        messageId: response.data.messageId,
        provider: 'brevo'
      };
    } catch (error) {
      logger.error('Failed to send company welcome email', {
        requestId,
        recipient: adminData.email,
        company: companyData.name,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send company subscription activation email
   * @param {Object} adminData - Admin user data
   * @param {Object} companyData - Company data
   * @param {string} requestId - Request tracking ID
   * @return {Promise<Object>} Email send result
   */
  async sendCompanyActivationEmail(adminData, companyData, requestId) {
    try {
      // Use the new template service for company activation emails
      const htmlContent = await emailTemplateService.generateCompanyActivationEmail({
        adminName: `${adminData.firstName} ${adminData.lastName}`,
        companyName: companyData.name,
        subscriptionType: companyData.subscriptionType === 'monthly' ? 'شهري' : 'سنوي',
        activationDate: new Date().toLocaleDateString('ar-SA'),
        dashboardUrl: `${process.env.CLIENT_URL || 'https://sayarat.com'}/company/dashboard`,
        userEmail: adminData.email,
        logoUrl: `${process.env.LOGO_URL || 'https://sayarat.com'}/logo.png`
      });

      // Prepare email data
      const emailData = {
        sender: {
          name: 'سيارات',
          email: 'atef@sayarat.autos'
        },
        to: [
          {
            email: adminData.email,
            name: `${adminData.firstName} ${adminData.lastName}`
          }
        ],
        subject: `تم تفعيل اشتراك شركة ${companyData.name} - سيارات`,
        htmlContent,
        tags: ['company-activation', 'automated'],
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

      logger.info('Company activation email sent successfully', {
        requestId,
        recipient: adminData.email,
        company: companyData.name,
        messageId: response.data.messageId
      });

      return {
        success: true,
        messageId: response.data.messageId,
        provider: 'brevo'
      };
    } catch (error) {
      logger.error('Failed to send company activation email', {
        requestId,
        recipient: adminData.email,
        company: companyData.name,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = BrevoEmailService;
