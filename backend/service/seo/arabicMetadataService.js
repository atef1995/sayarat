/**
 * Arabic Metadata Service for Syrian Car Market
 * 
 * Provides mappings between Arabic car terminology and English equivalents
 * Optimized for Syrian car market and Middle East region
 * 
 * @module ArabicMetadataService
 */

const logger = require('../../utils/logger');

/**
 * Arabic Metadata Service Class
 * Handles conversion between Arabic and English car terminology
 */
class ArabicMetadataService {
  constructor() {
    // Car type mappings from cars.json
    this.carTypes = {
      "بيكأب": "pickup",
      "جبلية": "suv",
      "سيدان": "sedan",
      "هاتشباك": "hatchback",
      "بابين": "coupe",
      "كشف": "convertible",
      "(ستيشن) واغن": "station"
    };

    // Reverse mapping for English to Arabic
    this.carTypesReverse = Object.fromEntries(
      Object.entries(this.carTypes).map(([arabic, english]) => [english, arabic])
    );

    // Fuel type mappings
    this.fuelTypes = {
      "بنزين": "bensin",
      "ديزل": "diesel",
      "غاز": "gas",
      "كهرباء": "electric",
      "هايبرد": "hybrid"
    };

    this.fuelTypesReverse = Object.fromEntries(
      Object.entries(this.fuelTypes).map(([arabic, english]) => [english, arabic])
    );

    // Gearbox mappings
    this.gearbox = {
      "اوتوماتيك": "automatic",
      "يدوي": "manual"
    };

    this.gearboxReverse = Object.fromEntries(
      Object.entries(this.gearbox).map(([arabic, english]) => [english, arabic])
    );

    // Syrian cities mappings
    this.cities = {
      "دمشق": "damascus",
      "حلب": "aleppo",
      "حمص": "homs",
      "حماة": "hama",
      "اللاذقية": "lattakia",
      "طرطوس": "tartous",
      "السويداء": "sweida",
      "القنيطرة": "quneitra",
      "درعا": "daraa",
      "الرقة": "raqqa",
      "دير الزور": "deir-ezzor",
      "الحسكة": "hasaka",
      "إدلب": "idleb",
      "القامشلي": "qamishli"
    };

    this.citiesReverse = Object.fromEntries(
      Object.entries(this.cities).map(([arabic, english]) => [english, arabic])
    );

    // Color mappings
    this.colors = {
      "أبيض": "white",
      "أسود": "black",
      "أحمر": "red",
      "أزرق": "blue",
      "أصفر": "yellow",
      "أخضر": "green",
      "برتقالي": "orange",
      "بني": "brown",
      "بيج": "beige",
      "ذهبي": "gold",
      "رمادي": "gray",
      "فضي": "silver",
      "كحلي": "navy",
      "كريمي": "cream",
      "لون آخر": "other"
    };

    this.colorsReverse = Object.fromEntries(
      Object.entries(this.colors).map(([arabic, english]) => [english, arabic])
    );
  }

  /**
   * Get Arabic car type from English
   * @param {string} englishType - English car type
   * @returns {string|null} Arabic car type
   */
  getArabicCarType(englishType) {
    if (!englishType) return null;
    return this.carTypesReverse[englishType.toLowerCase()] || null;
  }

  /**
   * Get English car type from Arabic
   * @param {string} arabicType - Arabic car type
   * @returns {string|null} English car type
   */
  getEnglishCarType(arabicType) {
    if (!arabicType) return null;
    return this.carTypes[arabicType] || null;
  }

  /**
   * Get Arabic fuel type from English
   * @param {string} englishFuel - English fuel type
   * @returns {string|null} Arabic fuel type
   */
  getArabicFuelType(englishFuel) {
    if (!englishFuel) return null;
    return this.fuelTypesReverse[englishFuel.toLowerCase()] || null;
  }

  /**
   * Get English fuel type from Arabic
   * @param {string} arabicFuel - Arabic fuel type
   * @returns {string|null} English fuel type
   */
  getEnglishFuelType(arabicFuel) {
    if (!arabicFuel) return null;
    return this.fuelTypes[arabicFuel] || null;
  }

  /**
   * Get Arabic city name from English slug
   * @param {string} englishCity - English city slug
   * @returns {string|null} Arabic city name
   */
  getArabicCity(englishCity) {
    if (!englishCity) return null;
    return this.citiesReverse[englishCity.toLowerCase()] || null;
  }

  /**
   * Get English city slug from Arabic name
   * @param {string} arabicCity - Arabic city name
   * @returns {string|null} English city slug
   */
  getEnglishCity(arabicCity) {
    if (!arabicCity) return null;
    return this.cities[arabicCity] || null;
  }

  /**
   * Get Arabic gearbox type from English
   * @param {string} englishGearbox - English gearbox type
   * @returns {string|null} Arabic gearbox type
   */
  getArabicGearbox(englishGearbox) {
    if (!englishGearbox) return null;
    return this.gearboxReverse[englishGearbox.toLowerCase()] || null;
  }

