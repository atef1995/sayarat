const logger = require('../../utils/logger');

/**
 * Subscription Payment Service
 *
 * ARCHITECTURE PRINCIPLES:
 * ========================
 *
 * 1. SINGLE RESPONSIBILITY: Handles payment recording and tracking
 * 2. DEPENDENCY INJECTION: Receives Knex instance for testability
 * 3. DATA ACCESS LAYER: Payment-specific database operations
 * 4. ERROR BOUNDARIES: Comprehensive error handling and logging
 *
 * RESPONSIBILITIES:
 * =================
 * - Record subscription payments
 * - Update payment records with charge information
 * - Get payment history
 * - Handle manual payment requests
 *
 * #TODO: Add payment analytics and reporting
 * #TODO: Implement payment retry logic tracking
 * #TODO: Add payment method management
 */
class SubscriptionPaymentService {
  constructor(knex) {
    if (!knex) {
      throw new Error('Knex instance is required for SubscriptionPaymentService');
    }
    this.knex = knex;
  }

  /**
   * Record payment for subscription or one-time payment
   * @param {Object} paymentData - Payment data to record
   * @param {string} [paymentData.stripe_subscription_id] - Stripe subscription ID
   * @param {string} [paymentData.stripe_payment_intent_id] - Stripe payment intent ID
   * @param {string} paymentData.stripe_invoice_id - Stripe invoice ID
   * @param {number} paymentData.amount - Payment amount
   * @param {string} paymentData.currency - Payment currency
   * @param {string} paymentData.status - Payment status
   * @param {Date} [paymentData.paid_at] - Payment success date
   * @param {Date} [paymentData.failed_at] - Payment failure date
   * @param {Object} [paymentData.metadata] - Additional metadata
   * @returns {Promise<Object>} Created payment record
   */
  async recordPayment(paymentData) {
    try {
      this._validatePaymentData(paymentData);

      const {
        stripe_subscription_id,
        stripe_payment_intent_id,
        stripe_invoice_id,
        stripe_customer_id,
        stripe_checkout_session_id,
        amount,
        currency,
        status,
        paid_at,
        failed_at,
        metadata = {}
      } = paymentData;

      const paymentRecord = {
        stripe_subscription_id,
        stripe_payment_intent_id,
        stripe_invoice_id,
        stripe_customer_id,
        stripe_checkout_session_id,
        amount,
        currency: currency?.toLowerCase(),
        status,
        paid_at,
        failed_at,
        metadata: JSON.stringify(metadata),
        created_at: new Date(),
        updated_at: new Date()
      };

      // Remove undefined fields
      Object.keys(paymentRecord).forEach(key => {
        if (paymentRecord[key] === undefined) {
          delete paymentRecord[key];
        }
      });

      const [paymentId] = await this.knex('subscription_payments').insert(paymentRecord).returning('id');

      const result = { id: paymentId, ...paymentRecord };

      logger.info('SubscriptionPaymentService - Payment recorded successfully', {
        paymentId,
        stripeSubscriptionId: stripe_subscription_id,
        stripeInvoiceId: stripe_invoice_id,
        amount,
        currency,
        status
      });

      return result;
    } catch (error) {
      logger.error('SubscriptionPaymentService - Error recording payment', {
        error: error.message,
        paymentData: {
          ...paymentData,
          metadata: 'redacted'
        },
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update payment record with charge information
   * @param {string} stripePaymentIntentId - Stripe payment intent ID
   * @param {Object} chargeData - Charge data to update
   * @param {string} [chargeData.stripe_charge_id] - Stripe charge ID
   * @param {Date} [chargeData.charged_at] - Charge success timestamp
   * @param {Date} [chargeData.charge_failed_at] - Charge failure timestamp
   * @param {string} [chargeData.charge_status] - Charge status (succeeded/failed)
   * @param {string} [chargeData.charge_failure_reason] - Charge failure reason
   * @returns {Promise<Object>} Updated payment record
   */
  async updatePaymentWithCharge(stripePaymentIntentId, chargeData) {
    try {
      if (!stripePaymentIntentId) {
        throw new Error('Stripe payment intent ID is required');
      }

      if (!chargeData || typeof chargeData !== 'object') {
        throw new Error('Valid charge data is required');
      }

      // Build update object with only provided fields
      const updateData = {};
      if (chargeData.stripe_charge_id) {
        updateData.stripe_charge_id = chargeData.stripe_charge_id;
      }
      if (chargeData.charged_at) {
        updateData.charged_at = chargeData.charged_at;
      }
      if (chargeData.charge_failed_at) {
        updateData.charge_failed_at = chargeData.charge_failed_at;
      }
      if (chargeData.charge_status) {
        updateData.charge_status = chargeData.charge_status;
      }
      if (chargeData.charge_failure_reason) {
        updateData.charge_failure_reason = chargeData.charge_failure_reason;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('No valid charge data fields provided for update');
      }

      updateData.updated_at = new Date();

      const updatedRows = await this.knex('subscription_payments')
        .where('stripe_payment_intent_id', stripePaymentIntentId)
        .update(updateData);

      if (updatedRows === 0) {
        logger.warn('SubscriptionPaymentService - No payment record found to update with charge data', {
          stripePaymentIntentId,
          chargeData
        });
        return null;
      }

      const updatedPayment = await this.knex('subscription_payments')
        .where('stripe_payment_intent_id', stripePaymentIntentId)
        .first();

      logger.info('SubscriptionPaymentService - Payment record updated with charge information', {
        stripePaymentIntentId,
        chargeId: chargeData.stripe_charge_id,
        chargeStatus: chargeData.charge_status,
        updatedRows
      });

      return updatedPayment;
    } catch (error) {
      logger.error('SubscriptionPaymentService - Error updating payment with charge data', {
        error: error.message,
        stripePaymentIntentId,
        chargeData,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get subscription payment history
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @param {number} [limit=50] - Maximum number of records to return
   * @returns {Promise<Array>} Payment history records
   */
  async getSubscriptionPaymentHistory(stripeSubscriptionId, limit = 50) {
    try {
      if (!stripeSubscriptionId) {
        throw new Error('Stripe subscription ID is required');
      }

      const payments = await this.knex('subscription_payments')
        .where('stripe_subscription_id', stripeSubscriptionId)
        .orderBy('created_at', 'desc')
        .limit(limit);

      // Parse metadata for each payment
      const paymentsWithParsedMetadata = payments.map(payment => ({
        ...payment,
        metadata: this._parseMetadata(payment.metadata)
      }));

      logger.debug('SubscriptionPaymentService - Retrieved subscription payment history', {
        stripeSubscriptionId,
        paymentCount: payments.length,
        limit
      });

      return paymentsWithParsedMetadata;
    } catch (error) {
      logger.error('SubscriptionPaymentService - Error getting subscription payment history', {
        error: error.message,
        stripeSubscriptionId,
        limit,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Create manual payment request
   * @param {Object} paymentRequestData - Manual payment request data
   * @returns {Promise<Object>} Created payment request
   */
  async createManualPaymentRequest(paymentRequestData) {
    try {
      this._validateManualPaymentRequestData(paymentRequestData);

      const requestData = {
        ...paymentRequestData,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      };

      const [requestId] = await this.knex('manual_payment_requests').insert(requestData).returning('id');

      const result = { id: requestId, ...requestData };

      logger.info('SubscriptionPaymentService - Manual payment request created successfully', {
        requestId,
        userId: paymentRequestData.user_id,
        planName: paymentRequestData.plan_name,
        amount: paymentRequestData.plan_price
      });

      return result;
    } catch (error) {
      logger.error('SubscriptionPaymentService - Error creating manual payment request', {
        error: error.message,
        paymentRequestData: {
          ...paymentRequestData,
          // Redact sensitive data
          phone: 'redacted',
          email: 'redacted'
        },
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update manual payment request status
   * @param {number} requestId - Request ID
   * @param {string} status - New status
   * @param {Object} [additionalData] - Additional data to update
   * @returns {Promise<Object>} Updated request
   */
  async updateManualPaymentRequestStatus(requestId, status, additionalData = {}) {
    try {
      if (!requestId || !status) {
        throw new Error('Request ID and status are required');
      }

      const validStatuses = ['pending', 'approved', 'rejected', 'processing', 'completed'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }

      const updateData = {
        status,
        updated_at: new Date(),
        ...additionalData
      };

      await this.knex('manual_payment_requests').where('id', requestId).update(updateData);

      const updatedRequest = await this.knex('manual_payment_requests').where('id', requestId).first();

      logger.info('SubscriptionPaymentService - Manual payment request status updated', {
        requestId,
        newStatus: status,
        additionalData
      });

      return updatedRequest;
    } catch (error) {
      logger.error('SubscriptionPaymentService - Error updating manual payment request status', {
        error: error.message,
        requestId,
        status,
        additionalData,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get payment analytics for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} [filters] - Additional filters
   * @returns {Promise<Object>} Payment analytics
   */
  async getPaymentAnalytics(startDate, endDate, filters = {}) {
    try {
      const query = this.knex('subscription_payments').whereBetween('created_at', [startDate, endDate]);

      // Apply filters
      if (filters.status) {
        query.where('status', filters.status);
      }
      if (filters.currency) {
        query.where('currency', filters.currency);
      }

      const analytics = await query
        .select([
          this.knex.raw('COUNT(*) as total_payments'),
          this.knex.raw('SUM(amount) as total_amount'),
          this.knex.raw('AVG(amount) as average_amount'),
          this.knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as successful_payments', ['succeeded']),
          this.knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as failed_payments', ['failed']),
          'currency'
        ])
        .groupBy('currency');

      logger.info('SubscriptionPaymentService - Payment analytics retrieved', {
        startDate,
        endDate,
        filters,
        resultCount: analytics.length
      });

      return analytics;
    } catch (error) {
      logger.error('SubscriptionPaymentService - Error getting payment analytics', {
        error: error.message,
        startDate,
        endDate,
        filters,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Parse metadata JSON string safely
   *
   * #TODO: Consider adding metadata schema validation to ensure structure consistency
   * #TODO: Add metadata size limits to prevent storage issues
   *
   * @param {string} metadataString - JSON string
   * @returns {Object} Parsed metadata object
   * @private
   */
  _parseMetadata(metadataString) {
    try {
      return metadataString ? JSON.parse(metadataString) : {};
    } catch (error) {
      logger.warn('SubscriptionPaymentService - Failed to parse metadata', {
        error: error.message,
        metadataString
      });
      return {};
    }
  }

  /**
   * Validate payment data
   * @param {Object} paymentData - Payment data to validate
   * @private
   */
  _validatePaymentData(paymentData) {
    const required = ['amount', 'currency', 'status'];

    for (const field of required) {
      if (!paymentData[field]) {
        throw new Error(`${field} is required for payment`);
      }
    }

    // Validate that either subscription_id or payment_intent_id is provided
    if (!paymentData.stripe_subscription_id && !paymentData.stripe_payment_intent_id) {
      throw new Error('Either stripe_subscription_id or stripe_payment_intent_id is required');
    }

    // Validate amount
    if (typeof paymentData.amount !== 'number' || paymentData.amount < 0) {
      throw new Error('Amount must be a non-negative number');
    }

    // Validate status
    const validStatuses = ['succeeded', 'failed', 'pending', 'canceled'];
    if (!validStatuses.includes(paymentData.status)) {
      throw new Error(`Invalid payment status: ${paymentData.status}. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  /**
   * Validate manual payment request data
   * @param {Object} requestData - Request data to validate
   * @private
   */
  _validateManualPaymentRequestData(requestData) {
    const required = [
      'user_id',
      'full_name',
      'phone',
      'email',
      'payment_method',
      'preferred_contact',
      'plan_name',
      'plan_price',
      'currency'
    ];

    for (const field of required) {
      if (!requestData[field]) {
        throw new Error(`${field} is required for manual payment request`);
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate price
    if (typeof requestData.plan_price !== 'number' || requestData.plan_price <= 0) {
      throw new Error('Plan price must be a positive number');
    }
  }
}

module.exports = { SubscriptionPaymentService };
