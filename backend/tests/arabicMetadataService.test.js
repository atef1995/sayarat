/**
 * Jest unit tests for Arabic Metadata Service
 * Tests Arabic car terminology, city mappings, and SEO metadata generation
 */

const ArabicMetadataService = require('../service/seo/arabicMetadataService');

describe('ArabicMetadataService', () => {
  let arabicService;

  beforeAll(() => {
    arabicService = new ArabicMetadataService();
  });

  describe('Car Type Mappings', () => {
    test('should return all car types with Arabic and English mappings', () => {
      const carTypes = arabicService.getAllCarTypes();

      expect(carTypes).toBeInstanceOf(Array);
      expect(carTypes.length).toBeGreaterThan(0);

      // Check that each car type has required properties
      carTypes.forEach(type => {
        expect(type).toHaveProperty('slug');
        expect(type).toHaveProperty('arabic');
        expect(type).toHaveProperty('english');
        expect(typeof type.slug).toBe('string');
        expect(typeof type.arabic).toBe('string');
        expect(typeof type.english).toBe('string');
      });
    });

    test('should include common Syrian car types', () => {
      const carTypes = arabicService.getAllCarTypes();
      const typeSlugs = carTypes.map(type => type.slug);

      expect(typeSlugs).toContain('sedan');
      expect(typeSlugs).toContain('suv');
      expect(typeSlugs).toContain('pickup');
      expect(typeSlugs).toContain('hatchback');
    });

    test('should return correct Arabic translation for sedan', () => {
      const arabicType = arabicService.getArabicCarType('sedan');
      expect(arabicType).toBe('سيدان');
    });

    test('should return null for unknown car type', () => {
      const arabicType = arabicService.getArabicCarType('unknown_type');
      expect(arabicType).toBeNull();
    });
  });

  describe('City Mappings', () => {
    test('should return all Syrian cities with Arabic and English mappings', () => {
      const cities = arabicService.getAllCities();

      expect(cities).toBeInstanceOf(Array);
      expect(cities.length).toBeGreaterThan(0);

      // Check that each city has required properties
      cities.forEach(city => {
        expect(city).toHaveProperty('slug');
        expect(city).toHaveProperty('arabic');
        expect(city).toHaveProperty('english');
        expect(typeof city.slug).toBe('string');
        expect(typeof city.arabic).toBe('string');
        expect(typeof city.english).toBe('string');
      });
    });

    test('should include major Syrian cities', () => {
      const cities = arabicService.getAllCities();
      const citySlugs = cities.map(city => city.slug);

      expect(citySlugs).toContain('damascus');
      expect(citySlugs).toContain('aleppo');
      expect(citySlugs).toContain('homs');
      expect(citySlugs).toContain('lattakia');
    });

    test('should return correct Arabic translation for Damascus', () => {
      const arabicCity = arabicService.getArabicCity('damascus');
      expect(arabicCity).toBe('دمشق');
    });

    test('should return null for unknown city', () => {
      const arabicCity = arabicService.getArabicCity('unknown_city');
      expect(arabicCity).toBeNull();
    });
  });

  describe('Fuel Type Mappings', () => {
    test('should return all fuel types with Arabic and English mappings', () => {
      const fuelTypes = arabicService.getAllFuelTypes();

      expect(fuelTypes).toBeInstanceOf(Array);
      expect(fuelTypes.length).toBeGreaterThan(0);

      // Check that each fuel type has required properties
      fuelTypes.forEach(fuel => {
        expect(fuel).toHaveProperty('slug');
        expect(fuel).toHaveProperty('arabic');
        expect(fuel).toHaveProperty('english');
      });
    });

    test('should include common fuel types for Syrian market', () => {
      const fuelTypes = arabicService.getAllFuelTypes();
      const fuelSlugs = fuelTypes.map(fuel => fuel.slug);

      expect(fuelSlugs).toContain('bensin');
      expect(fuelSlugs).toContain('diesel');
      expect(fuelSlugs).toContain('gas');
    });

    test('should return correct Arabic translation for gasoline', () => {
      const arabicFuel = arabicService.getArabicFuelType('bensin');
      expect(arabicFuel).toBe('بنزين');
    });
  });

  describe('Car Data Enhancement', () => {
    test('should enhance car data with Arabic metadata', () => {
      const mockCar = {
        id: 1,
        title: 'Toyota Camry 2023',
        car_type: 'sedan',
        fuel_type: 'bensin',
        gearbox: 'automatic',
        location: 'damascus',
        color: 'white'
      };

      const enhancedCar = arabicService.enhanceCarData(mockCar);

      expect(enhancedCar).toHaveProperty('arabic_car_type');
      expect(enhancedCar).toHaveProperty('arabic_fuel_type');
      expect(enhancedCar).toHaveProperty('arabic_gearbox');
      expect(enhancedCar).toHaveProperty('arabic_city');
      expect(enhancedCar).toHaveProperty('arabic_color');
      expect(enhancedCar).toHaveProperty('arabic_metadata');

      expect(enhancedCar.arabic_car_type).toBe('سيدان');
      expect(enhancedCar.arabic_fuel_type).toBe('بنزين');
      expect(enhancedCar.arabic_gearbox).toBe('اوتوماتيك');
      expect(enhancedCar.arabic_city).toBe('دمشق');
      expect(enhancedCar.arabic_color).toBe('أبيض');
    });

    test('should preserve original car data when enhancing', () => {
      const mockCar = {
        id: 1,
        title: 'Toyota Camry 2023',
        car_type: 'sedan'
      };

      const enhancedCar = arabicService.enhanceCarData(mockCar);

      expect(enhancedCar.id).toBe(1);
      expect(enhancedCar.title).toBe('Toyota Camry 2023');
      expect(enhancedCar.car_type).toBe('sedan');
    });

    test('should handle missing or unknown car data gracefully', () => {
      const mockCar = {
        id: 1,
        car_type: 'unknown_type',
        fuel_type: null,
        location: undefined
      };

      const enhancedCar = arabicService.enhanceCarData(mockCar);

      expect(enhancedCar.arabic_car_type).toBeNull();
      expect(enhancedCar.arabic_fuel_type).toBeUndefined();
      expect(enhancedCar.arabic_city).toBeUndefined();
    });
  });

  describe('Company Data Enhancement', () => {
    test('should enhance company data with Arabic metadata', () => {
      const mockCompany = {
        id: 1,
        name: 'Damascus Auto Center',
        location: 'damascus'
      };

      const enhancedCompany = arabicService.enhanceCompanyData(mockCompany);

      expect(enhancedCompany).toHaveProperty('arabic_city');
      expect(enhancedCompany).toHaveProperty('arabic_metadata');
      expect(enhancedCompany.arabic_city).toBe('دمشق');
    });
  });

  describe('Sitemap Metadata', () => {
    test('should return comprehensive sitemap metadata', () => {
      const metadata = arabicService.getSitemapMetadata();

      expect(metadata).toHaveProperty('carTypes');
      expect(metadata).toHaveProperty('cities');
      expect(metadata).toHaveProperty('fuelTypes');
      expect(metadata).toHaveProperty('market');

      expect(metadata.carTypes).toBeInstanceOf(Array);
      expect(metadata.cities).toBeInstanceOf(Array);
      expect(metadata.fuelTypes).toBeInstanceOf(Array);

      expect(metadata.market).toHaveProperty('region');
      expect(metadata.market).toHaveProperty('regionEnglish');
      expect(metadata.market).toHaveProperty('language');
      expect(metadata.market).toHaveProperty('countryCode');

      expect(metadata.market.region).toBe('سوريا');
      expect(metadata.market.regionEnglish).toBe('Syria');
      expect(metadata.market.language).toBe('العربية');
      expect(metadata.market.countryCode).toBe('SY');
    });

    test('should include minimum required data for sitemap generation', () => {
      const metadata = arabicService.getSitemapMetadata();

      expect(metadata.carTypes.length).toBeGreaterThanOrEqual(4);
      expect(metadata.cities.length).toBeGreaterThanOrEqual(8);
      expect(metadata.fuelTypes.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Gearbox Mappings', () => {
    test('should return correct Arabic translation for automatic gearbox', () => {
      const arabicGearbox = arabicService.getArabicGearbox('automatic');
      expect(arabicGearbox).toBe('اوتوماتيك');
    });

    test('should return correct Arabic translation for manual gearbox', () => {
      const arabicGearbox = arabicService.getArabicGearbox('manual');
      expect(arabicGearbox).toBe('يدوي');
    });
  });

  describe('Color Mappings', () => {
    test('should return correct Arabic translation for common colors', () => {
      expect(arabicService.getArabicColor('white')).toBe('أبيض');
      expect(arabicService.getArabicColor('black')).toBe('أسود');
      expect(arabicService.getArabicColor('red')).toBe('أحمر');
      expect(arabicService.getArabicColor('blue')).toBe('أزرق');
    });

    test('should return null for unknown color', () => {
      const arabicColor = arabicService.getArabicColor('unknown_color');
      expect(arabicColor).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle null input gracefully', () => {
      expect(() => arabicService.enhanceCarData(null)).not.toThrow();
      expect(() => arabicService.enhanceCompanyData(null)).not.toThrow();
    });

    test('should handle undefined input gracefully', () => {
      expect(() => arabicService.enhanceCarData(undefined)).not.toThrow();
      expect(() => arabicService.enhanceCompanyData(undefined)).not.toThrow();
    });

    test('should handle empty object gracefully', () => {
      const result = arabicService.enhanceCarData({});
      expect(result).toBeInstanceOf(Object);
      expect(result).toHaveProperty('arabic_metadata');
    });
  });
});
