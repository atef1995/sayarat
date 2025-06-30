/**
 * Subscription Controller - Unified account type support
 *
 * ARCHITECTURE REFACTORING NOTES:
 * ================================
 *
 * Updated to support unified subscription system with individual and company accounts:
 *
 * 1. UNIFIED ACCOUNT SUPPORT: Handles both individual and company subscriptions
 * 2. STRATEGY PATTERN: Uses UnifiedSubscriptionService for account-type-aware operations
 * 3. ENHANCED SECURITY: Validates account permissions for company operations
 * 4. AUDIT LOGGING: Comprehensive subscription action tracking
 *
 * NEW FEATURES:
 * =============
 *
 * - Account type detection and validation
 * - Company subscription management with role-based permissions
 * - Enhanced plan filtering based on target audience
 * - Comprehensive audit trail for all subscription changes
 *
 * #TODO: Add subscription transfer between account types
 * #TODO: Implement bulk operations for company admins
 * #TODO: Add subscription usage analytics and reporting
 * #TODO: Implement subscription plan recommendations
 */

const { UnifiedSubscriptionService, AccountTypeService } = require('../service/UnifiedSubscriptionService');

/**
 * Utility function to format user name from database fields
 * @param {Object} user - User object from database
 * @returns {string} Formatted user name
 */
const formatUserName = user => {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }

  return user.first_name || user.last_name || user.username || 'عزيزي العميل';
};

/**
 * Utility function to create user info object for emails
 * @param {Object} user - User object from request
 * @returns {Object} Formatted user info for email services
 */
const createUserInfoForEmail = user => {
  if (!user) {
    logger.error('User object is null or undefined for email creation');
    throw new Error('User object is required for sending emails');
  }

  if (!user.email) {
    logger.error('User email is missing', {
      userId: user.id,
      availableFields: Object.keys(user || {})
    });
    throw new Error('User email is required for sending emails');
  }

  const formattedName = formatUserName(user);

  logger.info('Created user info for email', {
    userId: user.id,
    hasEmail: !!user.email,
    formattedName,
    emailRedacted: user.email ? '[REDACTED]' : 'MISSING'
  });

  return {
    id: user.id,
    email: user.email,
    name: formattedName,
    fullName: formattedName
  };
};

const Stripe = require('stripe');
const logger = require('../utils/logger');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const ManualPaymentEmailService = require('../service/email/manualPaymentEmailService');
const SubscriptionEmailService = require('../service/subscription/subscriptionEmailService');
const BrevoEmailService = require('../service/brevoEmailService');
const ReqIdGenerator = require('../utils/reqIdGenerator');
const { SubscriptionServiceFactory } = require('../service/subscription');

const brevoEmailService = new BrevoEmailService();
const reqIdGenerator = new ReqIdGenerator();

// Initialize database connection and services
let knex;
let subscriptionServiceFactory;

const initializeDatabase = dbConnection => {
  knex = dbConnection;
  subscriptionServiceFactory = new SubscriptionServiceFactory(dbConnection);
};

/**
 * Get subscription plans from database or Stripe
 */
const getSubscriptionPlansFromDatabase = async () => {
  try {
    // Get plans from database using SubscriptionServiceFactory
    const plans = await subscriptionServiceFactory.getCoreService().getSubscriptionPlans();

    // Filter active plans and format features
    const activePlans = plans
      .filter(plan => plan.is_active)
      .sort((a, b) => (a.order_number || 0) - (b.order_number || 0));

    return activePlans.map(plan => ({
      ...plan,
      features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]')
    }));
  } catch (error) {
    logger.error('Error fetching plans from database:', { error });
    throw error;
  }
};

/**
 * Get all available subscription plans
 */
const getSubscriptionPlans = async (req, res) => {
  try {
    const { accountType } = req.query;
    const plans = await getSubscriptionPlansFromDatabase();

    // Filter plans based on account type if specified
    let filteredPlans = plans;
    if (accountType) {
      filteredPlans = plans.filter(plan => {
        // If plan has target_audience specified, check if it includes the requested account type
        if (plan.target_audience && Array.isArray(plan.target_audience)) {
          return plan.target_audience.includes(accountType);
        }
        // If no target_audience specified, plan is available for all account types
        return true;
      });
    }
    logger.info('Fetched subscription plans', {
      totalPlans: plans.length
    });
    // Transform for frontend compatibility
    const transformedPlans = filteredPlans.map(plan => ({
      id: plan.name,
      name: plan.name,
      displayName: plan.display_name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      features: plan.features,
      stripePriceId: plan.stripe_price_id,
      isActive: plan.is_active,
      order: plan.order_number,
      targetAudience: plan.target_audience || ['individual', 'company']
    }));
    res.json({
      success: true,
      plans: transformedPlans,
      filteredBy: accountType || 'all',
      totalPlans: plans.length,
      filteredPlans: transformedPlans.length
    });
  } catch (error) {
    logger.error('Error fetching subscription plans:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans'
    });
  }
};

