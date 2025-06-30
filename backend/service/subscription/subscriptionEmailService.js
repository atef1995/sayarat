const logger = require('../../utils/logger');

/**
 * Subscription Email Service for sending subscription-related emails
 *
 * This service handles all subscription lifecycle email notifications including:
 * - Welcome emails when subscription starts
 * - Cancellation confirmations
 * - Reactivation notifications
 * - Plan change confirmations
 * - Payment reminders and failure notifications
 *
 * Follows dependency injection pattern for better testability and modularity
 */
class SubscriptionEmailService {
  /**
   * Initialize the subscription email service
   * @param {Object} emailService - Injected email service (BrevoEmailService)
   * @param {string} requestId - Request tracking ID for logging
   */
  constructor(emailService, requestId = 'unknown') {
    this.emailService = emailService;
    this.requestId = requestId;

    // Validate required dependencies
    if (!emailService) {
      throw new Error('Email service is required for SubscriptionEmailService');
    }

    if (typeof emailService.sendTemplatedEmail !== 'function') {
      throw new Error('Email service must implement sendTemplatedEmail method');
    }
  }

  /**
   * Send welcome email when subscription is activated
   * @param {Object} subscriptionData - Subscription information
   * @param {Object} userInfo - User information
   * @param {Object} planDetails - Plan details
   * @returns {Promise<Object>} Email send result
   */
  async sendWelcomeEmail(subscriptionData, userInfo, planDetails) {
    try {
      logger.info('Sending subscription welcome email', {
        requestId: this.requestId,
        userId: userInfo.id,
        subscriptionId: subscriptionData.id,
        planName: planDetails.name
      });

      const params = {
        customerName: userInfo.name || userInfo.fullName || 'عزيزي العميل',
        planName: planDetails.displayName || planDetails.name,
        planPrice: planDetails.price,
        currency: planDetails.currency || 'USD',
        interval: this.formatInterval(planDetails.interval),
        periodStart: this.formatDate(subscriptionData.currentPeriodStart),
        periodEnd: this.formatDate(subscriptionData.currentPeriodEnd),
        subscriptionId: subscriptionData.id,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
        features: this.formatFeatures(planDetails.features),
        dashboardUrl: `${process.env.CLIENT_URL}/dashboard/subscription`,
        currentYear: new Date().getFullYear()
      };

      return await this.emailService.sendTemplatedEmail({
        templateName: 'subscription-welcome',
        to: {
          email: userInfo.email,
          name: params.customerName
        },
        subject: `مرحباً بك في ${params.planName} - Cars Bids`,
        params,
        requestId: this.requestId
      });
    } catch (error) {
      logger.error('Failed to send subscription welcome email', {
        requestId: this.requestId,
        userId: userInfo.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Send cancellation confirmation email
   * @param {Object} subscriptionData - Subscription information
   * @param {Object} userInfo - User information
   * @param {Object} cancellationDetails - Cancellation details
   * @returns {Promise<Object>} Email send result
   */
  async sendCancellationEmail(subscriptionData, userInfo, cancellationDetails) {
    try {
      logger.info('Sending subscription cancellation email', {
        requestId: this.requestId,
        userId: userInfo.id,
        subscriptionId: subscriptionData.id,
        cancellationType: cancellationDetails.type
      });

      const isImmediate = cancellationDetails.type === 'immediate';

      const params = {
        customerName: userInfo.name || userInfo.fullName || 'عزيزي العميل',
        subscriptionId: subscriptionData.id,
        cancellationType: isImmediate ? 'إلغاء فوري' : 'إلغاء في نهاية الفترة',
        cancellationReason: this.formatCancellationReason(cancellationDetails.reason),
        canceledAt: this.formatDate(cancellationDetails.canceledAt),
        currentPeriodEnd: this.formatDate(subscriptionData.currentPeriodEnd),
        isImmediateCancellation: isImmediate,
        dashboardUrl: `${process.env.CLIENT_URL}/dashboard/subscription`,
        reactivateUrl: `${process.env.CLIENT_URL}/dashboard/subscription?action=reactivate`,
        supportUrl: `${process.env.CLIENT_URL}/support`,
        currentYear: new Date().getFullYear()
      };

      return await this.emailService.sendTemplatedEmail({
        templateName: 'subscription-cancelled',
        to: {
          email: userInfo.email,
          name: params.customerName
        },
        subject: 'تأكيد إلغاء الاشتراك - Cars Bids',
        params,
        requestId: this.requestId
      });
    } catch (error) {
      logger.error('Failed to send subscription cancellation email', {
        requestId: this.requestId,
        userId: userInfo.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Send reactivation confirmation email
   * @param {Object} subscriptionData - Subscription information
   * @param {Object} userInfo - User information
   * @param {Object} reactivationDetails - Reactivation details
   * @returns {Promise<Object>} Email send result
   */
  async sendReactivationEmail(subscriptionData, userInfo, reactivationDetails) {
    try {
      logger.info('Sending subscription reactivation email', {
        requestId: this.requestId,
        userId: userInfo.id,
        subscriptionId: subscriptionData.id,
        reactivationCount: reactivationDetails.count
      });

      const params = {
        customerName: userInfo.name || userInfo.fullName || 'عزيزي العميل',
        subscriptionId: subscriptionData.id,
        reactivatedAt: this.formatDate(reactivationDetails.reactivatedAt),
        reactivationCount: reactivationDetails.count || 1,
        currentPeriodEnd: this.formatDate(subscriptionData.currentPeriodEnd),
        dashboardUrl: `${process.env.CLIENT_URL}/dashboard/subscription`,
        currentYear: new Date().getFullYear()
      };

      return await this.emailService.sendTemplatedEmail({
        templateName: 'subscription-reactivated',
        to: {
          email: userInfo.email,
          name: params.customerName
        },
        subject: 'مرحباً بعودتك! تم إعادة تفعيل اشتراكك - Cars Bids',
        params,
        requestId: this.requestId
      });
    } catch (error) {
      logger.error('Failed to send subscription reactivation email', {
        requestId: this.requestId,
        userId: userInfo.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Send plan update confirmation email
   * @param {Object} subscriptionData - Updated subscription information
   * @param {Object} userInfo - User information
   * @param {Object} updateDetails - Plan update details
   * @returns {Promise<Object>} Email send result
   */
  async sendPlanUpdateEmail(subscriptionData, userInfo, updateDetails) {
    try {
      logger.info('Sending subscription plan update email', {
        requestId: this.requestId,
        userId: userInfo.id,
        subscriptionId: subscriptionData.id,
        oldPlan: updateDetails.oldPlan.name,
        newPlan: updateDetails.newPlan.name
      });

      const isUpgrade = updateDetails.newPlan.price > updateDetails.oldPlan.price;

      const params = {
        customerName: userInfo.name || userInfo.fullName || 'عزيزي العميل',
        subscriptionId: subscriptionData.id,
        oldPlanName: updateDetails.oldPlan.displayName || updateDetails.oldPlan.name,
        oldPlanPrice: updateDetails.oldPlan.price,
        oldPlanInterval: this.formatInterval(updateDetails.oldPlan.interval),
        newPlanName: updateDetails.newPlan.displayName || updateDetails.newPlan.name,
        newPlanPrice: updateDetails.newPlan.price,
        newPlanInterval: this.formatInterval(updateDetails.newPlan.interval),
        currency: updateDetails.newPlan.currency || 'USD',
        updateDate: this.formatDate(updateDetails.updateDate),
        changeReason: updateDetails.reason || 'ترقية بناءً على طلب العميل',
        hasUpgrade: isUpgrade,
        prorationAmount: updateDetails.prorationAmount,
        newFeatures: this.formatFeaturesList(updateDetails.newPlan.features),
        dashboardUrl: `${process.env.CLIENT_URL}/dashboard/subscription`,
        currentYear: new Date().getFullYear()
      };

      return await this.emailService.sendTemplatedEmail({
        templateName: 'subscription-updated',
        to: {
          email: userInfo.email,
          name: params.customerName
        },
        subject: `تم تحديث خطة اشتراكك إلى ${params.newPlanName} - Cars Bids`,
        params,
        requestId: this.requestId
      });
    } catch (error) {
      logger.error('Failed to send subscription plan update email', {
        requestId: this.requestId,
        userId: userInfo.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Send payment failure notification
   * @param {Object} subscriptionData - Subscription information
   * @param {Object} userInfo - User information
   * @param {Object} paymentDetails - Payment failure details
   * @returns {Promise<Object>} Email send result
   */
  async sendPaymentFailureEmail(subscriptionData, userInfo, paymentDetails) {
    try {
      logger.info('Sending subscription payment failure email', {
        requestId: this.requestId,
        userId: userInfo.id,
        subscriptionId: subscriptionData.id,
        failureReason: paymentDetails.reason
      });

      const params = {
        customerName: userInfo.name || userInfo.fullName || 'عزيزي العميل',
        subscriptionId: subscriptionData.id,
        planName: subscriptionData.planDisplayName || subscriptionData.planName,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency || 'USD',
        failureReason: this.formatPaymentFailureReason(paymentDetails.reason),
        nextRetryDate: this.formatDate(paymentDetails.nextRetryDate),
        updatePaymentUrl: `${process.env.CLIENT_URL}/dashboard/subscription/payment`,
        dashboardUrl: `${process.env.CLIENT_URL}/dashboard/subscription`,
        supportUrl: `${process.env.CLIENT_URL}/support`,
        currentYear: new Date().getFullYear()
      };

      return await this.emailService.sendTemplatedEmail({
        templateName: 'payment-failed',
        to: {
          email: userInfo.email,
          name: params.customerName
        },
        subject: 'فشل في معالجة دفعة الاشتراك - Cars Bids',
        params,
        requestId: this.requestId
      });
    } catch (error) {
      logger.error('Failed to send subscription payment failure email', {
        requestId: this.requestId,
        userId: userInfo.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // #TODO: Add method for trial ending reminders
  // #TODO: Add method for renewal reminders
  // #TODO: Add method for subscription expiry warnings

  /**
   * Format subscription interval for display
   * @param {string} interval - Interval from Stripe (month, year)
   * @returns {string} Formatted interval in Arabic
   */
  formatInterval(interval) {
    const intervals = {
      month: 'شهرياً',
      year: 'سنوياً',
      week: 'أسبوعياً',
      day: 'يومياً'
    };
    return intervals[interval] || interval;
  }

  /**
   * Format date for display in Arabic locale
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date
   */
  formatDate(date) {
    if (!date) {
      return 'غير محدد';
    }

    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      logger.warn('Failed to format date', { date, error: error.message });
      return 'تاريخ غير صحيح';
    }
  }

  /**
   * Format cancellation reason for display
   * @param {string} reason - Cancellation reason
   * @returns {string} Formatted reason in Arabic
   */
  formatCancellationReason(reason) {
    const reasons = {
      user_requested: 'بناءً على طلب المستخدم',
      payment_failed: 'فشل في الدفع',
      upgrade: 'ترقية لخطة أفضل',
      downgrade: 'تخفيض لخطة أقل',
      trial_ended: 'انتهاء فترة التجربة',
      admin_action: 'إجراء إداري',
      policy_violation: 'مخالفة السياسات'
    };
    return reasons[reason] || reason || 'غير محدد';
  }

  /**
   * Format payment failure reason for display
   * @param {string} reason - Payment failure reason
   * @returns {string} Formatted reason in Arabic
   */
  formatPaymentFailureReason(reason) {
    const reasons = {
      insufficient_funds: 'رصيد غير كافي',
      card_declined: 'تم رفض البطاقة',
      expired_card: 'البطاقة منتهية الصلاحية',
      incorrect_cvc: 'رمز الأمان غير صحيح',
      processing_error: 'خطأ في المعالجة',
      authentication_required: 'مطلوب تأكيد إضافي'
    };
    return reasons[reason] || reason || 'سبب غير معروف';
  }

  /**
   * Format features object for template consumption
   * @param {Object} features - Features object
   * @returns {Object} Formatted features for template
   */
  formatFeatures(features) {
    if (!features || typeof features !== 'object') {
      return {};
    }

    // Return features object as-is for template conditional rendering
    return features;
  }

  /**
   * Format features array for listing in templates
   * @param {Array|Object} features - Features array or object
   * @returns {Array} Array of feature names in Arabic
   */
  formatFeaturesList(features) {
    const featureMap = {
      aiCarAnalysis: 'تحليل السيارات بالذكاء الاصطناعي',
      listingHighlights: 'تمييز الإعلانات وإبرازها',
      prioritySupport: 'دعم فني مميز ذو أولوية',
      advancedAnalytics: 'إحصائيات متقدمة ومفصلة',
      unlimitedListings: 'إعلانات غير محدودة',
      customBranding: 'علامة تجارية مخصصة',
      teamMembers: 'إدارة أعضاء الفريق'
    };

    if (Array.isArray(features)) {
      return features.map(feature => featureMap[feature] || feature);
    }

    if (typeof features === 'object') {
      return Object.keys(features)
        .filter(key => features[key])
        .map(key => featureMap[key] || key);
    }

    return [];
  }
}

module.exports = SubscriptionEmailService;
