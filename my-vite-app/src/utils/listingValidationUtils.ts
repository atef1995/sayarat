/**
 * Listing Validation Utilities
 * Enhanced validation helpers and error handling for listing creation
 */

import { ListingErrorType, ListingCreationError } from "../types/listingTypes";
import { CreateListing } from "../types";

/**
 * Client-side validation patterns and rules
 */
export const ValidationRules = {
  title: {
    minLength: 10,
    maxLength: 200,
    required: true,
  },
  price: {
    min: 100,
    max: 10000000,
    required: true,
  },
  year: {
    min: 1990,
    max: new Date().getFullYear() + 1,
    required: true,
  },
  mileage: {
    min: 0,
    max: 1000000,
    required: true,
  },
  description: {
    minLength: 20,
    maxLength: 1000,
    required: true,
  },
  images: {
    maxCount: 5,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  },
};

/**
 * Client-side validation for listing data
 * This provides immediate feedback before backend validation
 */
export class ClientValidation {
  /**
   * Validate a single field
   */
  static validateField(
    fieldName: keyof CreateListing,
    value: unknown
  ): {
    valid: boolean;
    error?: string;
    warning?: string;
  } {
    switch (fieldName) {
      case "title":
        return this.validateTitle(value as string);
      case "price":
        return this.validatePrice(value as number);
      case "year":
        return this.validateYear(value as number);
      case "mileage":
        return this.validateMileage(value as number);
      case "description":
        return this.validateDescription(value as string);
      default:
        return { valid: true };
    }
  }

  /**
   * Validate title field
   */
  private static validateTitle(title: string): {
    valid: boolean;
    error?: string;
    warning?: string;
  } {
    if (!title || title.trim().length === 0) {
      return { valid: false, error: "العنوان مطلوب" };
    }

    if (title.length < ValidationRules.title.minLength) {
      return {
        valid: false,
        error: `العنوان يجب أن يكون ${ValidationRules.title.minLength} أحرف على الأقل`,
      };
    }

    if (title.length > ValidationRules.title.maxLength) {
      return {
        valid: false,
        error: `العنوان يجب أن يكون أقل من ${ValidationRules.title.maxLength} حرف`,
      };
    }

    // Check for suspicious patterns
    if (/^\d+$/.test(title)) {
      return {
        valid: true,
        warning: "العنوان يحتوي على أرقام فقط، يُفضل إضافة وصف",
      };
    }

    return { valid: true };
  }

  /**
   * Validate price field
   */
  private static validatePrice(price: number): {
    valid: boolean;
    error?: string;
    warning?: string;
  } {
    if (!price || price <= 0) {
      return { valid: false, error: "السعر مطلوب ويجب أن يكون أكبر من الصفر" };
    }

    if (price < ValidationRules.price.min) {
      return {
        valid: false,
        error: `السعر منخفض جداً (أقل من ${ValidationRules.price.min})`,
      };
    }

    if (price > ValidationRules.price.max) {
      return {
        valid: false,
        error: `السعر مرتفع جداً (أكثر من ${ValidationRules.price.max.toLocaleString()})`,
      };
    }

    // Price reasonableness warnings
    if (price < 5000) {
      return { valid: true, warning: "السعر منخفض، تأكد من صحته" };
    }

    if (price > 500000) {
      return { valid: true, warning: "السعر مرتفع، تأكد من صحته" };
    }

    return { valid: true };
  }

  /**
   * Validate year field
   */
  private static validateYear(year: number): {
    valid: boolean;
    error?: string;
    warning?: string;
  } {
    const currentYear = new Date().getFullYear();

    if (!year) {
      return { valid: false, error: "سنة الصنع مطلوبة" };
    }

    if (year < ValidationRules.year.min) {
      return {
        valid: false,
        error: `سنة الصنع يجب أن تكون ${ValidationRules.year.min} أو أحدث`,
      };
    }

    if (year > currentYear + 1) {
      return { valid: false, error: "سنة الصنع لا يمكن أن تكون في المستقبل" };
    }

    // Age-based warnings
    const carAge = currentYear - year;
    if (carAge > 20) {
      return { valid: true, warning: "السيارة قديمة (أكثر من 20 سنة)" };
    }

    return { valid: true };
  }

  /**
   * Validate mileage field
   */
  private static validateMileage(mileage: number): {
    valid: boolean;
    error?: string;
    warning?: string;
  } {
    if (mileage === null || mileage === undefined) {
      return { valid: false, error: "عدد الكيلومترات مطلوب" };
    }

    if (mileage < 0) {
      return { valid: false, error: "عدد الكيلومترات لا يمكن أن يكون سالباً" };
    }

    if (mileage > ValidationRules.mileage.max) {
      return {
        valid: false,
        error: `عدد الكيلومترات مرتفع جداً (أكثر من ${ValidationRules.mileage.max.toLocaleString()})`,
      };
    }

    // Mileage reasonableness warnings
    if (mileage > 500000) {
      return { valid: true, warning: "عدد الكيلومترات مرتفع جداً" };
    }

    return { valid: true };
  }

