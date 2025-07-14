/**
 * Backend Sitemap Service for Cars-Bids Platform
 * 
 * Generates XML sitemaps optimized for Arabic content and Syria/Middle East market.
 *   async generateCarsSitemap() {
    try {
      const cars = await this.knex('listed_cars')
        .select([
          'id', 
          'slug',
          'title',
          'updated_at',
          'created_at',
          'status',
          'featured',
          'location',
          'make',
          'model',
          'year'
        ])
        .where('status', 'active')
        .where('deleted_at', null)
        .orderBy('updated_at', 'desc')
        .limit(50000); // Google sitemap limitpractices for Arabic search engines and Google's Arabic indexing.
 * 
 * Features:
 * - Static pages sitemap
 * - Dynamic car listings sitemap
 * - Company profiles sitemap  
 * - Blog posts sitemap
 * - Arabic language optimization
 * - Middle East geo-targeting
 * - Automatic updates and caching
 * 
 * @module SitemapService
 */

const logger = require('../../utils/logger');

/**
 * Sitemap Generator Service
 * Implements modular architecture for different sitemap types
 */
class SitemapService {
  constructor(knex) {
    this.knex = knex;
    this.baseUrl = process.env.SITE_URL || 'https://sayarat.autos';
    this.defaultChangefreq = 'weekly';
    this.defaultPriority = 0.5;

    // Arabic and Syria-specific configuration
    this.supportedLanguages = ['ar', 'ar-SY'];
    this.targetRegion = 'SY'; // Syria country code
    this.defaultTimezone = 'Asia/Damascus';

    // Initialize Arabic metadata service
    const ArabicMetadataService = require('./arabicMetadataService');
    this.arabicService = new ArabicMetadataService();
  }

  /**
   * Generate main sitemap index
   * @returns {Promise<string>} XML sitemap index
   */
  async generateSitemapIndex() {
    try {
      const sitemaps = [
        {
          loc: `${this.baseUrl}/sitemap-static.xml`,
          lastmod: new Date().toISOString()
        },
        {
          loc: `${this.baseUrl}/sitemap-cars.xml`,
          lastmod: await this.getLastCarModified()
        },
        {
          loc: `${this.baseUrl}/sitemap-companies.xml`,
          lastmod: await this.getLastCompanyModified()
        },
        {
          loc: `${this.baseUrl}/sitemap-blog.xml`,
          lastmod: await this.getLastBlogModified()
        },
        {
          loc: `${this.baseUrl}/sitemap-categories.xml`,
          lastmod: new Date().toISOString()
        }
      ];

      return this.generateSitemapIndexXML(sitemaps);
    } catch (error) {
      logger.error('Error generating sitemap index:', error);
      throw error;
    }
  }

  /**
   * Generate static pages sitemap
   * @returns {Promise<string>} XML sitemap for static pages
   */
  async generateStaticSitemap() {
    const staticPages = [
      {
        path: '/',
        priority: 1.0,
        changefreq: 'daily',
        description: 'سيارات للبيع في سوريا - موقع سيارات'
      },
      {
        path: '/search',
        priority: 0.9,
        changefreq: 'daily',
        description: 'البحث عن السيارات في سوريا'
      },
      {
        path: '/companies',
        priority: 0.8,
        changefreq: 'weekly',
        description: 'معارض السيارات في سوريا'
      },
      {
        path: '/blog',
        priority: 0.8,
        changefreq: 'daily',
        description: 'مدونة السيارات - أخبار ونصائح'
      },
      {
        path: '/about',
        priority: 0.6,
        changefreq: 'monthly',
        description: 'من نحن - موقع سيارات'
      },
      {
        path: '/contact',
        priority: 0.6,
        changefreq: 'monthly',
        description: 'اتصل بنا'
      },
      {
        path: '/help',
        priority: 0.7,
        changefreq: 'monthly',
        description: 'المساعدة والدعم'
      },
      {
        path: '/terms',
        priority: 0.4,
        changefreq: 'yearly',
        description: 'شروط الاستخدام'
      },
      {
        path: '/privacy',
        priority: 0.4,
        changefreq: 'yearly',
        description: 'سياسة الخصوصية'
      }
    ];

    const urls = staticPages.map(page => ({
      loc: `${this.baseUrl}${page.path}`,
      lastmod: new Date().toISOString(),
      changefreq: page.changefreq,
      priority: page.priority,
      alternateUrls: this.generateAlternateUrls(page.path)
    }));

    return this.generateSitemapXML(urls);
  }

