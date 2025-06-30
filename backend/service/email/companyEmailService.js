const logger = require('../../utils/logger');
const crypto = require('crypto');

/**
 * Company Email Service
 * Handles all company-related email communications including invitations,
 * notifications, and member management emails.
 *
 * Uses dependency injection pattern for better testability and flexibility.
 * All email templates and content are in Arabic using formal Syrian dialect
 * that is culturally appropriate and respectful.
 *
 * Cultural Considerations:
 * - Uses formal Arabic addressing (أهلاً وسهلاً, تشرّفنا)
 * - Respectful tone appropriate for business communications
 * - Syrian dialect expressions where appropriate
 * - Proper RTL (right-to-left) text direction
 * - Culturally relevant role translations
 *
 * @example
 * const emailService = new BrevoEmailService();
 * const companyEmailService = new CompanyEmailService(emailService);
 * await companyEmailService.sendMemberInvitation({...});
 */
class CompanyEmailService {
  /**
   * Constructor with dependency injection
   * @param {Object} emailService - Email service implementation (e.g., BrevoEmailService)
   * @param {Object} options - Optional configuration
   * @param {string} options.baseUrl - Base URL for links in emails
   * @param {string} options.fromEmail - Default sender email
   * @param {string} options.fromName - Default sender name
   * @param {Object} options.reqIdGenerator - Request ID generator instance
   */
  constructor(emailService, options = {}) {
    if (!emailService) {
      throw new Error('Email service is required');
    }

    this.emailService = emailService;
    this.reqIdGenerator = options.reqIdGenerator || null;
    this.config = {
      baseUrl: options.baseUrl || process.env.FRONTEND_URL || 'https://cars-bids.com',
      fromEmail: options.fromEmail || process.env.FROM_EMAIL || 'noreply@cars-bids.com',
      fromName: options.fromName || 'Cars Bids',
      ...options
    };

    // Cache for commonly used data
    this.templateCache = new Map();
    this.invitationCache = new Map();

    // Validate dependencies
    if (!this.reqIdGenerator) {
      logger.warn('No reqIdGenerator provided to CompanyEmailService - request IDs will not be generated');
    }
  }

