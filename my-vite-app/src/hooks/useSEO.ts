import React, { useEffect } from "react";

/**
 * Structured data interface for type safety
 */
interface StructuredData {
  "@context": string;
  "@type": string;
  "@id"?: string;
  [key: string]: unknown;
}

/**
 * Car listing interface for SEO
 */
interface CarListing {
  id: string;
  make: string;
  model: string;
  year: number;
  description?: string;
  images?: string[];
  mileage?: number;
  price: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  seller?: {
    name: string;
  };
}

/**
 * Company interface for SEO
 */
interface Company {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: string[];
  rating?: number;
  reviewCount?: number;
}

/**
 * SEO configuration interface for page-specific optimization
 */
export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product" | "business.business";
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  structuredData?: StructuredData;
  lang?: "ar" | "en";
  alternateUrls?: { hreflang: string; href: string }[];
  noIndex?: boolean;
  noFollow?: boolean;
}

/**
 * Default SEO configuration for the app
 */
const DEFAULT_SEO: SEOConfig = {
  title: "مزادات السيارات - أفضل منصة لبيع وشراء السيارات",
  description:
    "منصة مزادات السيارات الرائدة في المنطقة العربية. اكتشف أفضل العروض، قارن الأسعار، واعثر على سيارة أحلامك بأفضل الأسعار.",
  keywords: [
    "مزادات السيارات",
    "بيع السيارات",
    "شراء السيارات",
    "سيارات مستعملة",
    "سيارات جديدة",
    "مزاد سيارات",
    "سوق السيارات",
    "تقييم السيارات",
    "فحص السيارات",
    "تمويل السيارات",
  ],
  ogType: "website",
  twitterCard: "summary_large_image",
  lang: "ar",
};

/**
 * SEO Service class for managing all SEO-related operations
 * Implements Singleton pattern for consistent SEO management
 */
class SEOService {
  private static instance: SEOService;
  private currentConfig: SEOConfig = DEFAULT_SEO;

  private constructor() {}

  /**
   * Get singleton instance of SEO service
   */
  public static getInstance(): SEOService {
    if (!SEOService.instance) {
      SEOService.instance = new SEOService();
    }
    return SEOService.instance;
  }

  /**
   * Update SEO configuration for current page
   */
  public updateSEO(config: Partial<SEOConfig>): void {
    this.currentConfig = { ...DEFAULT_SEO, ...config };
    this.applyMetaTags();
    this.applyStructuredData();
  }

  /**
   * Apply meta tags to document head
   */
  private applyMetaTags(): void {
    const {
      title,
      description,
      keywords,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      ogType,
      twitterCard,
      lang,
      alternateUrls,
      noIndex,
      noFollow,
    } = this.currentConfig;

    // Title
    document.title = title;

    // Basic meta tags
    this.setMetaTag("description", description);
    this.setMetaTag("keywords", keywords?.join(", ") || "");
    this.setMetaTag("language", lang || "ar");

    // Robots meta tag
    const robotsContent = [];
    if (noIndex) robotsContent.push("noindex");
    if (noFollow) robotsContent.push("nofollow");
    if (robotsContent.length === 0) robotsContent.push("index", "follow");
    this.setMetaTag("robots", robotsContent.join(", "));

    // Open Graph tags
    this.setMetaProperty("og:title", ogTitle || title);
    this.setMetaProperty("og:description", ogDescription || description);
    this.setMetaProperty("og:type", ogType || "website");
    this.setMetaProperty("og:url", canonicalUrl || window.location.href);
    this.setMetaProperty("og:site_name", "مزادات السيارات");
    this.setMetaProperty("og:locale", lang === "ar" ? "ar_SA" : "en_US");

    if (ogImage) {
      this.setMetaProperty("og:image", ogImage);
      this.setMetaProperty("og:image:alt", ogTitle || title);
    }

    // Twitter Card tags
    this.setMetaName("twitter:card", twitterCard || "summary_large_image");
    this.setMetaName("twitter:title", ogTitle || title);
    this.setMetaName("twitter:description", ogDescription || description);
    this.setMetaName("twitter:site", "@cars_bids");

    if (ogImage) {
      this.setMetaName("twitter:image", ogImage);
    }

    // Canonical URL
    this.setCanonicalUrl(canonicalUrl || window.location.href);

    // Alternate URLs for hreflang
    this.setAlternateUrls(alternateUrls || []);

    // Additional Arabic-specific meta tags
    this.setMetaTag("content-language", lang || "ar");
    this.setMetaTag("geo.region", "SY"); // Syria as primary market
    this.setMetaTag("geo.placename", "Syria");
  }

