/**
 * Sitemap Management Script for Cars-Bids Platform
 * 
 * Automated sitemap generation and submission for optimal SEO
 * Optimized for Arabic content and Syria/Middle East market
 * 
 * Usage:
 * - node scripts/generateSitemap.js --generate (Generate all sitemaps)
 * - node scripts/generateSitemap.js --submit (Submit to search engines)
 * - node scripts/generateSitemap.js --stats (Show statistics)
 * 
 * @module SitemapScript
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const knex = require('../config/database');
const SitemapService = require('../service/seo/sitemapService');
const logger = require('../utils/logger');

/**
 * Sitemap Management Class
 */
class SitemapManager {
  constructor() {
    this.sitemapService = new SitemapService(knex);
    this.outputDir = path.join(__dirname, '../public/sitemaps');
    this.baseUrl = process.env.SITE_URL || 'https://sayarat.autos';
  }

  /**
   * Generate all sitemaps and save to files
   */
  async generateSitemaps() {
    try {
      // Ensure output directory exists
      await this.ensureDirectory(this.outputDir);

      logger.info('Starting sitemap generation...');

      // Generate all sitemap types
      const sitemaps = await Promise.all([
        this.generateAndSave('sitemap.xml', () => this.sitemapService.generateSitemapIndex()),
        this.generateAndSave('sitemap-static.xml', () => this.sitemapService.generateStaticSitemap()),
        this.generateAndSave('sitemap-cars.xml', () => this.sitemapService.generateCarsSitemap()),
        this.generateAndSave('sitemap-companies.xml', () => this.sitemapService.generateCompaniesSitemap()),
        this.generateAndSave('sitemap-blog.xml', () => this.sitemapService.generateBlogSitemap()),
        this.generateAndSave('sitemap-categories.xml', () => this.sitemapService.generateCategoriesSitemap()),
        this.generateAndSave('robots.txt', () => Promise.resolve(this.sitemapService.generateRobotsTxt()))
      ]);

      // Generate statistics
      const stats = await this.generateStats();
      await this.saveStats(stats);

      // Generate manual submission instructions
      await this.generateSubmissionInstructions();

      logger.info('Sitemap generation completed successfully');
      console.log('✅ All sitemaps generated successfully');
      console.log(`📁 Files saved to: ${this.outputDir}`);
      console.log(`📊 Total URLs: ${stats.total}`);
      console.log(`📋 Manual submission instructions created`);

      return sitemaps;
    } catch (error) {
      logger.error('Error generating sitemaps:', error);
      console.error('❌ Error generating sitemaps:', error.message);
      throw error;
    }
  }

  /**
   * Submit sitemaps to search engines
   */
  async submitSitemaps() {
    try {
      logger.info('Starting sitemap submission...');

      const submissions = [
        // Google Search Console (deprecated ping endpoint)
        this.submitToGoogle(`${this.baseUrl}/sitemap.xml`),
        // Bing Webmaster Tools (deprecated ping endpoint)
        this.submitToBing(`${this.baseUrl}/sitemap.xml`),
        // Yandex (still supported)
        this.submitToYandex(`${this.baseUrl}/sitemap.xml`)
      ];

      const results = await Promise.allSettled(submissions);

      results.forEach((result, index) => {
        const engines = ['Google', 'Bing', 'Yandex'];
        if (result.status === 'fulfilled') {
          if (index === 0 || index === 1) { // Google or Bing
            console.log(`ℹ️  ${engines[index]}: ${result.value}`);
          } else {
            console.log(`✅ Successfully submitted to ${engines[index]}`);
          }
          logger.info(`Sitemap submission for ${engines[index]}: ${result.value}`);
        } else {
          console.log(`❌ Failed to submit to ${engines[index]}: ${result.reason}`);
          logger.error(`Failed to submit to ${engines[index]}:`, result.reason);
        }
      });

      // Provide manual submission instructions
      console.log('\n📋 Manual Submission Instructions:');
      console.log('='.repeat(50));
      console.log(`🔍 Google Search Console: https://search.google.com/search-console`);
      console.log(`   Add property: ${this.baseUrl}`);
      console.log(`   Submit sitemap: ${this.baseUrl}/sitemap.xml`);
      console.log('');
      console.log(`🌐 Bing Webmaster Tools: https://www.bing.com/webmasters`);
      console.log(`   Add site: ${this.baseUrl}`);
      console.log(`   Submit sitemap: ${this.baseUrl}/sitemap.xml`);
      console.log('');
      console.log(`🌍 Yandex Webmaster: https://webmaster.yandex.com`);
      console.log(`   Automatically submitted via ping endpoint`);

      logger.info('Sitemap submission completed');
    } catch (error) {
      logger.error('Error submitting sitemaps:', error);
      console.error('❌ Error submitting sitemaps:', error.message);
      throw error;
    }
  }

