const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const {
  initializeDatabase,
  getSubscriptionPlans,
  getUserSubscriptionStatus,
  createSubscription,
  cancelSubscription,
  reactivateSubscription,
  updateSubscription,
  submitManualPayment,
  getAccountType,
  switchAccountType
} = require('../controllers/subscriptionController');

const createSubscriptionRouter = knex => {
  const router = express.Router();

  // Initialize database connection
  initializeDatabase(knex);

  // Get all available subscription plans
  router.get('/plans', getSubscriptionPlans);
  // Get user's current subscription status
  router.get('/status', ensureAuthenticated, getUserSubscriptionStatus);

  // Get user's account type information
  router.get('/account-type', ensureAuthenticated, getAccountType);

  // Switch user's account type
  router.post('/switch-account-type', ensureAuthenticated, switchAccountType);
  // Create a new subscription (supports both individual and company accounts)
  router.post('/create', ensureAuthenticated, createSubscription);

  // Legacy endpoint for company subscriptions (deprecated - use /create with accountType)
  router.post('/create-company', ensureAuthenticated, createSubscription);

  // Cancel subscription
  router.post('/cancel', ensureAuthenticated, cancelSubscription);

  // Reactivate subscription
  router.post('/reactivate', ensureAuthenticated, reactivateSubscription);

  // Update subscription plan
  router.put('/update', ensureAuthenticated, updateSubscription);

  // Submit manual payment request
  router.post('/manual-payment', ensureAuthenticated, submitManualPayment);

  return router;
};

module.exports = createSubscriptionRouter;