  /**
   * Send member invitation email
   * @param {Object} invitation - Invitation details
   * @param {string} invitation.email - Recipient email
   * @param {string} invitation.firstName - Recipient first name
   * @param {string} invitation.lastName - Recipient last name
   * @param {string} invitation.role - Member role
   * @param {Object} invitation.company - Company information
   * @param {Object} invitation.invitedBy - Inviter information
   * @param {string} invitation.invitationToken - Secure invitation token
   * @returns {Promise<Object>} Email sending result
   */ async sendMemberInvitation(invitation) {
    try {
      logger.info('Starting member invitation email process', {
        email: invitation?.email,
        companyName: invitation?.company?.name,
        role: invitation?.role,
        hasInvitationToken: !!invitation?.invitationToken
      });

      this._validateInvitationData(invitation);

      const emailData = this._buildMemberInvitationData(invitation);

      logger.info('Built email data for invitation', {
        email: invitation.email,
        emailDataKeys: Object.keys(emailData),
        invitationUrl: emailData.invitationUrl ? 'Generated' : 'Missing'
      }); // Generate request ID for tracking
      const requestId = this.reqIdGenerator
        ? this.reqIdGenerator.generateRequestId()
        : `comp_invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info('Generated request ID for invitation', {
        email: invitation.email,
        requestId,
        generatedBy: this.reqIdGenerator ? 'reqIdGenerator' : 'fallback'
      });

      const emailPayload = {
        to: {
          email: invitation.email,
          name: `${invitation.firstName} ${invitation.lastName}`
        },
        templateName: 'company-member-invitation',
        subject: `دعوة للانضمام إلى شركة ${invitation.company.name} على Cars Bids`,
        params: emailData,
        requestId: requestId
      };

      logger.info('Sending templated email', {
        email: invitation.email,
        templateName: emailPayload.templateName,
        subject: emailPayload.subject,
        hasEmailService: !!this.emailService
      });

      const result = await this.emailService.sendTemplatedEmail(emailPayload);

      logger.info('Email service responded', {
        email: invitation.email,
        resultKeys: Object.keys(result || {}),
        messageId: result?.messageId
      });

      // Cache invitation for tracking
      this._cacheInvitation(invitation.invitationToken, {
        email: invitation.email,
        companyId: invitation.company.id,
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      logger.info('Member invitation email sent successfully', {
        email: invitation.email,
        companyId: invitation.company.id,
        role: invitation.role,
        invitedBy: invitation.invitedBy.id,
        messageId: result?.messageId
      });

      return {
        success: true,
        messageId: result.messageId,
        invitationToken: invitation.invitationToken
      };
    } catch (error) {
      logger.error('Failed to send member invitation email - detailed error', {
        email: invitation?.email,
        companyId: invitation?.company?.id,
        error: error.message,
        errorType: error.constructor.name,
        errorStack: error.stack,
        originalError: error.originalError
          ? {
            message: error.originalError.message,
            type: error.originalError.constructor.name,
            stack: error.originalError.stack
          }
          : null
      });
      throw this._createEmailError('INVITATION_SEND_FAILED', error);
    }
  }
  /**
   * Send company welcome email to new members
   * @param {Object} welcomeData - Welcome email data
   * @returns {Promise<Object>} Email sending result
   */
  async sendCompanyWelcome(welcomeData) {
    try {
      this._validateWelcomeData(welcomeData);

      const emailData = this._buildWelcomeEmailData(welcomeData);

      // Generate request ID for tracking
      const requestId = this.reqIdGenerator
        ? this.reqIdGenerator.generateRequestId()
        : `comp_welcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = await this.emailService.sendTemplatedEmail({
        to: {
          email: welcomeData.member.email,
          name: `${welcomeData.member.firstName} ${welcomeData.member.lastName}`
        },
        templateName: 'company-welcome',
        subject: `أهلاً بكم في شركة ${welcomeData.company.name}!`,
        params: emailData,
        requestId: requestId
      });

      logger.info('Company welcome email sent', {
        memberId: welcomeData.member.id,
        companyId: welcomeData.company.id
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      logger.error('Failed to send company welcome email', {
        memberId: welcomeData.member.id,
        error: error.message
      });
      throw this._createEmailError('WELCOME_SEND_FAILED', error);
    }
  }
  /**
   * Send member removal notification
   * @param {Object} removalData - Removal notification data
   * @returns {Promise<Object>} Email sending result
   */
  async sendMemberRemovalNotification(removalData) {
    try {
      this._validateRemovalData(removalData);

      const emailData = this._buildRemovalEmailData(removalData);

      // Generate request ID for tracking
      const requestId = this.reqIdGenerator
        ? this.reqIdGenerator.generateRequestId()
        : `comp_removal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info('Generated request ID for member removal notification', {
        email: removalData.member.email,
        requestId,
        generatedBy: this.reqIdGenerator ? 'reqIdGenerator' : 'fallback'
      });

      const result = await this.emailService.sendTemplatedEmail({
        to: {
          email: removalData.member.email,
          name: `${removalData.member.firstName} ${removalData.member.lastName}`
        },
        templateName: 'company-member-removal',
        subject: `تحديث صلاحيات الوصول في شركة ${removalData.company.name}`,
        params: emailData,
        requestId: requestId
      });

      logger.info('Member removal notification sent', {
        memberId: removalData.member.id,
        companyId: removalData.company.id,
        removedBy: removalData.removedBy.id
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      logger.error('Failed to send member removal notification', {
        memberId: removalData.member.id,
        error: error.message
      });
      throw this._createEmailError('REMOVAL_NOTIFICATION_FAILED', error);
    }
  }
  /**
   * Send company activation notification
   * @param {Object} activationData - Company activation data
   * @returns {Promise<Object>} Email sending result
   */
  async sendCompanyActivation(activationData) {
    try {
      this._validateActivationData(activationData);

      const emailData = this._buildActivationEmailData(activationData);

      // Generate request ID for tracking
      const requestId = this.reqIdGenerator
        ? this.reqIdGenerator.generateRequestId()
        : `comp_activation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = await this.emailService.sendTemplatedEmail({
        to: {
          email: activationData.owner.email,
          name: `${activationData.owner.firstName} ${activationData.owner.lastName}`
        },
        templateName: 'company-activation',
        subject: `شركة ${activationData.company.name} أصبحت نشطة على Cars Bids`,
        params: emailData,
        requestId: requestId
      });

      logger.info('Company activation email sent', {
        companyId: activationData.company.id,
        ownerId: activationData.owner.id
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      logger.error('Failed to send company activation email', {
        companyId: activationData.company.id,
        error: error.message
      });
      throw this._createEmailError('ACTIVATION_SEND_FAILED', error);
    }
  }

  /**
   * Send bulk notification to all company members
   * @param {Object} notificationData - Bulk notification data
   * @returns {Promise<Array>} Array of email sending results
   */
  async sendBulkCompanyNotification(notificationData) {
    try {
      this._validateBulkNotificationData(notificationData);

      const results = [];
      const { members, company, notification } = notificationData; // #TODO: Implement rate limiting for bulk emails
      // #TODO: Add retry mechanism for failed emails

      for (const member of members) {
        try {
          const emailData = this._buildBulkNotificationData({
            member,
            company,
            notification
          });

          // Generate request ID for each individual email
          const requestId = this.reqIdGenerator
            ? this.reqIdGenerator.generateRequestId()
            : `comp_bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const result = await this.emailService.sendTemplatedEmail({
            to: {
              email: member.email,
              name: `${member.firstName} ${member.lastName}`
            },
            templateName: 'company-notification',
            subject: notification.subject,
            params: emailData,
            requestId: requestId
          });

          results.push({
            memberId: member.id,
            email: member.email,
            success: true,
            messageId: result.messageId
          });

          // Add delay between emails to avoid rate limiting
          await this._delay(100);
        } catch (error) {
          results.push({
            memberId: member.id,
            email: member.email,
            success: false,
            error: error.message
          });

          logger.error('Failed to send bulk notification to member', {
            memberId: member.id,
            email: member.email,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      logger.info('Bulk company notification completed', {
        companyId: company.id,
        totalMembers: members.length,
        successCount,
        failureCount
      });

      return {
        success: failureCount === 0,
        results,
        summary: {
          total: members.length,
          successful: successCount,
          failed: failureCount
        }
      };
    } catch (error) {
      logger.error('Failed to send bulk company notification', {
        companyId: notificationData.company.id,
        error: error.message
      });
      throw this._createEmailError('BULK_NOTIFICATION_FAILED', error);
    }
  }

  /**
   * Generate secure invitation token
   * @returns {string} Secure invitation token
   */
  generateInvitationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate invitation token and get cached data
   * @param {string} token - Invitation token
   * @returns {Object|null} Cached invitation data or null if invalid/expired
   */
  validateInvitationToken(token) {
    const cachedInvitation = this.invitationCache.get(token);

    if (!cachedInvitation) {
      return null;
    }

    if (new Date() > cachedInvitation.expiresAt) {
      this.invitationCache.delete(token);
      return null;
    }

    return cachedInvitation;
  } /**
   * Build member invitation email data
   * @private
   */
  _buildMemberInvitationData(invitation) {
    try {
      // Validate required fields for email data building
      if (!invitation.invitationToken) {
        throw new Error('Missing invitation token for email data building');
      }
      if (!invitation.company?.name) {
        throw new Error('Missing company name for email data building');
      }
      if (!invitation.invitedBy?.firstName || !invitation.invitedBy?.lastName) {
        throw new Error('Missing inviter information for email data building');
      }

      const invitationUrl = `${this.config.baseUrl}/accept-invitation?token=${invitation.invitationToken}`;

      const emailData = {
        memberName: `${invitation.firstName} ${invitation.lastName}`,
        companyName: invitation.company.name,
        role: this._translateRoleToArabic(invitation.role),
        inviterName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
        invitationUrl,
        expiryDays: 7,
        supportEmail: this.config.fromEmail,
        // Add temporary password and verification token if available
        tempPassword: invitation.tempPassword || null,
        emailVerificationToken: invitation.emailVerificationToken || null
      };

      logger.info('Built invitation email data', {
        email: invitation.email,
        hasInvitationUrl: !!emailData.invitationUrl,
        hasTempPassword: !!emailData.tempPassword,
        hasVerificationToken: !!emailData.emailVerificationToken,
        roleTranslated: emailData.role
      });

      return emailData;
    } catch (error) {
      logger.error('Failed to build member invitation email data', {
        email: invitation?.email,
        error: error.message,
        invitationKeys: Object.keys(invitation || {}),
        configKeys: Object.keys(this.config || {})
      });
      throw error;
    }
  }

  /**
   * Build welcome email data
   * @private
   */
  _buildWelcomeEmailData(welcomeData) {
    return {
      memberName: `${welcomeData.member.firstName} ${welcomeData.member.lastName}`,
      companyName: welcomeData.company.name,
      dashboardUrl: `${this.config.baseUrl}/company/dashboard`,
      supportEmail: this.config.fromEmail,
      companyLogo: welcomeData.company.logo
    };
  }
  /**
   * Build removal email data
   * @private
   */
  _buildRemovalEmailData(removalData) {
    return {
      memberName: `${removalData.member.firstName} ${removalData.member.lastName}`,
      companyName: removalData.company.name,
      reason: this._translateReasonToArabic(removalData.reason),
      supportEmail: this.config.fromEmail
    };
  }

  /**
   * Build activation email data
   * @private
   */
  _buildActivationEmailData(activationData) {
    return {
      ownerName: `${activationData.owner.firstName} ${activationData.owner.lastName}`,
      companyName: activationData.company.name,
      dashboardUrl: `${this.config.baseUrl}/company/dashboard`,
      subscriptionType: activationData.company.subscriptionType,
      supportEmail: this.config.fromEmail
    };
  }

  /**
   * Build bulk notification data
   * @private
   */
  _buildBulkNotificationData({ member, company, notification }) {
    return {
      memberName: `${member.firstName} ${member.lastName}`,
      companyName: company.name,
      message: notification.message,
      actionUrl: notification.actionUrl,
      supportEmail: this.config.fromEmail
    };
  }

  /**
   * Cache invitation for tracking and validation
   * @private
   */
  _cacheInvitation(token, data) {
    this.invitationCache.set(token, data);

    // Clean up expired invitations periodically
    setTimeout(
      () => {
        if (this.invitationCache.has(token)) {
          const cachedData = this.invitationCache.get(token);
          if (new Date() > cachedData.expiresAt) {
            this.invitationCache.delete(token);
          }
        }
      },
      7 * 24 * 60 * 60 * 1000
    ); // 7 days
  }

  /**
   * Add delay for rate limiting
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create standardized email error
   * @private
   */
  _createEmailError(type, originalError) {
    const error = new Error(`Email service error: ${type}`);
    error.type = type;
    error.originalError = originalError;
    return error;
  }
  /**
   * Validation methods
   * @private
   */
  _validateInvitationData(invitation) {
    try {
      logger.info('Validating invitation data', {
        email: invitation?.email,
        hasCompany: !!invitation?.company,
        hasInvitedBy: !!invitation?.invitedBy,
        hasInvitationToken: !!invitation?.invitationToken,
        providedFields: Object.keys(invitation || {})
      });

      const required = ['email', 'firstName', 'lastName', 'role', 'company', 'invitedBy', 'invitationToken'];
      this._validateRequiredFields(invitation, required, 'invitation');

      // Additional nested object validation
      if (invitation.company && !invitation.company.name) {
        throw new Error('Missing company.name in invitation data');
      }
      if (invitation.invitedBy && (!invitation.invitedBy.firstName || !invitation.invitedBy.lastName)) {
        throw new Error('Missing invitedBy name fields in invitation data');
      }

      logger.info('Invitation data validation passed', {
        email: invitation.email
      });
    } catch (error) {
      logger.error('Invitation data validation failed', {
        email: invitation?.email,
        error: error.message,
        providedData: invitation ? Object.keys(invitation) : 'null'
      });
      throw error;
    }
  }

  _validateWelcomeData(welcomeData) {
    const required = ['member', 'company'];
    this._validateRequiredFields(welcomeData, required, 'welcome data');
  }

  _validateRemovalData(removalData) {
    const required = ['member', 'company', 'removedBy'];
    this._validateRequiredFields(removalData, required, 'removal data');
  }

  _validateActivationData(activationData) {
    const required = ['company', 'owner'];
    this._validateRequiredFields(activationData, required, 'activation data');
  }

  _validateBulkNotificationData(notificationData) {
    const required = ['members', 'company', 'notification'];
    this._validateRequiredFields(notificationData, required, 'bulk notification data');
  }

  _validateRequiredFields(data, required, context) {
    const missingFields = [];

    for (const field of required) {
      if (!data || data[field] === undefined || data[field] === null) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      const error = new Error(`Missing required fields in ${context}: ${missingFields.join(', ')}`);
      error.missingFields = missingFields;
      error.context = context;
      error.providedFields = data ? Object.keys(data) : [];
      throw error;
    }
  }

  /**
   * Translate role to Arabic (Syrian dialect)
   * @private
   */
  _translateRoleToArabic(role) {
    const roleTranslations = {
      owner: 'مالك الشركة',
      admin: 'مدير',
      manager: 'مدير فرع',
      member: 'عضو',
      employee: 'موظف',
      salesperson: 'مندوب مبيعات',
      moderator: 'مشرف'
    };

    return roleTranslations[role] || 'عضو';
  }

  /**
   * Translate removal reason to Arabic (Syrian dialect)
   * @private
   */
  _translateReasonToArabic(reason) {
    if (!reason) {
      return 'قرار إداري';
    }

    const reasonTranslations = {
      'Administrative decision': 'قرار إداري',
      'Performance issues': 'مسائل تتعلق بالأداء',
      'Voluntary resignation': 'استقالة طوعية',
      'Company restructuring': 'إعادة هيكلة الشركة',
      'Contract ended': 'انتهاء العقد',
      'Policy violation': 'مخالفة السياسات',
      Downsizing: 'تقليص العمالة',
      'Role elimination': 'إلغاء المنصب',
      'Mutual agreement': 'اتفاق متبادل'
    };

    return reasonTranslations[reason] || reason;
  }

  /**
   * Get culturally appropriate greeting based on time of day
   * @private
   */
  _getArabicGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'صباح الخير';
    } else if (hour < 17) {
      return 'مساء الخير';
    } else {
      return 'مساء النور';
    }
  }
}

module.exports = CompanyEmailService;
