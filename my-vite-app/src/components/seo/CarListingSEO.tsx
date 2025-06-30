import React, { useEffect } from "react";
import { CarInfo, Seller } from "../../types";
import {
  generateSEOTitle,
  generateSEODescription,
  generateOGTitle,
  generateOGDescription,
  generateCarStructuredData,
  generateBreadcrumbStructuredData,
} from "../../utils/seoUtils";

interface CarListingSEOProps {
  car: CarInfo;
  seller: Seller;
  companyName?: string;
}

/**
 * SEO Component for Car Listings
 *
 * Implements comprehensive SEO optimization for individual car listing pages using existing CarInfo types:
 * - Structured data (Schema.org Car markup)
 * - Open Graph tags for social media
 * - Twitter Card optimization
 * - Arabic keyword optimization
 * - Local SEO for geographic targeting
 * - Breadcrumb navigation
 *
 * #TODO: Add review aggregation structured data
 * #TODO: Implement car comparison structured data
 * #TODO: Add video structured data for car videos
 * #TODO: Implement local business structured data for dealers
 */
const CarListingSEO: React.FC<CarListingSEOProps> = ({
  car,
  seller,
  companyName,
}) => {
  useEffect(() => {
    // Update document title
    document.title = generateSEOTitle(car, companyName);

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", generateSEODescription(car));
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = generateSEODescription(car);
      document.head.appendChild(meta);
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    const keywords = [
      car.make,
      car.model,
      car.year.toString(),
      car.location,
      "سيارات للبيع",
      "شراء سيارة",
      car.car_type,
      car.fuel || "",
      car.transmission || "",
    ]
      .filter(Boolean)
      .join(", ");

    if (metaKeywords) {
      metaKeywords.setAttribute("content", keywords);
    } else {
      const meta = document.createElement("meta");
      meta.name = "keywords";
      meta.content = keywords;
      document.head.appendChild(meta);
    }

    // Update Open Graph tags
    const updateOrCreateMetaTag = (property: string, content: string) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (metaTag) {
        metaTag.setAttribute("content", content);
      } else {
        metaTag = document.createElement("meta");
        metaTag.setAttribute("property", property);
        metaTag.setAttribute("content", content);
        document.head.appendChild(metaTag);
      }
    };

    updateOrCreateMetaTag("og:title", generateOGTitle(car));
    updateOrCreateMetaTag("og:description", generateOGDescription(car));
    updateOrCreateMetaTag(
      "og:image",
      car.image_urls[0] || "/default-car-image.jpg"
    );
    updateOrCreateMetaTag("og:type", "product");
    updateOrCreateMetaTag(
      "og:url",
      `${window.location.origin}/car-listing/${car.id}`
    );
    updateOrCreateMetaTag("og:site_name", companyName || "مزادات السيارات");

    // Twitter Card tags
    updateOrCreateMetaTag("twitter:card", "summary_large_image");
    updateOrCreateMetaTag("twitter:title", generateOGTitle(car));
    updateOrCreateMetaTag("twitter:description", generateOGDescription(car));
    updateOrCreateMetaTag(
      "twitter:image",
      car.image_urls[0] || "/default-car-image.jpg"
    );

    // Generate structured data
    const carStructuredData = generateCarStructuredData(car, seller);
    const breadcrumbStructuredData = generateBreadcrumbStructuredData(car);

    // Inject car structured data
    const existingCarScript = document.getElementById(
      "car-listing-structured-data"
    );
    if (existingCarScript) {
      existingCarScript.remove();
    }

    const carScript = document.createElement("script");
    carScript.id = "car-listing-structured-data";
    carScript.type = "application/ld+json";
    carScript.textContent = JSON.stringify(carStructuredData);
    document.head.appendChild(carScript);

    // Inject breadcrumb structured data
    const existingBreadcrumbScript = document.getElementById(
      "breadcrumb-structured-data"
    );
    if (existingBreadcrumbScript) {
      existingBreadcrumbScript.remove();
    }

    const breadcrumbScript = document.createElement("script");
    breadcrumbScript.id = "breadcrumb-structured-data";
    breadcrumbScript.type = "application/ld+json";
    breadcrumbScript.textContent = JSON.stringify(breadcrumbStructuredData);
    document.head.appendChild(breadcrumbScript);

    // Cleanup function
    return () => {
      // Clean up injected scripts when component unmounts
      const carScriptElement = document.getElementById(
        "car-listing-structured-data"
      );
      const breadcrumbScriptElement = document.getElementById(
        "breadcrumb-structured-data"
      );

      if (carScriptElement) carScriptElement.remove();
      if (breadcrumbScriptElement) breadcrumbScriptElement.remove();
    };
  }, [car, seller, companyName]);

  // This component doesn't render anything, it only manages SEO
  return null;
};

/**
 * Company Profile SEO Component
 */
interface CompanyProfileSEOProps {
  company: {
    id: string;
    name: string;
    description: string;
    logo?: string;
    address?: string;
    city: string;
    phone?: string;
    email?: string;
    website?: string;
    establishedYear?: number;
    employeeCount?: number;
    totalListings?: number;
    rating?: number;
    reviewCount?: number;
  };
}

export const CompanyProfileSEO: React.FC<CompanyProfileSEOProps> = ({
  company,
}) => {
  useEffect(() => {
    // Update document title
    document.title = `${company.name} - معرض سيارات ${company.city} | مزادات السيارات`;

    // Update meta description
    const description = `${company.name} - معرض سيارات معتمد في ${
      company.city
    }. ${company.description.substring(
      0,
      100
    )}... شاهد جميع السيارات المعروضة والخدمات المتاحة.`;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Generate company structured data
    const companyStructuredData = {
      "@context": "https://schema.org",
      "@type": "AutoDealer",
      "@id": `${window.location.origin}/company/${company.id}`,
      name: company.name,
      description: company.description,
      image: company.logo,
      address: {
        "@type": "PostalAddress",
        addressLocality: company.city,
        streetAddress: company.address,
        addressCountry: "SA",
      },
      telephone: company.phone,
      email: company.email,
      url: company.website || `${window.location.origin}/company/${company.id}`,
      foundingDate: company.establishedYear
        ? `${company.establishedYear}-01-01`
        : undefined,
      numberOfEmployees: company.employeeCount,
      aggregateRating: company.rating
        ? {
            "@type": "AggregateRating",
            ratingValue: company.rating,
            reviewCount: company.reviewCount || 1,
          }
        : undefined,
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "سيارات للبيع",
        itemListElement: company.totalListings
          ? [
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Car",
                  name: "سيارات متنوعة",
                },
              },
            ]
          : undefined,
      },
    };

    // Inject company structured data
    const existingScript = document.getElementById("company-structured-data");
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = "company-structured-data";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(companyStructuredData);
    document.head.appendChild(script);

    return () => {
      const scriptElement = document.getElementById("company-structured-data");
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, [company]);

  return null;
};

export default CarListingSEO;
