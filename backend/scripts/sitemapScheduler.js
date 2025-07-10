/**
 * Automated Sitemap Generation Scheduler
 * 
 * Provides automated sitemap updates for optimal SEO performance
 * Designed for Arabic content and Syria/Middle East market
 * 
 * @module SitemapScheduler
 */

const cron = require('node-cron');
const SitemapManager = require('./generateSitemap');
const logger = require('../utils/logger');

/**
 * Sitemap Scheduler Class
 * Manages automated sitemap generation and submission
 */
class SitemapScheduler {
  constructor() {
    this.manager = new SitemapManager();
    this.isRunning = false;
  }

  /**
   * Initialize all scheduled tasks
   */
  initialize() {
    logger.info('Initializing sitemap scheduler...');

    // Daily sitemap generation at 3:00 AM Damascus time
    // This ensures fresh sitemaps are available when most users are offline
    cron.schedule('0 3 * * *', async () => {
      await this.runDailyGeneration();
    }, {
      scheduled: true,
      timezone: 'Asia/Damascus'
    });

    // Weekly submission to search engines on Sundays at 4:00 AM
    cron.schedule('0 4 * * 0', async () => {
      await this.runWeeklySubmission();
    }, {
      scheduled: true,
      timezone: 'Asia/Damascus'
    });

    // Hourly cache refresh for high-traffic periods (9 AM - 9 PM Damascus time)
    cron.schedule('0 9-21 * * *', async () => {
      await this.runHourlyRefresh();
    }, {
      scheduled: true,
      timezone: 'Asia/Damascus'
    });

    // Monthly comprehensive rebuild on the 1st of each month at 2:00 AM
    cron.schedule('0 2 1 * *', async () => {
      await this.runMonthlyRebuild();
    }, {
      scheduled: true,
      timezone: 'Asia/Damascus'
    });

    logger.info('Sitemap scheduler initialized successfully');
    console.log('🗂️  Sitemap scheduler started');
    console.log('⏰ Daily generation: 3:00 AM Damascus time');
    console.log('📤 Weekly submission: Sundays 4:00 AM Damascus time');
    console.log('🔄 Hourly refresh: 9:00 AM - 9:00 PM Damascus time');
    console.log('🔧 Monthly rebuild: 1st of month 2:00 AM Damascus time');
  }

  /**
   * Run daily sitemap generation
   */
  async runDailyGeneration() {
    if (this.isRunning) {
      logger.warn('Sitemap generation already running, skipping daily task');
      return;
    }

    try {
      this.isRunning = true;
      logger.info('Starting daily sitemap generation...');

      await this.manager.generateSitemaps();

      // Log statistics
      const stats = await this.manager.showStats();
      logger.info('Daily sitemap generation completed', {
        totalUrls: stats.total,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Daily sitemap generation failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run weekly submission to search engines
   */
  async runWeeklySubmission() {
    try {
      logger.info('Starting weekly sitemap submission...');

      await this.manager.submitSitemaps();

      logger.info('Weekly sitemap submission completed');

    } catch (error) {
      logger.error('Weekly sitemap submission failed:', error);
    }
  }

  /**
   * Run hourly cache refresh during high-traffic periods
   */
  async runHourlyRefresh() {
    try {
      // Only refresh if there have been recent updates
      const lastUpdate = await this.getLastContentUpdate();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      if (lastUpdate > oneHourAgo) {
        logger.info('Starting hourly sitemap refresh...');

        // Only regenerate the most dynamic sitemaps
        await this.manager.generateAndSave('sitemap-cars.xml',
          () => this.manager.sitemapService.generateCarsSitemap());
        await this.manager.generateAndSave('sitemap.xml',
          () => this.manager.sitemapService.generateSitemapIndex());

        logger.info('Hourly sitemap refresh completed');
      } else {
        logger.debug('No recent content updates, skipping hourly refresh');
      }

    } catch (error) {
      logger.error('Hourly sitemap refresh failed:', error);
    }
  }

  /**
   * Run monthly comprehensive rebuild
   */
  async runMonthlyRebuild() {
    try {
      logger.info('Starting monthly sitemap rebuild...');

      // Full regeneration and submission
      await this.manager.generateSitemaps();
      await this.manager.submitSitemaps();

      // Clean up old sitemap files if needed
      await this.cleanupOldSitemaps();

      logger.info('Monthly sitemap rebuild completed');

    } catch (error) {
      logger.error('Monthly sitemap rebuild failed:', error);
    }
  }

  /**
   * Get last content update timestamp
   */
  async getLastContentUpdate() {
    try {
      const knex = require('../config/database');

      const lastUpdates = await Promise.all([
        knex('listings').max('updated_at as last_update').first(),
        knex('companies').max('updated_at as last_update').first(),
        knex('blog_posts').max('updated_at as last_update').first()
      ]);

      const timestamps = lastUpdates
        .map(result => result?.last_update)
        .filter(Boolean)
        .map(timestamp => new Date(timestamp));

      return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date(0);

    } catch (error) {
      logger.error('Error getting last content update:', error);
      return new Date(0);
    }
  }

  /**
   * Clean up old sitemap files
   */
  async cleanupOldSitemaps() {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      const sitemapDir = path.join(__dirname, '../public/sitemaps');
      const files = await fs.readdir(sitemapDir);

      // Keep current files and one backup
      const keepFiles = [
        'sitemap.xml',
        'sitemap-static.xml',
        'sitemap-cars.xml',
        'sitemap-companies.xml',
        'sitemap-blog.xml',
        'sitemap-categories.xml',
        'robots.txt',
        'sitemap-stats.json'
      ];

      for (const file of files) {
        if (!keepFiles.includes(file) && file.endsWith('.xml')) {
          const filePath = path.join(sitemapDir, file);
          const stats = await fs.stat(filePath);
          const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

          // Delete files older than 30 days
          if (ageInDays > 30) {
            await fs.unlink(filePath);
            logger.info(`Cleaned up old sitemap file: ${file}`);
          }
        }
      }

    } catch (error) {
      logger.error('Error cleaning up old sitemaps:', error);
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    cron.getTasks().forEach((task, name) => {
      task.stop();
      logger.info(`Stopped scheduled task: ${name}`);
    });

    console.log('🛑 Sitemap scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    const tasks = cron.getTasks();
    const status = {
      isInitialized: tasks.size > 0,
      isRunning: this.isRunning,
      activeTasks: tasks.size,
      nextRuns: Array.from(tasks.entries()).map(([name, task]) => ({
        name,
        running: task.running
      })),
      timezone: 'Asia/Damascus',
      schedules: {
        dailyGeneration: '0 3 * * * (3:00 AM daily)',
        weeklySubmission: '0 4 * * 0 (4:00 AM Sundays)',
        hourlyRefresh: '0 9-21 * * * (9:00 AM - 9:00 PM)',
        monthlyRebuild: '0 2 1 * * (2:00 AM 1st of month)'
      }
    };

    return status;
  }
}

// Export singleton instance
const sitemapScheduler = new SitemapScheduler();

module.exports = sitemapScheduler;