  /**
   * Generate car listings sitemap
   * @returns {Promise<string>} XML sitemap for car listings
   */
  async generateCarsSitemap() {
    try {
      const cars = await this.knex('listed_cars')
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
          'color',
          'meta_description',
          'meta_keywords'
        ])
        .where('status', 'active')
        .whereNull('deleted_at')
        .orderBy('updated_at', 'desc')
        .limit(50000); // Google sitemap limit

      const urls = cars.map(car => {
        // Use database slug or generate fallback
        const carSlug = car.slug || this.generateFallbackCarSlug(car);

        // Enhance car data with Arabic metadata
        const enhancedCar = this.arabicService.enhanceCarData(car);

        return {
          loc: `${this.baseUrl}/car/${carSlug}`,
          lastmod: new Date(car.updated_at).toISOString(),
          changefreq: 'weekly',
          priority: this.calculateCarPriority(car),
          alternateUrls: this.generateAlternateUrls(`/car/${carSlug}`),
          // Enhanced Arabic-specific metadata
          arabicTitle: car.title,
          arabicCarType: enhancedCar.arabic_car_type,
          arabicFuelType: enhancedCar.arabic_fuel_type,
          arabicGearbox: enhancedCar.arabic_gearbox,
          arabicCity: enhancedCar.arabic_city,
          arabicColor: enhancedCar.arabic_color,
          location: car.location,
          geoTarget: 'SY',
          metaDescription: car.meta_description,
          keywords: car.meta_keywords,
          arabicMetadata: enhancedCar.arabic_metadata
        };
      });