  /**
   * Generate and display sitemap statistics
   */
  async showStats() {
    try {
      const stats = await this.generateStats();

      console.log('\n📊 Sitemap Statistics');
      console.log('='.repeat(50));
      console.log(`🔗 Total URLs: ${stats.total}`);
      console.log(`📄 Static pages: ${stats.urls.static}`);
      console.log(`🚗 Car listings: ${stats.urls.cars}`);
      console.log(`🏢 Companies: ${stats.urls.companies}`);
      console.log(`📝 Blog posts: ${stats.urls.blog}`);
      console.log(`📂 Categories: ${stats.urls.categories}`);
      console.log(`📅 Last generated: ${stats.lastGenerated}`);
      console.log(`🌍 Target region: Syria (SY)`);
      console.log(`🗣️  Language: Arabic (ar, ar-SY)`);

      return stats;
    } catch (error) {
      logger.error('Error generating stats:', error);
      console.error('❌ Error generating stats:', error.message);
      throw error;
    }
  }

  /**
   * Generate and save a single sitemap
   */
  async generateAndSave(filename, generator) {
    try {
      const content = await generator();
      const filePath = path.join(this.outputDir, filename);
      await fs.writeFile(filePath, content, 'utf8');

      console.log(`✅ Generated: ${filename}`);
      logger.info(`Generated sitemap: ${filename}`);

      return { filename, size: content.length };
    } catch (error) {
      console.error(`❌ Failed to generate: ${filename}`);
      logger.error(`Failed to generate ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Generate comprehensive statistics
   */
  async generateStats() {
    try {
      // Get counts from database
      const [carsCount, companiesCount, blogCount] = await Promise.all([
        knex('listed_cars').where('status', 'active').count('* as count').first(),
        knex('companies').count('* as count').first(),
        knex('blog_posts').where('status', 'published').count('* as count').first()
      ]);

      const stats = {
        lastGenerated: new Date().toISOString(),
        urls: {
          static: 9, // Fixed number of static pages
          cars: parseInt(carsCount?.count || 0),
          companies: parseInt(companiesCount?.count || 0),
          blog: parseInt(blogCount?.count || 0),
          categories: 14 // 8 car types + 6 locations
        },
        optimization: {
          targetRegion: 'Syria (SY)',
          languages: ['Arabic (ar)', 'Arabic-Syria (ar-SY)'],
          hreflang: ['ar', 'ar-SY', 'x-default'],
          geoTarget: 'SY',
          features: [
            'Multi-language support',
            'Geographic targeting',
            'Arabic content optimization',
            'Damascus timezone',
            'Middle East focus'
          ]
        },
        searchEngines: {
          google: `${this.baseUrl}/sitemap.xml`,
          bing: `${this.baseUrl}/sitemap.xml`,
          yandex: `${this.baseUrl}/sitemap.xml`
        }
      };

      const totalUrls = Object.values(stats.urls).reduce((sum, count) => sum + count, 0);
      stats.total = totalUrls;

      return stats;
    } catch (error) {
      logger.error('Error generating statistics:', error);
      throw error;
    }
  }

  /**
   * Save statistics to file
   */
  async saveStats(stats) {
    try {
      const statsPath = path.join(this.outputDir, 'sitemap-stats.json');
      await fs.writeFile(statsPath, JSON.stringify(stats, null, 2), 'utf8');
      console.log(`📊 Statistics saved to: sitemap-stats.json`);
    } catch (error) {
      logger.error('Error saving statistics:', error);
    }
  }

  /**
   * Submit sitemap to Google
   * Note: Google deprecated the ping endpoint. Manual submission via Search Console is recommended.
   */
  async submitToGoogle(sitemapUrl) {
    // Google has deprecated the ping endpoint as of 2023
    // Return a message indicating manual submission is required
    logger.warn('Google ping endpoint is deprecated. Please submit manually via Google Search Console.');
    return Promise.resolve('Google ping endpoint deprecated - submit manually via Search Console at https://search.google.com/search-console');
  }

  /**
   * Submit sitemap to Bing
   * Note: Bing has deprecated the ping endpoint. Manual submission via Bing Webmaster Tools is recommended.
   */
  async submitToBing(sitemapUrl) {
    // Bing has also deprecated the ping endpoint
    // Return a message indicating manual submission is required
    logger.warn('Bing ping endpoint is deprecated. Please submit manually via Bing Webmaster Tools.');
    return Promise.resolve('Bing ping endpoint deprecated - submit manually via Bing Webmaster Tools at https://www.bing.com/webmasters');
  }

  /**
   * Submit sitemap to Yandex
   */
  async submitToYandex(sitemapUrl) {
    const submitUrl = `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    return this.makeHttpRequest(submitUrl, 'Yandex');
  }

  /**
   * Make HTTP request for sitemap submission
   */
  async makeHttpRequest(url, engine) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(`Submitted to ${engine} successfully`);
        } else {
          reject(new Error(`${engine} submission failed with status: ${response.statusCode}`));
        }
      });

      request.on('error', (error) => {
        reject(new Error(`${engine} submission failed: ${error.message}`));
      });

      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error(`${engine} submission timed out`));
      });
    });
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectory(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dirPath}`);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      await knex.destroy();
      console.log('🧹 Database connection closed');
    } catch (error) {
      logger.error('Error cleaning up:', error);
    }
  }

  /**
   * Generate manual submission instructions file
   */
  async generateSubmissionInstructions() {
    try {
      const instructions = `# Manual Sitemap Submission Instructions
      
