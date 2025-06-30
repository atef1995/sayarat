const express = require('express');
const logger = require('../utils/logger');
const { webhookLimiter, validateWebhookSignature, validateEventStructure } = require('../middleware/webhookSecurity');
const WebhookController = require('../controllers/webhookController');

const router = express.Router();

/**
 * Stripe Webhook Handler - Enhanced with comprehensive debugging
 * Handles all Stripe webhook events with enhanced security and error handling
 *
 * DEBUGGING ARCHITECTURE:
 * ======================
 * 1. Request reception logging
 * 2. Rate limiting validation
 * 3. Signature validation with detailed error logging
 * 4. Event structure validation
 * 5. Event processing with step-by-step tracking
 * 6. Response generation with performance metrics
 *
 * #TODO: Add webhook event replay functionality for testing
 * #TODO: Implement webhook analytics dashboard
 */
const webhook = knex => {
  const webhookController = new WebhookController(knex);

  /**
   * Debug middleware specific to webhook endpoints only
   * This helps identify if webhook requests are reaching the route
   */
  router.use('/webhook*', (req, res, next) => {
    next();
  });
  // Apply rate limiting to webhook endpoint
  router.use('/webhook', webhookLimiter);

  /**
   * Test endpoint to verify webhook is reachable
   * This endpoint helps debug connectivity issues
   */
  router.get('/webhook/test', (req, res) => {
    const testResponse = {
      status: 'webhook_endpoint_reachable',
      timestamp: new Date().toISOString(),
      server: 'cars-bids-backend',
      environment: process.env.NODE_ENV || 'development',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    logger.info('🧪 WEBHOOK TEST ENDPOINT HIT', testResponse);

    res.status(200).json(testResponse);
  });

  router.post('/webhook', async(req, res) => {
    const startTime = Date.now();
    const requestId = webhookController.generateRequestId();

    // Log request details
    webhookController.logRequestDetails(req, requestId);
    try {
      const signatureValidation = validateWebhookSignature(req, requestId);
      if (!signatureValidation.isValid) {
        logger.error('❌ SIGNATURE VALIDATION FAILED', {
          requestId,
          error: signatureValidation.error,
          code: signatureValidation.code,
          status: signatureValidation.status
        });
        return res.status(signatureValidation.status).json({
          error: signatureValidation.error,
          code: signatureValidation.code
        });
      }

      const { event } = signatureValidation;

      const structureValidation = validateEventStructure(event, requestId);
      if (!structureValidation.isValid) {
        logger.error('❌ EVENT STRUCTURE VALIDATION FAILED', {
          requestId,
          eventId: event?.id,
          error: structureValidation.error,
          code: structureValidation.code,
          status: structureValidation.status
        });
        return res.status(structureValidation.status).json({
          error: structureValidation.error,
          code: structureValidation.code
        });
      }

      const result = await webhookController.processWebhook(event, requestId, startTime);
      const totalProcessingTime = Date.now() - startTime;
      // Step 4: Send success response
      const response = webhookController.createSuccessResponse(result, event, requestId, totalProcessingTime);

      return res.status(200).json(response);
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Enhanced error logging with more context
      const errorDetails = {
        requestId,
        error: error.message,
        stack: error.stack,
        processingTimeMs: processingTime,
        errorType: error.constructor.name,
        errorCode: error.code,
        isDatabaseError: error.constructor.name === 'DatabaseError',
        isValidationError:
          error.message.includes('Missing required field') ||
          error.message.includes('Invalid') ||
          error.message.includes('invalid input syntax'),
        timestamp: new Date().toISOString()
      }; // Log specific error types differently
      if (errorDetails.isDatabaseError || errorDetails.isValidationError) {
        logger.error('💥 WEBHOOK PROCESSING FAILED - Database/Validation Error', errorDetails);

        // For timestamp errors, provide specific guidance
        if (error.message.includes('invalid input syntax for type timestamp')) {
          logger.error('🕒 TIMESTAMP CONVERSION ERROR DETECTED', {
            requestId,
            suggestion: 'Check Stripe webhook data for invalid timestamp values',
            commonCause: 'Unix timestamp conversion failure - check for null/undefined values'
          });
        } // For NOT NULL constraint violations, provide specific guidance
        if (error.message.includes('null value in column') && error.message.includes('violates not-null constraint')) {
          const columnMatch = error.message.match(/null value in column "([^"]+)"/);
          const column = columnMatch ? columnMatch[1] : 'unknown';

          logger.error('🚫 NOT NULL CONSTRAINT VIOLATION DETECTED', {
            requestId,
            column: column,
            suggestion: `The ${column} field is required but was not provided or could not be determined`,
            commonCause: 'Missing required data in Stripe webhook or lookup failure',
            possibleSolutions: [
              `Ensure ${column} is included in webhook metadata`,
              `Verify database lookup logic for ${column}`,
              'Check if this should be handled as a different subscription type'
            ]
          });
        }

        // For column does not exist errors, provide schema guidance
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          const columnMatch = error.message.match(/column "([^"]+)"/);
          const tableMatch = error.message.match(/relation "([^"]+)"/);
          const column = columnMatch ? columnMatch[1] : 'unknown';
          const table = tableMatch ? tableMatch[1] : 'unknown';

          logger.error('📋 DATABASE COLUMN MISSING', {
            requestId,
            table: table,
            column: column,
            suggestion: `The ${column} column is missing from the ${table} table`,
            commonCause: 'Database schema is out of sync with code expectations',
            solution: 'Run migration: node_modules/.bin/knex migrate:latest'
          });
        }

        // For invalid input syntax errors (type mismatches)
        if (error.message.includes('invalid input syntax for type')) {
          const typeMatch = error.message.match(/invalid input syntax for type (\w+): "([^"]+)"/);
          const columnMatch = error.message.match(/set "([^"]+)" =/);
          const type = typeMatch ? typeMatch[1] : 'unknown';
          const value = typeMatch ? typeMatch[2] : 'unknown';
          const column = columnMatch ? columnMatch[1] : 'unknown';

          logger.error('🔧 DATABASE TYPE MISMATCH', {
            requestId,
            column: column,
            expectedType: type,
            attemptedValue: value,
            suggestion: `The ${column} column expects ${type} but received a different data type`,
            commonCause: 'Database schema column type does not match the data being stored',
            solution: `Check if ${column} column type needs to be updated or if data conversion is needed`
          });
        }
      } else {
        logger.error('💥 WEBHOOK PROCESSING FAILED', errorDetails);
      }

      // Step 5: Send error response (triggers Stripe retry)
      const errorResponse = webhookController.createErrorResponse(error, requestId);

      logger.info('📤 SENDING ERROR RESPONSE', {
        requestId,
        errorResponse: errorResponse,
        willTriggerRetry: true
      });

      return res.status(500).json(errorResponse);
    }
  });

  /**
   * Test endpoint to verify webhook is reachable
   * This endpoint helps debug connectivity issues
   */
  router.get('/webhook/test', (req, res) => {
    const testResponse = {
      status: 'webhook_endpoint_reachable',
      timestamp: new Date().toISOString(),
      server: 'cars-bids-backend',
      environment: process.env.NODE_ENV || 'development',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    logger.info('🧪 WEBHOOK TEST ENDPOINT HIT', testResponse);

    res.status(200).json(testResponse);
  });

  return router;
};

module.exports = webhook;
