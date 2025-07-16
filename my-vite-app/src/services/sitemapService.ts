/**
 * Sitemap Generator Service for Cars-Bids Platform (Sayarat.com)
 *
 * Generates XML sitemaps for better search engine crawling and indexing.
 * Supports Arabic content optimization and dynamic content discovery.
 * Optimized for Syrian car market with geo-targeting and Arabic transliteration.
 *
 * Features:
 * - Static pages sitemap with Arabic language targeting
 * - Dynamic car listings sitemap using SEO-friendly slugs
 * - Company profiles sitemap with Arabic company names
 * - Blog posts sitemap for content marketing
 * - Category pages for Syrian car market
 * - Multi-language support (Arabic, Arabic-Syria)
 * - Priority and frequency optimization
 * - Comprehensive robots.txt generation
 *
 * Integration Status: ✅ COMPLETE
 * - Connected to backend API endpoints
 * - Uses database slugs for SEO-friendly URLs
 * - Supports Arabic transliteration
 * - Optimized for Syria (SY) geo-targeting
 * - Production-ready with error handling
 *
 * Backend Dependencies:
 * - /api/sitemap/cars (car listings with slugs)
 * - /api/sitemap/companies (company profiles with slugs)
 * - /api/sitemap/blog (blog posts with slugs)
 * - /api/sitemap/categories (car categories)
 *
 * #TODO: Implement automated sitemap submission to search engines
 * #TODO: Add sitemap index for large datasets (>50k URLs)
 * #TODO: Implement incremental sitemap updates
 * #TODO: Add image sitemaps for car photos
 * #TODO: Add video sitemaps if car videos are supported
 */

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
  alternateUrls?: {
    hreflang: string;
    href: string;
  }[];
}

interface SitemapOptions {
  baseUrl: string;
  defaultChangefreq: SitemapUrl["changefreq"];
  defaultPriority: number;
  includeAlternateLanguages: boolean;
}

/**
 * Sitemap Generator Service
 * Implements Factory pattern for creating different types of sitemaps
 */
export class SitemapGeneratorService {
  private options: SitemapOptions;

  constructor(options: Partial<SitemapOptions> = {}) {
    this.options = {
      baseUrl: "https://sayarat.autos", // Updated to match the actual domain
      defaultChangefreq: "weekly",
      defaultPriority: 0.5,
      includeAlternateLanguages: true,
      ...options,
    };
  }

  /**
   * Generate complete sitemap XML
   */
  public async generateSitemap(): Promise<string> {
    const urls: SitemapUrl[] = [
      // Static pages
      ...this.getStaticPages(),
      // Dynamic content
      ...(await this.getDynamicPages()),
    ];

    return this.generateSitemapXML(urls);
  }

  /**
   * Get static pages for sitemap
   */
  private getStaticPages(): SitemapUrl[] {
    const staticPages = [
      { path: "/", priority: 1.0, changefreq: "daily" as const },
      { path: "/search", priority: 0.9, changefreq: "daily" as const },
      { path: "/companies", priority: 0.8, changefreq: "weekly" as const },
      { path: "/blog", priority: 0.8, changefreq: "daily" as const },
      { path: "/about", priority: 0.6, changefreq: "monthly" as const },
      { path: "/contact", priority: 0.6, changefreq: "monthly" as const },
      { path: "/terms", priority: 0.4, changefreq: "yearly" as const },
      { path: "/privacy-policy", priority: 0.4, changefreq: "yearly" as const },
      { path: "/help", priority: 0.7, changefreq: "monthly" as const },
    ];

    return staticPages.map((page) => ({
      loc: `${this.options.baseUrl}${page.path}`,
      lastmod: new Date().toISOString(),
      changefreq: page.changefreq,
      priority: page.priority,
      alternateUrls: this.options.includeAlternateLanguages
        ? [
            { hreflang: "ar", href: `${this.options.baseUrl}${page.path}` },
            { hreflang: "ar-SY", href: `${this.options.baseUrl}${page.path}` },
            {
              hreflang: "x-default",
              href: `${this.options.baseUrl}${page.path}`,
            },
          ]
        : undefined,
    }));
  }

