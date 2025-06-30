const logger = require('../utils/logger');
const { SubscriptionServiceFactory } = require('./subscription');
const SubscriptionEmailService = require('./subscription/subscriptionEmailService');
const BrevoEmailService = require('./brevoEmailService');
const ReqIdGenerator = require('../utils/reqIdGenerator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Service for handling Stripe-specific webhook events
 * This service is responsible for processing subscription-related events from Stripe
 *
 * ARCHITECTURE PRINCIPLES:
 * ========================
 * 1. DEPENDENCY INJECTION: Receives Knex and Stripe instances for testability
 * 2. SINGLE RESPONSIBILITY: Handles only Stripe webhook event processing
 * 3. ERROR BOUNDARIES: Comprehensive error handling with proper logging
 * 4. MODULAR DESIGN: Each event type has its own handler method
 *
 * #TODO: Add comprehensive unit tests for all webhook handlers
 * #TODO: Implement retry mechanism for failed webhook processing
 * #TODO: Add webhook event validation and security checks
 * #TODO: Implement webhook event deduplication
 * #TODO: Add Stripe API rate limiting and error handling
 * #TODO: Implement webhook processing metrics and monitoring
 * #TODO: Add webhook signature verification for security
 */
class StripeWebhookService {
  /**
   * Initialize StripeWebhookService with dependencies
   * @param {Object} knex - Knex database instance
   * @param {Object} stripeClient - Optional Stripe client instance (defaults to module-level stripe)
   */
  constructor(knex, stripeClient = null) {
    if (!knex) {
      throw new Error('Knex instance is required for StripeWebhookService');
    }

    this.knex = knex;
    this.stripe = stripeClient || stripe; // Use injected client or module-level default

    // Validate Stripe client initialization
    if (!this.stripe) {
      throw new Error('Stripe client initialization failed - check STRIPE_SECRET_KEY environment variable');
    }

    this.subscriptionServiceFactory = new SubscriptionServiceFactory(knex);
    this.brevoEmailService = new BrevoEmailService();
    this.reqIdGenerator = new ReqIdGenerator();
  }

  /**
   * Process Stripe webhook event
   * @param {Object} event - Stripe event object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   */
  async processStripeEvent(event, requestId) {
    logger.info('Processing Stripe webhook event', {
      requestId,
      eventType: event.type,
      eventId: event.id
    });

    try {
      const result = await this._handleEventByType(event, requestId);

      logger.info('Stripe webhook event processed successfully', {
        requestId,
        eventType: event.type,
        eventId: event.id,
        result
      });

      return result;
    } catch (error) {
      logger.error('Error processing Stripe webhook event', {
        requestId,
        eventType: event.type,
        eventId: event.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Handle event based on its type
   * @param {Object} event - Stripe event object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleEventByType(event, requestId) {
    logger.info('Handling Stripe event', {
      requestId,
      eventType: event.type,
      eventId: event.id
    });
    switch (event.type) {
      case 'checkout.session.completed':
        return await this._handleCheckoutSessionCompleted(event.data.object, requestId);

      case 'customer.subscription.created':
        return await this._handleSubscriptionCreated(event.data.object, requestId);

      case 'customer.subscription.updated':
        return await this._handleSubscriptionUpdated(event.data.object, requestId);
      case 'customer.subscription.deleted':
        return await this._handleSubscriptionDeleted(event.data.object, requestId);

      case 'customer.subscription.pending_update_applied':
        return await this._handleSubscriptionPendingUpdateApplied(event.data.object, requestId);

      case 'customer.subscription.pending_update_expired':
        return await this._handleSubscriptionPendingUpdateExpired(event.data.object, requestId);

      case 'customer.subscription.trial_will_end':
        return await this._handleSubscriptionTrialWillEnd(event.data.object, requestId);

      // Payment intent events for subscription payments
      case 'payment_intent.succeeded':
        return await this._handleSubscriptionPaymentSucceeded(event.data.object, requestId);

      case 'payment_intent.payment_failed':
        return await this._handleSubscriptionPaymentFailed(event.data.object, requestId);

      // Charge events for subscription payments
      case 'charge.succeeded':
        return await this._handleSubscriptionChargeSucceeded(event.data.object, requestId);

      case 'charge.failed':
        return await this._handleSubscriptionChargeFailed(event.data.object, requestId);

      case 'invoice.payment_succeeded':
        return await this._handleInvoicePaymentSucceeded(event.data.object, requestId);

      case 'invoice.payment_failed':
        return await this._handleInvoicePaymentFailed(event.data.object, requestId);

      // Additional invoice events for comprehensive webhook coverage
      case 'invoice.finalized':
        return await this._handleInvoiceFinalized(event.data.object, requestId);

      case 'invoice.updated':
        return await this._handleInvoiceUpdated(event.data.object, requestId);

      case 'invoice.paid':
        return await this._handleInvoicePaid(event.data.object, requestId);

      case 'invoice_payment.paid':
        return await this._handleInvoicePaymentPaid(event.data.object, requestId);

      default:
        logger.warn('Unhandled Stripe event type', {
          requestId,
          eventType: event.type,
          eventId: event.id
        });
        return {
          type: 'ignored',
          reason: `Unhandled Stripe event type: ${event.type}`
        };
    }
  }

  /**
   * Handle checkout session completed event
   * @param {Object} session - Stripe checkout session object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleCheckoutSessionCompleted(session, requestId) {
    logger.info('Processing checkout session completed', {
      requestId,
      sessionId: session.id,
      customerId: session.customer,
      subscriptionId: session.subscription
    });

    try {
      // Handle subscription creation if subscription exists
      if (session.subscription) {
        await this._processSubscriptionFromSession(session, requestId);
      }

      // Handle one-time payment if no subscription
      if (!session.subscription && session.payment_intent) {
        await this._processOneTimePayment(session, requestId);
      }

      return {
        type: 'checkout_completed',
        sessionId: session.id,
        hasSubscription: !!session.subscription,
        hasPayment: !!session.payment_intent
      };
    } catch (error) {
      logger.error('Error handling checkout session completed', {
        requestId,
        sessionId: session.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle subscription created event
   * @param {Object} subscription - Stripe subscription object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */ async _handleSubscriptionCreated(subscription, requestId) {
    logger.info('Processing subscription created', {
      requestId,
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status
    });

    // Debug log subscription data for timestamp issues
    this._debugLogSubscriptionData(subscription, requestId, 'subscription_created');
    try {
      // Safely extract period dates
      const periodDates = this._extractSafePeriodDates(subscription);

      // Try to find user ID by customer ID
      const userId = await this._findUserByCustomerId(subscription.customer, requestId);

      // Extract plan_id with additional validation and logging
      const planId = subscription.items?.data?.[0]?.price?.id;
      if (!planId) {
        logger.warn('No plan_id found in subscription - this may cause issues with plan matching', {
          requestId,
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          subscriptionItems: subscription.items?.data?.length || 0,
          firstItem: subscription.items?.data?.[0]
            ? {
              id: subscription.items.data[0].id,
              price: subscription.items.data[0].price
                ? {
                  id: subscription.items.data[0].price.id,
                  product: subscription.items.data[0].price.product
                }
                : null
            }
            : null
        });
      } else {
        logger.info('Plan ID extracted successfully from subscription', {
          requestId,
          subscriptionId: subscription.id,
          planId
        });
      }

      const subscriptionData = {
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscription.status,
        plan_id: planId, // Use the validated plan_id
        metadata: JSON.stringify(subscription.metadata || {})
      }; // Add seller_id if found
      if (userId) {
        subscriptionData.seller_id = userId;
      } else {
        logger.warn('No user ID found for subscription - checking if this is a company subscription', {
          requestId,
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          metadata: subscription.metadata
        });

        // If this is a company subscription, handle differently
        if (subscription.metadata?.accountType === 'company') {
          logger.info('Company subscription detected - skipping user subscription creation', {
            requestId,
            subscriptionId: subscription.id
          });
          // Don't create user subscription for companies
          return {
            type: 'company_subscription_skipped',
            subscriptionId: subscription.id,
            reason: 'Company subscriptions handled separately'
          };
        } // For individual users without seller_id, we can't proceed
        logger.error('Cannot create subscription: seller_id required but not found for individual user', {
          requestId,
          subscriptionId: subscription.id,
          customerId: subscription.customer
        });

        throw new Error(
          `Cannot create subscription ${subscription.id}: seller_id is required but customer ${subscription.customer} not found in users table`
        );
      }

      // Only add dates if they are valid
      if (periodDates.current_period_start) {
        subscriptionData.current_period_start = periodDates.current_period_start;
      }
      if (periodDates.current_period_end) {
        subscriptionData.current_period_end = periodDates.current_period_end;
      }

      await this.subscriptionServiceFactory.createOrUpdateSubscription(subscriptionData);

      // Send welcome email only for active subscriptions
      // Incomplete subscriptions will trigger welcome email when they become active via subscription.updated webhook
      if (subscription.status === 'active') {
        try {
          await this._sendSubscriptionWelcomeEmail(subscription, userId, requestId);
          logger.info('Welcome email queued for active subscription', {
            requestId,
            subscriptionId: subscription.id,
            userId,
            status: subscription.status
          });
        } catch (emailError) {
          // Don't fail the webhook if email fails, just log the error
          logger.error('Failed to send subscription welcome email', {
            requestId,
            subscriptionId: subscription.id,
            userId,
            error: emailError.message
          });
        }
      } else {
        logger.info('Skipping welcome email for non-active subscription', {
          requestId,
          subscriptionId: subscription.id,
          status: subscription.status,
          note: 'Welcome email will be sent when subscription becomes active'
        });
      }

      return {
        type: 'subscription_created',
        subscriptionId: subscription.id,
        status: subscription.status
      };
    } catch (error) {
      logger.error('Error handling subscription created', {
        requestId,
        subscriptionId: subscription.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle subscription updated event
   * @param {Object} subscription - Stripe subscription object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */ async _handleSubscriptionUpdated(subscription, requestId) {
    logger.info('Processing subscription updated', {
      requestId,
      subscriptionId: subscription.id,
      status: subscription.status
    });

    // Debug log subscription data for timestamp issues
    this._debugLogSubscriptionData(subscription, requestId, 'subscription_updated');
    try {
      // Safely extract period dates
      const periodDates = this._extractSafePeriodDates(subscription);

      // Extract plan_id with additional validation and logging
      const planId = subscription.items?.data?.[0]?.price?.id;
      if (!planId) {
        logger.warn('No plan_id found in subscription update - this may cause issues with plan matching', {
          requestId,
          subscriptionId: subscription.id,
          subscriptionItems: subscription.items?.data?.length || 0,
          firstItem: subscription.items?.data?.[0]
            ? {
              id: subscription.items.data[0].id,
              price: subscription.items.data[0].price
                ? {
                  id: subscription.items.data[0].price.id,
                  product: subscription.items.data[0].price.product
                }
                : null
            }
            : null
        });
      } else {
        logger.info('Plan ID extracted successfully from subscription update', {
          requestId,
          subscriptionId: subscription.id,
          planId
        });
      }
      const additionalData = {
        plan_id: planId, // Use the validated plan_id
        metadata: JSON.stringify(subscription.metadata || {})
      };

      // Handle cancellation scenarios
      if (subscription.cancel_at_period_end) {
        additionalData.cancel_at_period_end = true;
        additionalData.cancel_at = subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null;

        logger.info('Subscription set to cancel at period end', {
          requestId,
          subscriptionId: subscription.id,
          cancelAt: additionalData.cancel_at,
          currentPeriodEnd: periodDates.current_period_end
        });
      } else if (subscription.cancel_at_period_end === false) {
        // Subscription was reactivated
        additionalData.cancel_at_period_end = false;
        additionalData.cancel_at = null;

        logger.info('Subscription cancellation was reversed - subscription reactivated', {
          requestId,
          subscriptionId: subscription.id,
          status: subscription.status
        });
      }

      // Track cancellation details if present
      if (subscription.canceled_at) {
        additionalData.canceled_at = new Date(subscription.canceled_at * 1000);
      }

      // Only add dates if they are valid
      if (periodDates.current_period_start) {
        additionalData.current_period_start = periodDates.current_period_start;
      }
      if (periodDates.current_period_end) {
        additionalData.current_period_end = periodDates.current_period_end;
      }

      await this.subscriptionServiceFactory
        .getCoreService()
        .updateSubscriptionStatus(subscription.id, subscription.status, additionalData);

      // Check if subscription just became active and send welcome email
      if (subscription.status === 'active') {
        try {
          // Get existing subscription to check if this is a status change from incomplete to active
          const existingSubscription = await this.subscriptionServiceFactory
            .getCoreService()
            .getSubscriptionByStripeId(subscription.id);
          const wasIncomplete =
            existingSubscription &&
            (existingSubscription.status === 'incomplete' || existingSubscription.status === 'incomplete_expired');

          if (wasIncomplete) {
            // Find user ID for the subscription
            const userId = await this._findUserByCustomerId(subscription.customer, requestId);

            if (userId) {
              await this._sendSubscriptionWelcomeEmail(subscription, userId, requestId);
              logger.info('Welcome email sent for newly activated subscription', {
                requestId,
                subscriptionId: subscription.id,
                userId,
                previousStatus: existingSubscription.status,
                newStatus: subscription.status
              });
            }
          }
        } catch (emailError) {
          // Don't fail the webhook if email fails, just log the error
          logger.error('Failed to send welcome email for activated subscription', {
            requestId,
            subscriptionId: subscription.id,
            error: emailError.message
          });
        }
      }

      return {
        type: 'subscription_updated',
        subscriptionId: subscription.id,
        status: subscription.status
      };
    } catch (error) {
      logger.error('Error handling subscription updated', {
        requestId,
        subscriptionId: subscription.id,
        error: error.message
      });
      throw error;
    }
  }
  /**
   * Handle subscription deleted event
   *
   * This event is fired when:
   * 1. A subscription is immediately canceled (cancel_at_period_end = false)
   * 2. A subscription reaches its cancel_at time and is actually canceled
   * 3. A subscription is deleted due to unpaid invoices
   *
   * @param {Object} subscription - Stripe subscription object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleSubscriptionDeleted(subscription, requestId) {
    logger.info('Processing subscription deleted', {
      requestId,
      subscriptionId: subscription.id,
      status: subscription.status,
      canceledAt: subscription.canceled_at,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: subscription.current_period_end
    });

    try {
      // Get the existing subscription to check previous state
      const existingSubscription = await this.subscriptionServiceFactory
        .getCoreService()
        .getSubscriptionByStripeId(subscription.id);

      if (!existingSubscription) {
        logger.warn('Subscription not found in database for deletion event', {
          requestId,
          subscriptionId: subscription.id
        });
        return {
          type: 'subscription_deleted',
          subscriptionId: subscription.id,
          status: 'not_found'
        };
      }

      // Determine cancellation reason based on Stripe data
      let cancellationReason = 'user_requested';
      let cancellationMetadata = {};

      if (subscription.metadata?.cancellation_reason) {
        cancellationReason = subscription.metadata.cancellation_reason;
      } else if (subscription.status === 'unpaid') {
        cancellationReason = 'unpaid_invoices';
      } else if (subscription.canceled_at && subscription.cancel_at_period_end) {
        cancellationReason = 'end_of_period';
      }

      // Prepare cancellation metadata
      cancellationMetadata = {
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : new Date(),
        cancellation_reason: cancellationReason,
        final_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
        was_cancel_at_period_end: subscription.cancel_at_period_end || false,
        stripe_status_at_deletion: subscription.status,
        ...subscription.metadata
      };

      // Update subscription status to canceled
      await this.subscriptionServiceFactory.getCoreService().updateSubscriptionStatus(subscription.id, 'canceled', {
        canceled_at: cancellationMetadata.canceled_at,
        metadata: JSON.stringify(cancellationMetadata)
      });

      // Get seller_id from subscription for premium status update
      const seller_id = existingSubscription.seller_id;

      if (seller_id) {
        // Update user premium status - remove premium access
        await this._updateUserPremiumStatus(seller_id, false);

        // Check if user has any other active subscriptions before removing premium
        const otherActiveSubscriptions = await this.knex('user_subscriptions')
          .where('seller_id', seller_id)
          .where('status', 'active')
          .whereNot('id', existingSubscription.id);

        if (otherActiveSubscriptions.length === 0) {
          logger.info('Removing premium status - no other active subscriptions found', {
            requestId,
            sellerId: seller_id,
            canceledSubscriptionId: subscription.id
          });
        } else {
          logger.info('User still has active subscriptions - maintaining premium status', {
            requestId,
            sellerId: seller_id,
            activeSubscriptionsCount: otherActiveSubscriptions.length
          });

          // Keep premium status since user has other active subscriptions
          await this._updateUserPremiumStatus(seller_id, true);
        }
      }

      // Log detailed cancellation information
      logger.info('Subscription cancellation processed successfully', {
        requestId,
        subscriptionId: subscription.id,
        sellerId: seller_id,
        cancellationReason,
        canceledAt: cancellationMetadata.canceled_at,
        hadOtherActiveSubscriptions: seller_id
          ? (
            await this.knex('user_subscriptions')
              .where('seller_id', seller_id)
              .where('status', 'active')
              .whereNot('id', existingSubscription.id)
          ).length > 0
          : false
      });

      return {
        type: 'subscription_deleted',
        subscriptionId: subscription.id,
        sellerId: seller_id,
        cancellationReason,
        status: 'processed'
      };
    } catch (error) {
      logger.error('Error handling subscription deleted', {
        requestId,
        subscriptionId: subscription.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Handle subscription pending update applied event
   * This event is fired when a pending update to a subscription is applied
   * @param {Object} subscription - Stripe subscription object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleSubscriptionPendingUpdateApplied(subscription, requestId) {
    logger.info('Processing subscription pending update applied', {
      requestId,
      subscriptionId: subscription.id,
      status: subscription.status
    });

    try {
      // Extract plan_id and period dates
      const periodDates = this._extractSafePeriodDates(subscription);
      const planId = subscription.items?.data?.[0]?.price?.id;

      const updateData = {
        plan_id: planId,
        metadata: JSON.stringify(subscription.metadata || {}),
        updated_at: new Date()
      };

      // Add period dates if valid
      if (periodDates.current_period_start) {
        updateData.current_period_start = periodDates.current_period_start;
      }
      if (periodDates.current_period_end) {
        updateData.current_period_end = periodDates.current_period_end;
      }

      await this.subscriptionServiceFactory
        .getCoreService()
        .updateSubscriptionStatus(subscription.id, subscription.status, updateData);

      return {
        type: 'subscription_pending_update_applied',
        subscriptionId: subscription.id,
        status: subscription.status
      };
    } catch (error) {
      logger.error('Error handling subscription pending update applied', {
        requestId,
        subscriptionId: subscription.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle subscription pending update expired event
   * This event is fired when a pending update to a subscription expires
   * @param {Object} subscription - Stripe subscription object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleSubscriptionPendingUpdateExpired(subscription, requestId) {
    logger.info('Processing subscription pending update expired', {
      requestId,
      subscriptionId: subscription.id,
      status: subscription.status
    });

    try {
      // Log the expired update for audit purposes
      const metadata = {
        ...subscription.metadata,
        pending_update_expired_at: new Date(),
        pending_update_expired_reason: 'Pending update expired without being applied'
      };

      await this.subscriptionServiceFactory
        .getCoreService()
        .updateSubscriptionStatus(subscription.id, subscription.status, {
          metadata,
          updated_at: new Date()
        });

      return {
        type: 'subscription_pending_update_expired',
        subscriptionId: subscription.id,
        status: subscription.status
      };
    } catch (error) {
      logger.error('Error handling subscription pending update expired', {
        requestId,
        subscriptionId: subscription.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle subscription trial will end event
   * This event is fired 3 days before a trial period ends
   * @param {Object} subscription - Stripe subscription object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleSubscriptionTrialWillEnd(subscription, requestId) {
    logger.info('Processing subscription trial will end', {
      requestId,
      subscriptionId: subscription.id,
      trialEnd: subscription.trial_end,
      status: subscription.status
    });

    try {
      // Update metadata to track trial ending notification
      const metadata = {
        ...subscription.metadata,
        trial_will_end_notified_at: new Date(),
        trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
      };

      await this.subscriptionServiceFactory
        .getCoreService()
        .updateSubscriptionStatus(subscription.id, subscription.status, {
          metadata,
          updated_at: new Date()
        });

      // #TODO: Send trial ending notification to user
      // #TODO: Consider offering special trial extension or discount

      return {
        type: 'subscription_trial_will_end',
        subscriptionId: subscription.id,
        trialEndDate: metadata.trial_end_date,
        status: subscription.status
      };
    } catch (error) {
      logger.error('Error handling subscription trial will end', {
        requestId,
        subscriptionId: subscription.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle invoice payment succeeded event
   * @param {Object} invoice - Stripe invoice object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleInvoicePaymentSucceeded(invoice, requestId) {
    logger.info('Processing invoice payment succeeded', {
      requestId,
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      amountPaid: invoice.amount_paid
    });

    try {
      if (invoice.subscription) {
        // Try to record payment, but don't fail if it doesn't work (e.g., for company subscriptions)
        try {
          await this.subscriptionServiceFactory.getPaymentService().recordPayment({
            stripe_subscription_id: invoice.subscription,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'succeeded',
            paid_at: new Date(invoice.status_transitions.paid_at * 1000)
          });
        } catch (paymentError) {
          logger.warn('Payment recording failed, but continuing with company activation', {
            requestId,
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
            error: paymentError.message
          });
        }

        // Check if this is a company subscription and update company status
        await this._handleCompanySubscriptionActivation(invoice.subscription, requestId);
      }

      return {
        type: 'invoice_payment_succeeded',
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
        amount: invoice.amount_paid
      };
    } catch (error) {
      logger.error('Error handling invoice payment succeeded', {
        requestId,
        invoiceId: invoice.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle invoice payment failed event
   * @param {Object} invoice - Stripe invoice object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleInvoicePaymentFailed(invoice, requestId) {
    logger.info('Processing invoice payment failed', {
      requestId,
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      attemptCount: invoice.attempt_count
    });

    try {
      if (invoice.subscription) {
        await this.subscriptionServiceFactory.getPaymentService().recordPayment({
          stripe_subscription_id: invoice.subscription,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: 'failed',
          failed_at: new Date()
        });

        // Handle subscription status based on payment failure
        if (invoice.attempt_count >= 3) {
          await this.subscriptionServiceFactory
            .getCoreService()
            .updateSubscriptionStatus(invoice.subscription, 'past_due', { payment_failed_at: new Date() });
        }
      }

      return {
        type: 'invoice_payment_failed',
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
        attemptCount: invoice.attempt_count
      };
    } catch (error) {
      logger.error('Error handling invoice payment failed', {
        requestId,
        invoiceId: invoice.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle invoice finalized event
   * @param {Object} invoice - Stripe invoice object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleInvoiceFinalized(invoice, requestId) {
    logger.info('Processing invoice finalized', {
      requestId,
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      status: invoice.status
    });

    try {
      // Invoice finalized means it's ready for payment
      // We can track this for billing analytics
      if (invoice.subscription) {
        // #TODO: Add invoice finalization tracking for billing analytics
        logger.info('Invoice finalized for subscription', {
          requestId,
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          amountDue: invoice.amount_due,
          dueDate: invoice.due_date
        });
      }

      return {
        type: 'invoice_finalized',
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
        amountDue: invoice.amount_due
      };
    } catch (error) {
      logger.error('Error handling invoice finalized', {
        requestId,
        invoiceId: invoice.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle invoice updated event
   * @param {Object} invoice - Stripe invoice object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleInvoiceUpdated(invoice, requestId) {
    logger.info('Processing invoice updated', {
      requestId,
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      status: invoice.status
    });

    try {
      // Track invoice updates for audit purposes
      if (invoice.subscription) {
        // #TODO: Add invoice update tracking for billing audit trail
        logger.info('Invoice updated for subscription', {
          requestId,
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          status: invoice.status,
          amountDue: invoice.amount_due
        });
      }

      return {
        type: 'invoice_updated',
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
        status: invoice.status
      };
    } catch (error) {
      logger.error('Error handling invoice updated', {
        requestId,
        invoiceId: invoice.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle invoice paid event
   * @param {Object} invoice - Stripe invoice object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleInvoicePaid(invoice, requestId) {
    logger.info('Processing invoice paid', {
      requestId,
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      amountPaid: invoice.amount_paid
    });

    try {
      // This is similar to invoice.payment_succeeded but may have different timing
      if (invoice.subscription) {
        await this.subscriptionServiceFactory.getPaymentService().recordPayment({
          stripe_subscription_id: invoice.subscription,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'succeeded',
          paid_at: new Date(invoice.status_transitions.paid_at * 1000)
        });

        // Ensure subscription is active
        await this.subscriptionServiceFactory.getCoreService().updateSubscriptionStatus(invoice.subscription, 'active');
      }

      return {
        type: 'invoice_paid',
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
        amount: invoice.amount_paid
      };
    } catch (error) {
      logger.error('Error handling invoice paid', {
        requestId,
        invoiceId: invoice.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle invoice payment paid event (different from invoice.paid)
   * @param {Object} invoicePayment - Stripe invoice payment object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleInvoicePaymentPaid(invoicePayment, requestId) {
    logger.info('Processing invoice payment paid', {
      requestId,
      invoicePaymentId: invoicePayment.id,
      invoiceId: invoicePayment.invoice
    });

    try {
      // Safety check: Ensure Stripe client is initialized
      if (!this.stripe) {
        throw new Error('Stripe client not initialized');
      }

      // Retrieve the full invoice to get subscription information
      const invoice = await this.stripe.invoices.retrieve(invoicePayment.invoice);

      logger.info('Retrieved invoice for payment processing', {
        requestId,
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
        amountPaid: invoice.amount_paid,
        status: invoice.status
      });

      // Process subscription update if this invoice has a subscription
      if (invoice.subscription && invoice.status === 'paid') {
        // Record the payment
        await this.subscriptionServiceFactory.getPaymentService().recordPayment({
          stripe_subscription_id: invoice.subscription,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'succeeded',
          paid_at: new Date(invoice.status_transitions.paid_at * 1000)
        });

        // Fetch the latest subscription data from Stripe to get updated period dates
        const stripeSubscription = await this.stripe.subscriptions.retrieve(invoice.subscription);

        logger.info('Retrieved subscription for period update', {
          requestId,
          subscriptionId: stripeSubscription.id,
          status: stripeSubscription.status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
        });

        // Use the new sync method to ensure all subscription data is current
        await this.subscriptionServiceFactory
          .getCoreService()
          .syncSubscriptionWithStripe(stripeSubscription.id, this.stripe);

        logger.info('Subscription synced with Stripe after payment', {
          requestId,
          subscriptionId: stripeSubscription.id,
          status: stripeSubscription.status,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
        });
      }

      logger.info('Invoice payment paid event processed', {
        requestId,
        invoicePaymentId: invoicePayment.id,
        invoiceId: invoicePayment.invoice,
        status: invoicePayment.status
      });

      return {
        type: 'invoice_payment_paid',
        invoicePaymentId: invoicePayment.id,
        invoiceId: invoicePayment.invoice
      };
    } catch (error) {
      logger.error('Error handling invoice payment paid', {
        requestId,
        invoicePaymentId: invoicePayment.id,
        error: error.message
      });
      throw error;
    }
  }
  /**
   * Process subscription from checkout session
   * @param {Object} session - Stripe checkout session object
   * @param {string} requestId - Request tracking ID
   * @private
   */ async _processSubscriptionFromSession(session, requestId) {
    try {
      // Extract metadata to determine account type and processing strategy
      const accountType = session.metadata?.accountType || 'individual';
      const isCompanySubscription = session.metadata?.isCompanySubscription === 'true' || accountType === 'company';
      const companyId = session.metadata?.companyId;

      logger.info('Processing subscription from session', {
        requestId,
        sessionId: session.id,
        subscriptionId: session.subscription,
        accountType,
        isCompanySubscription,
        companyId
      });

      // Handle company subscriptions with enhanced logic
      if (isCompanySubscription) {
        await this._processCompanySubscriptionFromSession(session, requestId);
        return;
      }

      // Extract user ID from session for individual subscriptions
      const userId = await this._extractUserIdFromSession(session, requestId);

      // For individual users, seller_id is required
      if (!userId) {
        logger.error('Cannot create subscription: seller_id is required but not found', {
          requestId,
          sessionId: session.id,
          subscriptionId: session.subscription,
          customerId: session.customer
        });

        // Don't throw an error - log and skip subscription creation
        // The subscription will be created later when the subscription.created event fires
        logger.warn('Deferring subscription creation to subscription.created event', {
          requestId,
          sessionId: session.id,
          subscriptionId: session.subscription
        });
        return;
      }

      const subscriptionData = {
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        stripe_checkout_session_id: session.id,
        seller_id: userId,
        status: 'active', // Checkout session completed means active
        metadata: JSON.stringify({
          ...(session.metadata || {}),
          accountType: 'individual'
        })
      };

      await this.subscriptionServiceFactory.createOrUpdateSubscription(subscriptionData);

      logger.info('Individual subscription processed from checkout session', {
        requestId,
        sessionId: session.id,
        subscriptionId: session.subscription,
        userId: userId
      });
    } catch (error) {
      logger.error('Error processing subscription from session', {
        requestId,
        sessionId: session.id,
        subscriptionId: session.subscription,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process company subscription from checkout session
   * @param {Object} session - Stripe checkout session object
   * @param {string} requestId - Request tracking ID
   * @private
   */
  async _processCompanySubscriptionFromSession(session, requestId) {
    try {
      const companyId = session.metadata?.companyId;
      const userId = session.metadata?.userId;

      if (!companyId) {
        logger.error('Company subscription requires companyId in metadata', {
          requestId,
          sessionId: session.id,
          subscriptionId: session.subscription
        });
        throw new Error('Missing companyId for company subscription');
      }

      // Implement company subscription activation logic
      logger.info('Company subscription processing initiated', {
        requestId,
        sessionId: session.id,
        subscriptionId: session.subscription,
        companyId,
        userId
      });

      // 1. Update company subscription status in companies table
      await this._updateCompanySubscriptionStatus(companyId, session, requestId);

      // #TODO: 2. Setting subscription permissions for company members
      // #TODO: 3. Sending activation emails to company administrators

      // For now, create a subscription record for the user who initiated the company subscription
      if (userId) {
        const subscriptionData = {
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          stripe_checkout_session_id: session.id,
          seller_id: userId,
          status: 'active',
          metadata: JSON.stringify({
            ...(session.metadata || {}),
            accountType: 'company',
            companyId: companyId,
            isCompanySubscription: true
          })
        };

        await this.subscriptionServiceFactory.createOrUpdateSubscription(subscriptionData);

        logger.info('Company subscription record created for initiating user', {
          requestId,
          sessionId: session.id,
          subscriptionId: session.subscription,
          companyId,
          userId
        });
      }

      return {
        type: 'company_subscription_processed',
        sessionId: session.id,
        subscriptionId: session.subscription,
        companyId
      };
    } catch (error) {
      logger.error('Error processing company subscription from session', {
        requestId,
        sessionId: session.id,
        subscriptionId: session.subscription,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process one-time payment from checkout session
   * @param {Object} session - Stripe checkout session object
   * @param {string} requestId - Request tracking ID
   * @private
   */
  async _processOneTimePayment(session, requestId) {
    try {
      await this.subscriptionServiceFactory.getPaymentService().recordPayment({
        stripe_payment_intent_id: session.payment_intent,
        stripe_customer_id: session.customer,
        stripe_checkout_session_id: session.id,
        amount: session.amount_total,
        currency: session.currency,
        status: 'succeeded',
        paid_at: new Date(),
        metadata: JSON.stringify(session.metadata || {})
      });

      logger.info('One-time payment processed from checkout session', {
        requestId,
        sessionId: session.id,
        paymentIntentId: session.payment_intent
      });
    } catch (error) {
      logger.error('Error processing one-time payment from session', {
        requestId,
        sessionId: session.id,
        paymentIntentId: session.payment_intent,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle subscription payment intent succeeded event
   * @param {Object} paymentIntent - Stripe payment intent object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleSubscriptionPaymentSucceeded(paymentIntent, requestId) {
    logger.info('Processing subscription payment succeeded', {
      requestId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });

    try {
      // Record the successful payment
      await this.subscriptionServiceFactory.getPaymentService().recordPayment({
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: paymentIntent.customer,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'succeeded',
        paid_at: new Date(),
        metadata: JSON.stringify(paymentIntent.metadata || {})
      });

      // If this is for a company subscription, handle activation
      if (paymentIntent.metadata?.accountType === 'company' && paymentIntent.metadata?.companyId) {
        await this._handleCompanySubscriptionActivation(paymentIntent, requestId);
      }

      logger.info('Subscription payment succeeded processed successfully', {
        requestId,
        paymentIntentId: paymentIntent.id
      });

      return {
        type: 'subscription_payment_succeeded',
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount
      };
    } catch (error) {
      logger.error('Error processing subscription payment succeeded', {
        requestId,
        paymentIntentId: paymentIntent.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle subscription payment intent failed event
   * @param {Object} paymentIntent - Stripe payment intent object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleSubscriptionPaymentFailed(paymentIntent, requestId) {
    logger.error('Processing subscription payment failed', {
      requestId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      lastPaymentError: paymentIntent.last_payment_error?.message
    });

    try {
      // Record the failed payment
      await this.subscriptionServiceFactory.getPaymentService().recordPayment({
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: paymentIntent.customer,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'failed',
        failed_at: new Date(),
        failure_reason: paymentIntent.last_payment_error?.message || 'Unknown error',
        metadata: JSON.stringify(paymentIntent.metadata || {})
      });

      logger.info('Subscription payment failed recorded', {
        requestId,
        paymentIntentId: paymentIntent.id
      });

      return {
        type: 'subscription_payment_failed',
        paymentIntentId: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message || 'Unknown error'
      };
    } catch (error) {
      logger.error('Error processing subscription payment failed', {
        requestId,
        paymentIntentId: paymentIntent.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle subscription charge succeeded event
   * @param {Object} charge - Stripe charge object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleSubscriptionChargeSucceeded(charge, requestId) {
    logger.info('Processing subscription charge succeeded', {
      requestId,
      chargeId: charge.id,
      paymentIntentId: charge.payment_intent,
      amount: charge.amount,
      currency: charge.currency
    });

    try {
      // Update the payment record with charge information
      if (charge.payment_intent) {
        await this.subscriptionServiceFactory.getPaymentService().updatePaymentWithCharge(charge.payment_intent, {
          stripe_charge_id: charge.id,
          charged_at: new Date(),
          charge_status: 'succeeded'
        });
      }

      logger.info('Subscription charge succeeded processed successfully', {
        requestId,
        chargeId: charge.id
      });

      return {
        type: 'subscription_charge_succeeded',
        chargeId: charge.id,
        paymentIntentId: charge.payment_intent
      };
    } catch (error) {
      logger.error('Error processing subscription charge succeeded', {
        requestId,
        chargeId: charge.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle subscription charge failed event
   * @param {Object} charge - Stripe charge object
   * @param {string} requestId - Request tracking ID
   * @returns {Object} - Processing result
   * @private
   */
  async _handleSubscriptionChargeFailed(charge, requestId) {
    logger.error('Processing subscription charge failed', {
      requestId,
      chargeId: charge.id,
      paymentIntentId: charge.payment_intent,
      amount: charge.amount,
      currency: charge.currency,
      failureMessage: charge.failure_message
    });

    try {
      // Update the payment record with charge failure information
      if (charge.payment_intent) {
        await this.subscriptionServiceFactory.getPaymentService().updatePaymentWithCharge(charge.payment_intent, {
          stripe_charge_id: charge.id,
          charge_failed_at: new Date(),
          charge_status: 'failed',
          charge_failure_reason: charge.failure_message || 'Unknown charge failure'
        });
      }

      logger.info('Subscription charge failed recorded', {
        requestId,
        chargeId: charge.id
      });

      return {
        type: 'subscription_charge_failed',
        chargeId: charge.id,
        paymentIntentId: charge.payment_intent,
        error: charge.failure_message || 'Unknown charge failure'
      };
    } catch (error) {
      logger.error('Error processing subscription charge failed', {
        requestId,
        chargeId: charge.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle company subscription activation
   * @param {Object} paymentIntent - Stripe payment intent object
   * @param {string} requestId - Request tracking ID
   * @private
   */
  async _handleCompanySubscriptionActivation(paymentIntent, requestId) {
    try {
      const companyId = paymentIntent.metadata.companyId;
      const subscriptionId = paymentIntent.metadata.subscriptionId;

      logger.info('Processing company subscription activation', {
        requestId,
        companyId,
        subscriptionId,
        paymentIntentId: paymentIntent.id
      });

      // TODO: Implement company activation logic
      // const CompanyRegistrationService = require('./authentication/companyRegistrationService');
      // const companyService = new CompanyRegistrationService(this.knex);
      // await companyService.activateCompanySubscription(companyId, subscriptionId);

      // For now, just log the activation
      logger.info('Company subscription activation completed', {
        requestId,
        companyId,
        subscriptionId
      });
    } catch (error) {
      logger.error('Failed to process company subscription activation', {
        requestId,
        companyId: paymentIntent.metadata?.companyId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Debug log Stripe subscription data for timestamp issues
   * @param {Object} subscription - Stripe subscription object
   * @param {string} requestId - Request tracking ID
   * @param {string} eventType - Event type for context
   * @private
   */
  _debugLogSubscriptionData(subscription, requestId, eventType) {
    if (!subscription) {
      logger.warn('No subscription data provided for debugging', { requestId, eventType });
      return;
    }

    const debugData = {
      requestId,
      eventType,
      subscriptionId: subscription.id,
      status: subscription.status,
      current_period_start: {
        value: subscription.current_period_start,
        type: typeof subscription.current_period_start,
        isNumber: typeof subscription.current_period_start === 'number',
        isValidNumber:
          typeof subscription.current_period_start === 'number' && !isNaN(subscription.current_period_start),
        converted: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null
      },
      current_period_end: {
        value: subscription.current_period_end,
        type: typeof subscription.current_period_end,
        isNumber: typeof subscription.current_period_end === 'number',
        isValidNumber: typeof subscription.current_period_end === 'number' && !isNaN(subscription.current_period_end),
        converted: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null
      }
    };

    logger.info('🔍 DEBUG: Stripe subscription timestamp data', debugData);
  }

  /**
   * Find user ID by Stripe customer ID
   * @param {string} stripeCustomerId - Stripe customer ID
   * @param {string} requestId - Request tracking ID for logging
   * @returns {Promise<string|null>} - User ID or null if not found
   * @private
   */
  async _findUserByCustomerId(stripeCustomerId, requestId) {
    try {
      if (!stripeCustomerId) {
        logger.warn('No Stripe customer ID provided for user lookup', { requestId });
        return null;
      }

      // Try to find user in sellers table by Stripe customer ID
      const user = await this.knex('sellers').select('id').where('stripe_customer_id', stripeCustomerId).first();

      if (user) {
        logger.info('Found user by Stripe customer ID', {
          requestId,
          stripeCustomerId,
          userId: user.id
        });
        return user.id;
      }

      // If not found in sellers, try companies table
      const company = await this.knex('companies').select('id').where('stripe_customer_id', stripeCustomerId).first();

      if (company) {
        logger.info('Found company by Stripe customer ID', {
          requestId,
          stripeCustomerId,
          companyId: company.id
        });
        // For companies, we might want to use a different approach
        // For now, return null and handle this case separately
        return null;
      }

      logger.warn('No user found for Stripe customer ID', {
        requestId,
        stripeCustomerId
      });
      return null;
    } catch (error) {
      logger.error('Error finding user by Stripe customer ID', {
        requestId,
        stripeCustomerId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Extract user ID from session metadata or lookup by customer ID
   * @param {Object} session - Stripe checkout session object
   * @param {string} requestId - Request tracking ID
   * @returns {Promise<string|null>} - User ID or null if not found
   * @private
   */
  async _extractUserIdFromSession(session, requestId) {
    try {
      // First, check if user_id is in session metadata
      if (session.metadata?.user_id) {
        logger.info('Found user ID in session metadata', {
          requestId,
          sessionId: session.id,
          userId: session.metadata.user_id
        });
        return session.metadata.user_id;
      }

      // If not in metadata, try to find by customer ID
      if (session.customer) {
        const userId = await this._findUserByCustomerId(session.customer, requestId);
        if (userId) {
          return userId;
        }
      }

      // Check if this is a company subscription
      if (session.metadata?.accountType === 'company' && session.metadata?.companyId) {
        logger.info('Company subscription detected, skipping seller_id requirement', {
          requestId,
          sessionId: session.id,
          companyId: session.metadata.companyId
        });
        // For company subscriptions, we might handle this differently
        // For now, we'll skip creating the subscription and handle it in company flow
        return 'COMPANY_SUBSCRIPTION';
      }

      logger.warn('Could not determine user ID for subscription', {
        requestId,
        sessionId: session.id,
        customerId: session.customer,
        metadata: session.metadata
      });
      return null;
    } catch (error) {
      logger.error('Error extracting user ID from session', {
        requestId,
        sessionId: session.id,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Safely convert Unix timestamp to JavaScript Date
   * @param {number|null|undefined} unixTimestamp - Unix timestamp in seconds
   * @param {string} fieldName - Field name for logging purposes
   * @returns {Date|null} - JavaScript Date object or null if invalid
   * @private
   */
  _safeTimestampToDate(unixTimestamp, fieldName = 'timestamp') {
    try {
      // Handle null, undefined, or non-numeric values
      if (unixTimestamp === null || unixTimestamp === undefined || typeof unixTimestamp !== 'number') {
        logger.warn('Invalid timestamp provided', {
          fieldName,
          value: unixTimestamp,
          type: typeof unixTimestamp
        });
        return null;
      }

      // Handle zero or negative timestamps
      if (unixTimestamp <= 0) {
        logger.warn('Zero or negative timestamp provided', {
          fieldName,
          value: unixTimestamp
        });
        return null;
      }

      // Convert Unix timestamp (seconds) to JavaScript Date (milliseconds)
      const date = new Date(unixTimestamp * 1000);

      // Validate the resulting date
      if (isNaN(date.getTime())) {
        logger.warn('Timestamp conversion resulted in invalid date', {
          fieldName,
          originalValue: unixTimestamp,
          convertedValue: date
        });
        return null;
      }

      return date;
    } catch (error) {
      logger.error('Error converting timestamp to date', {
        fieldName,
        unixTimestamp,
        error: error.message
      });
      return null;
    }
  } /**
   * Safely extract subscription period dates
   * @param {Object} subscription - Stripe subscription object
   * @returns {Object} - Object with safe date values
   * @private
   */
  _extractSafePeriodDates(subscription) {
    // For incomplete subscriptions, period dates are not available yet
    if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
      logger.info('Skipping period date extraction for incomplete subscription', {
        subscriptionId: subscription.id,
        status: subscription.status
      });
      return {
        current_period_start: null,
        current_period_end: null
      };
    }

    const periodStart = this._safeTimestampToDate(subscription.current_period_start, 'current_period_start');
    const periodEnd = this._safeTimestampToDate(subscription.current_period_end, 'current_period_end');

    return {
      current_period_start: periodStart,
      current_period_end: periodEnd
    };
  }

  /**
   * Update user premium status in the sellers table
   * @param {string} sellerId - Seller ID (UUID)
   * @param {boolean} isPremium - Premium status to set
   * @returns {Promise<void>}
   * @private
   */
  async _updateUserPremiumStatus(sellerId, isPremium) {
    try {
      await this.knex('sellers').where('id', sellerId).update({
        is_premium: isPremium,
        updated_at: new Date()
      });

      logger.info('User premium status updated', {
        sellerId,
        isPremium,
        updatedAt: new Date()
      });
    } catch (error) {
      logger.error('Failed to update user premium status', {
        sellerId,
        isPremium,
        error: error.message
      });
      // Don't throw - this is a secondary operation that shouldn't fail the main process
    }
  }

  /**
   * Send subscription welcome email
   * @param {Object} subscription - Stripe subscription object
   * @param {string} userId - User ID
   * @param {string} requestId - Request tracking ID
   * @private
   */
  async _sendSubscriptionWelcomeEmail(subscription, userId, requestId) {
    try {
      // Get user information
      const user = await this.knex('sellers').where('id', userId).first();

      if (!user) {
        logger.warn('User not found for welcome email', {
          requestId,
          userId,
          subscriptionId: subscription.id
        });
        return;
      }

      // Get plan information
      const planId = subscription.items?.data?.[0]?.price?.id;
      let planDetails = {
        name: 'Premium Plan',
        displayName: 'خطة مميزة',
        price: 'غير محدد',
        currency: 'USD',
        interval: 'month',
        features: {
          aiCarAnalysis: true,
          listingHighlights: true,
          prioritySupport: true,
          advancedAnalytics: true,
          unlimitedListings: true
        }
      };

      // Try to get plan details from database if plan_id exists
      if (planId) {
        try {
          const dbPlan = await this.knex('subscription_plans')
            .where('stripe_price_id', planId)
            .orWhere('name', planId)
            .first();

          if (dbPlan) {
            planDetails = {
              name: dbPlan.name,
              displayName: dbPlan.display_name || dbPlan.name,
              price: dbPlan.price,
              currency: dbPlan.currency || 'USD',
              interval: dbPlan.interval || 'month',
              features: dbPlan.features || planDetails.features
            };
          }
        } catch (planError) {
          logger.warn('Could not fetch plan details from database', {
            requestId,
            planId,
            error: planError.message
          });
        }
      }

      const subscriptionEmailService = new SubscriptionEmailService(this.brevoEmailService, requestId);

      const userInfo = {
        id: userId,
        email: user.email,
        name: user.full_name || user.name,
        fullName: user.full_name || user.name
      };

      const subscriptionData = {
        id: subscription.id,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      };

      await subscriptionEmailService.sendWelcomeEmail(subscriptionData, userInfo, planDetails);

      logger.info('Subscription welcome email sent successfully', {
        requestId,
        userId,
        subscriptionId: subscription.id,
        userEmail: user.email
      });
    } catch (error) {
      logger.error('Error sending subscription welcome email', {
        requestId,
        userId,
        subscriptionId: subscription.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update company subscription status in companies table
   * @param {string} companyId - Company ID
   * @param {Object} session - Stripe checkout session object
   * @param {string} requestId - Request tracking ID
   * @private
   */
  async _updateCompanySubscriptionStatus(companyId, session, requestId) {
    try {
      // Extract subscription type from session metadata
      const planType = session.metadata?.planType || 'monthly'; // Default to monthly
      const subscriptionType = ['monthly', 'yearly'].includes(planType) ? planType : 'monthly';

      logger.info('Updating company subscription status', {
        requestId,
        companyId,
        subscriptionType,
        sessionId: session.id,
        subscriptionId: session.subscription
      }); // Update company subscription status and type
      const updateResult = await this.knex('companies').where('id', companyId).update({
        subscription_type: subscriptionType,
        subscription_status: 'active',
        subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        updated_at: new Date()
      });

      if (updateResult === 0) {
        logger.error('Company not found for subscription update', {
          requestId,
          companyId,
          sessionId: session.id
        });
        throw new Error(`Company with ID ${companyId} not found`);
      }

      logger.info('Company subscription status updated successfully', {
        requestId,
        companyId,
        subscriptionType,
        subscriptionStatus: 'active',
        stripeSubscriptionId: session.subscription
      });

      return {
        companyId,
        subscriptionType,
        subscriptionStatus: 'active',
        stripeSubscriptionId: session.subscription
      };
    } catch (error) {
      logger.error('Error updating company subscription status', {
        requestId,
        companyId,
        sessionId: session.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Handle company subscription activation when payment succeeds
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @param {string} requestId - Request tracking ID
   * @private
   */
  async _handleCompanySubscriptionActivation(stripeSubscriptionId, requestId) {
    try {
      // Check if this subscription belongs to a company
      const companyRecord = await this.knex('companies').where('subscription_id', stripeSubscriptionId).first();

      if (!companyRecord) {
        // Not a company subscription, check if it's in user_subscriptions with company metadata
        const userSubscription = await this.knex('user_subscriptions')
          .where('stripe_subscription_id', stripeSubscriptionId)
          .first();

        if (userSubscription && userSubscription.metadata) {
          const metadata =
            typeof userSubscription.metadata === 'string'
              ? JSON.parse(userSubscription.metadata)
              : userSubscription.metadata;

          if (metadata.isCompanySubscription && metadata.companyId) {
            // Update company status based on user subscription
            await this._activateCompanySubscription(metadata.companyId, stripeSubscriptionId, requestId);
          }
        }
        return;
      }

      // Direct company subscription - activate it
      await this._activateCompanySubscription(companyRecord.id, stripeSubscriptionId, requestId);
    } catch (error) {
      logger.error('Error handling company subscription activation', {
        requestId,
        stripeSubscriptionId,
        error: error.message,
        stack: error.stack
      });
      // Don't throw - this is a supplementary operation
      logger.warn('Company subscription activation failed, but payment was recorded', {
        requestId,
        stripeSubscriptionId
      });
    }
  }

  /**
   * Activate company subscription by updating status
   * @param {string} companyId - Company ID
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @param {string} requestId - Request tracking ID
   * @private
   */
  async _activateCompanySubscription(companyId, stripeSubscriptionId, requestId) {
    try {
      // Get subscription details from Stripe to determine plan type
      const subscriptionDetails = await this._getStripeSubscriptionDetails(stripeSubscriptionId);
      const subscriptionType = this._determineSubscriptionType(subscriptionDetails);

      logger.info('Activating company subscription', {
        requestId,
        companyId,
        stripeSubscriptionId,
        subscriptionType
      });

      // Update company subscription status
      const updateResult = await this.knex('companies').where('id', companyId).update({
        subscription_type: subscriptionType,
        subscription_status: 'active',
        subscription_id: stripeSubscriptionId,
        updated_at: new Date()
      });

      if (updateResult === 0) {
        logger.error('Company not found for subscription activation', {
          requestId,
          companyId,
          stripeSubscriptionId
        });
        return;
      }

      logger.info('Company subscription activated successfully', {
        requestId,
        companyId,
        subscriptionType,
        subscriptionStatus: 'active',
        stripeSubscriptionId
      });
    } catch (error) {
      logger.error('Error activating company subscription', {
        requestId,
        companyId,
        stripeSubscriptionId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get Stripe subscription details
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @returns {Object} Subscription details
   * @private
   */
  async _getStripeSubscriptionDetails(stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
        expand: ['items.data.price']
      });

      logger.debug('Retrieved Stripe subscription details', {
        subscriptionId: stripeSubscriptionId,
        status: subscription.status,
        itemsCount: subscription.items.data.length
      });

      return subscription;
    } catch (error) {
      logger.error('Error retrieving Stripe subscription details', {
        stripeSubscriptionId,
        error: error.message
      });

      // Return default structure if API call fails
      return {
        items: {
          data: [
            {
              price: {
                recurring: {
                  interval: 'month' // Default to monthly
                }
              }
            }
          ]
        }
      };
    }
  }

  /**
   * Determine subscription type from Stripe subscription details
   * @param {Object} subscriptionDetails - Stripe subscription details
   * @returns {string} Subscription type ('monthly' or 'yearly')
   * @private
   */
  _determineSubscriptionType(subscriptionDetails) {
    try {
      if (subscriptionDetails.items && subscriptionDetails.items.data && subscriptionDetails.items.data.length > 0) {
        const interval = subscriptionDetails.items.data[0].price?.recurring?.interval;
        return interval === 'year' ? 'yearly' : 'monthly';
      }
      return 'monthly'; // Default
    } catch (error) {
      logger.warn('Could not determine subscription type, defaulting to monthly', {
        error: error.message
      });
      return 'monthly';
    }
  }
}

module.exports = StripeWebhookService;
