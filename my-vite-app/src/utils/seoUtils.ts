import { CarInfo, Seller } from "../types";

/**
 * SEO Utility Functions for Car Listings
 *
 * Provides utilities to convert existing car data types to SEO-optimized formats
 * and generate search engine friendly metadata with proper null safety.
 *
 * #TODO: Add support for multilingual SEO (English/Arabic)
 * #TODO: Implement automatic keyword extraction from description
 * #TODO: Add image optimization recommendations
 * #TODO: Implement A/B testing for SEO titles and descriptions
 * #TODO: Add caching layer for generated SEO data
 * #TODO: Implement SEO score calculator
 */

/**
 * Safe array access utility
 */
const safeArray = <T>(arr: T[] | undefined | null): T[] => {
  return Array.isArray(arr) ? arr : [];
};

/**
 * Safe string access utility
 */
const safeString = (
  str: string | undefined | null,
  defaultValue = ""
): string => {
  return typeof str === "string" ? str : defaultValue;
};

/**
 * Safe number access utility
 */
const safeNumber = (
  num: number | undefined | null,
  defaultValue = 0
): number => {
  return typeof num === "number" && !isNaN(num) ? num : defaultValue;
};

export interface SEOCarData {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  price: number;
  currency: string;
  location: string;
  images: string[];
  make: string;
  model: string;
  year: number;
  mileage?: number;
  fuel?: string;
  transmission?: string;
  carType?: string;
  seller: Seller;
  createdAt: string;
  status: string;
}

/**
 * Converts CarInfo to SEO-friendly format with null safety
 */
export const convertCarInfoToSEO = (
  car: CarInfo,
  seller: Seller
): SEOCarData => {
  return {
    id: safeString(car.id, ""),
    title: safeString(car.title, ""),
    description: safeString(car.description, ""),
    keywords: generateCarKeywords(car),
    price: safeNumber(car.price, 0),
    currency: safeString(car.currency, "USD"), // Default to USD as it's commonly used in Syrian car market
    location: safeString(car.location, ""),
    images: safeArray(car.image_urls),
    make: safeString(car.make, ""),
    model: safeString(car.model, ""),
    year: safeNumber(car.year, new Date().getFullYear()),
    mileage: safeNumber(car.mileage),
    fuel: safeString(car.fuel),
    transmission: safeString(car.transmission),
    carType: safeString(car.car_type),
    seller: seller,
    createdAt: safeString(car.created_at, new Date().toISOString()),
    status: car.status,
  };
};

/**
 * Generates SEO keywords from car information with null safety
 */
export const generateCarKeywords = (car: CarInfo): string[] => {
  const make = safeString(car.make, "");
  const model = safeString(car.model, "");
  const year = safeNumber(car.year, new Date().getFullYear());
  const location = safeString(car.location, "");
  const carType = safeString(car.car_type, "");
  const fuel = safeString(car.fuel, "");
  const transmission = safeString(car.transmission, "");
  const color = safeString(car.color, "");
  const price = safeNumber(car.price, 0);
  const specs = safeArray(car.specs);

  const keywords = [
    // Basic car info (only if values exist)
    make,
    model,
    year.toString(),
    make && model ? `${make} ${model}` : "",
    make && model ? `${make} ${model} ${year}` : "",

    // Location-based (Syrian cities and regions)
    location,
    location ? `سيارات ${location}` : "",
    make && location ? `${make} ${location}` : "",
    "سيارات دمشق",
    "سيارات حلب",
    "سيارات اللاذقية",
    "سيارات حمص",
    "سيارات حماة",
    "سيارات طرطوس",
    "سيارات السويداء",
    "سيارات درعا",
    "سيارات الحسكة",
    "سيارات دير الزور",
    "سيارات الرقة",
    "سيارات إدلب",
    "سيارات القنيطرة",
    "سيارات ريف دمشق",

    // Type and category
    carType,
    carType ? `سيارة ${carType}` : "",

    // Features
    fuel ? `سيارة ${fuel}` : "",
    transmission,
    color && make ? `${make} ${color}` : "",

    // Specifications
    ...specs,

    // Syrian market specific terms
    "سيارات للبيع في سوريا",
    "شراء سيارة سوريا",
    "سيارات مستعملة سوريا",
    "معرض سيارات سوريا",
    "أفضل الأسعار سوريا",
    "سوق السيارات السوري",
    "مزادات السيارات سوريا",
    "بيع وشراء السيارات سوريا",
    "سيارات السوق السوري",
    "أسعار السيارات في سوريا",
    "معارض السيارات دمشق",
    "معارض السيارات حلب",
    "تجارة السيارات سوريا",
    "استيراد السيارات سوريا",
    "سيارات أوروبية سوريا",
    "سيارات يابانية سوريا",
    "سيارات كورية سوريا",
    "سيارات أمريكية سوريا",

    // Price-related with Syrian context and currency options
    price < 50000 ? "سيارات رخيصة سوريا" : "سيارات فاخرة سوريا",
    year > new Date().getFullYear() - 5
      ? "سيارة حديثة سوريا"
      : "سيارة مستعملة سوريا",

    // Currency-specific keywords
    "سيارات بالدولار سوريا",
    "سيارات بالليرة السورية",
    "أسعار السيارات بالدولار",
    "أسعار السيارات بالليرة",
    "سيارات USD سوريا",
    "سيارات SYP سوريا",
    "تسعير السيارات دولار",
    "تسعير السيارات ليرة",
    "مقارنة أسعار السيارات سوريا",
    "صرف العملة السيارات",

    // Regional and neighboring markets
    "سيارات الشرق الأوسط",
    "سيارات المنطقة العربية",
    "سيارات لبنان سوريا",
    "سيارات الأردن سوريا",
    "سيارات تركيا سوريا",
  ].filter(Boolean) as string[];

  // Remove duplicates and empty values
  return [...new Set(keywords)];
};