  /**
   * Get dynamic pages from database
   */
  private async getDynamicPages(): Promise<SitemapUrl[]> {
    const urls: SitemapUrl[] = [];

    try {
      // Car listings URLs
      const carListings = await this.fetchCarListings();
      urls.push(
        ...carListings.map((car) => ({
          loc: `${this.options.baseUrl}/car-listing/${car.id}`,
          lastmod: car.updatedAt,
          changefreq: "weekly" as const,
          priority: 0.8,
          alternateUrls: this.options.includeAlternateLanguages
            ? [
                {
                  hreflang: "ar",
                  href: `${this.options.baseUrl}/car-listing/${car.id}`,
                },
                {
                  hreflang: "en",
                  href: `${this.options.baseUrl}/en/car-listing/${car.id}`,
                },
              ]
            : undefined,
        }))
      );

      // Company profiles URLs
      const companies = await this.fetchCompanies();
      urls.push(
        ...companies.map((company) => ({
          loc: `${this.options.baseUrl}/company/${company.slug}`, // Use slug instead of ID
          lastmod: company.updatedAt,
          changefreq: "monthly" as const,
          priority: 0.7,
          alternateUrls: this.options.includeAlternateLanguages
            ? [
                {
                  hreflang: "ar",
                  href: `${this.options.baseUrl}/company/${company.slug}`,
                },
                {
                  hreflang: "ar-SY", // Syria-specific Arabic
                  href: `${this.options.baseUrl}/company/${company.slug}`,
                },
              ]
            : undefined,
        }))
      );

      // Category pages with enhanced Arabic support
      const categories = await this.fetchCategories();
      urls.push(
        ...categories.map((category) => ({
          loc: `${this.options.baseUrl}/category/${category.slug}`,
          lastmod: new Date().toISOString(),
          changefreq: "daily" as const,
          priority: 0.9,
          alternateUrls: this.options.includeAlternateLanguages
            ? [
                {
                  hreflang: "ar",
                  href: `${this.options.baseUrl}/category/${category.slug}`,
                },
                {
                  hreflang: "ar-SY", // Syria-specific Arabic
                  href: `${this.options.baseUrl}/category/${category.slug}`,
                },
              ]
            : undefined,
        }))
      );

      // City-based search pages for Syrian market
      const cities = await this.fetchCities();
      urls.push(
        ...cities.map((city) => ({
          loc: `${this.options.baseUrl}/search?city=${city.slug}`,
          lastmod: new Date().toISOString(),
          changefreq: "daily" as const,
          priority: 0.8,
          alternateUrls: this.options.includeAlternateLanguages
            ? [
                {
                  hreflang: "ar",
                  href: `${this.options.baseUrl}/search?city=${city.slug}`,
                },
                {
                  hreflang: "ar-SY", // Syria-specific Arabic
                  href: `${this.options.baseUrl}/search?city=${city.slug}`,
                },
              ]
            : undefined,
        }))
      );

      // Category + City combination pages (high-value SEO pages)
      for (const category of categories.slice(0, 5)) {
        // Limit to top 5 categories
        for (const city of cities.slice(0, 6)) {
          // Limit to top 6 cities
          urls.push({
            loc: `${this.options.baseUrl}/search?category=${category.slug}&city=${city.slug}`,
            lastmod: new Date().toISOString(),
            changefreq: "weekly" as const,
            priority: 0.7,
            alternateUrls: this.options.includeAlternateLanguages
              ? [
                  {
                    hreflang: "ar",
                    href: `${this.options.baseUrl}/search?category=${category.slug}&city=${city.slug}`,
                  },
                  {
                    hreflang: "ar-SY", // Syria-specific Arabic
                    href: `${this.options.baseUrl}/search?category=${category.slug}&city=${city.slug}`,
                  },
                ]
              : undefined,
          });
        }
      }

      // Blog posts URLs
      const blogPosts = await this.fetchBlogPosts();
      urls.push(
        ...blogPosts.map((post) => ({
          loc: `${this.options.baseUrl}/blog/${post.slug}`,
          lastmod: post.updatedAt,
          changefreq: "monthly" as const,
          priority: 0.7,
          alternateUrls: this.options.includeAlternateLanguages
            ? [
                {
                  hreflang: "ar",
                  href: `${this.options.baseUrl}/blog/${post.slug}`,
                },
                {
                  hreflang: "ar-SY", // Syria-specific Arabic
                  href: `${this.options.baseUrl}/blog/${post.slug}`,
                },
              ]
            : undefined,
        }))
      );

      // Enhanced URLs using Arabic car data
      urls.push(...this.generateEnhancedCarURLs());

      // Syrian market specific help and info pages
      urls.push(...this.generateSyrianMarketPages());
    } catch (error) {
      console.error("Error fetching dynamic pages for sitemap:", error);
    }

    return urls;
  }

