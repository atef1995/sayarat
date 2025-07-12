/**
 * Sitemap Controller for Cars-Bids Platform
 * 
 * Handles sitemap generation and delivery with proper caching
 * Optimized for Arabic content and Syria/Middle East market
 * 
 * @module SitemapController
 */

const SitemapService = require('../../service/seo/sitemapService');
const logger = require('../../utils/logger');

/**
 * Sitemap Controller Class
 * Implements caching and error handling for sitemap requests
 */
class SitemapController {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Bind methods to preserve 'this' context
    this.getSitemapIndex = this.getSitemapIndex.bind(this);
    this.getStaticSitemap = this.getStaticSitemap.bind(this);
    this.getCarsSitemap = this.getCarsSitemap.bind(this);
    this.getCompaniesSitemap = this.getCompaniesSitemap.bind(this);
    this.getBlogSitemap = this.getBlogSitemap.bind(this);
    this.getCategoriesSitemap = this.getCategoriesSitemap.bind(this);
    this.getRobotsTxt = this.getRobotsTxt.bind(this);
    this.getSitemapStats = this.getSitemapStats.bind(this);
    this.clearCache = this.clearCache.bind(this);
    this.getCarsForSitemap = this.getCarsForSitemap.bind(this);
    this.getCompaniesForSitemap = this.getCompaniesForSitemap.bind(this);
    this.getBlogPostsForSitemap = this.getBlogPostsForSitemap.bind(this);
    this.getCategoriesForSitemap = this.getCategoriesForSitemap.bind(this);
    this.getCitiesForSitemap = this.getCitiesForSitemap.bind(this);
    this.getArabicMetadata = this.getArabicMetadata.bind(this);
  }

  /**
   * Serve main sitemap index
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSitemapIndex(req, res) {
    try {
      const cacheKey = 'sitemap-index';
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return this.sendXMLResponse(res, cached);
      }

      const sitemapService = new SitemapService(req.knex || req.app.locals.knex);
      const sitemap = await sitemapService.generateSitemapIndex();

      this.setCache(cacheKey, sitemap);
      this.sendXMLResponse(res, sitemap);

      logger.info('Generated sitemap index successfully');
    } catch (error) {
      logger.error('Error generating sitemap index:', error);
      res.status(500).json({
        error: 'Failed to generate sitemap index',
        message: 'خطأ في إنشاء فهرس الخريطة'
      });
    }
  }

  /**
   * Serve static pages sitemap
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getStaticSitemap(req, res) {
    try {
      const cacheKey = 'sitemap-static';
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return this.sendXMLResponse(res, cached);
      }

      const sitemapService = new SitemapService(req.knex || req.app.locals.knex);
      const sitemap = await sitemapService.generateStaticSitemap();

      this.setCache(cacheKey, sitemap);
      this.sendXMLResponse(res, sitemap);

      logger.info('Generated static sitemap successfully');
    } catch (error) {
      logger.error('Error generating static sitemap:', error);
      res.status(500).json({
        error: 'Failed to generate static sitemap',
        message: 'خطأ في إنشاء خريطة الصفحات الثابتة'
      });
    }
  }

  /**
   * Serve cars sitemap
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCarsSitemap(req, res) {
    try {
      const cacheKey = 'sitemap-cars';
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return this.sendXMLResponse(res, cached);
      }

      const sitemapService = new SitemapService(req.knex || req.app.locals.knex);
      const sitemap = await sitemapService.generateCarsSitemap();

      // Shorter cache for cars as they update frequently
      this.setCache(cacheKey, sitemap, 6 * 60 * 60 * 1000); // 6 hours
      this.sendXMLResponse(res, sitemap);

      logger.info('Generated cars sitemap successfully');
    } catch (error) {
      logger.error('Error generating cars sitemap:', error);
      res.status(500).json({
        error: 'Failed to generate cars sitemap',
        message: 'خطأ في إنشاء خريطة السيارات'
      });
    }
  }

  /**
   * Serve companies sitemap
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCompaniesSitemap(req, res) {
    try {
      const cacheKey = 'sitemap-companies';
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return this.sendXMLResponse(res, cached);
      }

      const sitemapService = new SitemapService(req.knex || req.app.locals.knex);
      const sitemap = await sitemapService.generateCompaniesSitemap();

      this.setCache(cacheKey, sitemap);
      this.sendXMLResponse(res, sitemap);

      logger.info('Generated companies sitemap successfully');
    } catch (error) {
      logger.error('Error generating companies sitemap:', error);
      res.status(500).json({
        error: 'Failed to generate companies sitemap',
        message: 'خطأ في إنشاء خريطة الشركات'
      });
    }
  }

  /**
   * Serve blog sitemap
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getBlogSitemap(req, res) {
    try {
      const cacheKey = 'sitemap-blog';
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return this.sendXMLResponse(res, cached);
      }

      const sitemapService = new SitemapService(req.knex || req.app.locals.knex);
      const sitemap = await sitemapService.generateBlogSitemap();

      this.setCache(cacheKey, sitemap);
      this.sendXMLResponse(res, sitemap);

      logger.info('Generated blog sitemap successfully');
    } catch (error) {
      logger.error('Error generating blog sitemap:', error);
      res.status(500).json({
        error: 'Failed to generate blog sitemap',
        message: 'خطأ في إنشاء خريطة المدونة'
      });
    }
  }

  /**
   * Serve categories sitemap
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCategoriesSitemap(req, res) {
    try {
      const cacheKey = 'sitemap-categories';
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return this.sendXMLResponse(res, cached);
      }

      const sitemapService = new SitemapService(req.knex || req.app.locals.knex);
      const sitemap = await sitemapService.generateCategoriesSitemap();

      this.setCache(cacheKey, sitemap);
      this.sendXMLResponse(res, sitemap);

      logger.info('Generated categories sitemap successfully');
    } catch (error) {
      logger.error('Error generating categories sitemap:', error);
      res.status(500).json({
        error: 'Failed to generate categories sitemap',
        message: 'خطأ في إنشاء خريطة التصنيفات'
      });
    }
  }

  /**
   * Serve robots.txt
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getRobotsTxt(req, res) {
    try {
      const cacheKey = 'robots-txt';
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return this.sendTextResponse(res, cached);
      }

      const sitemapService = new SitemapService(req.knex || req.app.locals.knex);
      const robotsTxt = sitemapService.generateRobotsTxt();

      this.setCache(cacheKey, robotsTxt);
      this.sendTextResponse(res, robotsTxt);

      logger.info('Generated robots.txt successfully');
    } catch (error) {
      logger.error('Error generating robots.txt:', error);
      res.status(500).json({
        error: 'Failed to generate robots.txt',
        message: 'خطأ في إنشاء ملف robots.txt'
      });
    }
  }

  /**
   * Clear sitemap cache (for admin use)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async clearCache(req, res) {
    try {
      this.cache.clear();

      res.json({
        success: true,
        message: 'Sitemap cache cleared successfully',
        messageAr: 'تم مسح ذاكرة التخزين المؤقت بنجاح'
      });

      logger.info('Sitemap cache cleared');
    } catch (error) {
      logger.error('Error clearing sitemap cache:', error);
      res.status(500).json({
        error: 'Failed to clear cache',
        message: 'خطأ في مسح ذاكرة التخزين المؤقت'
      });
    }
  }

  /**
   * Get sitemap statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSitemapStats(req, res) {
    try {
      // Get counts from database
      const [carsCount, companiesCount, blogCount] = await Promise.all([
        req.knex('listings').where('status', 'approved').count('* as count').first(),
        req.knex('companies').where('status', 'active').count('* as count').first(),
        req.knex('blog_posts').where('status', 'published').count('* as count').first()
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
        cache: {
          entries: this.cache.size,
          keys: Array.from(this.cache.keys())
        },
        optimization: {
          targetRegion: 'Syria',
          language: 'Arabic',
          hreflang: ['ar', 'ar-SY'],
          geoTarget: 'SY'
        }
      };

      const totalUrls = Object.values(stats.urls).reduce((sum, count) => sum + count, 0);
      stats.total = totalUrls;

      res.json(stats);
      logger.info('Generated sitemap statistics');
    } catch (error) {
      logger.error('Error generating sitemap stats:', error);
      res.status(500).json({
        error: 'Failed to generate sitemap statistics',
        message: 'خطأ في إنشاء إحصائيات الخريطة'
      });
    }
  }

  /**
   * Get item from cache
   * @param {string} key - Cache key
   * @returns {string|null} Cached content or null
   */
  getFromCache(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.content;
  }

  /**
   * Set item in cache
   * @param {string} key - Cache key
   * @param {string} content - Content to cache
   * @param {number} timeout - Cache timeout in milliseconds
   */
  setCache(key, content, timeout = this.cacheTimeout) {
    this.cache.set(key, {
      content,
      expiry: Date.now() + timeout
    });
  }

  /**
   * Send XML response with proper headers
   * @param {Object} res - Express response object
   * @param {string} xml - XML content
   */
  sendXMLResponse(res, xml) {
    res.set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'X-Robots-Tag': 'noindex', // Don't index sitemap files themselves
      'Content-Language': 'ar'
    });
    res.send(xml);
  }

  /**
   * Send text response with proper headers
   * @param {Object} res - Express response object
   * @param {string} text - Text content
   */
  sendTextResponse(res, text) {
    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'X-Robots-Tag': 'noindex'
    });
    res.send(text);
  }

  /**
   * Get cars data for sitemap with Arabic metadata
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCarsForSitemap(req, res) {
    try {
      const ArabicMetadataService = require('../../service/seo/arabicMetadataService');
      const arabicService = new ArabicMetadataService();

      const cacheKey = 'sitemap-cars-data';
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return res.json(cached);
      }

      const knex = req.knex || req.app.locals.knex;
      const cars = await knex('listed_cars')
        .select([
          'id',
          'slug',
          'title',
          'updated_at',
          'created_at',
          'status',
          'location',
          'make',
          'model',
          'year',
          'car_type',
          'fuel_type',
          'gearbox',
          'color'
        ])
        .where('status', 'active')
        .whereNull('deleted_at')
        .orderBy('updated_at', 'desc')
        .limit(50000);

      // Enhance each car with Arabic metadata
      const enhancedCars = cars.map(car => {
        const enhanced = arabicService.enhanceCarData(car);
        return {
          id: enhanced.id,
          slug: enhanced.slug,
          updatedAt: enhanced.updated_at,
          arabicType: enhanced.arabic_car_type,
          arabicCity: enhanced.arabic_city,
          arabicFuelType: enhanced.arabic_fuel_type,
          arabicGearbox: enhanced.arabic_gearbox,
          arabicColor: enhanced.arabic_color,
          year: enhanced.year,
          make: enhanced.make,
          model: enhanced.model
        };
      });

      this.setCache(cacheKey, enhancedCars);
      res.json(enhancedCars);

      arabicService.logMetadataOperation('cars_sitemap_api', { count: enhancedCars.length });
      logger.info(`Served ${enhancedCars.length} cars with Arabic metadata for sitemap`);
    } catch (error) {
      logger.error('Error fetching cars for sitemap:', error);
      res.status(500).json({
        error: 'Failed to fetch cars data',
        message: 'خطأ في جلب بيانات السيارات'
      });
    }
  }

  /**
   * Get companies data for sitemap with Arabic metadata
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCompaniesForSitemap(req, res) {
    try {
      const ArabicMetadataService = require('../../service/seo/arabicMetadataService');
      const arabicService = new ArabicMetadataService();

      const cacheKey = 'sitemap-companies-data';
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return res.json(cached);
      }

      const knex = req.knex || req.app.locals.knex;
      const companies = await knex('companies')
        .select([
          'id',
          'slug',
          'company_name',
          'updated_at',
          'created_at',
          'status',
          'location',
          'city'
        ])
        .where('status', 'active')
        .whereNull('deleted_at')
        .orderBy('updated_at', 'desc');

      // Enhance each company with Arabic metadata
      const enhancedCompanies = companies.map(company => {
        const enhanced = arabicService.enhanceCompanyData(company);
        return {
          id: enhanced.id,
          slug: enhanced.slug,
          updatedAt: enhanced.updated_at,
          name: enhanced.company_name,
          arabicCity: enhanced.arabic_city,
          location: enhanced.location || enhanced.city
        };
      });

      this.setCache(cacheKey, enhancedCompanies);
      res.json(enhancedCompanies);

      arabicService.logMetadataOperation('companies_sitemap_api', { count: enhancedCompanies.length });
      logger.info(`Served ${enhancedCompanies.length} companies with Arabic metadata for sitemap`);
    } catch (error) {
      logger.error('Error fetching companies for sitemap:', error);
      res.status(500).json({
        error: 'Failed to fetch companies data',
        message: 'خطأ في جلب بيانات الشركات'
      });
    }
  }

  /**
   * Get blog posts data for sitemap with Arabic metadata
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getBlogPostsForSitemap(req, res) {
    try {
      const cacheKey = 'sitemap-blog-data';
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return res.json(cached);
      }

      const knex = req.knex || req.app.locals.knex;
      const posts = await knex('blog_posts')
        .select([
          'id',
          'slug',
          'title',
          'updated_at',
          'created_at',
          'status',
          'category',
          'tags'
        ])
        .where('status', 'published')
        .whereNull('deleted_at')
        .orderBy('updated_at', 'desc');

      const enhancedPosts = posts.map(post => ({
        id: post.id,
        slug: post.slug,
        updatedAt: post.updated_at,
        title: post.title,
        category: post.category,
        tags: post.tags,
        arabicMetadata: {
          region: 'سوريا',
          market: 'الشرق الأوسط',
          language: 'العربية'
        }
      }));

      this.setCache(cacheKey, enhancedPosts);
      res.json(enhancedPosts);

      logger.info(`Served ${enhancedPosts.length} blog posts with Arabic metadata for sitemap`);
    } catch (error) {
      logger.error('Error fetching blog posts for sitemap:', error);
      res.status(500).json({
        error: 'Failed to fetch blog posts data',
        message: 'خطأ في جلب بيانات المقالات'
      });
    }
  }

  /**
   * Get categories data for sitemap with Arabic metadata
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCategoriesForSitemap(req, res) {
    try {
      const ArabicMetadataService = require('../../service/seo/arabicMetadataService');
      const arabicService = new ArabicMetadataService();

      const cacheKey = 'sitemap-categories-data';
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return res.json(cached);
      }

      const carTypes = arabicService.getAllCarTypes();
      const enhancedCategories = carTypes.map(type => ({
        slug: type.slug,
        arabicName: type.arabic,
        englishName: type.english,
        priority: this.getCategoryPriority(type.slug),
        arabicMetadata: {
          region: 'سوريا',
          market: 'الشرق الأوسط',
          language: 'العربية'
        }
      }));

      this.setCache(cacheKey, enhancedCategories);
      res.json(enhancedCategories);

      arabicService.logMetadataOperation('categories_sitemap_api', { count: enhancedCategories.length });
      logger.info(`Served ${enhancedCategories.length} categories with Arabic metadata for sitemap`);
    } catch (error) {
      logger.error('Error fetching categories for sitemap:', error);
      res.status(500).json({
        error: 'Failed to fetch categories data',
        message: 'خطأ في جلب بيانات الفئات'
      });
    }
  }

  /**
   * Get cities data for sitemap with Arabic metadata
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCitiesForSitemap(req, res) {
    try {
      const ArabicMetadataService = require('../../service/seo/arabicMetadataService');
      const arabicService = new ArabicMetadataService();

      const cacheKey = 'sitemap-cities-data';
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return res.json(cached);
      }

      const cities = arabicService.getAllCities();
      const enhancedCities = cities.map(city => ({
        slug: city.slug,
        arabicName: city.arabic,
        englishName: city.english,
        priority: this.getCityPriority(city.slug),
        arabicMetadata: {
          country: 'سوريا',
          region: 'الشرق الأوسط',
          language: 'العربية'
        }
      }));

      this.setCache(cacheKey, enhancedCities);
      res.json(enhancedCities);

      arabicService.logMetadataOperation('cities_sitemap_api', { count: enhancedCities.length });
      logger.info(`Served ${enhancedCities.length} cities with Arabic metadata for sitemap`);
    } catch (error) {
      logger.error('Error fetching cities for sitemap:', error);
      res.status(500).json({
        error: 'Failed to fetch cities data',
        message: 'خطأ في جلب بيانات المدن'
      });
    }
  }

  /**
   * Get comprehensive Arabic metadata for frontend
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getArabicMetadata(req, res) {
    try {
      const ArabicMetadataService = require('../../service/seo/arabicMetadataService');
      const arabicService = new ArabicMetadataService();

      const cacheKey = 'arabic-metadata-comprehensive';
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return res.json(cached);
      }

      const metadata = arabicService.getSitemapMetadata();

      // Set longer cache for metadata (1 week)
      this.setCache(cacheKey, metadata, 7 * 24 * 60 * 60 * 1000);
      res.json(metadata);

      arabicService.logMetadataOperation('metadata_api', metadata);
      logger.info('Served comprehensive Arabic metadata');
    } catch (error) {
      logger.error('Error fetching Arabic metadata:', error);
      res.status(500).json({
        error: 'Failed to fetch Arabic metadata',
        message: 'خطأ في جلب البيانات العربية'
      });
    }
  }

  /**
   * Get category priority for sitemap
   * @param {string} categorySlug - Category slug
   * @returns {number} Priority value
   */
  getCategoryPriority(categorySlug) {
    const priorities = {
      'sedan': 0.9,
      'suv': 0.9,
      'pickup': 0.8,
      'hatchback': 0.7,
      'coupe': 0.6,
      'convertible': 0.5,
      'station': 0.6
    };
    return priorities[categorySlug] || 0.5;
  }

  /**
   * Get city priority for sitemap
   * @param {string} citySlug - City slug
   * @returns {number} Priority value
   */
  getCityPriority(citySlug) {
    const priorities = {
      'damascus': 1.0,
      'aleppo': 0.9,
      'homs': 0.8,
      'hama': 0.7,
      'lattakia': 0.8,
      'tartous': 0.7
    };
    return priorities[citySlug] || 0.6;
  }

  /**
   * Set cache with custom timeout
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} timeout - Custom timeout in milliseconds
   */
  setCache(key, value, timeout = null) {
    const cacheTimeout = timeout || this.cacheTimeout;
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      timeout: cacheTimeout
    });
  }
}

module.exports = new SitemapController();
