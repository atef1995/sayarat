/**
 * Jest unit tests for Sitemap Service
 * Tests XML sitemap generation with Arabic optimization for Syrian car market
 */

const SitemapService = require('../service/seo/sitemapService');

// Mock the Arabic metadata service
jest.mock('../service/seo/arabicMetadataService', () => {
  return jest.fn().mockImplementation(() => ({
    enhanceCarData: jest.fn((car) => ({
      ...car,
      arabic_car_type: car.car_type === 'sedan' ? 'سيدان' : car.car_type,
      arabic_fuel_type: car.fuel_type === 'bensin' ? 'بنزين' : car.fuel_type,
      arabic_gearbox: car.gearbox === 'automatic' ? 'اوتوماتيك' : car.gearbox,
      arabic_city: car.location === 'damascus' ? 'دمشق' : car.location,
      arabic_color: car.color === 'white' ? 'أبيض' : car.color,
      arabic_metadata: {
        region: 'سوريا',
        market: 'الشرق الأوسط',
        language: 'العربية'
      }
    })),
    enhanceCompanyData: jest.fn((company) => ({
      ...company,
      arabic_city: company.location === 'damascus' ? 'دمشق' : company.location,
      arabic_metadata: {
        region: 'سوريا',
        market: 'الشرق الأوسط',
        language: 'العربية'
      }
    })),
    getAllCarTypes: jest.fn(() => [
      { slug: 'sedan', arabic: 'سيدان', english: 'sedan' },
      { slug: 'suv', arabic: 'جبلية', english: 'suv' },
      { slug: 'pickup', arabic: 'بيكأب', english: 'pickup' },
      { slug: 'hatchback', arabic: 'هاتشباك', english: 'hatchback' }
    ]),
    getAllCities: jest.fn(() => [
      { slug: 'damascus', arabic: 'دمشق', english: 'damascus' },
      { slug: 'aleppo', arabic: 'حلب', english: 'aleppo' },
      { slug: 'homs', arabic: 'حمص', english: 'homs' }
    ]),
    getArabicCarType: jest.fn((type) => type === 'sedan' ? 'سيدان' : type),
    getArabicFuelType: jest.fn((fuel) => fuel === 'bensin' ? 'بنزين' : fuel)
  }));
});