  /**
   * Get English gearbox type from Arabic
   * @param {string} arabicGearbox - Arabic gearbox type
   * @returns {string|null} English gearbox type
   */
  getEnglishGearbox(arabicGearbox) {
    if (!arabicGearbox) return null;
    return this.gearbox[arabicGearbox] || null;
  }

  /**
   * Get Arabic color from English
   * @param {string} englishColor - English color
   * @returns {string|null} Arabic color
   */
  getArabicColor(englishColor) {
    if (!englishColor) return null;
    return this.colorsReverse[englishColor.toLowerCase()] || null;
  }

  /**
   * Get English color from Arabic
   * @param {string} arabicColor - Arabic color
   * @returns {string|null} English color
   */
  getEnglishColor(arabicColor) {
    if (!arabicColor) return null;
    return this.colors[arabicColor] || null;
  }

  /**
   * Enhance car data with Arabic metadata
   * @param {Object} carData - Car data object
   * @returns {Object} Enhanced car data with Arabic metadata
   */
  enhanceCarData(carData) {
    if (!carData) return null;

    const enhanced = { ...carData };

    // Add Arabic metadata based on existing English data
    if (carData.car_type) {
      enhanced.arabic_car_type = this.getArabicCarType(carData.car_type);
    }

    if (carData.fuel_type) {
      enhanced.arabic_fuel_type = this.getArabicFuelType(carData.fuel_type);
    }

    if (carData.gearbox) {
      enhanced.arabic_gearbox = this.getArabicGearbox(carData.gearbox);
    }

    if (carData.location || carData.city) {
      const city = carData.location || carData.city;
      enhanced.arabic_city = this.getArabicCity(city);
    }

    if (carData.color) {
      enhanced.arabic_color = this.getArabicColor(carData.color);
    }

    // Add SEO-friendly metadata
    enhanced.arabic_metadata = {
      region: 'سوريا', // Syria in Arabic
      market: 'الشرق الأوسط', // Middle East in Arabic  
      currency: 'ليرة سورية', // Syrian Pound in Arabic
      language: 'العربية' // Arabic in Arabic
    };

    return enhanced;
  }

  /**
   * Enhance company data with Arabic metadata
   * @param {Object} companyData - Company data object
   * @returns {Object} Enhanced company data with Arabic metadata
   */
  enhanceCompanyData(companyData) {
    if (!companyData) return null;

    const enhanced = { ...companyData };

    // Add Arabic city if location exists
    if (companyData.location || companyData.city) {
      const city = companyData.location || companyData.city;
      enhanced.arabic_city = this.getArabicCity(city);
    }

    // Add Arabic metadata
    enhanced.arabic_metadata = {
      region: 'سوريا',
      market: 'الشرق الأوسط',
      business_type: 'تاجر سيارات', // Car dealer in Arabic
      language: 'العربية'
    };

    return enhanced;
  }

  /**
   * Get all available car types with Arabic names
   * @returns {Array} Array of car types with Arabic and English names
   */
  getAllCarTypes() {
    return Object.entries(this.carTypes).map(([arabic, english]) => ({
      arabic,
      english,
      slug: english
    }));
  }

  /**
   * Get all available cities with Arabic names
   * @returns {Array} Array of cities with Arabic and English names
   */
  getAllCities() {
    return Object.entries(this.cities).map(([arabic, english]) => ({
      arabic,
      english,
      slug: english
    }));
  }

  /**
   * Get all available fuel types with Arabic names
   * @returns {Array} Array of fuel types with Arabic and English names
   */
  getAllFuelTypes() {
    return Object.entries(this.fuelTypes).map(([arabic, english]) => ({
      arabic,
      english,
      slug: english
    }));
  }

  /**
   * Get comprehensive metadata for sitemap generation
   * @returns {Object} Comprehensive metadata object
   */
  getSitemapMetadata() {
    return {
      carTypes: this.getAllCarTypes(),
      cities: this.getAllCities(),
      fuelTypes: this.getAllFuelTypes(),
      gearboxTypes: Object.entries(this.gearbox).map(([arabic, english]) => ({
        arabic,
        english,
        slug: english
      })),
      colors: Object.entries(this.colors).map(([arabic, english]) => ({
        arabic,
        english,
        slug: english
      })),
      market: {
        region: 'سوريا',
        regionEnglish: 'Syria',
        market: 'الشرق الأوسط',
        marketEnglish: 'Middle East',
        currency: 'ليرة سورية',
        currencyEnglish: 'Syrian Pound',
        currencyCode: 'SYP',
        language: 'العربية',
        languageCode: 'ar',
        countryCode: 'SY'
      }
    };
  }

  /**
   * Log metadata enhancement operation
   * @param {string} operation - Operation type
   * @param {Object} data - Data being enhanced
   */
  logMetadataOperation(operation, data) {
    logger.info(`Arabic metadata operation: ${operation}`, {
      operation,
      dataType: data?.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString(),
      market: 'Syrian'
    });
  }
}

module.exports = ArabicMetadataService;