/**
 * Get user's current subscription status
 * Enhanced with subscription database service for better modularity
 */
const getUserSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id; // Get account type using unified AccountTypeService
    const accountType = await AccountTypeService.getUserAccountType(userId);
    const companyInfo = await AccountTypeService.getUserCompanyInfo(userId);

    // Check if user is a company (companies get AI features automatically)
    const isCompany = accountType === 'company';

    logger.info('Subscription status - Account type determination:', {
      userId,
      accountType,
      isCompany,
      hasCompanyInfo: !!companyInfo,
      companyName: companyInfo?.name
    });

    let hasActiveSubscription = false;
    let subscription = null;
    if (subscriptionServiceFactory) {
      // Use subscription service factory for cleaner data access
      const activeSubscription = await subscriptionServiceFactory.getCoreService().getUserActiveSubscription(userId);

      if (activeSubscription) {
        subscription = {
          id: activeSubscription.id,
          planId: activeSubscription.plan_id,
          planName: activeSubscription.plan_name,
          planDisplayName: activeSubscription.plan_display_name,
          price: activeSubscription.plan_price,
          currency: activeSubscription.plan_currency,
          features: activeSubscription.plan_features || [],
          status: activeSubscription.status,
          currentPeriodStart: activeSubscription.current_period_start,
          currentPeriodEnd: activeSubscription.current_period_end,
          stripeSubscriptionId: activeSubscription.stripe_subscription_id,
          features: activeSubscription.plan_features || [],
          // Cancellation information
          cancelAtPeriodEnd: activeSubscription.cancel_at_period_end || false,
          canceledAt: activeSubscription.canceled_at || null,
          cancellationReason: activeSubscription.cancellation_reason || null
        };

        // Determine if subscription provides active benefits
        // A subscription provides benefits if:
        // 1. It's active/trialing AND
        // 2. Either not scheduled for cancellation OR still within the current period
        const now = new Date();
        const periodEnd = new Date(activeSubscription.current_period_end);
        const isWithinPeriod = !activeSubscription.current_period_end || now <= periodEnd;
        const isActiveStatus = ['active', 'trialing'].includes(activeSubscription.status);

        hasActiveSubscription = isActiveStatus && isWithinPeriod;

        logger.info('Subscription status evaluation:', {
          userId,
          status: activeSubscription.status,
          cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
          periodEnd: activeSubscription.current_period_end,
          isWithinPeriod,
          isActiveStatus,
          hasActiveSubscription
        });

        // Update user's premium status if not already set and subscription provides benefits
        if (hasActiveSubscription && !req.user.is_premium) {
          await subscriptionServiceFactory
            .getUserAccountService()
            .updateUserPremiumStatus(userId, true)
            .catch(err => logger.warn('Failed to update user premium status:', { err, userId }));
        }
      }
    }

    // Define features based on subscription and company status
    const features = {
      aiCarAnalysis: hasActiveSubscription || isCompany,
      listingHighlights: hasActiveSubscription || isCompany,
      prioritySupport: hasActiveSubscription || isCompany,
      advancedAnalytics: hasActiveSubscription,
      unlimitedListings: hasActiveSubscription || isCompany,
      customBranding: hasActiveSubscription && isCompany,
      teamMembers: isCompany ? 10 : hasActiveSubscription ? 1 : 0
    };
    res.json({
      hasActiveSubscription,
      isCompany,
      accountType: accountType,
      company: companyInfo,
      canSwitchAccountType: true, // This could be based on business rules
      features,
      subscription,
      // Additional metadata for frontend logic
      canManageSubscription: true,
      billingCycle: subscription?.interval || null,
      nextBillingDate: subscription?.currentPeriodEnd || null
    });
  } catch (error) {
    logger.error('Error checking subscription status:', {
      error,
      userId: req.user.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to check subscription status'
    });
  }
};

/**
 * Create a new subscription with Stripe
 */
