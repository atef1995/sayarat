/**
 * Sitemap Generator Service for Cars-Bids Platform
 *
 * Generates XML sitemaps for better search engine crawling and indexing.
 * Supports Arabic content optimization and dynamic content discovery.
 *
 * Features:
 * - Static pages sitemap
 * - Dynamic car listings sitemap
 * - Company profiles sitemap
 * - Multi-language support
 * - Priority and frequency optimization
 *
 * #TODO: Implement automated sitemap submission to search engines
 * #TODO: Add sitemap index for large datasets
 * #TODO: Implement incremental sitemap updates
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
      baseUrl: "https://cars-bids.com",
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
      { path: "/about", priority: 0.6, changefreq: "monthly" as const },
      { path: "/contact", priority: 0.6, changefreq: "monthly" as const },
      { path: "/terms", priority: 0.4, changefreq: "yearly" as const },
      { path: "/privacy", priority: 0.4, changefreq: "yearly" as const },
      { path: "/help", priority: 0.7, changefreq: "monthly" as const },
      { path: "/pricing", priority: 0.8, changefreq: "weekly" as const },
    ];

    return staticPages.map((page) => ({
      loc: `${this.options.baseUrl}${page.path}`,
      lastmod: new Date().toISOString(),
      changefreq: page.changefreq,
      priority: page.priority,
      alternateUrls: this.options.includeAlternateLanguages
        ? [
            { hreflang: "ar", href: `${this.options.baseUrl}${page.path}` },
            { hreflang: "en", href: `${this.options.baseUrl}/en${page.path}` },
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
          loc: `${this.options.baseUrl}/company/${company.id}`,
          lastmod: company.updatedAt,
          changefreq: "monthly" as const,
          priority: 0.7,
          alternateUrls: this.options.includeAlternateLanguages
            ? [
                {
                  hreflang: "ar",
                  href: `${this.options.baseUrl}/company/${company.id}`,
                },
                {
                  hreflang: "en",
                  href: `${this.options.baseUrl}/en/company/${company.id}`,
                },
              ]
            : undefined,
        }))
      );

      // Category pages
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
                  hreflang: "en",
                  href: `${this.options.baseUrl}/en/category/${category.slug}`,
                },
              ]
            : undefined,
        }))
      );
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
   * Generate robots.txt content
   */
  public generateRobotsTxt(): string {
    const baseUrl = this.options.baseUrl;

    return `User-agent: *
Allow: /

# Arabic content
Allow: /ar/
Allow: /search
Allow: /car-listing/
Allow: /company/
Allow: /category/

# Disallow admin and private areas
Disallow: /admin/
Disallow: /
Disallow: /private/
Disallow: /*.json$
Disallow: /*?*sort=
Disallow: /*?*filter=

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-cars.xml
Sitemap: ${baseUrl}/sitemap-companies.xml

# Crawl-delay for better server performance
Crawl-delay: 1

# Special rules for different bots
User-agent: Googlebot
Crawl-delay: 0

User-agent: Bingbot
Crawl-delay: 1

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
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
   * Fetch car listings from API (mock implementation)
   */
  private async fetchCarListings(): Promise<
    { id: string; updatedAt: string }[]
  > {
    // #TODO: Replace with actual API call
    try {
      const response = await fetch("/cars/sitemap");
      if (!response.ok) throw new Error("Failed to fetch car listings");
      return await response.json();
    } catch {
      return []; // Return empty array if API fails
    }
  }

  /**
   * Fetch companies from API (mock implementation)
   */
  private async fetchCompanies(): Promise<{ id: string; updatedAt: string }[]> {
    // #TODO: Replace with actual API call
    try {
      const response = await fetch("/companies/sitemap");
      if (!response.ok) throw new Error("Failed to fetch companies");
      return await response.json();
    } catch {
      return []; // Return empty array if API fails
    }
  }

  /**
   * Fetch categories from API (mock implementation)
   */
  private async fetchCategories(): Promise<{ slug: string }[]> {
    // #TODO: Replace with actual API call
    const defaultCategories = [
      { slug: "sedans" },
      { slug: "suvs" },
      { slug: "trucks" },
      { slug: "luxury" },
      { slug: "sports" },
      { slug: "electric" },
      { slug: "hybrid" },
    ];

    try {
      const response = await fetch("/categories/sitemap");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return await response.json();
    } catch {
      return defaultCategories; // Return default categories if API fails
    }
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