describe('SitemapService', () => {
  let sitemapService;
  let mockKnex;

  beforeEach(() => {
    // Mock knex database connection
    mockKnex = {
      // Mock for cars query
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      first: jest.fn(),
      max: jest.fn().mockReturnThis(),
      schema: {
        hasTable: jest.fn().mockResolvedValue(true)
      },
      raw: jest.fn().mockResolvedValue({ rows: [{ test: 1 }] })
    };

    // Set up environment
    process.env.SITE_URL = 'https://sayarat.autos';

    sitemapService = new SitemapService(mockKnex);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with correct base URL and settings', () => {
      expect(sitemapService.baseUrl).toBe('https://sayarat.autos');
      expect(sitemapService.defaultChangefreq).toBe('weekly');
      expect(sitemapService.defaultPriority).toBe(0.5);
      expect(sitemapService.supportedLanguages).toEqual(['ar', 'ar-SY']);
      expect(sitemapService.targetRegion).toBe('SY');
    });

    test('should use default URL when SITE_URL is not set', () => {
      delete process.env.SITE_URL;
      const service = new SitemapService(mockKnex);
      expect(service.baseUrl).toBe('https://sayarat.autos');
    });
  });

  describe('generateStaticSitemap', () => {
    test('should generate static pages sitemap with Arabic metadata', async () => {
      const sitemap = await sitemapService.generateStaticSitemap();

      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(sitemap).toContain('https://sayarat.autos/');
      expect(sitemap).toContain('https://sayarat.autos/search');
      expect(sitemap).toContain('https://sayarat.autos/blog');
      expect(sitemap).toContain('hreflang="ar"');
      expect(sitemap).toContain('hreflang="ar-SY"');
      expect(sitemap).toContain('hreflang="x-default"');
    });

    test('should include all required static pages', async () => {
      const sitemap = await sitemapService.generateStaticSitemap();

      const expectedPages = [
        'https://sayarat.autos/',
        'https://sayarat.autos/search',
        'https://sayarat.autos/companies',
        'https://sayarat.autos/blog',
        'https://sayarat.autos/about',
        'https://sayarat.autos/contact',
        'https://sayarat.autos/help',
        'https://sayarat.autos/terms',
        'https://sayarat.autos/privacy'
      ];

      expectedPages.forEach(page => {
        expect(sitemap).toContain(page);
      });
    });
  });

  describe('generateCarsSitemap', () => {
    test('should generate cars sitemap with active listings', async () => {
      const mockCars = [
        {
          id: 1,
          slug: 'toyota-camry-2023',
          title: 'Toyota Camry 2023',
          updated_at: new Date('2023-07-01'),
          created_at: new Date('2023-06-01'),
          status: 'active',
          location: 'damascus',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          car_type: 'sedan',
          fuel_type: 'bensin'
        },
        {
          id: 2,
          slug: 'honda-crv-2022',
          title: 'Honda CR-V 2022',
          updated_at: new Date('2023-06-15'),
          created_at: new Date('2023-05-15'),
          status: 'active',
          location: 'aleppo',
          make: 'Honda',
          model: 'CR-V',
          year: 2022,
          car_type: 'suv',
          fuel_type: 'bensin'
        }
      ];

      // Configure mock to return the test data
      mockKnex.select().where().orderBy().limit.mockResolvedValue(mockCars);

      const sitemap = await sitemapService.generateCarsSitemap();

      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain('https://sayarat.autos/car-listing/1');
      expect(sitemap).toContain('https://sayarat.autos/car-listing/2');
      expect(sitemap).toContain('<changefreq>weekly</changefreq>');
      expect(sitemap).toContain('hreflang="ar"');
      expect(sitemap).toContain('hreflang="ar-SY"');
    });

    test('should handle empty cars list gracefully', async () => {
      mockKnex.select().where().orderBy().limit.mockResolvedValue([]);

      const sitemap = await sitemapService.generateCarsSitemap();

      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain('<urlset');
      expect(sitemap).toContain('</urlset>');
    });

    test('should handle database connection errors', async () => {
      mockKnex.raw.mockRejectedValue(new Error('Database connection failed'));

      await expect(sitemapService.generateCarsSitemap()).rejects.toThrow();
    });
  });

  describe('generateCompaniesSitemap', () => {
    test('should generate companies sitemap', async () => {
      const mockCompanies = [
        {
          id: 1,
          company_name: 'Damascus Auto Center',
          name: 'Damascus Auto Center',
          slug: 'damascus-auto-center',
          updated_at: new Date('2023-07-01'),
          created_at: new Date('2023-01-01'),
          city: 'damascus',
          location: 'Damascus',
          address: 'Damascus Street 123'
        }
      ];

      mockKnex.select().where().orderBy.mockResolvedValue(mockCompanies);

      const sitemap = await sitemapService.generateCompaniesSitemap();

      expect(sitemap).toContain('https://sayarat.autos/company/damascus-auto-center');
      expect(sitemap).toContain('<changefreq>monthly</changefreq>');
      expect(sitemap).toContain('<priority>0.7</priority>');
    });
  });

  describe('generateBlogSitemap', () => {
    test('should generate blog posts sitemap', async () => {
      const mockPosts = [
        {
          id: 1,
          title: 'Syrian Car Market 2023',
          slug: 'syrian-car-market-2023',
          updated_at: new Date('2023-07-01'),
          created_at: new Date('2023-06-01'),
          status: 'published',
          meta_description: 'Analysis of Syrian car market',
          meta_keywords: 'syria, cars, market'
        }
      ];

      mockKnex.select().where().orderBy.mockResolvedValue(mockPosts);

      const sitemap = await sitemapService.generateBlogSitemap();

      expect(sitemap).toContain('https://sayarat.autos/blog/syrian-car-market-2023');
      expect(sitemap).toContain('<changefreq>monthly</changefreq>');
      expect(sitemap).toContain('<priority>0.7</priority>');
    });
  });

  describe('generateCategoriesSitemap', () => {
    test('should generate categories and locations sitemap', async () => {
      const sitemap = await sitemapService.generateCategoriesSitemap();

      expect(sitemap).toContain('https://sayarat.autos/category/sedan');
      expect(sitemap).toContain('https://sayarat.autos/category/suv');
      expect(sitemap).toContain('https://sayarat.autos/location/damascus');
      expect(sitemap).toContain('https://sayarat.autos/location/aleppo');
      expect(sitemap).toContain('https://sayarat.autos/search?carType=sedan&fuelType=bensin');
    });
  });

  describe('generateSitemapIndex', () => {
    test('should generate sitemap index with all sub-sitemaps', async () => {
      // Mock the date methods
      mockKnex.max().where().first.mockResolvedValue({ last_modified: new Date('2023-07-01') });

      const sitemapIndex = await sitemapService.generateSitemapIndex();

      expect(sitemapIndex).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemapIndex).toContain('<sitemapindex');
      expect(sitemapIndex).toContain('https://sayarat.autos/sitemap-static.xml');
      expect(sitemapIndex).toContain('https://sayarat.autos/sitemap-cars.xml');
      expect(sitemapIndex).toContain('https://sayarat.autos/sitemap-companies.xml');
      expect(sitemapIndex).toContain('https://sayarat.autos/sitemap-blog.xml');
      expect(sitemapIndex).toContain('https://sayarat.autos/sitemap-categories.xml');
    });
  });

  describe('generateRobotsTxt', () => {
    test('should generate robots.txt with Arabic content rules', () => {
      const robotsTxt = sitemapService.generateRobotsTxt();

      expect(robotsTxt).toContain('User-agent: *');
      expect(robotsTxt).toContain('Allow: /');
      expect(robotsTxt).toContain('Allow: /ar/');
      expect(robotsTxt).toContain('Allow: /search*');
      expect(robotsTxt).toContain('Allow: /car/*');
      expect(robotsTxt).toContain('Allow: /company/*');
      expect(robotsTxt).toContain('Allow: /blog/*');
      expect(robotsTxt).toContain('Disallow: /admin/');
      expect(robotsTxt).toContain('Disallow: /api/');
      expect(robotsTxt).toContain('Sitemap: https://sayarat.autos/sitemap.xml');
      expect(robotsTxt).toContain('User-agent: Googlebot');
      expect(robotsTxt).toContain('User-agent: YandexBot');
    });
  });

  describe('Priority Calculation', () => {
    test('should calculate car priority correctly', () => {
      const newCar = {
        year: new Date().getFullYear(),
        updated_at: new Date(),
        location: 'Damascus'
      };

      const priority = sitemapService.calculateCarPriority(newCar);
      expect(priority).toBeGreaterThan(0.5);
      expect(priority).toBeLessThanOrEqual(1.0);
    });

    test('should give higher priority to newer cars', () => {
      const newCar = { year: new Date().getFullYear(), updated_at: new Date(), location: 'Damascus' };
      const oldCar = { year: 2010, updated_at: new Date(), location: 'Damascus' };

      const newCarPriority = sitemapService.calculateCarPriority(newCar);
      const oldCarPriority = sitemapService.calculateCarPriority(oldCar);

      expect(newCarPriority).toBeGreaterThan(oldCarPriority);
    });

    test('should give correct category priorities', () => {
      expect(sitemapService.getCategoryPriority('sedan')).toBe(0.9);
      expect(sitemapService.getCategoryPriority('suv')).toBe(0.9);
      expect(sitemapService.getCategoryPriority('pickup')).toBe(0.8);
      expect(sitemapService.getCategoryPriority('unknown')).toBe(0.5);
    });

    test('should give correct city priorities', () => {
      expect(sitemapService.getCityPriority('damascus')).toBe(1.0);
      expect(sitemapService.getCityPriority('aleppo')).toBe(0.9);
      expect(sitemapService.getCityPriority('homs')).toBe(0.8);
      expect(sitemapService.getCityPriority('unknown')).toBe(0.6);
    });
  });

  describe('XML Generation', () => {
    test('should escape XML special characters correctly', () => {
      const testString = 'Test & "quote" <tag> >gt< \'apostrophe\'';
      const escaped = sitemapService.escapeXML(testString);

      expect(escaped).toBe('Test &amp; &quot;quote&quot; &lt;tag&gt; &gt;gt&lt; &apos;apostrophe&apos;');
    });

    test('should generate valid XML structure', async () => {
      const urls = [
        {
          loc: 'https://sayarat.autos/test',
          lastmod: '2023-07-01T00:00:00.000Z',
          changefreq: 'weekly',
          priority: 0.8,
          alternateUrls: [
            { hreflang: 'ar', href: 'https://sayarat.autos/test' }
          ]
        }
      ];

      const xml = sitemapService.generateSitemapXML(urls);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(xml).toContain('<url>');
      expect(xml).toContain('<loc>https://sayarat.autos/test</loc>');
      expect(xml).toContain('<lastmod>2023-07-01T00:00:00.000Z</lastmod>');
      expect(xml).toContain('<changefreq>weekly</changefreq>');
      expect(xml).toContain('<priority>0.8</priority>');
      expect(xml).toContain('hreflang="ar"');
      expect(xml).toContain('</url>');
      expect(xml).toContain('</urlset>');
    });
  });

  describe('Alternate URLs', () => {
    test('should generate alternate language URLs correctly', () => {
      const alternateUrls = sitemapService.generateAlternateUrls('/test-page');

      expect(alternateUrls).toHaveLength(3);
      expect(alternateUrls[0]).toEqual({
        hreflang: 'ar',
        href: 'https://sayarat.autos/test-page'
      });
      expect(alternateUrls[1]).toEqual({
        hreflang: 'ar-SY',
        href: 'https://sayarat.autos/test-page'
      });
      expect(alternateUrls[2]).toEqual({
        hreflang: 'x-default',
        href: 'https://sayarat.autos/test-page'
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing database connection gracefully', async () => {
      const serviceWithoutDb = new SitemapService(null);

      await expect(serviceWithoutDb.generateCarsSitemap()).rejects.toThrow('Database connection not available');
    });

    test('should handle missing table gracefully', async () => {
      mockKnex.schema.hasTable.mockResolvedValue(false);

      await expect(sitemapService.generateCarsSitemap()).rejects.toThrow('Table listed_cars does not exist');
    });
  });
});