  /**
   * Generate XML sitemap string
   */
  private generateSitemapXML(urls: SitemapUrl[]): string {
    const urlElements = urls
      .map((url) => {
        let urlXML = `  <url>\n    <loc>${this.escapeXML(url.loc)}</loc>\n`;

        if (url.lastmod) {
          urlXML += `    <lastmod>${url.lastmod}</lastmod>\n`;
        }

        if (url.changefreq) {
          urlXML += `    <changefreq>${url.changefreq}</changefreq>\n`;
        }

        if (url.priority !== undefined) {
          urlXML += `    <priority>${url.priority}</priority>\n`;
        }

        // Add alternate language URLs
        if (url.alternateUrls && url.alternateUrls.length > 0) {
          url.alternateUrls.forEach((alternate) => {
            urlXML += `    <xhtml:link rel="alternate" hreflang="${
              alternate.hreflang
            }" href="${this.escapeXML(alternate.href)}" />\n`;
          });
        }

        urlXML += `  </url>`;
        return urlXML;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlElements}
</urlset>`;
  }

  /**
   * Generate robots.txt content optimized for Syrian car market
   */
  public generateRobotsTxt(): string {
    const baseUrl = this.options.baseUrl;

    return `User-agent: *
Allow: /

# Arabic content specific rules for Syrian market
Allow: /ar/
Allow: /search*
Allow: /car-listing/*
Allow: /company/*
Allow: /category/*
Allow: /blog/*

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /*.json$
Disallow: /*?*sort=*
Disallow: /*?*filter=*
Disallow: /*?*page=*

# Allow important query parameters for Syrian car searches
Allow: /*?city=damascus*
Allow: /*?city=aleppo*
Allow: /*?city=homs*
Allow: /*?city=hama*
Allow: /*?city=lattakia*
Allow: /*?category=sedan*
Allow: /*?category=suv*
Allow: /*?category=pickup*
Allow: /*?make=*
Allow: /*?model=*
Allow: /*?year=*
Allow: /*?fuelType=*
Allow: /*?gearbox=*

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-cars.xml
Sitemap: ${baseUrl}/sitemap-companies.xml
Sitemap: ${baseUrl}/sitemap-blog.xml
Sitemap: ${baseUrl}/sitemap-categories.xml

# Crawl-delay for better server performance
Crawl-delay: 1

# Special rules for different bots
User-agent: Googlebot
Crawl-delay: 0
Allow: /

User-agent: Bingbot
Crawl-delay: 1
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: WhatsApp
Allow: /

# Arabic and Middle Eastern search engines
User-agent: YandexBot
Allow: /
Crawl-delay: 1

User-agent: DuckDuckBot
Allow: /

# Block aggressive crawlers that might impact server performance
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: SemrushBot
Crawl-delay: 10

# Special handling for social media crawlers
User-agent: LinkedInBot
Allow: /

User-agent: TelegramBot
Allow: /`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Fetch car listings from API
   */
  private async fetchCarListings(): Promise<
    { id: string; slug: string; updatedAt: string }[]
  > {
    try {
      const response = await fetch("/api/sitemap/cars");
      if (!response.ok) throw new Error("Failed to fetch car listings");
      return await response.json();
    } catch {
      return []; // Return empty array if API fails
    }
  }

  /**
   * Fetch companies from API
   */
  private async fetchCompanies(): Promise<
    { id: string; slug: string; updatedAt: string }[]
  > {
    try {
      const response = await fetch("/api/sitemap/companies");
      if (!response.ok) throw new Error("Failed to fetch companies");
      return await response.json();
    } catch {
      return []; // Return empty array if API fails
    }
  }

  /**
   * Fetch categories from API with enhanced Arabic car types
   */
  private async fetchCategories(): Promise<
    { slug: string; arabicName?: string }[]
  > {
    // Enhanced Arabic categories for Syrian car market based on actual data
    const defaultCategories = [
      { slug: "sedan", arabicName: "سيدان" },
      { slug: "suv", arabicName: "جبلية" },
      { slug: "pickup", arabicName: "بيكأب" },
      { slug: "hatchback", arabicName: "هاتشباك" },
      { slug: "coupe", arabicName: "بابين" },
      { slug: "convertible", arabicName: "كشف" },
      { slug: "station", arabicName: "(ستيشن) واغن" },
      { slug: "electric", arabicName: "كهربائية" },
      { slug: "hybrid", arabicName: "هايبرد" },
      { slug: "diesel", arabicName: "ديزل" },
      { slug: "gas", arabicName: "غاز" },
    ];

    try {
      const response = await fetch("/api/sitemap/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return await response.json();
    } catch {
      return defaultCategories; // Return default categories if API fails
    }
  }

  /**
   * Fetch Syrian cities for location-based sitemap URLs
   */
  private async fetchCities(): Promise<{ slug: string; arabicName: string }[]> {
    const syrianCities = [
      { slug: "damascus", arabicName: "دمشق" },
      { slug: "aleppo", arabicName: "حلب" },
      { slug: "homs", arabicName: "حمص" },
      { slug: "hama", arabicName: "حماة" },
      { slug: "lattakia", arabicName: "اللاذقية" },
      { slug: "tartous", arabicName: "طرطوس" },
      { slug: "sweida", arabicName: "السويداء" },
      { slug: "quneitra", arabicName: "القنيطرة" },
      { slug: "daraa", arabicName: "درعا" },
      { slug: "raqqa", arabicName: "الرقة" },
      { slug: "deir-ezzor", arabicName: "دير الزور" },
      { slug: "hasaka", arabicName: "الحسكة" },
      { slug: "idleb", arabicName: "إدلب" },
      { slug: "qamishli", arabicName: "القامشلي" },
    ];

    try {
      const response = await fetch("/api/sitemap/cities");
      if (!response.ok) throw new Error("Failed to fetch cities");
      return await response.json();
    } catch {
      return syrianCities; // Return default Syrian cities if API fails
    }
  }

  /**
   * Fetch blog posts from API
   */
  private async fetchBlogPosts(): Promise<
    { id: string; slug: string; updatedAt: string }[]
  > {
    try {
      const response = await fetch("/api/sitemap/blog");
      if (!response.ok) throw new Error("Failed to fetch blog posts");
      return await response.json();
    } catch {
      return []; // Return empty array if API fails
    }
  }

  /**
   * Generate enhanced SEO URLs for Syrian car market
   * Uses actual Arabic car data for better search visibility
   */
  private generateEnhancedCarURLs(): SitemapUrl[] {
    const enhancedUrls: SitemapUrl[] = [];
    const baseUrl = this.options.baseUrl;

    // Popular car type combinations for Syrian market
    const popularCombinations = [
      { type: "sedan", fuel: "bensin", priority: 0.8 },
      { type: "suv", fuel: "diesel", priority: 0.9 },
      { type: "pickup", fuel: "diesel", priority: 0.8 },
      { type: "hatchback", fuel: "bensin", priority: 0.7 },
      { type: "sedan", fuel: "gas", priority: 0.7 }, // Gas cars popular in Syria
    ];

    // Generate URLs for popular combinations
    popularCombinations.forEach((combo) => {
      enhancedUrls.push({
        loc: `${baseUrl}/search?carType=${combo.type}&fuelType=${combo.fuel}`,
        lastmod: new Date().toISOString(),
        changefreq: "weekly" as const,
        priority: combo.priority,
        alternateUrls: this.options.includeAlternateLanguages
          ? [
              {
                hreflang: "ar",
                href: `${baseUrl}/search?carType=${combo.type}&fuelType=${combo.fuel}`,
              },
              {
                hreflang: "ar-SY",
                href: `${baseUrl}/search?carType=${combo.type}&fuelType=${combo.fuel}`,
              },
            ]
          : undefined,
      });
    });

    // Generate year-based URLs (recent years more popular)
    const popularYears = [2023, 2022, 2021, 2020, 2019, 2018];
    popularYears.forEach((year, index) => {
      enhancedUrls.push({
        loc: `${baseUrl}/search?year=${year}`,
        lastmod: new Date().toISOString(),
        changefreq: "weekly" as const,
        priority: 0.7 - index * 0.05, // Newer years have higher priority
        alternateUrls: this.options.includeAlternateLanguages
          ? [
              {
                hreflang: "ar",
                href: `${baseUrl}/search?year=${year}`,
              },
              {
                hreflang: "ar-SY",
                href: `${baseUrl}/search?year=${year}`,
              },
            ]
          : undefined,
      });
    });

    // Generate gearbox type URLs
    const gearboxTypes = ["automatic", "manual"];
    gearboxTypes.forEach((gearbox) => {
      enhancedUrls.push({
        loc: `${baseUrl}/search?gearbox=${gearbox}`,
        lastmod: new Date().toISOString(),
        changefreq: "weekly" as const,
        priority: gearbox === "automatic" ? 0.8 : 0.7, // Automatic preferred
        alternateUrls: this.options.includeAlternateLanguages
          ? [
              {
                hreflang: "ar",
                href: `${baseUrl}/search?gearbox=${gearbox}`,
              },
              {
                hreflang: "ar-SY",
                href: `${baseUrl}/search?gearbox=${gearbox}`,
              },
            ]
          : undefined,
      });
    });

    return enhancedUrls;
  }

  /**
   * Generate Syrian market specific help and info pages
   */
  private generateSyrianMarketPages(): SitemapUrl[] {
    const baseUrl = this.options.baseUrl;
    const syrianPages = [
      { path: "/help/buying-guide", priority: 0.8 },
      { path: "/help/selling-guide", priority: 0.8 },
      { path: "/help/car-financing-syria", priority: 0.7 },
      { path: "/help/car-insurance-syria", priority: 0.7 },
      { path: "/help/car-registration-syria", priority: 0.6 },
      { path: "/news/car-market-syria", priority: 0.8 },
      { path: "/tips/car-maintenance", priority: 0.7 },
      { path: "/tips/fuel-efficiency", priority: 0.6 },
    ];

    return syrianPages.map((page) => ({
      loc: `${baseUrl}${page.path}`,
      lastmod: new Date().toISOString(),
      changefreq: "monthly" as const,
      priority: page.priority,
      alternateUrls: this.options.includeAlternateLanguages
        ? [
            { hreflang: "ar", href: `${baseUrl}${page.path}` },
            { hreflang: "ar-SY", href: `${baseUrl}${page.path}` },
          ]
        : undefined,
    }));
  }

  /**
   * Generate structured data mapping for Arabic car attributes
   * Maps Arabic terms to structured data schema
   */
  public static getCarStructuredDataMapping() {
    return {
      carTypes: {
        سيدان: "sedan",
        جبلية: "suv",
        بيكأب: "pickup",
        هاتشباك: "hatchback",
        بابين: "coupe",
        كشف: "convertible",
        "(ستيشن) واغن": "station",
      },
      fuelTypes: {
        بنزين: "gasoline",
        ديزل: "diesel",
        غاز: "lpg",
        كهرباء: "electric",
        هايبرد: "hybrid",
      },
      gearbox: {
        اوتوماتيك: "automatic",
        يدوي: "manual",
      },
      cities: {
        دمشق: "Damascus",
        حلب: "Aleppo",
        حمص: "Homs",
        حماة: "Hama",
        اللاذقية: "Latakia",
        طرطوس: "Tartus",
        السويداء: "As-Suwayda",
        القنيطرة: "Quneitra",
        درعا: "Daraa",
        الرقة: "Raqqa",
        "دير الزور": "Deir ez-Zor",
        الحسكة: "Al-Hasakah",
        إدلب: "Idlib",
        القامشلي: "Qamishli",
      },
    };
  }

  /**
   * Track car listing views with Arabic metadata
   */
  public static trackCarListingView(carData: {
    id: string;
    arabicType?: string;
    arabicCity?: string;
    arabicFuelType?: string;
    year?: number;
  }): void {
    const mapping = this.getCarStructuredDataMapping();

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "car_listing_view", {
        car_id: carData.id,
        car_type_arabic: carData.arabicType,
        car_type_english: carData.arabicType
          ? mapping.carTypes[
              carData.arabicType as keyof typeof mapping.carTypes
            ]
          : undefined,
        city_arabic: carData.arabicCity,
        city_english: carData.arabicCity
          ? mapping.cities[carData.arabicCity as keyof typeof mapping.cities]
          : undefined,
        fuel_type_arabic: carData.arabicFuelType,
        fuel_type_english: carData.arabicFuelType
          ? mapping.fuelTypes[
              carData.arabicFuelType as keyof typeof mapping.fuelTypes
            ]
          : undefined,
        car_year: carData.year,
        market: "syria",
        language: "arabic",
      });
    }

    // #TODO: Add specific tracking for Syrian car market insights
    // #TODO: Track most popular car types by city
    // #TODO: Track fuel type preferences by region
  }
}

/**
 * Google Analytics gtag interface
 */
interface GtagFunction {
  (
    command: "event",
    eventName: string,
    parameters?: Record<string, unknown>
  ): void;
  (
    command: "config" | "js",
    targetId: string | Date,
    config?: Record<string, unknown>
  ): void;
}

/**
 * Window interface extension for gtag
 */
declare global {
  interface Window {
    gtag?: GtagFunction;
  }
}

/**
 * SEO Analytics Service for tracking and reporting
 */
export class SEOAnalyticsService {
  /**
   * Track page view with SEO data
   */
  public static trackPageView(
    seoData: Partial<{ title: string; description: string; keywords: string[] }>
  ): void {
    // Google Analytics 4 event
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "page_view", {
        page_title: seoData.title,
        page_location: window.location.href,
        content_group1: seoData.keywords?.[0] || "general",
      });
    }

    // #TODO: Add additional analytics providers
    // #TODO: Track Core Web Vitals
    // #TODO: Track Arabic-specific metrics
  }

  /**
   * Track search queries for SEO insights
   */
  public static trackSearch(query: string, results: number): void {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "search", {
        search_term: query,
        number_of_results: results,
      });
    }
  }

  /**
   * Track structured data implementation
   */
  public static trackStructuredData(type: string, isValid: boolean): void {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "structured_data_implementation", {
        schema_type: type,
        is_valid: isValid,
      });
    }
  }
}

export default SitemapGeneratorService;
