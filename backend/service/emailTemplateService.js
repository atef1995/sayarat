const fs = require('fs').promises;
const path = require('path');

class EmailTemplateService {
  constructor() {
    this.templatesPath = path.join(__dirname, '../email-templates');
    this.baseTemplate = null;
  }

  async getBaseTemplate() {
    if (!this.baseTemplate) {
      const baseTemplatePath = path.join(this.templatesPath, 'base-template.html');
      this.baseTemplate = await fs.readFile(baseTemplatePath, 'utf8');
    }
    return this.baseTemplate;
  }

  async getContentTemplate(templateName) {
    const contentPath = path.join(this.templatesPath, 'content', `${templateName}-content.html`);
    return await fs.readFile(contentPath, 'utf8');
  }

  replacePlaceholders(template, params) {
    let result = template;

    // Replace all {{ params.key }} with actual values
    result = result.replace(/\{\{\s*params\.(\w+)\s*\}\}/g, (match, key) => {
      return params[key] || match;
    });

    // Replace other template variables
    Object.keys(params).forEach(key => {
      const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(placeholder, params[key] || '');
    });

    return result;
  }

  async generateEmail(templateType, params = {}) {
    try {
      // Get base template
      const baseTemplate = await this.getBaseTemplate();

      // Get content template
      const contentTemplate = await this.getContentTemplate(templateType);

      // Prepare comprehensive default params
      const defaultParams = {
        // Site URLs and Navigation
        siteUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://sayarat.autos',
        supportUrl: process.env.SUPPORT_URL || 'https://sayarat.autos/support',
        loginUrl: `${process.env.CLIENT_URL || 'https://sayarat.autos'}/login`,
        dashboardUrl: `${process.env.CLIENT_URL || 'https://sayarat.autos'}/profile`,
        unsubscribeUrl: params.unsubscribeUrl || `${process.env.CLIENT_URL || 'https://sayarat.autos'}/unsubscribe`,
        privacyUrl: `${process.env.CLIENT_URL || 'https://sayarat.autos'}/privacy-policy`,

        // Company Information
        companyName: 'سيارات',
        companyAddress: 'السويد, فيكخو',
        companyPhone: '+46793496556',
        supportEmail: 'atef@sayarat.autos',

        // Email Template Details
        headerTitle: params.headerTitle || 'سيارات - منصة بيع وشراء السيارات',
        emailTitle: params.emailTitle || 'سيارات',
        emailReason: params.emailReason || 'كجزء من خدماتنا',
        userEmail: params.userEmail || '',

        // Branding
        logoUrl: params.logoUrl || `${process.env.CLIENT_URL || 'https://sayarat.autos'}/logo.png`,

        // Social Media Links
        facebookUrl: 'https://www.facebook.com/profile.php?id=61577876198309',
        twitterUrl: 'https://x.com/Sayarat_syria',
        instagramUrl: 'https://instagram.com/sayarat_syria',

        // Date and Time
        currentYear: new Date().getFullYear(),
        currentDate: new Date().toLocaleDateString('ar-SA'),

        // Override with provided params
        ...params
      };

      // Replace placeholders in content
      const processedContent = this.replacePlaceholders(contentTemplate, defaultParams);

      // Inject content into base template
      const finalEmail = baseTemplate.replace('{{ content }}', processedContent);

      // Replace remaining placeholders in base template
      return this.replacePlaceholders(finalEmail, defaultParams);

    } catch (error) {
      console.error(`Error generating email template ${templateType}:`, error);
      throw new Error(`Failed to generate email template: ${templateType}`);
    }
  }

  // Specific email generation methods
  async generateVerificationEmail(params) {
    const requiredParams = ['userName', 'verificationUrl'];
    this.validateParams(requiredParams, params);

    return await this.generateEmail('verify-email', {
      subject: 'تأكيد البريد الإلكتروني - سيارات',
      headerTitle: 'تأكيد البريد الإلكتروني',
      emailReason: 'للتحقق من صحة بريدك الإلكتروني',
      userEmail: params.userEmail || '',
      ...params
    });
  }

  async generatePasswordResetEmail(params) {
    const requiredParams = ['userName', 'resetUrl'];
    this.validateParams(requiredParams, params);

    return await this.generateEmail('password-reset', {
      subject: 'إعادة تعيين كلمة المرور - سيارات',
      headerTitle: 'إعادة تعيين كلمة المرور',
      emailReason: 'لأنك طلبت إعادة تعيين كلمة المرور',
      expirationTime: '30 دقيقة',
      userEmail: params.userEmail || '',
      ...params
    });
  }