const createSubscription = async (req, res) => {
  try {
    const { planId, accountType, companyId } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    // Detect account type (support explicit parameter or infer from user data)
    const detectedAccountType =
      accountType || (req.user.accountType === 'company' || req.user.is_company ? 'company' : 'individual');

    // Validate company-specific requirements
    if (detectedAccountType === 'company') {
      const effectiveCompanyId = companyId || req.user.company_id || userId;
      if (!effectiveCompanyId) {
        return res.status(400).json({
          success: false,
          error: 'Company ID is required for company subscriptions'
        });
      }
    }

    // Get the plan from database
    const plans = await getSubscriptionPlansFromDatabase();
    const plan = plans.find(p => p.name === planId);

    if (!plan) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan ID'
      });
    }

    // Validate plan availability for account type
    if (detectedAccountType === 'company' && plan.target_audience && !plan.target_audience.includes('company')) {
      return res.status(400).json({
        success: false,
        error: 'Selected plan is not available for company accounts'
      });
    }

    // Get the actual Stripe price using lookup key
    let stripePrice;
    try {
      const prices = await stripe.prices.list({
        lookup_keys: [planId],
        expand: ['data.product']
      });

      if (prices.data.length === 0) {
        logger.error(`No Stripe price found for lookup key: ${planId}`);
        return res.status(400).json({
          success: false,
          error: 'Subscription plan not available'
        });
      }

      stripePrice = prices.data[0];
    } catch (stripeError) {
      logger.error('Error fetching Stripe price:', { stripeError, planId });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription plan details'
      });
    } // Check if user already has an active subscription using SubscriptionServiceFactory
    if (subscriptionServiceFactory) {
      const existingSubscription = await subscriptionServiceFactory.getCoreService().getUserActiveSubscription(userId);

      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          error: 'User already has an active subscription'
        });
      }
    }

    // Create or retrieve Stripe customer
    let stripeCustomer;
    let stripeCustomerId = req.user.stripe_customer_id;

    if (!stripeCustomerId) {
      try {
        stripeCustomer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            userId: userId.toString(),
            source: 'cars-bids-app'
          }
        });
        stripeCustomerId = stripeCustomer.id; // Update user with Stripe customer ID
        if (subscriptionServiceFactory) {
          await subscriptionServiceFactory
            .getUserAccountService()
            .updateUserStripeCustomerId(userId, stripeCustomerId)
            .catch(err => logger.warn('Failed to update user stripe_customer_id:', err));
        }
      } catch (customerError) {
        logger.error('Error creating Stripe customer:', { customerError, userId, userEmail });
        return res.status(500).json({
          success: false,
          error: 'Failed to create customer profile'
        });
      }
    } else {
      try {
        stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
      } catch (retrieveError) {
        logger.error('Error retrieving Stripe customer:', { retrieveError, stripeCustomerId });
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve customer profile'
        });
      }
    } // Create Stripe Checkout Session
    try {
      // Ensure frontend URL has proper scheme
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const baseUrl = frontendUrl.startsWith('http') ? frontendUrl : `https://${frontendUrl}`;

      // Prepare metadata for the session
      const sessionMetadata = {
        userId: userId.toString(),
        planId: planId,
        planName: plan.display_name,
        accountType: detectedAccountType
      };

      // Add company-specific metadata if applicable
      if (detectedAccountType === 'company') {
        sessionMetadata.companyId = companyId || req.user.company_id || userId;
        sessionMetadata.isCompanySubscription = 'true';
      }

      // Determine success/cancel URLs based on account type
      const successUrl =
        detectedAccountType === 'company'
          ? `${baseUrl}/company-dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`
          : `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;

      const cancelUrl =
        detectedAccountType === 'company'
          ? `${baseUrl}/company-dashboard?subscription=cancelled`
          : `${baseUrl}/subscription/cancel`;

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: stripePrice.id,
            quantity: 1
          }
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: sessionMetadata,
        subscription_data: {
          metadata: {
            userId: userId.toString(),
            planId: planId,
            accountType: detectedAccountType,
            ...(detectedAccountType === 'company' && {
              companyId: companyId || req.user.company_id || userId,
              isCompanySubscription: 'true'
            })
          }
        }
      });

      logger.info('Stripe checkout session created', {
        userId,
        planId,
        sessionId: session.id,
        customerId: stripeCustomerId,
        accountType: detectedAccountType
      });

      res.json({
        success: true,
        sessionId: session.id,
        url: session.url,
        subscription: {
          planId,
          planName: plan.display_name,
          price: stripePrice.unit_amount / 100,
          currency: stripePrice.currency.toUpperCase(),
          interval: stripePrice.recurring.interval
        }
      });
    } catch (sessionError) {
      logger.error('Error creating Stripe checkout session:', { sessionError, userId, planId });
      res.status(500).json({
        success: false,
        error: 'Failed to create checkout session'
      });
    }
  } catch (error) {
    logger.error('Error creating subscription:', { error, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription'
    });
  }
};

/**
 * Cancel subscription with comprehensive handling
 *
 * This function handles both immediate cancellation and cancellation at period end
 * depending on the request parameters and business logic.
 */
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { immediate = false, reason = 'user_requested' } = req.body;
    if (!subscriptionServiceFactory) {
      return res.status(500).json({
        success: false,
        error: 'SubscriptionServiceFactory not available'
      });
    }

    // Find user's active subscription using SubscriptionServiceFactory
    const userSubscription = await subscriptionServiceFactory.getCoreService().getUserActiveSubscription(userId);

    if (!userSubscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    // Check if subscription is already set to cancel
    if (userSubscription.canceled_at || userSubscription.cancel_at_period_end) {
      return res.status(400).json({
        success: false,
        error: 'Subscription is already scheduled for cancellation',
        details: {
          canceledAt: userSubscription.canceled_at,
          cancelAtPeriodEnd: userSubscription.cancel_at_period_end,
          currentPeriodEnd: userSubscription.current_period_end
        }
      });
    }

    let cancellationResult = null;
    const shouldRemovePremiumImmediately = immediate;

    // Cancel with Stripe
    if (userSubscription.stripe_subscription_id) {
      try {
        if (immediate) {
          // Immediate cancellation
          cancellationResult = await stripe.subscriptions.cancel(userSubscription.stripe_subscription_id, {
            prorate: true,
            invoice_now: false
          });

          logger.info('Stripe subscription canceled immediately', {
            userId,
            stripeSubscriptionId: userSubscription.stripe_subscription_id,
            reason
          });
        } else {
          // Cancel at period end (default behavior)
          cancellationResult = await stripe.subscriptions.update(userSubscription.stripe_subscription_id, {
            cancel_at_period_end: true,
            metadata: {
              cancellation_reason: reason,
              canceled_by_user: 'true',
              cancellation_requested_at: new Date().toISOString()
            }
          });

          logger.info('Stripe subscription set to cancel at period end', {
            userId,
            stripeSubscriptionId: userSubscription.stripe_subscription_id,
            cancelAt: cancellationResult.cancel_at,
            reason
          });
        }
      } catch (stripeError) {
        logger.error('Error canceling Stripe subscription:', {
          stripeError: stripeError.message,
          userId,
          immediate
        });
        return res.status(500).json({
          success: false,
          error: 'Failed to cancel subscription with payment provider',
          details: stripeError.message
        });
      }
    }

    // Prepare database update data
    const updateData = {
      updated_at: new Date(),
      metadata: {
        ...userSubscription.metadata,
        cancellation_reason: reason,
        cancellation_requested_at: new Date(),
        canceled_by_user: true
      }
    };

    if (immediate) {
      updateData.status = 'canceled';
      updateData.canceled_at = new Date();
    } else {
      updateData.cancel_at_period_end = true;
      if (cancellationResult?.cancel_at) {
        updateData.cancel_at = new Date(cancellationResult.cancel_at * 1000);
      }
    }

    // Update subscription status in database
    await knex('user_subscriptions').where('id', userSubscription.id).update(updateData);

    // Handle premium status update
    if (shouldRemovePremiumImmediately) {
      // Check if user has other active subscriptions before removing premium
      const otherActiveSubscriptions = await knex('user_subscriptions')
        .where('seller_id', userId)
        .whereIn('status', ['active', 'trialing'])
        .whereNot('id', userSubscription.id);

      if (otherActiveSubscriptions.length === 0) {
        await knex('sellers')
          .where('id', userId)
          .update({
            is_premium: false,
            updated_at: new Date()
          })
          .catch(err => logger.warn('Failed to update user premium status:', err));

        logger.info('Premium status removed immediately due to immediate cancellation', {
          userId,
          subscriptionId: userSubscription.id
        });
      } else {
        logger.info('Premium status maintained due to other active subscriptions', {
          userId,
          otherActiveSubscriptions: otherActiveSubscriptions.length
        });
      }
    }

    // Prepare response
    const responseData = {
      success: true,
      subscriptionId: userSubscription.id,
      cancellationType: immediate ? 'immediate' : 'at_period_end',
      reason
    };

    if (immediate) {
      responseData.message = 'Subscription has been canceled immediately';
      responseData.canceledAt = updateData.canceled_at;
    } else {
      responseData.message = 'Subscription will be canceled at the end of the current billing period';
      responseData.currentPeriodEnd = userSubscription.current_period_end;
      responseData.cancelAt = updateData.cancel_at;
    }
    logger.info('Subscription cancellation processed successfully', {
      userId,
      subscriptionId: userSubscription.id,
      immediate,
      reason,
      stripeSubscriptionId: userSubscription.stripe_subscription_id
    }); // Send cancellation confirmation email
    try {
      const requestId = reqIdGenerator.generateRequestId();
      const subscriptionEmailService = new SubscriptionEmailService(brevoEmailService, requestId);

      // Get user information for email with error handling
      let userInfo;
      try {
        userInfo = createUserInfoForEmail(req.user);
      } catch (userInfoError) {
        logger.error('Failed to create user info for cancellation email', {
          userId,
          error: userInfoError.message,
          userFields: req.user ? Object.keys(req.user) : 'user object is null'
        });
        throw userInfoError;
      }

      const cancellationDetails = {
        type: immediate ? 'immediate' : 'at_period_end',
        reason,
        canceledAt: immediate ? updateData.canceled_at : updateData.cancel_at
      };

      const subscriptionForEmail = {
        id: userSubscription.id,
        currentPeriodEnd: userSubscription.current_period_end,
        planDisplayName: userSubscription.plan_display_name || userSubscription.plan_name
      };

      await subscriptionEmailService.sendCancellationEmail(subscriptionForEmail, userInfo, cancellationDetails);

      logger.info('Cancellation email sent successfully', {
        userId,
        subscriptionId: userSubscription.id,
        requestId
      });
    } catch (emailError) {
      // Don't fail the cancellation if email fails, just log the error
      logger.error('Failed to send cancellation email', {
        userId,
        subscriptionId: userSubscription.id,
        error: emailError.message
      });
    }

    res.json(responseData);
  } catch (error) {
    logger.error('Error canceling subscription:', {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
      code: error.code || 'CANCELLATION_ERROR'
    });
  }
};

/**
 * Update subscription plan
 */
const updateSubscription = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    if (!knex) {
      return res.status(500).json({
        success: false,
        error: 'Database connection not available'
      });
    }

    // Get the new plan from database
    const plans = await getSubscriptionPlansFromDatabase();
    const newPlan = plans.find(p => p.name === planId);

    if (!newPlan) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan ID'
      });
    } // Find user's current subscription
    const userSubscription = await knex('user_subscriptions')
      .where('seller_id', userId)
      .where('status', 'active')
      .first();

    if (!userSubscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    // Get the new Stripe price
    let stripePrice;
    try {
      const prices = await stripe.prices.list({
        lookup_keys: [planId],
        expand: ['data.product']
      });

      if (prices.data.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'New subscription plan not available'
        });
      }

      stripePrice = prices.data[0];
    } catch (stripeError) {
      logger.error('Error fetching new Stripe price:', { stripeError, planId });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch new plan details'
      });
    }

    // Update Stripe subscription
    if (userSubscription.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(userSubscription.stripe_subscription_id);

        await stripe.subscriptions.update(userSubscription.stripe_subscription_id, {
          items: [
            {
              id: subscription.items.data[0].id,
              price: stripePrice.id
            }
          ],
          proration_behavior: 'create_prorations'
        });

        logger.info('Stripe subscription updated', {
          userId,
          stripeSubscriptionId: userSubscription.stripe_subscription_id,
          newPlanId: planId
        });
      } catch (stripeError) {
        logger.error('Error updating Stripe subscription:', { stripeError, userId, planId });
        return res.status(500).json({
          success: false,
          error: 'Failed to update subscription with payment provider'
        });
      }
    }

    // Update subscription in database
    const newPlanRecord = await knex('subscription_plans').where('name', planId).first();

    if (newPlanRecord) {
      await knex('user_subscriptions').where('id', userSubscription.id).update({
        plan_id: newPlanRecord.id,
        updated_at: new Date()
      });
    }

    logger.info('Subscription updated successfully', {
      userId,
      subscriptionId: userSubscription.id,
      newPlanId: planId
    });

    res.json({
      success: true,
      subscription: {
        id: userSubscription.id,
        userId,
        planId,
        status: 'active',
        plan: newPlan
      }
    });
  } catch (error) {
    logger.error('Error updating subscription:', { error, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Failed to update subscription'
    });
  }
};

/**
 * Submit manual payment request
 */
const submitManualPayment = async (req, res) => {
  try {
    const userId = req.user.id;

    const { fullName, phone, email, paymentMethod, preferredContact, notes, planName, planPrice, currency } = req.body;

    // Validate required fields
    if (!fullName || !phone || !email || !paymentMethod || !preferredContact || !planName || !planPrice) {
      return res.status(400).json({
        success: false,
        error: 'جميع الحقول مطلوبة'
      });
    }

    let referenceId;
    // Save manual payment request to database
    if (knex) {
      const result = await knex('manual_payment_requests')
        .insert({
          seller_id: userId,
          full_name: fullName,
          phone: phone,
          email: email,
          payment_method: paymentMethod,
          preferred_contact: preferredContact,
          notes: notes || null,
          plan_name: planName,
          plan_price: planPrice,
          currency: currency,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('id');

      referenceId = Array.isArray(result) ? result[0].id : result.id;
      logger.info('Manual payment request saved to database', {
        userId,
        referenceId,
        planName,
        planPrice,
        paymentMethod,
        preferredContact
      });
    }

    if (!referenceId) {
      throw new Error('Failed to save manual payment request');
    }

    const reqId = reqIdGenerator.generateRequestId();
    const manualPaymentEmailService = new ManualPaymentEmailService(
      brevoEmailService,
      'manual_payment',
      {
        fullName,
        email
      },
      {
        subject: 'طلب دفع يدوي - تأكيد',
        params: {
          customerName: fullName,
          planName,
          planPrice,
          currency,
          referenceId,
          paymentMethod,
          preferredContact,
          phone, // Add phone number for admin email
          accountType: 'فردي', // Add account type
          subscriptionDuration: planName.includes('سنوي') ? 'سنوي' : 'شهري',
          requestDate: new Date().toLocaleDateString('ar-SY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          notes: notes || 'لا توجد ملاحظات إضافية'
        }
      },
      reqId
    );

    // Send customer email
    await manualPaymentEmailService.sendManualPaymentEmail();

    // Send admin notification email
    await manualPaymentEmailService.sendAdminManualPaymentEmail();

    logger.info('Manual payment request submitted', {
      userId,
      planName,
      planPrice,
      paymentMethod,
      preferredContact
    });

    res.json({
      success: true,
      message: 'تم إرسال طلب الدفع اليدوي بنجاح'
    });
  } catch (error) {
    logger.error('Error submitting manual payment request', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'فشل في إرسال طلب الدفع اليدوي'
    });
  }
};

/**
 * Reactivate a subscription that was set to cancel at period end
 *
 * This function allows users to reactivate subscriptions that were previously
 * set to cancel at the end of the billing period, effectively undoing the cancellation.
 */
const reactivateSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!knex) {
      return res.status(500).json({
        success: false,
        error: 'Database connection not available'
      });
    }

    // Find user's subscription that's set to cancel
    const userSubscription = await knex('user_subscriptions')
      .where('seller_id', userId)
      .where('status', 'active')
      .where('cancel_at_period_end', true)
      .whereNull('canceled_at') // Only reactivate if not fully canceled
      .first();

    if (!userSubscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found that can be reactivated',
        details: 'Subscription must be active and set to cancel at period end'
      });
    }

    // Check if subscription is still within the current period
    const currentDate = new Date();
    const periodEndDate = new Date(userSubscription.current_period_end);

    if (currentDate > periodEndDate) {
      return res.status(400).json({
        success: false,
        error: 'Subscription period has already ended',
        details: {
          currentPeriodEnd: userSubscription.current_period_end,
          currentDate: currentDate.toISOString()
        }
      });
    }

    let reactivationResult = null;

    // Reactivate with Stripe
    if (userSubscription.stripe_subscription_id) {
      try {
        reactivationResult = await stripe.subscriptions.update(userSubscription.stripe_subscription_id, {
          cancel_at_period_end: false,
          metadata: {
            reactivated_at: new Date().toISOString(),
            reactivated_by_user: 'true',
            original_cancellation_reason: userSubscription.metadata?.cancellation_reason || 'unknown'
          }
        });

        logger.info('Stripe subscription reactivated successfully', {
          userId,
          stripeSubscriptionId: userSubscription.stripe_subscription_id,
          reactivatedAt: new Date()
        });
      } catch (stripeError) {
        logger.error('Error reactivating Stripe subscription:', {
          stripeError: stripeError.message,
          userId,
          subscriptionId: userSubscription.id
        });
        return res.status(500).json({
          success: false,
          error: 'Failed to reactivate subscription with payment provider',
          details: stripeError.message
        });
      }
    }

    // Update database to remove cancellation flags
    const updateData = {
      cancel_at_period_end: false,
      cancel_at: null,
      updated_at: new Date(),
      metadata: {
        ...userSubscription.metadata,
        reactivated_at: new Date(),
        reactivated_by_user: true,
        reactivation_count: (userSubscription.metadata?.reactivation_count || 0) + 1
      }
    };

    await knex('user_subscriptions').where('id', userSubscription.id).update(updateData);

    // Ensure premium status is active
    await knex('sellers')
      .where('id', userId)
      .update({
        is_premium: true,
        updated_at: new Date()
      })
      .catch(err => logger.warn('Failed to update user premium status:', err));

    // Prepare response
    const responseData = {
      success: true,
      subscriptionId: userSubscription.id,
      message: 'Subscription has been successfully reactivated',
      reactivatedAt: updateData.metadata.reactivated_at,
      currentPeriodEnd: userSubscription.current_period_end,
      status: 'active',
      cancelAtPeriodEnd: false
    };
    logger.info('Subscription reactivated successfully', {
      userId,
      subscriptionId: userSubscription.id,
      stripeSubscriptionId: userSubscription.stripe_subscription_id,
      reactivationCount: updateData.metadata.reactivation_count
    }); // Send reactivation confirmation email
    try {
      const requestId = reqIdGenerator.generateRequestId();
      const subscriptionEmailService = new SubscriptionEmailService(brevoEmailService, requestId);

      // Get user information for email with error handling
      let userInfo;
      try {
        userInfo = createUserInfoForEmail(req.user);
      } catch (userInfoError) {
        logger.error('Failed to create user info for reactivation email', {
          userId,
          error: userInfoError.message,
          userFields: req.user ? Object.keys(req.user) : 'user object is null'
        });
        throw userInfoError;
      }

      const reactivationDetails = {
        reactivatedAt: updateData.metadata.reactivated_at,
        count: updateData.metadata.reactivation_count
      };

      const subscriptionForEmail = {
        id: userSubscription.id,
        currentPeriodEnd: userSubscription.current_period_end,
        planDisplayName: userSubscription.plan_display_name || userSubscription.plan_name
      };

      await subscriptionEmailService.sendReactivationEmail(subscriptionForEmail, userInfo, reactivationDetails);

      logger.info('Reactivation email sent successfully', {
        userId,
        subscriptionId: userSubscription.id,
        requestId
      });
    } catch (emailError) {
      // Don't fail the reactivation if email fails, just log the error
      logger.error('Failed to send reactivation email', {
        userId,
        subscriptionId: userSubscription.id,
        error: emailError.message
      });
    }

    res.json(responseData);
  } catch (error) {
    logger.error('Error reactivating subscription:', {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to reactivate subscription',
      code: error.code || 'REACTIVATION_ERROR'
    });
  }
};

/**
 * Get user subscriptions with account type awareness
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get subscriptions using unified service
    const subscriptions = await UnifiedSubscriptionService.getUserSubscriptions(userId);

    // Get account type for context
    const accountType = await AccountTypeService.getUserAccountType(userId);

    // Get company info if applicable
    const companyInfo =
      accountType === AccountTypeService.ACCOUNT_TYPES.COMPANY ? await AccountTypeService.getUserCompany(userId) : null;

    res.json({
      success: true,
      data: {
        subscriptions,
        account_type: accountType,
        company: companyInfo,
        permissions: {
          can_manage_company_subscription: await AccountTypeService.canManageCompanySubscription(userId)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscriptions',
      message: error.message
    });
  }
};

/**
 * Get available subscription plans for user's account type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAvailablePlans = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get plans filtered by account type
    const plans = await UnifiedSubscriptionService.getAvailablePlans(userId);

    // Get account type for context
    const accountType = await AccountTypeService.getUserAccountType(userId);

    res.json({
      success: true,
      data: {
        plans,
        account_type: accountType,
        total_plans: plans.length
      }
    });
  } catch (error) {
    logger.error('Error fetching available plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plans',
      message: error.message
    });
  }
};

/**
 * Create subscription with account type validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSubscriptionWithAccountType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_id, stripe_subscription_data } = req.body;

    // Validate required fields
    if (!plan_id || !stripe_subscription_data) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID and Stripe subscription data are required'
      });
    }

    // Create subscription using unified service
    const subscription = await UnifiedSubscriptionService.createSubscription(userId, plan_id, stripe_subscription_data);

    // Get updated account context
    const accountType = await AccountTypeService.getUserAccountType(userId);
    const companyInfo =
      accountType === AccountTypeService.ACCOUNT_TYPES.COMPANY ? await AccountTypeService.getUserCompany(userId) : null;

    res.status(201).json({
      success: true,
      data: {
        subscription_id: subscription[0],
        account_type: accountType,
        company: companyInfo,
        message: `${accountType === 'company' ? 'Company' : 'Individual'} subscription created successfully`
      }
    });
  } catch (error) {
    logger.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription',
      message: error.message
    });
  }
};

/**
 * Switch account type (individual <-> company)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const switchAccountType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetAccountType, companyId, new_account_type, company_id } = req.body;

    // Support both new frontend format and legacy format
    const accountType = targetAccountType || new_account_type;
    const companyIdValue = companyId || company_id;
    logger.info('switchAccountType called with:', {
      userId,
      targetAccountType,
      companyId,
      new_account_type,
      company_id,
      resolvedAccountType: accountType,
      resolvedCompanyId: companyIdValue
    });

    logger.info('Available account types:', Object.values(AccountTypeService.ACCOUNT_TYPES));
    logger.info('Account type validation check:', {
      accountType,
      isValid: Object.values(AccountTypeService.ACCOUNT_TYPES).includes(accountType)
    });

    // Validate account type
    if (!Object.values(AccountTypeService.ACCOUNT_TYPES).includes(accountType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account type'
      });
    }

    // Validate company_id for company account type
    if (accountType === AccountTypeService.ACCOUNT_TYPES.COMPANY && !companyIdValue) {
      return res.status(400).json({
        success: false,
        error: 'Company ID is required for company account type'
      });
    }

    // Switch account type
    const success = await AccountTypeService.switchAccountType(userId, accountType, companyIdValue);
    if (!success) {
      return res.status(500).json({
        success: false,
        newAccountType: accountType,
        error: 'Failed to switch account type'
      });
    }

    // Get updated context
    const updatedAccountType = await AccountTypeService.getUserAccountType(userId);
    const companyInfo =
      updatedAccountType === AccountTypeService.ACCOUNT_TYPES.COMPANY
        ? await AccountTypeService.getUserCompanyInfo(userId)
        : null;

    res.json({
      success: true,
      newAccountType: updatedAccountType,
      message: `Account type switched to ${updatedAccountType} successfully`,
      data: {
        account_type: updatedAccountType,
        company: companyInfo
      }
    });
  } catch (error) {
    logger.error('Error switching account type:', { error, userId: req.user.id, body: req.body });
    res.status(500).json({
      success: false,
      newAccountType: req.body.targetAccountType || req.body.new_account_type || 'individual',
      error: 'Failed to switch account type',
      message: error.message
    });
  }
};

/**
 * Get subscription analytics for admin/company owners
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSubscriptionAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { account_type } = req.query;

    // Check if user has permission to view analytics
    const userAccountType = await AccountTypeService.getUserAccountType(userId);
    const canManageCompany = await AccountTypeService.canManageCompanySubscription(userId);

    // For company analytics, user must be able to manage company
    if (account_type === AccountTypeService.ACCOUNT_TYPES.COMPANY && !canManageCompany) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to view company analytics'
      });
    }

    // Get analytics for requested account type or user's account type
    const targetAccountType = account_type || userAccountType;
    const analytics = await UnifiedSubscriptionService.getSubscriptionAnalytics(targetAccountType);

    res.json({
      success: true,
      data: {
        account_type: targetAccountType,
        analytics,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching subscription analytics:', { error, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
};

/**
 * Get user's account type information
 */
const getAccountType = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get detailed account type information using AccountTypeService
    const accountType = await AccountTypeService.getUserAccountType(userId);
    const companyInfo = await AccountTypeService.getUserCompanyInfo(userId);

    res.json({
      success: true,
      accountType: accountType,
      canSwitchAccountType: true, // This could be based on business rules
      company: companyInfo,
      userId: userId
    });
  } catch (error) {
    logger.error('Error getting account type:', {
      error,
      userId: req.user.id
    });
    res.status(500).json({
      success: false,
      accountType: 'individual',
      canSwitchAccountType: false,
      error: 'Failed to get account type information'
    });
  }
};

// #TODO: Webhook handling has been moved to dedicated services (StripeWebhookService and WebhookEventProcessor)
// This controller now focuses solely on subscription management endpoints
// Webhook processing is handled by: backend/controllers/webhookController.js

// #TODO: Individual webhook handlers have been moved to StripeWebhookService
// These functions are kept as private utilities for potential direct database operations
// but primary webhook processing should use the dedicated webhook services

module.exports = {
  initializeDatabase,
  getSubscriptionPlans,
  getUserSubscriptionStatus,
  createSubscription,
  cancelSubscription,
  updateSubscription,
  submitManualPayment,
  reactivateSubscription,
  getUserSubscriptions,
  getAvailablePlans,
  createSubscriptionWithAccountType,
  switchAccountType,
  getSubscriptionAnalytics,
  getAccountType
  // #TODO: Remove handleStripeWebhook export - webhook handling moved to dedicated services
  // Legacy webhook handlers kept as internal utilities but should not be exported
  // Use webhookController.js for webhook endpoint handling
};
