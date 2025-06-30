import { CarCardProps } from "../my-vite-app/src/types";
import {
  shouldDisplayCompanyInfo,
  getSellerDisplayName,
  getCompanyLogoUrl,
  getCompanyBadgeConfig,
  isValidCompanyData,
  CompanyDisplayFactory,
  isCompanyListing,
  validateCompanyData,
} from "../my-vite-app/src/utils/companyUtils";

/**
 * Test suite for company display utilities
 * Follows modular architecture and DRY principles
 */
describe("CompanyUtils", () => {
  let mockIndividualListing: CarCardProps;
  let mockCompanyListing: CarCardProps;
  let mockInvalidCompanyListing: CarCardProps;

  beforeEach(() => {
    // Mock data for individual seller
    mockIndividualListing = {
      id: "1",
      title: "Individual Car",
      price: 10000,
      make: "Toyota",
      model: "Camry",
      year: 2020,
      mileage: 50000,
      location: "Damascus",
      listing_status: "active",
      created_at: "2023-01-01",
      car_type: "sedan",
      color: "white",
      description: "Great car",
      transmission: "automatic",
      fuel: "gasoline",
      status: "active",
      seller_id: "seller1",
      image_urls: [],
      hp: 200,
      specs: [],
      engine_cylinders: 4,
      engine_liters: 2.0,
      views: 100,
      seller_name: "John Doe",
      seller_username: "johndoe",
      is_company: false,
    };

    // Mock data for company seller
    mockCompanyListing = {
      ...mockIndividualListing,
      id: "2",
      title: "Company Car",
      seller_name: "Company Rep",
      seller_username: "companyrep",
      is_company: true,
      company_name: "AutoDealer Pro",
      company_logo: "https://example.com/logo.png",
    };

    // Mock data for invalid company
    mockInvalidCompanyListing = {
      ...mockCompanyListing,
      id: "3",
      company_name: "",
      company_logo: undefined,
    };
  });

  describe("shouldDisplayCompanyInfo", () => {
    test("should return false for individual sellers", () => {
      const result = shouldDisplayCompanyInfo(mockIndividualListing);
      expect(result).toBe(false);
    });

    test("should return true for valid company listings", () => {
      const result = shouldDisplayCompanyInfo(mockCompanyListing);
      expect(result).toBe(true);
    });

    test("should return false for company with empty name", () => {
      const result = shouldDisplayCompanyInfo(mockInvalidCompanyListing);
      expect(result).toBe(false);
    });

    test("should return false for company with undefined name", () => {
      const listing = { ...mockCompanyListing, company_name: undefined };
      const result = shouldDisplayCompanyInfo(listing);
      expect(result).toBe(false);
    });
  });

  describe("getSellerDisplayName", () => {
    test("should return company name for company listings", () => {
      const result = getSellerDisplayName(mockCompanyListing);
      expect(result).toBe("AutoDealer Pro");
    });

    test("should return seller name for individual listings", () => {
      const result = getSellerDisplayName(mockIndividualListing);
      expect(result).toBe("John Doe");
    });

    test("should return username when seller name is not available", () => {
      const listing = { ...mockIndividualListing, seller_name: undefined };
      const result = getSellerDisplayName(listing);
      expect(result).toBe("johndoe");
    });

    test("should return fallback when no names are available", () => {
      const listing = {
        ...mockIndividualListing,
        seller_name: undefined,
        seller_username: undefined,
      };
      const result = getSellerDisplayName(listing);
      expect(result).toBe("Unknown Seller");
    });
  });

  describe("getCompanyLogoUrl", () => {
    test("should return logo URL for company listings", () => {
      const result = getCompanyLogoUrl(mockCompanyListing);
      expect(result).toBe("https://example.com/logo.png");
    });

    test("should return null for individual listings", () => {
      const result = getCompanyLogoUrl(mockIndividualListing);
      expect(result).toBe(null);
    });

    test("should return null when logo is not available", () => {
      const listing = { ...mockCompanyListing, company_logo: undefined };
      const result = getCompanyLogoUrl(listing);
      expect(result).toBe(null);
    });
  });

  describe("getCompanyBadgeConfig", () => {
    test("should return badge config for company listings", () => {
      const result = getCompanyBadgeConfig(mockCompanyListing);

      expect(result).not.toBeNull();
      expect(result?.show).toBe(true);
      expect(result?.name).toBe("AutoDealer Pro");
      expect(result?.logoUrl).toBe("https://example.com/logo.png");
      expect(result?.className).toContain("bg-blue-50");
    });

    test("should return null for individual listings", () => {
      const result = getCompanyBadgeConfig(mockIndividualListing);
      expect(result).toBeNull();
    });

    test("should return null for invalid company listings", () => {
      const result = getCompanyBadgeConfig(mockInvalidCompanyListing);
      expect(result).toBeNull();
    });
  });

  describe("isValidCompanyData", () => {
    test("should return true for valid individual listings", () => {
      const result = isValidCompanyData(mockIndividualListing);
      expect(result).toBe(true);
    });

    test("should return true for valid company listings", () => {
      const result = isValidCompanyData(mockCompanyListing);
      expect(result).toBe(true);
    });

    test("should return false for company with empty name", () => {
      const result = isValidCompanyData(mockInvalidCompanyListing);
      expect(result).toBe(false);
    });

    test("should return false for company with excessively long name", () => {
      const listing = {
        ...mockCompanyListing,
        company_name: "A".repeat(256), // Exceeds 255 character limit
      };
      const result = isValidCompanyData(listing);
      expect(result).toBe(false);
    });
  });

  describe("CompanyDisplayFactory", () => {
    test("should create badge config for company listings", () => {
      const result = CompanyDisplayFactory.createDisplayConfig(
        mockCompanyListing,
        "badge"
      );

      expect(result).not.toBeNull();
      expect(result?.showLogo).toBe(true);
      expect(result?.showIcon).toBe(true);
      expect(result?.name).toBe("AutoDealer Pro");
    });

    test("should create card config for company listings", () => {
      const result = CompanyDisplayFactory.createDisplayConfig(
        mockCompanyListing,
        "card"
      );

      expect(result).not.toBeNull();
      expect(result?.showDescription).toBe(true);
      expect(result?.className).toContain("bg-white");
    });

    test("should create minimal config for company listings", () => {
      const result = CompanyDisplayFactory.createDisplayConfig(
        mockCompanyListing,
        "minimal"
      );

      expect(result).not.toBeNull();
      expect(result?.showLogo).toBe(false);
      expect(result?.showIcon).toBe(false);
      expect(result?.className).toContain("text-xs");
    });

    test("should return null for individual listings", () => {
      const result = CompanyDisplayFactory.createDisplayConfig(
        mockIndividualListing
      );
      expect(result).toBeNull();
    });

    test("should default to badge variant", () => {
      const result =
        CompanyDisplayFactory.createDisplayConfig(mockCompanyListing);
      expect(result?.showLogo).toBe(true);
      expect(result?.showIcon).toBe(true);
    });
  });

  describe("isCompanyListing", () => {
    test("should return true for valid company listings", () => {
      const result = isCompanyListing(mockCompanyListing);
      expect(result).toBe(true);
    });

    test("should return false for individual listings", () => {
      const result = isCompanyListing(mockIndividualListing);
      expect(result).toBe(false);
    });
  });

  describe("validateCompanyData", () => {
    test("should return null for valid data", () => {
      const result = validateCompanyData(mockCompanyListing);
      expect(result).toBeNull();
    });

    test("should return Error for invalid data", () => {
      const result = validateCompanyData(mockInvalidCompanyListing);
      expect(result).toBeInstanceOf(Error);
      expect(result?.message).toContain("Invalid company data");
    });

    test("should return null for valid individual listings", () => {
      const result = validateCompanyData(mockIndividualListing);
      expect(result).toBeNull();
    });

    test("should handle thrown errors gracefully", () => {
      // Mock a scenario where listing data causes an exception
      const badListing = { ...mockCompanyListing };
      // Remove required id field to cause potential issues
      delete (badListing as any).id;

      const result = validateCompanyData(badListing);
      expect(result).toBeInstanceOf(Error);
    });
  });

  describe("Edge Cases", () => {
    test("should handle listings with whitespace-only company names", () => {
      const listing = { ...mockCompanyListing, company_name: "   " };
      const result = shouldDisplayCompanyInfo(listing);
      expect(result).toBe(false);
    });

    test("should handle listings with null company_name", () => {
      const listing = { ...mockCompanyListing, company_name: null as any };
      const result = shouldDisplayCompanyInfo(listing);
      expect(result).toBe(false);
    });

    test("should handle listings with undefined is_company", () => {
      const listing = { ...mockCompanyListing, is_company: undefined };
      const result = shouldDisplayCompanyInfo(listing);
      expect(result).toBe(false);
    });
  });
});

/**
 * #TODO: Add performance tests for large datasets
 * #TODO: Add integration tests with React components
 * #TODO: Add tests for RTL (right-to-left) text rendering
 * #TODO: Add accessibility tests for company badges
 * #TODO: Add tests for company logo lazy loading
 */
