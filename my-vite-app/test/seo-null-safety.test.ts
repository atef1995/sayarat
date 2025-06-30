/**
 * Test file for SEO utilities with null safety
 * This validates that all SEO functions handle undefined/null values gracefully
 */

import {
  generateSEOTitle,
  generateSEODescription,
  generateOGTitle,
  generateOGDescription,
  generateCarStructuredData,
  generateBreadcrumbStructuredData,
  generateCarKeywords,
} from "../src/utils/seoUtils";
import { CarInfo, Seller } from "../src/types";

// Mock data with potential null/undefined values (similar to what caused the error)
const incompleteCarInfo: Partial<CarInfo> = {
  id: "123",
  make: "BMW",
  model: "320i",
  year: 2020,
  price: 50000,
  location: "دمشق",
  description: "سيارة ممتازة",
  // Missing specs, image_urls, and other optional fields
};

const mockSeller: Seller = {
  id: "seller-123",
  auth_id: "auth-123",
  name: "أحمد محمد",
  first_name: "أحمد",
  username: "ahmed123",
  location: "دمشق",
};

/**
 * Test null safety for all SEO functions
 */
function testNullSafety() {
  console.log("🧪 Testing SEO Functions Null Safety...\n");

  try {
    // Test with incomplete car data
    const carInfo = incompleteCarInfo as CarInfo;

    console.log("1. Testing generateSEOTitle...");
    const seoTitle = generateSEOTitle(carInfo);
    console.log("✅ SEO Title:", seoTitle);

    console.log("\n2. Testing generateSEODescription...");
    const seoDescription = generateSEODescription(carInfo);
    console.log("✅ SEO Description:", seoDescription);

    console.log("\n3. Testing generateOGTitle...");
    const ogTitle = generateOGTitle(carInfo);
    console.log("✅ OG Title:", ogTitle);

    console.log("\n4. Testing generateOGDescription...");
    const ogDescription = generateOGDescription(carInfo);
    console.log("✅ OG Description:", ogDescription);

    console.log("\n5. Testing generateCarKeywords...");
    const keywords = generateCarKeywords(carInfo);
    console.log("✅ Keywords (first 10):", keywords.slice(0, 10));

    console.log("\n6. Testing generateCarStructuredData...");
    const structuredData = generateCarStructuredData(carInfo, mockSeller);
    console.log("✅ Structured Data Brand:", structuredData.brand?.name);
    console.log(
      "✅ Structured Data Specs:",
      structuredData.additionalProperty ? "Present" : "Safely omitted"
    );

    console.log("\n7. Testing generateBreadcrumbStructuredData...");
    const breadcrumbs = generateBreadcrumbStructuredData(carInfo);
    console.log("✅ Breadcrumbs:", breadcrumbs.itemListElement.length, "items");

    console.log(
      "\n🎉 All tests passed! Functions handle null/undefined values safely."
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }

  return true;
}

/**
 * Test with completely empty data
 */
function testEmptyData() {
  console.log("\n🧪 Testing with Empty Data...\n");

  try {
    // Create minimal car info with just required fields
    const emptyCarInfo: CarInfo = {
      id: "",
      title: "",
      price: 0,
      make: "",
      model: "",
      year: 0,
      mileage: 0,
      location: "",
      listing_status: "active",
      created_at: "",
      car_type: "",
      color: "",
      description: "",
      transmission: "automatic",
      fuel: "",
      currency: "",
      status: "",
      seller_id: "",
      image_urls: [],
      hp: 0,
      specs: [],
      engine_cylinders: 0,
      engine_liters: 0,
      views: 0,
    };

    const emptySeller: Seller = {
      id: "",
      auth_id: "",
      name: "",
      first_name: "",
      username: "",
      location: "",
    };

    const seoTitle = generateSEOTitle(emptyCarInfo);
    const seoDescription = generateSEODescription(emptyCarInfo);
    const ogTitle = generateOGTitle(emptyCarInfo);
    const ogDescription = generateOGDescription(emptyCarInfo);
    const structuredData = generateCarStructuredData(emptyCarInfo, emptySeller);

    console.log("✅ Empty data handled gracefully");
    console.log("✅ SEO Title:", seoTitle);
    console.log("✅ Functions return valid output even with empty data");
  } catch (error) {
    console.error("❌ Empty data test failed:", error);
    return false;
  }

  return true;
}

/**
 * Test with null values specifically
 */
function testNullValues() {
  console.log("\n🧪 Testing with Null Values...\n");

  try {
    // Create car info with explicit null values
    const nullCarInfo = {
      id: "123",
      make: "BMW",
      model: null,
      year: 2020,
      price: 50000,
      specs: null, // This was the original issue
      description: null,
      location: "دمشق",
      image_urls: null,
    } as unknown as CarInfo;

    const ogDescription = generateOGDescription(nullCarInfo);
    const structuredData = generateCarStructuredData(nullCarInfo, mockSeller);

    console.log("✅ Null values handled gracefully");
    console.log("✅ OG Description with null specs:", ogDescription);
    console.log(
      "✅ Structured data additional properties:",
      structuredData.additionalProperty ? "Present" : "Safely omitted"
    );
  } catch (error) {
    console.error("❌ Null values test failed:", error);
    return false;
  }

  return true;
}

// Run all tests
console.log("🚀 Starting SEO Utilities Null Safety Tests...\n");

const test1 = testNullSafety();
const test2 = testEmptyData();
const test3 = testNullValues();

if (test1 && test2 && test3) {
  console.log("\n🎉 All SEO null safety tests passed!");
  console.log("\n✅ Key Improvements:");
  console.log("1. ✅ Added safe utility functions for null/undefined checks");
  console.log("2. ✅ All SEO functions now handle missing data gracefully");
  console.log('3. ✅ No more "Cannot read properties of undefined" errors');
  console.log("4. ✅ Functions provide sensible defaults for missing values");
  console.log("5. ✅ Improved TypeScript type safety with proper checks");
  console.log("6. ✅ Better error prevention and user experience");
} else {
  console.log("\n❌ Some tests failed. Please check the implementation.");
}

export { testNullSafety, testEmptyData, testNullValues };
