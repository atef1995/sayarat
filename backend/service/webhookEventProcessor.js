const { markAsPaid, toggleHighlight } = require('../dbQueries/listed_cars');
const BrevoEmailService = require('./brevoEmailService');
const logger = require('../utils/logger');

/**
 * Webhook event processors for different Stripe event types
 */
class WebhookEventProcessor {
  constructor(knex) {
    this.knex = knex;
    this.brevoEmailService = new BrevoEmailService();
  }

  /**
   * Process payment intent succeeded event
   * This method handles successful payment intents, marks listings as paid,
   * toggles highlighted status if applicable, and sends success emails.
   * @param {Object} paymentIntent - Stripe payment intent object
   * @param {string} requestId - Request tracking ID
   */
  async processPaymentSucceeded(paymentIntent, requestId) {
    const clientSecret = paymentIntent.client_secret;

    // Validate required fields
    if (!clientSecret) {
      throw new Error('Missing client_secret in payment_intent');
    }

    if (!paymentIntent.id) {
      throw new Error('Missing payment_intent id');
    }

    logger.info('Processing successful payment', {
      requestId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      clientSecret: `${clientSecret?.slice(0, 20)}...`
    });

    // Mark as paid with retry mechanism
    await this.markAsPageWithRetry(clientSecret, paymentIntent.id, requestId);

    logger.info('metadata', {
      requestId,
      metadata: paymentIntent.metadata || {}
    });
    // Toggle highlighted status if applicable
    if (paymentIntent.metadata?.items.length > 0) {
      const item = JSON.parse(paymentIntent.metadata.items)[0];
      if (item.highlight === true) {
        await this.toggleHighlightedListing(clientSecret, true, requestId);
      }
    } // Send success email (non-blocking)
    this.sendSuccessEmail(paymentIntent, requestId).catch(error => {
      logger.error('Failed to send success email', {
        requestId,
        paymentIntentId: paymentIntent.id,
        error: error.message
      });
    });

    logger.info('Listing payment processing completed successfully', {
      requestId,
      paymentIntentId: paymentIntent.id
    });
  }

  /**
   * Process payment intent failed event
   * @param {Object} failedPaymentIntent - Stripe failed payment intent object
   * @param {string} requestId - Request tracking ID
   */
  async processPaymentFailed(failedPaymentIntent, requestId) {
    if (!failedPaymentIntent.id) {
      throw new Error('Missing payment_intent id in failed payment');
    }

    logger.error('Payment failed', {
      requestId,
      paymentIntentId: failedPaymentIntent.id,
      lastPaymentError: failedPaymentIntent.last_payment_error?.message || 'Unknown error',
      amount: failedPaymentIntent.amount,
      currency: failedPaymentIntent.currency
    });

    // Send failure email (non-blocking)
    this.sendFailureEmail(failedPaymentIntent, requestId).catch(error => {
      logger.error('Failed to send failure email', {
        requestId,
        paymentIntentId: failedPaymentIntent.id,
        error: error.message
      });
    });

    return failedPaymentIntent.last_payment_error?.message || 'Payment failed';
  }

  /**
   * Process charge succeeded event
   * @param {Object} charge - Stripe charge object
   * @param {string} requestId - Request tracking ID
   */
  async processChargeSucceeded(charge, requestId) {
    logger.info('Processing charge succeeded', {
      requestId,
      chargeId: charge.id,
      amount: charge.amount,
      currency: charge.currency
    });

    // Send success email (non-blocking)
    this.sendChargeSuccessEmail(charge, requestId).catch(error => {
      logger.error('Failed to send charge success email', {
        requestId,
        chargeId: charge.id,
        error: error.message
      });
    });
  }

  /**
   * Process charge failed event
   * @param {Object} charge - Stripe failed charge object
   * @param {string} requestId - Request tracking ID
   */
  async processChargeFailed(charge, requestId) {
    if (!charge.id) {
      throw new Error('Missing charge id in failed charge');
    }

    logger.error('Charge failed', {
      requestId,
      chargeId: charge.id,
      failureCode: charge.failure_code,
      failureMessage: charge.failure_message || 'Unknown error',
      amount: charge.amount,
      currency: charge.currency
    });

    // Send failure email (non-blocking)
    this.sendChargeFailureEmail(charge, requestId).catch(error => {
      logger.error('Failed to send charge failure email', {
        requestId,
        chargeId: charge.id,
        error: error.message
      });
    });

    return charge.failure_message || 'Charge failed';
  }