/**
 * Generates SEO-optimized title for car listing with null safety
 */
export const generateSEOTitle = (
  car: CarInfo,
  companyName?: string
): string => {
  const make = safeString(car.make, "سيارة");
  const model = safeString(car.model, "");
  const year = safeNumber(car.year, new Date().getFullYear());
  const price = safeNumber(car.price, 0);
  const location = safeString(car.location, "");

  const currency = safeString(car.currency, "USD");
  const currencySymbol =
    currency === "USD" ? "$" : currency === "SYP" ? "ل.س" : currency;

  const baseTitle = `${make} ${model} ${year} - ${price.toLocaleString()} ${currencySymbol}`;
  const locationText = location ? ` في ${location}` : "";
  const suffix = companyName ? ` | ${companyName}` : " | مزادات السيارات";

  return `${baseTitle}${locationText}${suffix}`;
};

/**
 * Generates SEO-optimized description for car listing with null safety
 */
export const generateSEODescription = (car: CarInfo): string => {
  const make = safeString(car.make, "سيارة");
  const model = safeString(car.model, "");
  const year = safeNumber(car.year, new Date().getFullYear());
  const location = safeString(car.location, "سوريا");
  const description = safeString(car.description, "");
  const mileage = safeNumber(car.mileage);
  const specs = safeArray(car.specs);

  const baseDescription = `${make} ${model} ${year} للبيع في ${location}.`;
  const specsText =
    specs.length > 0 ? ` مواصفات: ${specs.slice(0, 3).join("، ")}.` : "";
  const mileageText =
    mileage > 0 ? ` المسافة المقطوعة: ${mileage.toLocaleString()} كم.` : "";
  const customDescription =
    description.length > 100
      ? ` ${description.substring(0, 100)}...`
      : description.length > 0
      ? ` ${description}`
      : "";

  const fullDescription = `${baseDescription}${specsText}${mileageText}${customDescription} شاهد التفاصيل والصور الآن.`;

  // Ensure description is within SEO limits (150-160 characters)
  return fullDescription.length > 160
    ? `${fullDescription.substring(0, 157)}...`
    : fullDescription;
};

/**
 * Generates Open Graph optimized title with null safety
 */
export const generateOGTitle = (car: CarInfo): string => {
  const make = safeString(car.make, "سيارة");
  const model = safeString(car.model, "");
  const year = safeNumber(car.year, new Date().getFullYear());
  const price = safeNumber(car.price, 0);

  const currency = safeString(car.currency, "USD");
  const currencySymbol =
    currency === "USD" ? "$" : currency === "SYP" ? "ل.س" : currency;

  return `${make} ${model} ${year} - ${price.toLocaleString()} ${currencySymbol}`;
};

/**
 * Generates Open Graph optimized description with null safety
 */
