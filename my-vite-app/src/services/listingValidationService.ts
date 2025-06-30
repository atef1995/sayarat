/**
 * Listing Validation Service
 * Handles frontend communication with backend validation endpoint
 */

import { loadApiConfig } from "../config/apiConfig";
import { CreateListing } from "../types";

// #TODO: Import from your actual API configuration or environment
const { apiUrl } = loadApiConfig();

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  message?: string;
}

export interface ValidationRequest extends CreateListing {
  dryRun: boolean;
  userId: string;
}

class ListingValidationService {
  private static instance: ListingValidationService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = `${apiUrl}/api/listings`;
  }

  public static getInstance(): ListingValidationService {
    if (!ListingValidationService.instance) {
      ListingValidationService.instance = new ListingValidationService();
    }
    return ListingValidationService.instance;
  }

  /**
   * Validate listing data before payment/submission
   * This is the dry run validation that prevents payment on invalid data
   */
  async validateListing(
    listingData: CreateListing,
    userId: string,
    images?: File[]
  ): Promise<ValidationResult> {
    try {
      const formData = new FormData();

      // Add listing data
      Object.entries(listingData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // Add validation flags
      formData.append("dryRun", "true");
      formData.append("userId", userId);

      // Add images if provided
      if (images && images.length > 0) {
        images.forEach((image) => {
          formData.append(`images`, image);
        });
      }

      const response = await fetch(`${this.baseUrl}/validate`, {
        method: "POST",
        body: formData,
        credentials: "include", // Include cookies for authentication
        headers: {
          // Don't set Content-Type header when using FormData
          // Let the browser set it automatically with boundary
        },
      });

      if (!response.ok) {
        // Handle different HTTP status codes
        if (response.status === 401) {
          return {
            valid: false,
            errors: ["يجب تسجيل الدخول لاستخدام هذه الخدمة"],
          };
        }

        if (response.status === 403) {
          const result = await response.json();
          return {
            valid: false,
            errors: [result.message || "لا يمكنك إنشاء المزيد من الإعلانات"],
            warnings: result.needsUpgrade ? ["يرجى ترقية الاشتراك"] : undefined,
          };
        }

        if (response.status >= 500) {
          return {
            valid: false,
            errors: ["مشكلة في الخادم، يرجى المحاولة لاحقاً"],
          };
        }
      }

      const result = await response.json();

      return {
        valid: result.valid,
        message: result.message,
        errors: result.errors,
        warnings: result.warnings,
      };
    } catch (error) {
      console.error("Validation service error:", error);

      if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
          valid: false,
          errors: [
            "مشكلة في الاتصال بالإنترنت، يرجى التحقق من الاتصال والمحاولة مرة أخرى",
          ],
        };
      }

      return {
        valid: false,
        errors: [
          "حدث خطأ غير متوقع أثناء التحقق من صحة البيانات، يرجى المحاولة مرة أخرى",
        ],
      };
    }
  }

  /**
   * Validate specific fields (for real-time validation)
   */
  async validateFields(
    fields: Partial<CreateListing>,
    userId: string
  ): Promise<ValidationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/validate-fields`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...fields,
          dryRun: true,
          userId,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const result = await response.json();
        return {
          valid: false,
          errors: result.errors || ["Field validation failed"],
        };
      }

      return await response.json();
    } catch (error) {
      console.error("Field validation error:", error);
      return {
        valid: false,
        errors: ["Field validation failed"],
      };
    }
  }

  /**
   * Check if validation is available (health check)
   */
  async isValidationAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/validate/health`, {
        method: "GET",
        credentials: "include",
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const listingValidationService = ListingValidationService.getInstance();

// Export error types for better error handling
export enum ValidationErrorType {
  NETWORK_ERROR = "network_error",
  AUTHENTICATION_ERROR = "authentication_error",
  VALIDATION_ERROR = "validation_error",
  LIMIT_EXCEEDED = "limit_exceeded",
  SERVER_ERROR = "server_error",
}

/**
 * Helper function to categorize validation errors
 */
export function categorizeValidationError(error: string): ValidationErrorType {
  if (error.includes("network") || error.includes("connection")) {
    return ValidationErrorType.NETWORK_ERROR;
  }
  if (error.includes("authentication") || error.includes("login")) {
    return ValidationErrorType.AUTHENTICATION_ERROR;
  }
  if (error.includes("listing_limit_exceeded")) {
    return ValidationErrorType.LIMIT_EXCEEDED;
  }
  if (error.includes("server error") || error.includes("internal")) {
    return ValidationErrorType.SERVER_ERROR;
  }
  return ValidationErrorType.VALIDATION_ERROR;
}
