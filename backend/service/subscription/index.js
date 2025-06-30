/**
 * Subscription Services Module - Modular Architecture
 *
 * EXPORTS:
 * ========
 *
 * Main Factory:
 * - SubscriptionServiceFactory: Unified interface to all subscription services
 *
 * Specialized Services:
 * - SubscriptionCoreService: Basic CRUD operations
 * - SubscriptionPaymentService: Payment recording and tracking
 * - SubscriptionLifecycleService: Cancellation, reactivation, plan changes
 * - UserAccountManagementService: User account operations
 * - SubscriptionAnalyticsService: Analytics and reporting
 *
 * USAGE EXAMPLES:
 * ===============
 *
 * // Recommended: Use the factory for unified operations
 * const { SubscriptionServiceFactory } = require('./subscription');
 * const factory = new SubscriptionServiceFactory(knex);
 * await factory.createOrUpdateSubscription(data);
 *
 * // Advanced: Use individual services for specific operations
 * const { SubscriptionCoreService } = require('./subscription');
 * const coreService = new SubscriptionCoreService(knex);
 * await coreService.getUserActiveSubscription(userId);
 *
 * // Legacy compatibility (deprecated)
 * const { SubscriptionDatabase } = require('./subscriptionDatabase');
 * const subscriptionDb = new SubscriptionDatabase(knex); // Shows deprecation warning
 */

// Main Factory (Recommended)
const { SubscriptionServiceFactory } = require('./SubscriptionServiceFactory');

// Specialized Services (For advanced usage)
const { SubscriptionCoreService } = require('./SubscriptionCoreService');
const { SubscriptionPaymentService } = require('./SubscriptionPaymentService');
const { SubscriptionLifecycleService } = require('./SubscriptionLifecycleService');
const { UserAccountManagementService } = require('./UserAccountManagementService');
const { SubscriptionAnalyticsService } = require('./SubscriptionAnalyticsService');

module.exports = {
  // Main Factory (Recommended for most use cases)
  SubscriptionServiceFactory,

  // Specialized Services (For specific operations)
  SubscriptionCoreService,
  SubscriptionPaymentService,
  SubscriptionLifecycleService,
  UserAccountManagementService,
  SubscriptionAnalyticsService,

  // Convenience factory function
  createSubscriptionServices: knex => new SubscriptionServiceFactory(knex)
};