## Overview
Google and Bing have deprecated their ping endpoints for sitemap submission.
Manual submission through their webmaster tools is now required.

## 🔍 Google Search Console

1. Visit: https://search.google.com/search-console
2. Add your property: ${this.baseUrl}
3. Verify ownership (DNS, HTML file, or HTML tag)
4. Navigate to "Sitemaps" in the left sidebar
5. Submit your sitemap URL: ${this.baseUrl}/sitemap.xml

### Additional Google Sitemaps to Submit:
- ${this.baseUrl}/sitemap-static.xml
- ${this.baseUrl}/sitemap-cars.xml
- ${this.baseUrl}/sitemap-companies.xml
- ${this.baseUrl}/sitemap-blog.xml
- ${this.baseUrl}/sitemap-categories.xml

## 🌐 Bing Webmaster Tools

1. Visit: https://www.bing.com/webmasters
2. Add your site: ${this.baseUrl}
3. Verify ownership (XML file, meta tag, or CNAME)
4. Navigate to "Sitemaps" section
5. Submit your sitemap URL: ${this.baseUrl}/sitemap.xml

## 🌍 Yandex Webmaster

Yandex still supports automatic submission via ping endpoint.
✅ Automatically submitted when running \`--submit\` command.

Manual submission available at: https://webmaster.yandex.com

## 📋 SEO Benefits for Arabic Market

- **Geographic Targeting**: All sitemaps include Syria (SY) geo-targeting
- **Language Support**: Hreflang tags for Arabic (ar, ar-SY)
- **Local Content**: Syrian cities and Arabic car categories prioritized
- **Update Frequency**: Optimized for Damascus timezone

## 🔄 Automation Schedule

- Daily generation: 3:00 AM Damascus time
- Weekly submission: Sundays 4:00 AM Damascus time
- Monthly comprehensive rebuild: 1st of month 2:00 AM

Generated on: ${new Date().toISOString()}
Base URL: ${this.baseUrl}
Target Market: Syria and Middle East (Arabic speakers)
`;

      const instructionsPath = path.join(this.outputDir, 'MANUAL_SUBMISSION_INSTRUCTIONS.md');
      await fs.writeFile(instructionsPath, instructions, 'utf8');
      console.log(`📋 Manual submission instructions saved to: MANUAL_SUBMISSION_INSTRUCTIONS.md`);

      return instructionsPath;
    } catch (error) {
      logger.error('Error generating submission instructions:', error);
    }
  }

  /**
   * Test Arabic metadata integration
   */
  async testArabicMetadataIntegration() {
    try {
      logger.info('Testing Arabic metadata integration...');
      console.log('\n🌍 Testing Arabic Metadata Integration...');

      const ArabicMetadataService = require('../service/seo/arabicMetadataService');
      const arabicService = new ArabicMetadataService();

      // Test metadata retrieval
      const metadata = arabicService.getSitemapMetadata();
      console.log(`✅ Car types with Arabic names: ${metadata.carTypes.length}`);
      console.log(`✅ Syrian cities with Arabic names: ${metadata.cities.length}`);
      console.log(`✅ Fuel types with Arabic names: ${metadata.fuelTypes.length}`);

      // Test enhanced sitemap generation
      const enhancedSitemap = await this.sitemapService.generateCategoriesSitemap();
      const hasArabicData = enhancedSitemap.includes('sedan') && enhancedSitemap.includes('damascus');
      console.log(`✅ Enhanced sitemap with Arabic data: ${hasArabicData ? 'Yes' : 'No'}`);

      console.log(`📊 Arabic metadata integration: ${metadata.market.region} (${metadata.market.regionEnglish})`);
      logger.info('Arabic metadata integration test completed successfully');
    } catch (error) {
      logger.error('Error testing Arabic metadata integration:', error);
      console.error('❌ Arabic metadata integration test failed:', error.message);
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  const manager = new SitemapManager();
  const args = process.argv.slice(2);

  try {
    if (args.includes('--generate') || args.length === 0) {
      await manager.generateSitemaps();
      // Test Arabic metadata integration after generating sitemaps
      await manager.testArabicMetadataIntegration();
    }

    if (args.includes('--submit')) {
      await manager.submitSitemaps();
    }

    if (args.includes('--stats')) {
      await manager.showStats();
    }

    if (args.includes('--test-arabic')) {
      await manager.testArabicMetadataIntegration();
    }

    if (args.includes('--help')) {
      console.log(`
🗺️  Sitemap Management Script for Cars-Bids Platform

Usage:
  node scripts/generateSitemap.js [options]

Options:
  --generate    Generate all sitemap files (default if no options)
  --submit      Submit sitemaps to search engines (with manual instructions)
  --stats       Show sitemap statistics
  --test-arabic Test Arabic metadata integration
  --help        Show this help message

Examples:
  node scripts/generateSitemap.js
  node scripts/generateSitemap.js --generate --submit
  node scripts/generateSitemap.js --stats
  node scripts/generateSitemap.js --test-arabic

Features:
  ✅ Arabic content optimization
  ✅ Syria/Middle East geo-targeting
  ✅ Multi-language support (ar, ar-SY)
  ✅ Yandex automatic submission
  ✅ Manual submission guidance for Google & Bing
  ✅ Comprehensive statistics
  ✅ File caching and optimization
  ✅ Arabic metadata integration testing

Note: Google and Bing have deprecated their ping endpoints.
Manual submission via their webmaster tools is now required.
      `);
    }

  } catch (error) {
    console.error('❌ Script execution failed:', error.message);
    process.exit(1);
  } finally {
    await manager.cleanup();
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = SitemapManager;
