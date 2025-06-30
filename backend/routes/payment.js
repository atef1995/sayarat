const express = require('express');
const paymentRouter = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { ensureAuthenticated } = require('../middleware/auth');
const logger = require('../utils/logger');
const { markAsPaid } = require('../dbQueries/listed_cars');

// #TODO: DEPRECATION NOTICE
// This endpoint is deprecated and will be removed in a future version
// Please use /api/subscription/create with accountType: 'company' instead

// Company subscription payment
paymentRouter.post('/company-subscription', ensureAuthenticated, async(req, res) => {
  // Log deprecation warning
  logger.warn('DEPRECATED ENDPOINT USED: /api/payment/company-subscription', {
    userId: req.user.id,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    deprecationMessage: 'This endpoint is deprecated. Please use /api/subscription/create with accountType: "company"'
  });

  try {
    const { companyId, subscriptionType } = req.body;

    if (!companyId || !subscriptionType) {
      return res.status(400).json({
        error: 'Company ID and subscription type are required'
      });
    }

    // Define price IDs (these would be set up in your Stripe dashboard)
    const priceIds = {
      monthly: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder',
      yearly: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly_placeholder'
    };

    const priceId = priceIds[subscriptionType];
    if (!priceId) {
      return res.status(400).json({
        error: 'Invalid subscription type'
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.FRONTEND_URL}/company-payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/company-payment/cancel`,
      metadata: {
        companyId: companyId,
        subscriptionType: subscriptionType,
        type: 'company_subscription'
      },
      customer_email: req.user.email
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    logger.error('Company subscription payment error:', error);
    res.status(500).json({
      error: 'Failed to create subscription payment session',
      details: error.message
    });
  }
});

// Company subscription webhook handler
paymentRouter.post('/webhook/company-subscription', express.raw({ type: 'application/json' }), async(req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_COMPANY_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      if (session.metadata.type === 'company_subscription') {
        await handleCompanySubscriptionSuccess(session);
      }
      break;
    case 'invoice.payment_succeeded':
      // Handle successful recurring payments
      break;
    case 'invoice.payment_failed':
      // Handle failed payments
      break;
    default:
      logger.info(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

async function handleCompanySubscriptionSuccess(session) {
  try {
    const { companyId } = session.metadata;
    const subscriptionId = session.subscription;

    // Here you would update your database to activate the company subscription
    // This requires the CompanyRegistrationService
    logger.info(`Company subscription activated: ${companyId}, subscription: ${subscriptionId}`);

    // TODO: Call CompanyRegistrationService.activateCompanySubscription(companyId, subscriptionId)
  } catch (error) {
    logger.error('Error handling company subscription success:', error);
  }
}

paymentRouter.get('/products', async(req, res) => {
  try {
    const products = await stripe.products.list({
      limit: 10,
      expand: ['data.default_price'],
      ids: ['prod_SUbJmOAx9pEED4']
    });
    res.json(products);
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      details: error.message
    });
  }
});

paymentRouter.post('/create-payment-intent', async(req, res) => {
  const { items } = req.body;
  logger.info('Creating payment intent with items:', { items });
  if (!items) {
    return res.status(400).json({ error: 'No items provided for payment' });
  }
  try {
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: await calculateOrderAmount(items),
      currency: 'usd',
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        success_redirect: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_redirect: `${process.env.FRONTEND_URL}/payment/cancel`,
        items: JSON.stringify(items) // Store items in metadata for later reference
      }
    });

    res.send({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({
      error: 'Failed to create payment intent',
      details: error.message
    });
  }
});

const calculateOrderAmount = async items => {
  const sum = await stripe.products
    .list({
      limit: 10,
      expand: ['data.default_price']
    })
    .then(products => {
      return items.reduce((total, item) => {
        const product = products.data.find(p => p.id === item.productId);
        logger.info(`Calculating price for item: ${item.productId}, quantity: ${item.quantity}`);
        logger.info(`Product found: ${product ? product.name : 'not found'}`);
        logger.info(`Product price: ${product ? product.default_price.unit_amount : 'not available'}`);
        if (product && product.default_price) {
          return total + product.default_price.unit_amount * item.quantity;
        }
        return total;
      }, 0);
    });
  if (sum === 0) {
    logger.warn('Calculated order amount is zero, no items found or all items have zero price.');
    throw new Error('Order amount cannot be zero');
  }
  logger.info(`Calculated order amount: ${sum} cents`);
  return sum * 100; // Convert to cents
};

module.exports = paymentRouter;
