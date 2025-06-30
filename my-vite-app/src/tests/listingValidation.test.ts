/**
 * Listing Validation Integration Test
 * Test the complete validation flow from frontend to backend
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { listingValidationService } from "../services/listingValidationService";
import { ClientValidation } from "../utils/listingValidationUtils";
import { CreateListing } from "../types";

// Mock listing data for testing
const mockValidListing: CreateListing = {
  title: "BMW X5 2020 فل كامل خليجي",
  make: "BMW",
  model: "X5",
  year: 2020,
  price: 45000,
  mileage: 25000,
  description:
    "سيارة BMW X5 موديل 2020 بحالة ممتازة، فل كامل، خليجي، سيرفيس منتظم في الوكالة",
  location: "دبي",
  car_type: "جبلية",
  color: "أسود",
  transmission: "اوتوماتيك",
  fuel: "بنزين",
  currency: "usd",
  engine_cylinders: "6",
  engine_liters: 3.0,
  hp: 340,
  specs: ["نافيجيشن", "كاميرا خلفية", "جلد", "فتحة سقف"],
  highlight: false,
  autoRelist: false,
};

const mockInvalidListing: Partial<CreateListing> = {
  title: "BMW", // Too short
  make: "BMW",
  model: "X5",
  year: 1985, // Too old
  price: -5000, // Negative price
  mileage: -1000, // Negative mileage
  description: "قصير", // Too short
  location: "دبي",
  car_type: "جبلية",
  color: "أسود",
  transmission: "اوتوماتيك",
  fuel: "بنزين",
  currency: "usd",
};

describe("Listing Validation Integration", () => {
  describe("Client-side Validation", () => {
    it("should validate valid listing data", () => {
      const result = ClientValidation.validateListing(mockValidListing);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should catch validation errors in invalid listing", () => {
      const result = ClientValidation.validateListing(mockInvalidListing);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should validate individual fields correctly", () => {
      // Valid title
      const validTitle = ClientValidation.validateField(
        "title",
        "BMW X5 2020 فل كامل"
      );
      expect(validTitle.valid).toBe(true);

      // Invalid title (too short)
      const invalidTitle = ClientValidation.validateField("title", "BMW");
      expect(invalidTitle.valid).toBe(false);
      expect(invalidTitle.error).toContain("10 أحرف");

      // Valid price
      const validPrice = ClientValidation.validateField("price", 25000);
      expect(validPrice.valid).toBe(true);

      // Invalid price (negative)
      const invalidPrice = ClientValidation.validateField("price", -5000);
      expect(invalidPrice.valid).toBe(false);
    });

    it("should provide warnings for suspicious data", () => {
      // Very low price should trigger warning
      const lowPrice = ClientValidation.validateField("price", 2000);
      expect(lowPrice.valid).toBe(true);
      expect(lowPrice.warning).toContain("منخفض");

      // Very old car should trigger warning
      const oldYear = ClientValidation.validateField("year", 1998);
      expect(oldYear.valid).toBe(true);
      expect(oldYear.warning).toContain("قديمة");
    });
  });

  describe("Image Validation", () => {
    it("should validate image files correctly", () => {
      // Create mock image files
      const validImage = new File([""], "car1.jpg", { type: "image/jpeg" });
      const invalidImage = new File([""], "document.pdf", {
        type: "application/pdf",
      });
      const largeImage = new File(
        [new ArrayBuffer(6 * 1024 * 1024)],
        "large.jpg",
        { type: "image/jpeg" }
      );

      // Valid images
      const validResult = ClientValidation.validateImages([validImage]);
      expect(validResult.valid).toBe(true);

      // Invalid file type
      const invalidTypeResult = ClientValidation.validateImages([invalidImage]);
      expect(invalidTypeResult.valid).toBe(false);
      expect(invalidTypeResult.errors[0]).toContain("غير مدعوم");

      // Too large
      const largeFileResult = ClientValidation.validateImages([largeImage]);
      expect(largeFileResult.valid).toBe(false);
      expect(largeFileResult.errors[0]).toContain("كبيرة جداً");

      // Too many images
      const tooManyImages = Array(6).fill(validImage);
      const tooManyResult = ClientValidation.validateImages(tooManyImages);
      expect(tooManyResult.valid).toBe(false);
      expect(tooManyResult.errors[0]).toContain("5 صور كحد أقصى");
    });

    it("should warn about missing images", () => {
      const result = ClientValidation.validateImages([]);
      expect(result.valid).toBe(true);
      expect(result.warnings[0]).toContain("لا توجد صور");
    });
  });

  describe("Backend Validation Service", () => {
    // Note: These tests would need a running backend or proper mocking

    it("should check if validation service is available", async () => {
      const isAvailable =
        await listingValidationService.isValidationAvailable();
      // This might be false in test environment
      expect(typeof isAvailable).toBe("boolean");
    });

    it("should handle network errors gracefully", async () => {
      // Mock fetch to simulate network error
      const originalFetch = global.fetch;
      global.fetch = jest
        .fn()
        .mockRejectedValue(new TypeError("Network error"));

      const result = await listingValidationService.validateListing(
        mockValidListing,
        "test-user-id"
      );

      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toContain("الاتصال بالإنترنت");

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it("should handle authentication errors", async () => {
      // Mock fetch to simulate 401 response
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized" }),
      });

      const result = await listingValidationService.validateListing(
        mockValidListing,
        "test-user-id"
      );

      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toContain("تسجيل الدخول");

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it("should handle subscription limit errors", async () => {
      // Mock fetch to simulate 403 response
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () =>
          Promise.resolve({
            message: "Subscription limit exceeded",
            needsUpgrade: true,
          }),
      });

      const result = await listingValidationService.validateListing(
        mockValidListing,
        "test-user-id"
      );

      expect(result.valid).toBe(false);
      expect(result.warnings?.[0]).toContain("ترقية الاشتراك");

      // Restore original fetch
      global.fetch = originalFetch;
    });
  });

  describe("Field Validation", () => {
    it("should validate individual fields via service", async () => {
      // Mock successful field validation
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            valid: true,
            warnings: ["تحذير تجريبي"],
          }),
      });

      const result = await listingValidationService.validateFields(
        { title: "BMW X5 2020" },
        "test-user-id"
      );

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain("تحذير تجريبي");

      // Restore original fetch
      global.fetch = originalFetch;
    });
  });
});

/**
 * Performance Tests
 */