  /**
   * Mark listing as paid with retry logic
   * @param {string} clientSecret - Payment intent client secret
   * @param {string} paymentIntentId - Payment intent ID
   * @param {string} requestId - Request tracking ID
   */
  async markAsPageWithRetry(clientSecret, paymentIntentId, requestId) {
    let markPaidSuccess = false;
    let markPaidRetries = 0;
    const maxMarkPaidRetries = 3;

    while (!markPaidSuccess && markPaidRetries < maxMarkPaidRetries) {
      try {
        await markAsPaid(this.knex, clientSecret);
        markPaidSuccess = true;
        logger.info('Listing marked as paid successfully', {
          requestId,
          paymentIntentId,
          clientSecret: `${clientSecret?.slice(0, 20)}...`
        });
      } catch (markPaidError) {
        markPaidRetries++;
        logger.warn('Failed to mark as paid, retrying', {
          requestId,
          paymentIntentId,
          retry: markPaidRetries,
          error: markPaidError.message
        });

        if (markPaidRetries >= maxMarkPaidRetries) {
          throw new Error(`Failed to mark as paid after ${maxMarkPaidRetries} retries: ${markPaidError.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, Math.pow(2, markPaidRetries) * 200));
      }
    }
  }

  async toggleHighlightedListing(clientSecret, isHighlighted, requestId) {
    let toggleSuccess = false;
    let toggleRetries = 0;
    const maxToggleRetries = 3;
    while (!toggleSuccess && toggleRetries < maxToggleRetries) {
      try {
        const result = await toggleHighlight(this.knex, clientSecret, isHighlighted);

        if (result === 0) {
          throw new Error(`No listing found with client secret ${clientSecret}`);
        }

        toggleSuccess = true;
        logger.info('Listing highlighted status updated successfully', {
          requestId,
          clientSecret,
          isHighlighted
        });
      } catch (toggleError) {
        toggleRetries++;
        logger.warn('Failed to update highlighted status, retrying', {
          requestId,
          clientSecret,
          retry: toggleRetries,
          error: toggleError.message
        });

        if (toggleRetries >= maxToggleRetries) {
          throw new Error(
            `Failed to update highlighted status after ${maxToggleRetries} retries: ${toggleError.message}`
          );
        }

        await new Promise(resolve => setTimeout(resolve, Math.pow(2, toggleRetries) * 200));
      }
    }
    return toggleSuccess;
  }

  /**
   * Send success email for payment intent
   * @param {Object} paymentIntent - Stripe payment intent object
   * @param {string} requestId - Request tracking ID
   */
  async sendSuccessEmail(paymentIntent, requestId) {
    if (paymentIntent.metadata?.email) {
      try {
        await this.brevoEmailService.sendPaymentSuccessEmail(paymentIntent, requestId);

        logger.info('Success email sent via Brevo', {
          requestId,
          paymentIntentId: paymentIntent.id,
          email: paymentIntent.metadata.email
        });
      } catch (emailError) {
        // Fallback to old email service
        logger.warn('Brevo email failed, falling back to old service', {
          requestId,
          paymentIntentId: paymentIntent.id,
          error: emailError.message
        });

        await this.sendSuccessEmailFallback(paymentIntent, requestId);
      }
    }
  }
  /**
   * Send failure email for payment intent
   * @param {Object} failedPaymentIntent - Stripe failed payment intent object
   * @param {string} requestId - Request tracking ID
   */
  async sendFailureEmail(failedPaymentIntent, requestId) {
    const email = failedPaymentIntent.billing_details?.email || failedPaymentIntent.metadata?.email;

    if (email) {
      try {
        await this.brevoEmailService.sendPaymentFailedEmail(failedPaymentIntent, requestId);

        logger.info('Failure email sent via Brevo', {
          requestId,
          paymentIntentId: failedPaymentIntent.id,
          email: email
        });
      } catch (emailError) {
        // Fallback to old email service
        logger.warn('Brevo email failed, falling back to old service', {
          requestId,
          paymentIntentId: failedPaymentIntent.id,
          error: emailError.message
        });

        await this.sendFailureEmailFallback(failedPaymentIntent, requestId);
      }
    }
  } /**
   * Send success email for charge
   * @param {Object} charge - Stripe charge object
   * @param {string} requestId - Request tracking ID
   */
  async sendChargeSuccessEmail(charge, requestId) {
    if (charge.billing_details?.email || charge.metadata?.email) {
      try {
        await this.brevoEmailService.sendChargeSuccessEmail(charge, requestId);

        logger.info('Charge success email sent via Brevo', {
          requestId,
          chargeId: charge.id,
          email: charge.billing_details?.email || charge.metadata?.email,
          amount: charge.amount
        });
      } catch (emailError) {
        // Fallback to old email service
        logger.warn('Brevo email failed for charge, falling back to old service', {
          requestId,
          chargeId: charge.id,
          error: emailError.message
        });

        await this.sendChargeSuccessEmailFallback(charge, requestId);
      }
    }
  }
  /**
   * Send failure email for charge
   * @param {Object} charge - Stripe failed charge object
   * @param {string} requestId - Request tracking ID
   */
  async sendChargeFailureEmail(charge, requestId) {
    if (charge.billing_details?.email || charge.metadata?.email) {
      try {
        await this.brevoEmailService.sendChargeFailedEmail(charge, requestId);

        logger.info('Charge failure email sent via Brevo', {
          requestId,
          chargeId: charge.id,
          email: charge.billing_details?.email || charge.metadata?.email
        });
      } catch (emailError) {
        // Fallback to old email service
        logger.warn('Brevo email failed for charge failure, falling back to old service', {
          requestId,
          chargeId: charge.id,
          error: emailError.message
        });

        await this.sendChargeFailureEmailFallback(charge, requestId);
      }
    }
  }
  /**
   * @deprecated Use StripeWebhookService for subscription-related payments
   * This method is kept for backward compatibility but should not be used for new subscriptions
   * Handle company subscription activation - DEPRECATED
   * @param {Object} paymentIntent - Stripe payment intent object
   * @param {string} requestId - Request tracking ID
   */
  async handleCompanyActivation(paymentIntent, requestId) {
    logger.warn('DEPRECATED: handleCompanyActivation called in WebhookEventProcessor', {
      requestId,
      paymentIntentId: paymentIntent.id,
      message: 'This method is deprecated. Use StripeWebhookService for subscription payments.'
    });

    // Check if this is a company subscription payment
    if (paymentIntent.metadata?.accountType === 'company' && paymentIntent.metadata?.companyId) {
      logger.warn('Company subscription payment detected in listing payment processor', {
        requestId,
        paymentIntentId: paymentIntent.id,
        companyId: paymentIntent.metadata.companyId,
        message: 'This should be handled by StripeWebhookService, not WebhookEventProcessor'
      });

      // Don't process - this should go through the subscription flow
      return;
    }
  }
}

module.exports = WebhookEventProcessor;
