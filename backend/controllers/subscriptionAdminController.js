const logger = require('../utils/logger');
const SubscriptionSyncService = require('../service/subscriptionSyncService');
const SubscriptionScheduler = require('../service/subscriptionScheduler');
const { SubscriptionServiceFactory } = require('../service/subscription');
const BrevoEmailService = require('../service/brevoEmailService');
/**
 * Subscription Admin Controller
 *
 * ARCHITECTURE PRINCIPLES:
 * ========================
 *
 * 1. SINGLE RESPONSIBILITY: Handles admin operations for subscription management
 * 2. DEPENDENCY INJECTION: Services are injected for better testability
 * 3. SEPARATION OF CONCERNS: Admin operations separated from user operations
 * 4. AUTHORIZATION: Admin-only endpoints with proper security
 * 5. ERROR BOUNDARIES: Comprehensive error handling for admin operations
 *
 * USAGE:
 * ======
 *
 * This controller provides admin endpoints for:
 * - Manual sync operations
 * - Scheduler management
 * - Sync status and statistics
 * - Plan monitoring and management
 *
 * #TODO: Add admin authentication middleware
 * #TODO: Implement audit logging for admin operations
 * #TODO: Add rate limiting for admin endpoints
 * #TODO: Implement bulk operations for subscription management
 */

let knex;
let syncService;
let scheduler;
let subscriptionServiceFactory;
let brevoEmailService;

const initializeAdminServices = dbConnection => {
  knex = dbConnection;
  subscriptionServiceFactory = new SubscriptionServiceFactory(knex);
  brevoEmailService = new BrevoEmailService();
  // Initialize sync service with Stripe
  const Stripe = require('stripe');
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  syncService = new SubscriptionSyncService(knex, stripe, subscriptionServiceFactory, brevoEmailService);

  // Initialize scheduler
  scheduler = new SubscriptionScheduler(syncService);

  // Start scheduler if enabled
  if (process.env.SUBSCRIPTION_SCHEDULER_ENABLED !== 'false') {
    scheduler.start();
  }

  logger.info('Subscription admin services initialized');
};

/**
 * Get sync service status and statistics
 */
const getSyncStatus = async (req, res) => {
  try {
    // #TODO: Add admin authentication check
    // if (!req.user?.isAdmin) {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    const status = {
      scheduler: scheduler ? scheduler.getStatus() : null,
      lastSync: syncService ? syncService.lastSyncTime : null,
      services: {
        syncService: !!syncService,
        scheduler: !!scheduler,
        database: !!subscriptionServiceFactory
      },
      environment: {
        schedulerEnabled: process.env.SUBSCRIPTION_SCHEDULER_ENABLED !== 'false',
        fullSyncSchedule: process.env.SUBSCRIPTION_FULL_SYNC_SCHEDULE || '0 2 * * *',
        planMonitorSchedule: process.env.SUBSCRIPTION_PLAN_MONITOR_SCHEDULE || '*/30 * * * *',
        activeSyncSchedule: process.env.SUBSCRIPTION_ACTIVE_SYNC_SCHEDULE || '*/15 * * * *'
      }
    };

    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting sync status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status'
    });
  }
};

/**
 * Manually trigger subscription sync
 */
const triggerSync = async (req, res) => {
  try {
    // #TODO: Add admin authentication check

    const { type = 'active', options = {} } = req.body;

    if (!syncService) {
      return res.status(503).json({
        success: false,
        error: 'Sync service not available'
      });
    }

    logger.info('Manual sync triggered', {
      type,
      options,
      triggeredBy: req.user?.id || 'unknown'
    });

    let result;
    switch (type) {
      case 'full':
        result = await syncService.syncAllSubscriptions('full', options);
        break;
      case 'plans':
        result = await syncService.monitorNewPlans(options);
        break;
      case 'active':
      default:
        result = await syncService.syncAllSubscriptions('active_only', options);
        break;
    }

    res.json({
      success: true,
      result,
      triggeredAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error triggering manual sync', {
      error: error.message,
      type: req.body?.type,
      triggeredBy: req.user?.id || 'unknown'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to trigger sync'
    });
  }
};

/**
 * Monitor and discover new subscription plans
 */
const monitorPlans = async (req, res) => {
  try {
    // #TODO: Add admin authentication check

    const { autoAdd = false } = req.body;

    if (!syncService) {
      return res.status(503).json({
        success: false,
        error: 'Sync service not available'
      });
    }

    logger.info('Plan monitoring triggered', {
      autoAdd,
      triggeredBy: req.user?.id || 'unknown'
    });

    const result = await syncService.monitorNewPlans({ autoAdd });

    res.json({
      success: true,
      result,
      triggeredAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error monitoring plans', {
      error: error.message,
      triggeredBy: req.user?.id || 'unknown'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to monitor plans'
    });
  }
};

/**
 * Control scheduler (start/stop/restart)
 */
const controlScheduler = async (req, res) => {
  try {
    // #TODO: Add admin authentication check

    const { action } = req.body;

    if (!scheduler) {
      return res.status(503).json({
        success: false,
        error: 'Scheduler service not available'
      });
    }

    logger.info('Scheduler control triggered', {
      action,
      triggeredBy: req.user?.id || 'unknown'
    });

    let result;
    switch (action) {
      case 'start':
        scheduler.start();
        result = 'Scheduler started';
        break;
      case 'stop':
        scheduler.stop();
        result = 'Scheduler stopped';
        break;
      case 'restart':
        scheduler.stop();
        scheduler.start();
        result = 'Scheduler restarted';
        break;
      case 'status':
        result = scheduler.getStatus();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Use: start, stop, restart, or status'
        });
    }

    res.json({
      success: true,
      result,
      action,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error controlling scheduler', {
      error: error.message,
      action: req.body?.action,
      triggeredBy: req.user?.id || 'unknown'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to control scheduler'
    });
  }
};

/**
 * Get subscription analytics and insights
 */
const getSubscriptionAnalytics = async (req, res) => {
  try {
    // #TODO: Add admin authentication check

    if (!knex) {
      return res.status(503).json({
        success: false,
        error: 'Database service not available'
      });
    }

    // Get subscription statistics
    const totalSubscriptions = await knex('user_subscriptions').count('* as count').first();
    const activeSubscriptions = await knex('user_subscriptions').where('status', 'active').count('* as count').first();

    const planDistribution = await knex('user_subscriptions')
      .leftJoin('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.stripe_price_id')
      .select('subscription_plans.display_name as plan_name')
      .select('user_subscriptions.status')
      .count('* as count')
      .groupBy('subscription_plans.display_name', 'user_subscriptions.status');

    const recentSubscriptions = await knex('user_subscriptions').select('*').orderBy('created_at', 'desc').limit(10);

    // Get plan statistics
    const totalPlans = await knex('subscription_plans').count('* as count').first();
    const activePlans = await knex('subscription_plans').where('is_active', true).count('* as count').first();

    const analytics = {
      subscriptions: {
        total: totalSubscriptions.count,
        active: activeSubscriptions.count,
        distribution: planDistribution,
        recent: recentSubscriptions
      },
      plans: {
        total: totalPlans.count,
        active: activePlans.count
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error('Error getting subscription analytics', {
      error: error.message,
      requestedBy: req.user?.id || 'unknown'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get subscription analytics'
    });
  }
};

module.exports = {
  initializeAdminServices,
  getSyncStatus,
  triggerSync,
  monitorPlans,
  controlScheduler,
  getSubscriptionAnalytics
};
