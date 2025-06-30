const logger = require('../utils/logger');

/**
 * Database operations for webhook events with retry logic
 */
class WebhookDatabase {
  constructor(knex) {
    this.knex = knex;
  }

  /**
   * Check if webhook event already exists (idempotency)
   * @param {string} eventId - Stripe event ID
   * @param {string} requestId - Request tracking ID
   * @returns {Object|null} - Existing event or null
   */
  async checkIdempotency(eventId, requestId) {
    let existingEvent;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        existingEvent = await this.knex('webhook_events').where('stripe_event_id', eventId).first();
        break;
      } catch (dbError) {
        retryCount++;
        logger.warn('Database query retry', {
          requestId,
          eventId,
          retry: retryCount,
          error: dbError.message
        });

        if (retryCount >= maxRetries) {
          logger.error('Database query failed after retries', {
            requestId,
            eventId,
            error: dbError.message
          });
          throw new Error('Database temporarily unavailable');
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
      }
    }

    return existingEvent;
  }

  /**
   * Create initial webhook event record
   * @param {Object} event - Stripe event object
   * @param {string} requestId - Request tracking ID
   * @returns {number} - Webhook event ID
   */
  async createWebhookEvent(event, requestId) {
    try {
      const insertResult = await this.knex('webhook_events')
        .insert({
          stripe_event_id: event.id,
          event_type: event.type,
          payment_intent_id: event.data.object.id,
          client_secret: event.data.object.client_secret,
          status: 'processing',
          metadata: JSON.stringify(event.data.object.metadata || {}),
          created_at: this.knex.fn.now()
        })
        .returning('id');

      let webhookEventId = Array.isArray(insertResult) ? insertResult[0] : insertResult;

      if (typeof webhookEventId === 'object' && webhookEventId.id) {
        webhookEventId = webhookEventId.id;
      }

      logger.info('Webhook event record created', {
        requestId,
        eventId: event.id,
        webhookEventId
      });

      return webhookEventId;
    } catch (insertError) {
      // Handle potential race condition where another instance inserted the same event
      if (insertError.code === '23505' || insertError.message.includes('unique')) {
        logger.info('Event already processed by another instance', {
          requestId,
          eventId: event.id
        });
        throw new Error('ALREADY_PROCESSED');
      }

      logger.error('Failed to create webhook event record', {
        requestId,
        eventId: event.id,
        error: insertError.message
      });
      throw new Error('Failed to create webhook record');
    }
  }

  /**
   * Update webhook event status
   * @param {number} webhookEventId - Webhook event ID
   * @param {Object} updateData - Data to update
   */
  async updateWebhookEvent(webhookEventId, updateData) {
    await this.knex('webhook_events')
      .where('id', webhookEventId)
      .update({
        ...updateData,
        processed_at: this.knex.fn.now()
      });
  }

  /**
   * Update webhook event with success status
   * @param {number} webhookEventId - Webhook event ID
   * @param {number} processingTime - Processing time in milliseconds
   */
  async markSuccess(webhookEventId, processingTime) {
    await this.updateWebhookEvent(webhookEventId, {
      status: 'success',
      processing_time_ms: processingTime
    });
  }

  /**
   * Update webhook event with failed status
   * @param {number} webhookEventId - Webhook event ID
   * @param {string} errorMessage - Error message
   * @param {number} processingTime - Processing time in milliseconds
   */
  async markFailed(webhookEventId, errorMessage, processingTime) {
    await this.updateWebhookEvent(webhookEventId, {
      status: 'failed',
      error_message: errorMessage,
      processing_time_ms: processingTime
    });
  }

  /**
   * Update webhook event with ignored status
   * @param {number} webhookEventId - Webhook event ID
   * @param {string} reason - Reason for ignoring
   * @param {number} processingTime - Processing time in milliseconds
   */
  async markIgnored(webhookEventId, reason, processingTime) {
    await this.updateWebhookEvent(webhookEventId, {
      status: 'ignored',
      error_message: reason,
      processing_time_ms: processingTime
    });
  }
}

module.exports = WebhookDatabase;