describe("Validation Performance", () => {
  it("should validate large datasets efficiently", () => {
    const startTime = performance.now();

    // Validate 100 listings
    for (let i = 0; i < 100; i++) {
      ClientValidation.validateListing(mockValidListing);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (< 100ms)
    expect(duration).toBeLessThan(100);
  });

  it("should validate images efficiently", () => {
    const startTime = performance.now();

    // Create multiple mock images
    const images = Array(5)
      .fill(null)
      .map((_, i) => new File([""], `car${i}.jpg`, { type: "image/jpeg" }));

    // Validate 50 times
    for (let i = 0; i < 50; i++) {
      ClientValidation.validateImages(images);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (< 50ms)
    expect(duration).toBeLessThan(50);
  });
});

/**
 * Edge Cases
 */
describe("Validation Edge Cases", () => {
  it("should handle null and undefined values", () => {
    const nullResult = ClientValidation.validateField("title", null);
    expect(nullResult.valid).toBe(false);

    const undefinedResult = ClientValidation.validateField("price", undefined);
    expect(undefinedResult.valid).toBe(false);
  });

  it("should handle empty strings and zero values", () => {
    const emptyStringResult = ClientValidation.validateField("title", "");
    expect(emptyStringResult.valid).toBe(false);

    const zeroResult = ClientValidation.validateField("price", 0);
    expect(zeroResult.valid).toBe(false);
  });

  it("should handle extreme values", () => {
    const extremelyLongTitle = "A".repeat(500);
    const longTitleResult = ClientValidation.validateField(
      "title",
      extremelyLongTitle
    );
    expect(longTitleResult.valid).toBe(false);

    const extremelyHighPrice = 999999999;
    const highPriceResult = ClientValidation.validateField(
      "price",
      extremelyHighPrice
    );
    expect(highPriceResult.valid).toBe(false);
  });

  it("should handle special characters and unicode", () => {
    const arabicTitle = "سيارة BMW X5 موديل 2020 🚗";
    const arabicResult = ClientValidation.validateField("title", arabicTitle);
    expect(arabicResult.valid).toBe(true);

    const emojiOnlyTitle = "🚗🚙🏎️";
    const emojiResult = ClientValidation.validateField("title", emojiOnlyTitle);
    expect(emojiResult.valid).toBe(false); // Should be invalid due to length
  });
});
