const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Webhook-specific rate limiting middleware
const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many webhook requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    // Use combination of IP and Stripe signature for more granular limiting
    return `${req.ip}_${req.headers['stripe-signature']?.slice(0, 10) || 'no-sig'}`;
  },
  skip: req => {
    // Skip rate limiting if no Stripe signature (will be rejected anyway)
    return !req.headers['stripe-signature'];
  }
});

/**
 * Validates Stripe webhook signature with enhanced debugging
 * @param {Object} req - Express request object
 * @param {string} requestId - Unique request identifier
 * @returns {Object} - { isValid: boolean, error?: string, event?: Object }
 */
const validateWebhookSignature = (req, requestId) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    logger.warn('❌ Missing Stripe signature', { requestId, ip: req.ip });
    return {
      isValid: false,
      error: 'Missing signature',
      code: 'MISSING_SIGNATURE',
      status: 401
    };
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET && !process.env.ENDPOINT_SECRET) {
    logger.error('Missing webhook secret environment variable (STRIPE_WEBHOOK_SECRET or ENDPOINT_SECRET)', {
      requestId
    });
    return {
      isValid: false,
      error: 'Server configuration error',
      code: 'MISSING_CONFIG',
      status: 500
    };
  }
  // Support both common environment variable names
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.ENDPOINT_SECRET;

  try {
    // Use req.rawBody if available (preferred for webhooks), otherwise req.body
    const bodyPayload = req.rawBody || req.body;

    const event = stripe.webhooks.constructEvent(bodyPayload, sig, webhookSecret);

    return { isValid: true, event };
  } catch (err) {
    logger.error('❌ Webhook signature verification failed', {
      requestId,
      error: err.message,
      errorType: err.constructor.name,
      ip: req.ip,
      signature: `${sig?.slice(0, 20)}...`,
      hasRawBody: !!req.rawBody,
      hasBody: !!req.body,
      bodyLength: req.rawBody?.length || req.body?.length
    });
    return {
      isValid: false,
      error: 'Invalid signature',
      code: 'INVALID_SIGNATURE',
      status: 400
    };
  }
};

/**
 * Validates webhook event structure
 * @param {Object} event - Stripe event object
 * @param {string} requestId - Unique request identifier
 * @returns {Object} - { isValid: boolean, error?: string }
 */
const validateEventStructure = (event, requestId) => {
  if (!event.id || !event.type || !event.data?.object) {
    logger.error('Invalid event structure', {
      requestId,
      eventId: event.id,
      eventType: event.type,
      hasData: !!event.data,
      hasObject: !!event.data?.object
    });
    return {
      isValid: false,
      error: 'Invalid event structure',
      code: 'INVALID_EVENT',
      status: 400
    };
  }
  return { isValid: true };
};

module.exports = {
  webhookLimiter,
  validateWebhookSignature,
  validateEventStructure
};