      logger.info(`Generated cars sitemap with ${urls.length} entries and Arabic metadata`);
      return this.generateSitemapXML(urls);
    } catch (error) {
      logger.error('Error generating cars sitemap:', error);
      throw error;
    }
  }

  /**
   * Generate companies sitemap
   * @returns {Promise<string>} XML sitemap for companies
   */
  async generateCompaniesSitemap() {
    try {
      const companies = await this.knex('companies')
        .select([
          'id',
          'company_name',
          'name',
          'slug',
          'updated_at',
          'created_at',
          'city',
          'location',
          'address',
          'meta_description',
          'meta_keywords'
        ])
        .where('status', 'active')
        .whereNull('deleted_at')
        .orderBy('updated_at', 'desc');

      const urls = companies.map(company => {
        // Use database slug or generate fallback
        const companySlug = company.slug || this.generateFallbackCompanySlug(company);

        // Enhance company data with Arabic metadata
        const enhancedCompany = this.arabicService.enhanceCompanyData({
          ...company,
          location: company.city || company.location
        });

        return {
          loc: `${this.baseUrl}/company/${companySlug}`,
          lastmod: new Date(company.updated_at).toISOString(),
          changefreq: 'monthly',
          priority: 0.7,
          alternateUrls: this.generateAlternateUrls(`/company/${companySlug}`),
          companyName: company.company_name || company.name,
          arabicCity: enhancedCompany.arabic_city,
          location: company.city || company.location || 'Syria',
          geoTarget: 'SY',
          metaDescription: company.meta_description,
          keywords: company.meta_keywords,
          arabicMetadata: enhancedCompany.arabic_metadata
        };
      });

      logger.info(`Generated companies sitemap with ${urls.length} entries and Arabic metadata`);
      return this.generateSitemapXML(urls);
    } catch (error) {
      logger.error('Error generating companies sitemap:', error);
      throw error;
    }
  }

  /**
   * Generate blog posts sitemap
   * @returns {Promise<string>} XML sitemap for blog posts
   */
  async generateBlogSitemap() {
    try {
      const posts = await this.knex('blog_posts')
        .select([
          'id',
          'title',
          'slug',
          'updated_at',
          'created_at',
          'status',
          'meta_description',
          'meta_keywords'
        ])
        .where('status', 'published')
        .orderBy('updated_at', 'desc');

      const urls = posts.map(post => {
        // Use database slug or generate fallback
        const postSlug = post.slug || this.generateFallbackPostSlug(post);

        return {
          loc: `${this.baseUrl}/blog/${postSlug}`,
          lastmod: new Date(post.updated_at).toISOString(),
          changefreq: 'monthly',
          priority: 0.7, // Default since featured column may not exist
          alternateUrls: this.generateAlternateUrls(`/blog/${postSlug}`),
          geoTarget: 'SY',
          metaDescription: post.meta_description,
          keywords: post.meta_keywords
        };
      });

      return this.generateSitemapXML(urls);
    } catch (error) {
      logger.error('Error generating blog sitemap:', error);
      throw error;
    }
  }

  /**
   * Generate categories sitemap
   * @returns {Promise<string>} XML sitemap for categories
   */
  async generateCategoriesSitemap() {
    try {
      // Get car categories and cities from Arabic metadata service
      const carCategories = this.arabicService.getAllCarTypes();
      const cities = this.arabicService.getAllCities();

      const urls = [
        // Car type categories with Arabic metadata
        ...carCategories.map(category => ({
          loc: `${this.baseUrl}/category/${category.slug}`,
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: this.getCategoryPriority(category.slug),
          alternateUrls: this.generateAlternateUrls(`/category/${category.slug}`),
          arabicName: category.arabic,
          englishName: category.english,
          geoTarget: 'SY',
          arabicMetadata: {
            region: 'سوريا',
            market: 'الشرق الأوسط',
            language: 'العربية'
          }
        })),

        // Syrian cities with Arabic metadata
        ...cities.map(city => ({
          loc: `${this.baseUrl}/location/${city.slug}`,
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: this.getCityPriority(city.slug),
          alternateUrls: this.generateAlternateUrls(`/location/${city.slug}`),
          arabicName: city.arabic,
          englishName: city.english,
          geoTarget: 'SY',
          arabicMetadata: {
            country: 'سوريا',
            region: 'الشرق الأوسط',
            language: 'العربية'
          }
        })),

        // Enhanced search combinations for Syrian market
        ...this.generateEnhancedSearchURLs()
      ];

      logger.info(`Generated categories sitemap with ${urls.length} entries and Arabic metadata`);
      return this.generateSitemapXML(urls);
    } catch (error) {
      logger.error('Error generating categories sitemap:', error);
      throw error;
    }
  }

  /**
   * Generate enhanced search URLs for Syrian car market
   * @returns {Array} Array of enhanced search URL objects
   */
  generateEnhancedSearchURLs() {
    const popularCombinations = [
      { carType: 'sedan', fuelType: 'bensin', priority: 0.8 },
      { carType: 'suv', fuelType: 'diesel', priority: 0.9 },
      { carType: 'pickup', fuelType: 'diesel', priority: 0.8 },
      { carType: 'hatchback', fuelType: 'bensin', priority: 0.7 }
    ];

    return popularCombinations.map(combo => ({
      loc: `${this.baseUrl}/search?carType=${combo.carType}&fuelType=${combo.fuelType}`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: combo.priority,
      alternateUrls: this.generateAlternateUrls(`/search?carType=${combo.carType}&fuelType=${combo.fuelType}`),
      arabicCarType: this.arabicService.getArabicCarType(combo.carType),
      arabicFuelType: this.arabicService.getArabicFuelType(combo.fuelType),
      geoTarget: 'SY'
    }));
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
      'tartous': 0.7,
      'sweida': 0.6,
      'daraa': 0.6
    };
    return priorities[citySlug] || 0.6;
  }

  /**
   * Generate robots.txt optimized for Arabic content
   * @returns {string} robots.txt content
   */
  generateRobotsTxt() {
    return `User-agent: *
Allow: /

# Arabic content specific rules
Allow: /ar/
Allow: /search*
Allow: /car/*
Allow: /company/*
Allow: /category/*
Allow: /location/*
Allow: /blog/*

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /*.json$
Disallow: /*?*sort=
Disallow: /*?*filter=
Disallow: /*?*page=

# Allow important query parameters for cars
Allow: /*?make=*
Allow: /*?model=*
Allow: /*?year=*
Allow: /*?location=*

# Sitemaps
Sitemap: ${this.baseUrl}/sitemap.xml
Sitemap: ${this.baseUrl}/sitemap-cars.xml
Sitemap: ${this.baseUrl}/sitemap-companies.xml
Sitemap: ${this.baseUrl}/sitemap-blog.xml

# Crawl-delay for better server performance
Crawl-delay: 1

# Special rules for search engines
User-agent: Googlebot
Crawl-delay: 0
Allow: /

User-agent: Bingbot
Crawl-delay: 1
Allow: /

# Social media crawlers
User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: WhatsApp
Allow: /

# Arabic search engines
User-agent: YandexBot
Allow: /

# Block aggressive crawlers
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /`;
  }

  /**
   * Generate alternate language URLs for internationalization
   * @param {string} path - URL path
   * @returns {Array} Array of alternate URLs
   */
  generateAlternateUrls(path) {
    return [
      {
        hreflang: 'ar',
        href: `${this.baseUrl}${path}`
      },
      {
        hreflang: 'ar-SY',
        href: `${this.baseUrl}${path}`
      },
      {
        hreflang: 'x-default',
        href: `${this.baseUrl}${path}`
      }
    ];
  }

  /**
   * Calculate priority for car listings based on various factors
   * @param {Object} car - Car object
   * @returns {number} Priority value between 0.0 and 1.0
   */
  calculateCarPriority(car) {
    let priority = 0.5; // Base priority

    // TODO: Add featured boost when featured column exists
    // if (car.featured) priority += 0.2;

    // Boost newer cars
    const carAge = new Date().getFullYear() - car.year;
    if (carAge <= 2) priority += 0.2;
    else if (carAge <= 5) priority += 0.1;

    // Boost recently updated
    const daysSinceUpdate = (new Date() - new Date(car.updated_at)) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate <= 7) priority += 0.1;

    // Boost cars in major Syrian cities
    const majorCities = ['damascus', 'aleppo', 'homs', 'latakia'];
    if (majorCities.some(city => car.location?.toLowerCase().includes(city))) {
      priority += 0.1;
    }

    return Math.min(priority, 1.0);
  }

  /**
   * Generate sitemap XML with Arabic optimization
   * @param {Array} urls - Array of URL objects
   * @returns {string} XML sitemap
   */
  generateSitemapXML(urls) {
    const urlElements = urls.map(url => {
      let urlXML = `  <url>\n    <loc>${this.escapeXML(url.loc)}</loc>\n`;

      if (url.lastmod) {
        urlXML += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }

      if (url.changefreq) {
        urlXML += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }

      if (url.priority !== undefined) {
        urlXML += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
      }

      // Add alternate language URLs for Arabic optimization
      if (url.alternateUrls && url.alternateUrls.length > 0) {
        url.alternateUrls.forEach(alternate => {
          urlXML += `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${this.escapeXML(alternate.href)}" />\n`;
        });
      }

      urlXML += `  </url>`;
      return urlXML;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:geo="http://www.google.com/geo/schemas/sitemap/1.0">
${urlElements}
</urlset>`;
  }

  /**
   * Generate sitemap index XML
   * @param {Array} sitemaps - Array of sitemap objects
   * @returns {string} XML sitemap index
   */
  generateSitemapIndexXML(sitemaps) {
    const sitemapElements = sitemaps.map(sitemap => {
      return `  <sitemap>
    <loc>${this.escapeXML(sitemap.loc)}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapElements}
</sitemapindex>`;
  }

  /**
   * Get last modification date for cars
   * @returns {Promise<string>} ISO date string
   */
  async getLastCarModified() {
    try {
      const result = await this.knex('listed_cars')
        .max('updated_at as last_modified')
        .where('status', 'active')
        .first();

      return result?.last_modified
        ? new Date(result.last_modified).toISOString()
        : new Date().toISOString();
    } catch (error) {
      logger.error('Error getting last car modified:', error);
      return new Date().toISOString();
    }
  }

  /**
   * Get last modification date for companies
   * @returns {Promise<string>} ISO date string
   */
  async getLastCompanyModified() {
    try {
      const result = await this.knex('companies')
        .max('updated_at as last_modified')
        .first();

      return result?.last_modified
        ? new Date(result.last_modified).toISOString()
        : new Date().toISOString();
    } catch (error) {
      logger.error('Error getting last company modified:', error);
      return new Date().toISOString();
    }
  }

  /**
   * Get last modification date for blog posts
   * @returns {Promise<string>} ISO date string
   */
  async getLastBlogModified() {
    try {
      const result = await this.knex('blog_posts')
        .max('updated_at as last_modified')
        .where('status', 'published')
        .first();

      return result?.last_modified
        ? new Date(result.last_modified).toISOString()
        : new Date().toISOString();
    } catch (error) {
      logger.error('Error getting last blog modified:', error);
      return new Date().toISOString();
    }
  }

  /**
   * Generate fallback slug for car if slug is missing
   * @param {Object} car - Car object
   * @returns {string} Generated slug
   */
  generateFallbackCarSlug(car) {
    const slugGenerator = require('../../utils/slugGenerator');
    const title = car.title || `${car.make}-${car.model}-${car.year}` || `car-${car.id}`;
    return slugGenerator.generateSlug(title, { includeId: true, id: car.id });
  }

  /**
   * Generate fallback slug for company if slug is missing
   * @param {Object} company - Company object
   * @returns {string} Generated slug
   */
  generateFallbackCompanySlug(company) {
    const slugGenerator = require('../../utils/slugGenerator');
    const name = company.name || `company-${company.id}`;
    return slugGenerator.generateSlug(name, { includeId: true, id: company.id });
  }

  /**
   * Generate fallback slug for blog post if slug is missing
   * @param {Object} post - Blog post object
   * @returns {string} Generated slug
   */
  generateFallbackPostSlug(post) {
    const slugGenerator = require('../../utils/slugGenerator');
    const title = post.title || `post-${post.id}`;
    return slugGenerator.generateSlug(title, { includeId: true, id: post.id });
  }

  /**
   * Escape XML special characters
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeXML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

module.exports = SitemapService;