export const generateOGDescription = (car: CarInfo): string => {
  const make = safeString(car.make, "سيارة");
  const model = safeString(car.model, "");
  const year = safeNumber(car.year, new Date().getFullYear());
  const location = safeString(car.location, "سوريا");

  const baseDescription = `اكتشف هذه ${make} ${model} ${year} المميزة في ${location}.`;
  const specs = safeArray(car.specs);
  const highlights =
    specs.length > 0 ? ` مميزات خاصة: ${specs.slice(0, 2).join("، ")}.` : "";

  return `${baseDescription}${highlights} مواصفات رائعة وسعر مناسب. شاهد الصور والتفاصيل الآن.`;
};

/**
 * Generates JSON-LD structured data for car listing with null safety
 */
export const generateCarStructuredData = (car: CarInfo, seller: Seller) => {
  const make = safeString(car.make, "Unknown");
  const model = safeString(car.model, "");
  const year = safeNumber(car.year, new Date().getFullYear());
  const price = safeNumber(car.price, 0);
  const description = safeString(car.description, "");
  const imageUrls = safeArray(car.image_urls);
  const specs = safeArray(car.specs);
  const views = safeNumber(car.views, 0);
  const mileage = safeNumber(car.mileage);
  const engineLiters = safeNumber(car.engine_liters);
  const engineCylinders = safeNumber(car.engine_cylinders);

  const currency = safeString(car.currency, "USD");
  const location = safeString(car.location, "");
  const carType = safeString(car.car_type, "");
  const fuel = safeString(car.fuel, "");
  const transmission = safeString(car.transmission, "");
  const color = safeString(car.color, "");
  const createdAt = safeString(car.created_at, new Date().toISOString());
  const listingStatus = safeString(car.listing_status, "active");

  // Seller information with null safety
  const sellerName = safeString(
    seller?.name || seller?.first_name,
    "Unknown Seller"
  );
  const sellerLocation = safeString(seller?.location, location);

  return {
    "@context": "https://schema.org",
    "@type": "Car",
    "@id": `${window.location.origin}/car-listing/${car.id}`,
    name: `${make} ${model} ${year}`,
    description: description,
    image: imageUrls,
    brand: make
      ? {
          "@type": "Brand",
          name: make,
        }
      : undefined,
    model: model || undefined,
    vehicleModelDate: year,
    bodyType: carType || undefined,
    fuelType: fuel || undefined,
    vehicleTransmission: transmission || undefined,
    color: color || undefined,
    mileageFromOdometer:
      mileage > 0
        ? {
            "@type": "QuantitativeValue",
            value: mileage,
            unitText: "km",
          }
        : undefined,
    vehicleEngine:
      engineLiters > 0
        ? {
            "@type": "EngineSpecification",
            engineDisplacement: {
              "@type": "QuantitativeValue",
              value: engineLiters,
              unitText: "L",
            },
            numberOfCylinders:
              engineCylinders > 0 ? engineCylinders : undefined,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: currency,
      availability:
        listingStatus === "active"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: {
        "@type": "Person",
        name: sellerName,
        address: sellerLocation
          ? {
              "@type": "PostalAddress",
              addressLocality: sellerLocation,
              addressCountry: "SY",
            }
          : undefined,
      },
      validFrom: createdAt,
      url: `${window.location.origin}/car-listing/${car.id}`,
    },
    manufacturer: make
      ? {
          "@type": "Organization",
          name: make,
        }
      : undefined,
    additionalProperty:
      specs.length > 0
        ? specs.map((spec) => ({
            "@type": "PropertyValue",
            name: "specification",
            value: spec,
          }))
        : undefined,
    dateCreated: createdAt,
    url: `${window.location.origin}/car-listing/${car.id}`,
    aggregateRating:
      views > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Math.min(5, Math.max(1, views / 100)), // Simple rating based on views
            reviewCount: Math.floor(views / 10) || 1,
          }
        : undefined,
  };
};

/**
 * Generates breadcrumb structured data with null safety
 */
export const generateBreadcrumbStructuredData = (car: CarInfo) => {
  const make = safeString(car.make, "سيارة");
  const model = safeString(car.model, "");
  const year = safeNumber(car.year, new Date().getFullYear());
  const carId = safeString(car.id, "");

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "الرئيسية",
        item: window.location.origin,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "السيارات",
        item: `${window.location.origin}/cars`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: make,
        item: `${window.location.origin}/cars?make=${encodeURIComponent(make)}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: `${make} ${model}`,
        item: `${window.location.origin}/cars?make=${encodeURIComponent(
          make
        )}&model=${encodeURIComponent(model)}`,
      },
      {
        "@type": "ListItem",
        position: 5,
        name: `${make} ${model} ${year}`,
        item: `${window.location.origin}/car-listing/${carId}`,
      },
    ],
  };
};