  /**
   * Apply structured data (JSON-LD) to document
   */
  private applyStructuredData(): void {
    const { structuredData } = this.currentConfig;

    // Remove existing structured data
    const existingScript = document.getElementById("structured-data");
    if (existingScript) {
      existingScript.remove();
    }

    if (structuredData) {
      const script = document.createElement("script");
      script.id = "structured-data";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }

  /**
   * Set meta tag by name
   */
  private setMetaTag(name: string, content: string): void {
    let meta = document.querySelector(
      `meta[name="${name}"]`
    ) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  /**
   * Set meta tag by property (Open Graph)
   */
  private setMetaProperty(property: string, content: string): void {
    let meta = document.querySelector(
      `meta[property="${property}"]`
    ) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("property", property);
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  /**
   * Set meta tag by name (Twitter)
   */
  private setMetaName(name: string, content: string): void {
    let meta = document.querySelector(
      `meta[name="${name}"]`
    ) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  /**
   * Set canonical URL
   */
  private setCanonicalUrl(url: string): void {
    let link = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = url;
  }

  /**
   * Set alternate URLs for hreflang
   */
  private setAlternateUrls(
    alternateUrls: { hreflang: string; href: string }[]
  ): void {
    // Remove existing alternate links
    const existingLinks = document.querySelectorAll('link[rel="alternate"]');
    existingLinks.forEach((link) => link.remove());

    // Add new alternate links
    alternateUrls.forEach(({ hreflang, href }) => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = hreflang;
      link.href = href;
      document.head.appendChild(link);
    });
  }

  /**
   * Generate structured data for car listing
   */
  public generateCarListingStructuredData(car: CarListing): StructuredData {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${window.location.origin}/car-listing/${car.id}`,
      name: `${car.make} ${car.model} ${car.year}`,
      description: car.description,
      image: car.images?.[0] || "",
      brand: {
        "@type": "Brand",
        name: car.make,
      },
      model: car.model,
      vehicleModelDate: car.year,
      mileageFromOdometer: {
        "@type": "QuantitativeValue",
        value: car.mileage,
        unitText: "km",
      },
      offers: {
        "@type": "Offer",
        price: car.price,
        priceCurrency: car.currency || "SYP",
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: car.seller?.name || "مزادات السيارات",
        },
      },
      aggregateRating: car.rating
        ? {
            "@type": "AggregateRating",
            ratingValue: car.rating,
            reviewCount: car.reviewCount || 1,
          }
        : undefined,
    };
  }

  /**
   * Generate structured data for company profile
   */
  public generateCompanyStructuredData(company: Company): StructuredData {
    return {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${window.location.origin}/company/${company.id}`,
      name: company.name,
      description: company.description,
      image: company.logo,
      address: {
        "@type": "PostalAddress",
        streetAddress: company.address,
        addressLocality: company.city,
        addressCountry: "SA",
      },
      telephone: company.phone,
      email: company.email,
      url: company.website,
      sameAs: company.socialMedia || [],
      aggregateRating: company.rating
        ? {
            "@type": "AggregateRating",
            ratingValue: company.rating,
            reviewCount: company.reviewCount || 1,
          }
        : undefined,
    };
  }

  /**
   * Generate breadcrumb structured data
   */
  public generateBreadcrumbStructuredData(
    breadcrumbs: { name: string; url: string }[]
  ): StructuredData {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
  }
}

/**
 * React hook for managing SEO in components
 * Provides easy-to-use SEO management with automatic cleanup
 */
export const useSEO = (config?: Partial<SEOConfig>) => {
  const seoService = SEOService.getInstance();

  useEffect(() => {
    if (config) {
      // Add current URL as canonical if not provided
      const configWithCanonical = {
        ...config,
        canonicalUrl:
          config.canonicalUrl ||
          `${window.location.origin}${window.location.pathname}`,
      };

      seoService.updateSEO(configWithCanonical);
    }
  }, [config, seoService]);

  return {
    updateSEO: (newConfig: Partial<SEOConfig>) =>
      seoService.updateSEO(newConfig),
    generateCarListingStructuredData:
      seoService.generateCarListingStructuredData,
    generateCompanyStructuredData: seoService.generateCompanyStructuredData,
    generateBreadcrumbStructuredData:
      seoService.generateBreadcrumbStructuredData,
  };
};

/**
 * HOC for adding SEO to components
 * #TODO: Implement SEO HOC pattern for reusable SEO management
 */
export const withSEO = <P extends object>(
  Component: React.ComponentType<P>,
  seoConfig: Partial<SEOConfig>
) => {
  return React.memo((props: P) => {
    useSEO(seoConfig);
    return React.createElement(Component, props);
  });
};

export default SEOService;