  /**
   * Validate description field
   */
  private static validateDescription(description: string): {
    valid: boolean;
    error?: string;
    warning?: string;
  } {
    if (!description || description.trim().length === 0) {
      return { valid: false, error: "الوصف مطلوب" };
    }

    if (description.length < ValidationRules.description.minLength) {
      return {
        valid: false,
        error: `الوصف يجب أن يكون ${ValidationRules.description.minLength} حرف على الأقل`,
      };
    }

    if (description.length > ValidationRules.description.maxLength) {
      return {
        valid: false,
        error: `الوصف يجب أن يكون أقل من ${ValidationRules.description.maxLength} حرف`,
      };
    }

    // Check for quality indicators
    if (description.split(" ").length < 5) {
      return {
        valid: true,
        warning: "الوصف قصير جداً، يُفضل إضافة المزيد من التفاصيل",
      };
    }

    return { valid: true };
  }

  /**
   * Validate image files
   */
  static validateImages(images: File[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const result = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
    };

    if (images.length === 0) {
      result.warnings.push("لا توجد صور، يُفضل إضافة صور للإعلان");
      return result;
    }

    if (images.length > ValidationRules.images.maxCount) {
      result.valid = false;
      result.errors.push(
        `يمكن رفع ${ValidationRules.images.maxCount} صور كحد أقصى`
      );
    }

    images.forEach((image, index) => {
      // Check file type
      if (!ValidationRules.images.allowedTypes.includes(image.type)) {
        result.valid = false;
        result.errors.push(`نوع الصورة ${index + 1} غير مدعوم (${image.type})`);
      }

      // Check file size
      if (image.size > ValidationRules.images.maxSize) {
        result.valid = false;
        result.errors.push(
          `الصورة ${index + 1} كبيرة جداً (${(image.size / 1024 / 1024).toFixed(
            1
          )}MB)`
        );
      }

      // Check file name
      if (image.name.length > 100) {
        result.warnings.push(`اسم الصورة ${index + 1} طويل جداً`);
      }
    });

    return result;
  }

  /**
   * Validate complete listing data
   */
  static validateListing(data: Partial<CreateListing>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const result = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
    };

    // Validate each field
    Object.entries(data).forEach(([key, value]) => {
      if (key in ValidationRules) {
        const fieldValidation = this.validateField(
          key as keyof CreateListing,
          value
        );
        if (!fieldValidation.valid && fieldValidation.error) {
          result.valid = false;
          result.errors.push(fieldValidation.error);
        }
        if (fieldValidation.warning) {
          result.warnings.push(fieldValidation.warning);
        }
      }
    });

    return result;
  }
}

/**
 * Error categorization and handling utilities
 */
export class ValidationErrorHandler {
  /**
   * Create a standardized listing error
   */
  static createError(
    type: ListingErrorType,
    message: string,
    details?: Record<string, unknown>,
    isRetryable: boolean = true
  ): ListingCreationError {
    return {
      type,
      message,
      details,
      isRetryable,
    };
  }

  /**
   * Categorize backend validation errors
   */
  static categorizeBackendError(error: string): ListingErrorType {
    const errorLower = error.toLowerCase();

    if (
      errorLower.includes("authentication") ||
      errorLower.includes("unauthorized")
    ) {
      return ListingErrorType.AUTHENTICATION;
    }

    if (errorLower.includes("subscription") || errorLower.includes("limit")) {
      return ListingErrorType.SUBSCRIPTION_REQUIRED;
    }

    if (errorLower.includes("network") || errorLower.includes("connection")) {
      return ListingErrorType.NETWORK_ERROR;
    }

    if (errorLower.includes("validation") || errorLower.includes("invalid")) {
      return ListingErrorType.BACKEND_VALIDATION;
    }

    return ListingErrorType.UNKNOWN;
  }

  /**
   * Get user-friendly error message based on error type
   */
  static getUserFriendlyMessage(error: ListingCreationError): string {
    switch (error.type) {
      case ListingErrorType.AUTHENTICATION:
        return "يرجى تسجيل الدخول مرة أخرى للمتابعة";

      case ListingErrorType.SUBSCRIPTION_REQUIRED:
        return "يرجى ترقية اشتراكك لإنشاء المزيد من الإعلانات";

      case ListingErrorType.NETWORK_ERROR:
        return "مشكلة في الاتصال بالإنترنت، يرجى المحاولة لاحقاً";

      case ListingErrorType.BACKEND_VALIDATION:
        return error.message || "البيانات المدخلة غير صحيحة";

      case ListingErrorType.FORM_VALIDATION:
        return error.message || "يرجى التحقق من البيانات المدخلة";

      default:
        return "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى";
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: ListingCreationError): boolean {
    return error.isRetryable && error.type !== ListingErrorType.AUTHENTICATION;
  }
}

/**
 * Validation state management utilities
 */
export class ValidationStateManager {
  /**
   * Create initial validation state
   */
  static createInitialState() {
    return {
      isValidating: false,
      clientValidation: {
        valid: false,
        errors: [],
        warnings: [],
      },
      backendValidation: {
        valid: false,
        errors: [],
        warnings: [],
      },
      lastValidatedAt: null as Date | null,
    };
  }

  /**
   * Update validation state
   */
  static updateValidationState(
    currentState: Record<string, unknown>,
    validationType: "client" | "backend",
    result: { valid: boolean; errors?: string[]; warnings?: string[] }
  ) {
    return {
      ...currentState,
      [validationType + "Validation"]: {
        valid: result.valid,
        errors: result.errors || [],
        warnings: result.warnings || [],
      },
      lastValidatedAt: new Date(),
    };
  }
}