  async generateWelcomeEmail(params) {
    const requiredParams = ['userName'];
    this.validateParams(requiredParams, params);

    return await this.generateEmail('welcome', {
      subject: 'مرحباً بك في سيارات! 🎉',
      headerTitle: 'مرحباً بك في سيارات!',
      emailReason: 'لأنك انضممت حديثاً إلى منصتنا',
      loginUrl: `${process.env.CLIENT_URL || 'https://sayarat.autos'}/login`,
      userEmail: params.userEmail || '',
      ...params
    });
  }

  async generateCompanyWelcomeEmail(params) {
    const requiredParams = ['userName', 'companyName'];
    this.validateParams(requiredParams, params);

    return await this.generateEmail('company-welcome', {
      subject: `مرحباً بشركة ${params.companyName} في سيارات! 🏢`,
      headerTitle: `مرحباً بشركة ${params.companyName}`,
      emailReason: 'لأنك قمت بتسجيل شركتك في منصتنا',
      dashboardUrl: `${process.env.CLIENT_URL || 'https://sayarat.autos'}/company/profile`,
      userEmail: params.userEmail || '',
      ...params
    });
  }

  async generatePaymentSuccessEmail(params) {
    const requiredParams = ['customerName', 'paymentId', 'amount', 'currency'];
    this.validateParams(requiredParams, params);

    return await this.generateEmail('success-payment', {
      subject: 'تم الدفع بنجاح - سيارات',
      headerTitle: 'تم الدفع بنجاح!',
      emailReason: 'لتأكيد نجاح عملية الدفع',
      userEmail: params.userEmail || '',
      paymentDate: params.paymentDate || new Date().toLocaleDateString('ar-SA'),
      listingType: params.listingType || 'إعلان مميز',
      ...params
    });
  }

  async generatePaymentFailedEmail(params) {
    const requiredParams = ['customerName', 'paymentId', 'amount', 'currency'];
    this.validateParams(requiredParams, params);

    return await this.generateEmail('payment-failed', {
      subject: 'فشل الدفع - سيارات',
      headerTitle: 'فشل في إتمام الدفع',
      emailReason: 'لإشعارك بفشل عملية الدفع',
      userEmail: params.userEmail || '',
      attemptDate: params.attemptDate || new Date().toLocaleDateString('ar-SA'),
      ...params
    });
  }

  async generateEmailVerifySuccessEmail(params) {
    const requiredParams = ['name'];
    this.validateParams(requiredParams, params);

    return await this.generateEmail('email-verify-success', {
      subject: 'تم التحقق من بريدك الإلكتروني - سيارات',
      headerTitle: 'تم التحقق من بريدك الإلكتروني!',
      emailReason: 'لتأكيد نجاح التحقق من بريدك الإلكتروني',
      userEmail: params.userEmail || '',
      homeUrl: params.homeUrl || `${process.env.CLIENT_URL || 'https://sayarat.com'}`,
      ...params
    });
  }

  async generateCompanyActivationEmail(params) {
    const requiredParams = ['adminName', 'companyName'];
    this.validateParams(requiredParams, params);

    return await this.generateEmail('company-activation', {
      subject: `تم تفعيل اشتراك شركة ${params.companyName} - سيارات`,
      headerTitle: 'تم تفعيل اشتراك شركتك!',
      emailReason: 'لتأكيد تفعيل اشتراك شركتك في منصتنا',
      userEmail: params.userEmail || '',
      activationDate: params.activationDate || new Date().toLocaleDateString('ar-SA'),
      subscriptionType: params.subscriptionType || 'شهري',
      dashboardUrl: params.dashboardUrl || `${process.env.CLIENT_URL || 'https://sayarat.com'}/company/dashboard`,
      createListingUrl: params.createListingUrl || `${process.env.CLIENT_URL || 'https://sayarat.com'}/create-listing`,
      ...params
    });
  }

  validateParams(requiredParams, providedParams) {
    const missingParams = requiredParams.filter(param => !providedParams[param]);
    if (missingParams.length > 0) {
      throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
    }
  }

  // Helper method to preview emails (for testing)
  async previewEmail(templateType, params = {}) {
    const email = await this.generateEmail(templateType, params);
    console.log(`\n=== Email Preview: ${templateType} ===`);
    console.log(email);
    console.log('=== End Preview ===\n');
    return email;
  }
}

module.exports = new EmailTemplateService();
