const logger = require('../utils/logger');
const WebhookDatabase = require('../service/webhookDatabase');
const WebhookEventProcessor = require('../service/webhookEventProcessor');
const StripeWebhookService = require('../service/stripeWebhookService');

/**
 * Main webhook controller that orchestrates the webhook processing flow
 */
class WebhookController {
  constructor(knex) {
    this.knex = knex;
    this.database = new WebhookDatabase(knex);
    this.eventProcessor = new WebhookEventProcessor(knex);
    this.stripeWebhookService = new StripeWebhookService(knex);
  }

  /**
   * Process webhook event
   * @param {Object} event - Stripe event object
   * @param {string} requestId - Request tracking ID
   * @param {number} startTime - Request start time
   * @returns {Object} - Processing result
   */
  async processWebhook(event, requestId, startTime) {
    // Check idempotency
    const existingEvent = await this.database.checkIdempotency(event.id, requestId);

    if (existingEvent) {
      logger.info('Event already processed - idempotency check', {
        requestId,
        eventId: event.id,
        existingStatus: existingEvent.status,
        originalProcessedAt: existingEvent.processed_at
      });
      return {
        success: true,
        status: 'already_processed',
        processedAt: existingEvent.processed_at
      };
    }

    // Create webhook event record
    let webhookEventId;
    try {
      webhookEventId = await this.database.createWebhookEvent(event, requestId);
    } catch (error) {
      if (error.message === 'ALREADY_PROCESSED') {
        return {
          success: true,
          status: 'already_processed'
        };
      }
      throw error;
    }

    try {
      // Process the event based on type
      const result = await this.processEventByType(event, requestId);

      // Update success status
      const processingTime = Date.now() - startTime;
      await this.database.markSuccess(webhookEventId, processingTime);

      return {
        success: true,
        processingTime,
        result
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('Critical error processing webhook', {
        requestId,
        eventId: event.id,
        eventType: event.type,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime
      });

      // Update failed status
      try {
        await this.database.markFailed(webhookEventId, error.message, processingTime);
      } catch (updateError) {
        logger.error('Failed to update webhook event with error status', {
          requestId,
          eventId: event.id,
          originalError: error.message,
          updateError: updateError.message
        });
      }

      throw error;
    }
  } /**
   * Process event based on its type
   * @param {Object} event - Stripe event object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   */
  async processEventByType(event, requestId) {
    logger.info('Processing webhook event', {
      requestId,
      eventType: event.type,
      eventId: event.id
    });

    switch (event.type) {
      // Payment-related events (only for listing payments, not subscriptions)
      case 'payment_intent.succeeded': {
        // Check if this is a subscription payment - if so, route to subscription handler
        if (this.isSubscriptionPayment(event.data.object)) {
          logger.info('Routing payment_intent.succeeded to subscription handler', {
            requestId,
            eventId: event.id,
            paymentIntentId: event.data.object.id,
            reason: 'Detected subscription payment indicators'
          });
          const stripeResult = await this.stripeWebhookService.processStripeEvent(event, requestId);
          return { type: 'subscription_payment_succeeded', result: stripeResult };
        }
        // Otherwise, process as listing payment
        logger.info('Routing payment_intent.succeeded to listing handler', {
          requestId,
          eventId: event.id,
          paymentIntentId: event.data.object.id,
          reason: 'No subscription payment indicators found'
        });
        await this.eventProcessor.processPaymentSucceeded(event.data.object, requestId);
        return { type: 'listing_payment_succeeded' };
      }
      case 'payment_intent.payment_failed': {
        // Check if this is a subscription payment - if so, route to subscription handler
        if (this.isSubscriptionPayment(event.data.object)) {
          logger.info('Routing payment_intent.payment_failed to subscription handler', {
            requestId,
            eventId: event.id,
            paymentIntentId: event.data.object.id,
            reason: 'Detected subscription payment indicators'
          });
          const stripeResult = await this.stripeWebhookService.processStripeEvent(event, requestId);
          return { type: 'subscription_payment_failed', result: stripeResult };
        }
        // Otherwise, process as listing payment
        logger.info('Routing payment_intent.payment_failed to listing handler', {
          requestId,
          eventId: event.id,
          paymentIntentId: event.data.object.id,
          reason: 'No subscription payment indicators found'
        });
        const errorMessage = await this.eventProcessor.processPaymentFailed(event.data.object, requestId);
        return { type: 'listing_payment_failed', error: errorMessage };
      }
      case 'charge.succeeded': {
        // Check if this is a subscription charge - if so, route to subscription handler
        if (this.isSubscriptionCharge(event.data.object)) {
          logger.info('Routing charge.succeeded to subscription handler', {
            requestId,
            eventId: event.id,
            chargeId: event.data.object.id,
            reason: 'Detected subscription charge indicators'
          });
          const stripeResult = await this.stripeWebhookService.processStripeEvent(event, requestId);
          return { type: 'subscription_charge_succeeded', result: stripeResult };
        }
        // Otherwise, process as listing charge
        logger.info('Routing charge.succeeded to listing handler', {
          requestId,
          eventId: event.id,
          chargeId: event.data.object.id,
          reason: 'No subscription charge indicators found'
        });
        await this.eventProcessor.processChargeSucceeded(event.data.object, requestId);
        return { type: 'listing_charge_succeeded' };
      }
      case 'charge.failed': {
        // Check if this is a subscription charge - if so, route to subscription handler
        if (this.isSubscriptionCharge(event.data.object)) {
          logger.info('Routing charge.failed to subscription handler', {
            requestId,
            eventId: event.id,
            chargeId: event.data.object.id,
            reason: 'Detected subscription charge indicators'
          });
          const stripeResult = await this.stripeWebhookService.processStripeEvent(event, requestId);
          return { type: 'subscription_charge_failed', result: stripeResult };
        }
        // Otherwise, process as listing charge
        logger.info('Routing charge.failed to listing handler', {
          requestId,
          eventId: event.id,
          chargeId: event.data.object.id,
          reason: 'No subscription charge indicators found'
        });
        const chargeErrorMessage = await this.eventProcessor.processChargeFailed(event.data.object, requestId);
        return { type: 'listing_charge_failed', error: chargeErrorMessage }; // Subscription-related events
      }
      case 'checkout.session.completed':
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.pending_update_applied':
      case 'customer.subscription.pending_update_expired':
      case 'customer.subscription.trial_will_end':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
      // Additional invoice events for comprehensive coverage
      case 'invoice.finalized':
      case 'invoice.updated':
      case 'invoice.paid':
      case 'invoice_payment.paid': {
        const stripeResult = await this.stripeWebhookService.processStripeEvent(event, requestId);
        return { type: 'stripe_event', eventType: event.type, result: stripeResult };
      }
      default: {
        logger.warn('Unhandled event type received', {
          requestId,
          eventType: event.type,
          eventId: event.id
        });

        // For unhandled events, we mark as ignored rather than failed
        return { type: 'ignored', reason: `Unhandled event type: ${event.type}` };
      }
    }
  }

  /**
   * Generate unique request ID
   * @returns {string} - Unique request identifier
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log request details
   * @param {Object} req - Express request object
   * @param {string} requestId - Request tracking ID
   */
  logRequestDetails(req, requestId) {
    logger.info('Webhook request received', {
      requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      contentLength: req.headers['content-length'],
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Create success response
   * @param {Object} result - Processing result
   * @param {Object} event - Stripe event object
   * @param {string} requestId - Request tracking ID
   * @param {number} totalTime - Total processing time
   * @returns {Object} - Success response
   */
  createSuccessResponse(result, event, requestId, totalTime) {
    return {
      received: true,
      eventId: event.id,
      eventType: event.type,
      processingTimeMs: totalTime,
      requestId,
      status: result.status || 'processed'
    };
  }

  /**
   * Create error response
   * @param {Error} error - Error object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Error response
   */
  createErrorResponse(error, requestId) {
    return {
      error: 'Webhook processing failed',
      code: 'PROCESSING_ERROR',
      requestId,
      message: error.message
    };
  }

  /**
   * Determine if a payment intent is for a subscription
   * @param {Object} paymentIntent - Stripe payment intent object
   * @returns {boolean} - True if this is a subscription payment
   */
  isSubscriptionPayment(paymentIntent) {
    // Check if payment intent has subscription-related metadata
    if (paymentIntent.metadata) {
      // Direct subscription indicators
      if (
        paymentIntent.metadata.subscriptionId ||
        paymentIntent.metadata.subscription_id ||
        paymentIntent.metadata.type === 'subscription' ||
        paymentIntent.metadata.payment_type === 'subscription'
      ) {
        return true;
      }

      // Company subscription indicators
      if (paymentIntent.metadata.accountType === 'company' && paymentIntent.metadata.companyId) {
        return true;
      }
    }

    // Check if payment intent is associated with a subscription
    if (paymentIntent.invoice) {
      return true; // Invoices are typically for subscriptions
    }

    // Check description for subscription keywords
    if (paymentIntent.description) {
      const description = paymentIntent.description.toLowerCase();
      if (
        description.includes('subscription') ||
        description.includes('recurring') ||
        description.includes('monthly') ||
        description.includes('yearly')
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Determine if a charge is for a subscription
   * @param {Object} charge - Stripe charge object
   * @returns {boolean} - True if this is a subscription charge
   */
  isSubscriptionCharge(charge) {
    // Check if charge has subscription-related metadata
    if (charge.metadata) {
      // Direct subscription indicators
      if (
        charge.metadata.subscriptionId ||
        charge.metadata.subscription_id ||
        charge.metadata.type === 'subscription' ||
        charge.metadata.payment_type === 'subscription'
      ) {
        return true;
      }

      // Company subscription indicators
      if (charge.metadata.accountType === 'company' && charge.metadata.companyId) {
        return true;
      }
    }

    // Check if charge is associated with an invoice (subscription billing)
    if (charge.invoice) {
      return true;
    }

    // Check if charge is associated with a payment intent that we can analyze
    if (charge.payment_intent) {
      // We would need to fetch the payment intent to check, but for now
      // we'll rely on other indicators
    }

    // Check description for subscription keywords
    if (charge.description) {
      const description = charge.description.toLowerCase();
      if (
        description.includes('subscription') ||
        description.includes('recurring') ||
        description.includes('monthly') ||
        description.includes('yearly')
      ) {
        return true;
      }
    }

    return false;
  }
}

module.exports = WebhookController;
