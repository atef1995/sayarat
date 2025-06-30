const cron = require('node-cron');
const logger = require('../utils/logger');

/**
 * Subscription Scheduler Service
 *
 * ARCHITECTURE PRINCIPLES:
 * ========================
 *
 * 1. SINGLE RESPONSIBILITY: Handles scheduling of subscription sync tasks
 * 2. DEPENDENCY INJECTION: Receives sync service for better testability
 * 3. OBSERVER PATTERN: Can notify other services of scheduled events
 * 4. COMMAND PATTERN: Encapsulates sync operations as commands
 * 5. ERROR BOUNDARIES: Comprehensive error handling for scheduled tasks
 *
 * USAGE:
 * ======
 *
 * const scheduler = new SubscriptionScheduler(syncService);
 * scheduler.start();
 *
 * #TODO: Add configurable schedules via environment variables
 * #TODO: Implement task persistence and recovery after restart
 * #TODO: Add health checks and monitoring for scheduled tasks
 * #TODO: Implement task priority and queue management
 */
class SubscriptionScheduler {
  constructor(syncService, options = {}) {
    if (!syncService) {
      throw new Error('SubscriptionSyncService is required for SubscriptionScheduler');
    }

    this.syncService = syncService;
    this.options = {
      // Default schedules (can be overridden via environment variables)
      fullSyncSchedule: process.env.SUBSCRIPTION_FULL_SYNC_SCHEDULE || '0 2 * * *', // Daily at 2 AM
      planMonitorSchedule: process.env.SUBSCRIPTION_PLAN_MONITOR_SCHEDULE || '*/30 * * * *', // Every 30 minutes
      activeSyncSchedule: process.env.SUBSCRIPTION_ACTIVE_SYNC_SCHEDULE || '*/15 * * * *', // Every 15 minutes
      enabled: process.env.SUBSCRIPTION_SCHEDULER_ENABLED !== 'false', // Enabled by default
      ...options
    };

    this.tasks = new Map();
    this.isRunning = false;
    this.stats = {
      tasksExecuted: 0,
      lastFullSync: null,
      lastPlanMonitor: null,
      lastActiveSync: null,
      errors: []
    };
  }

  /**
   * Start all scheduled tasks
   */
  start() {
    if (this.isRunning) {
      logger.warn('Subscription scheduler is already running');
      return;
    }

    if (!this.options.enabled) {
      logger.info('Subscription scheduler is disabled');
      return;
    }

    try {
      logger.info('Starting subscription scheduler', {
        schedules: {
          fullSync: this.options.fullSyncSchedule,
          planMonitor: this.options.planMonitorSchedule,
          activeSync: this.options.activeSyncSchedule
        }
      });

      // Schedule full sync (daily)
      this._scheduleTask('fullSync', this.options.fullSyncSchedule, async() => {
        await this._executeFullSync();
      });

      // Schedule plan monitoring (every 30 minutes)
      this._scheduleTask('planMonitor', this.options.planMonitorSchedule, async() => {
        await this._executePlanMonitor();
      });

      // Schedule active subscription sync (every 15 minutes)
      this._scheduleTask('activeSync', this.options.activeSyncSchedule, async() => {
        await this._executeActiveSync();
      });

      this.isRunning = true;
      logger.info('Subscription scheduler started successfully');
    } catch (error) {
      logger.error('Failed to start subscription scheduler', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Subscription scheduler is not running');
      return;
    }

    try {
      logger.info('Stopping subscription scheduler');

      // Stop all cron tasks
      for (const [taskName, task] of this.tasks) {
        task.stop();
        logger.info(`Stopped scheduled task: ${taskName}`);
      }

      this.tasks.clear();
      this.isRunning = false;

      logger.info('Subscription scheduler stopped successfully');
    } catch (error) {
      logger.error('Error stopping subscription scheduler', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Get scheduler status and statistics
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      tasksCount: this.tasks.size,
      stats: this.stats,
      nextExecutions: this._getNextExecutions(),
      options: this.options
    };
  }

  /**
   * Manually trigger a specific sync operation
   */
  async triggerSync(type = 'active', options = {}) {
    try {
      logger.info('Manually triggering sync', { type, options });

      let result;
      switch (type) {
        case 'full':
          result = await this._executeFullSync(options);
          break;
        case 'plans':
          result = await this._executePlanMonitor(options);
          break;
        case 'active':
        default:
          result = await this._executeActiveSync(options);
          break;
      }

      logger.info('Manual sync completed', { type, result });
      return result;
    } catch (error) {
      logger.error('Manual sync failed', { type, error: error.message });
      throw error;
    }
  }

  /**
   * Schedule a task using cron
   * @private
   */
  _scheduleTask(name, schedule, handler) {
    const task = cron.schedule(
      schedule,
      async() => {
        const taskId = `${name}_${Date.now()}`;

        try {
          logger.info('Executing scheduled task', { taskName: name, taskId, schedule });

          const startTime = Date.now();
          await handler();
          const duration = Date.now() - startTime;

          this.stats.tasksExecuted++;
          this.stats[`last${name.charAt(0).toUpperCase() + name.slice(1)}`] = new Date();

          logger.info('Scheduled task completed', {
            taskName: name,
            taskId,
            duration: `${duration}ms`
          });
        } catch (error) {
          logger.error('Scheduled task failed', {
            taskName: name,
            taskId,
            error: error.message,
            stack: error.stack
          });

          this.stats.errors.push({
            taskName: name,
            taskId,
            error: error.message,
            timestamp: new Date()
          });

          // Keep only last 10 errors
          if (this.stats.errors.length > 10) {
            this.stats.errors = this.stats.errors.slice(-10);
          }
        }
      },
      {
        scheduled: false,
        timezone: process.env.TZ || 'UTC'
      }
    );

    this.tasks.set(name, task);
    task.start();

    logger.info(`Scheduled task registered: ${name}`, { schedule });
  }

  /**
   * Execute full subscription sync
   * @private
   */
  async _executeFullSync(options = {}) {
    logger.info('Starting scheduled full sync');

    const result = await this.syncService.syncAllSubscriptions('full', {
      ...options,
      scheduledTask: true
    });

    logger.info('Full sync completed', {
      updated: result.subscriptionsUpdated,
      errors: result.errors.length
    });

    return result;
  }

  /**
   * Execute plan monitoring
   * @private
   */
  async _executePlanMonitor(options = {}) {
    logger.info('Starting scheduled plan monitoring');

    const result = await this.syncService.monitorNewPlans({
      autoAdd: true, // Auto-add new plans when found
      ...options,
      scheduledTask: true
    });

    logger.info('Plan monitoring completed', {
      newPlans: result.newPlansFound.length,
      errors: result.errors.length
    });

    return result;
  }

  /**
   * Execute active subscription sync
   * @private
   */
  async _executeActiveSync(options = {}) {
    logger.info('Starting scheduled active sync');

    const result = await this.syncService.syncAllSubscriptions('active_only', {
      ...options,
      scheduledTask: true
    });

    logger.info('Active sync completed', {
      updated: result.subscriptionsUpdated,
      errors: result.errors.length
    });

    return result;
  }

  /**
   * Get next execution times for all tasks
   * @private
   */
  _getNextExecutions() {
    const nextExecutions = {};

    for (const [taskName, task] of this.tasks) {
      try {
        // Note: node-cron doesn't provide next execution time directly
        // This is a simplified representation
        nextExecutions[taskName] = 'Scheduled';
      } catch (error) {
        nextExecutions[taskName] = 'Error getting next execution';
      }
    }

    return nextExecutions;
  }
}

module.exports = SubscriptionScheduler;
