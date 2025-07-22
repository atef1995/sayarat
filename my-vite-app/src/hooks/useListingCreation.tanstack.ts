import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { listingService } from "../services/listingService";
import { listingValidationService } from "../services/listingValidationService";
import { loadApiConfig } from "../config/apiConfig";
import { CreateListing } from "../types";
import { PaymentItem } from "../types/payment";
import { listingKeys } from "../types/listingQueryKeys";

interface ListingCreationData {
  formValues: CreateListing;
  images?: File[];
  hasProducts: boolean;
  productIds?: string[];
}

interface ValidationData {
  formValues: CreateListing;
  images?: File[];
  userId: string;
}

interface FieldValidationData {
  fields: Partial<CreateListing>;
  userId: string;
}

/**
 * Hook for listing status check
 */
export const useListingStatus = () => {
  const authContext = useContext(AuthContext);
  const isAuthenticated = !!authContext?.user?.id;

  return useQuery({
    queryKey: listingKeys.status(),
    queryFn: async () => {
      // Get API URL from config
      const { apiUrl } = loadApiConfig();
      const response = await fetch(`${apiUrl}/listings/status`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch listing status");
      }
      return response.json();
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
};

/**
 * Hook for validation health check
 */
export const useValidationHealth = () => {
  return useQuery({
    queryKey: listingKeys.validationHealth(),
    queryFn: () => listingValidationService.isValidationAvailable(),
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
};

/**
 * Hook for field validation (real-time validation)
 */
export const useFieldValidation = () => {
  return useMutation({
    mutationFn: async ({ fields, userId }: FieldValidationData) => {
      return await listingValidationService.validateFields(fields, userId);
    },
    retry: 1,
    onError: (error: Error) => {
      console.error("Field validation error:", error);
    },
  });
};

/**
 * Hook for backend validation (dry run)
 */
export const useListingValidation = () => {
  return useMutation({
    mutationFn: async ({ formValues, images, userId }: ValidationData) => {
      console.log("🔍 Starting backend validation...");

      const result = await listingValidationService.validateListing(
        formValues,
        userId,
        images
      );

      console.log("✅ Backend validation result:", result);

      if (!result.valid) {
        throw new Error(
          result.errors?.join(", ") || "فشل في التحقق من صحة البيانات"
        );
      }

      return result;
    },
    retry: 1,
    onSuccess: (data) => {
      if (data.warnings && data.warnings.length > 0) {
        data.warnings.forEach((warning) => message.warning(warning));
      }
    },
    onError: (error: Error) => {
      console.error("❌ Backend validation failed:", error);
      message.error(error.message);
    },
  });
};

/**
 * Hook for creating listings with automatic retry
 */
export const useCreateListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      formValues,
      images,
      hasProducts,
      productIds,
    }: ListingCreationData) => {
      console.log("🚀 Starting listing creation...");

      // Create FormData
      const formData = new FormData();

      // Fields to exclude from FormData (UI-specific fields)
      const excludeFields = [
        "image_urls",
        "id",
        "listing_status",
        "created_at",
        "seller_id",
        "status",
        "favorites_count",
        "is_favorited",
        "views",
        "_placement",
      ];

      // Add all form fields to FormData
      Object.entries(formValues).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          !excludeFields.includes(key)
        ) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === "object") {
            console.warn(`Skipping object field: ${key}`, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // Add images if provided
      if (images && images.length > 0) {
        images.forEach((image) => {
          formData.append("images", image);
        });
      }

      // Add products if selected
      if (hasProducts && productIds) {
        formData.append("productIds", JSON.stringify(productIds));
      }

      console.log("📋 Form data prepared:", Array.from(formData.keys()));

      // Use the listing service which has built-in retry logic
      const success = await listingService.submitListing(
        formData,
        undefined, // initialValues for updates
        hasProducts
      );

      if (!success) {
        throw new Error("فشل في إنشاء الإعلان");
      }

      return { success: true, message: "تم إنشاء الإعلان بنجاح" };
    },
    retry: (failureCount, error) => {
      // Handle specific errors that shouldn't be retried
      if (error instanceof Error) {
        if (
          error.message === "listing_limit_exceeded" ||
          error.message.includes("authentication") ||
          error.message.includes("subscription")
        ) {
          return false; // Don't retry these errors
        }

        // Retry network/timeout errors up to 2 times
        if (
          error.name === "AbortError" ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("timeout")
        ) {
          return failureCount < 2;
        }
      }

      // Default: retry once for other errors
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff: 1s, 2s, 4s
    onSuccess: (data) => {
      console.log("✅ Listing created successfully");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: listingKeys.status() });
      queryClient.invalidateQueries({ queryKey: listingKeys.userListings() });

      message.success(data.message);
    },
    onError: (error: Error) => {
      console.error("❌ Listing creation failed:", error);

      // Handle specific error types
      if (error.message === "listing_limit_exceeded") {
        message.error(
          "تم الوصول إلى الحد الأقصى للإعلانات. يرجى ترقية الاشتراك"
        );
      } else if (error.name === "AbortError") {
        message.error("انتهت مهلة الطلب. يرجى المحاولة مرة أخرى");
      } else if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        message.error("مشكلة في الاتصال. يرجى التحقق من الإنترنت");
      } else if (error.message.includes("Invalid response format")) {
        message.error("خطأ في استجابة الخادم. يرجى المحاولة مرة أخرى");
      } else {
        message.error(error.message || "حدث خطأ أثناء إنشاء الإعلان");
      }
    },
  });
};

/**
 * Simplified hook that orchestrates the entire listing creation flow
 * This replaces the complex useListingCreation hook
 */
export const useListingCreation = ({
  isAuthenticated,
  needsSubscription,
  hasSelectedProducts,
  items,
  refreshStatus,
}: {
  isAuthenticated: boolean;
  needsSubscription: boolean;
  hasSelectedProducts: boolean;
  items: PaymentItem[];
  refreshStatus: () => Promise<void>;
}) => {
  const authContext = useContext(AuthContext);

  // Get individual mutations
  const validationMutation = useListingValidation();
  const fieldValidationMutation = useFieldValidation();
  const createListingMutation = useCreateListing();

  // Combined state
  const isLoading =
    validationMutation.isPending || createListingMutation.isPending;

  const error = validationMutation.error || createListingMutation.error;

  /**
   * Simplified execution function
   */
  const executeListingCreation = async (
    formValues: CreateListing,
    handlePayment: () => Promise<boolean>,
    images?: File[]
  ): Promise<boolean> => {
    try {
      // Step 1: Check authentication and subscription
      if (!isAuthenticated) {
        message.error("يجب تسجيل الدخول لنشر الإعلانات");
        return false;
      }

      await refreshStatus();

      if (needsSubscription) {
        message.error("يجب ترقية الاشتراك لإنشاء المزيد من الإعلانات");
        return false;
      }

      const userId = authContext?.user?.id;
      if (!userId) {
        message.error(
          "لم يتم العثور على معرف المستخدم، يرجى إعادة تسجيل الدخول"
        );
        return false;
      }

      // Step 2: Backend validation
      console.log("🔍 Step 2: Backend validation");
      await validationMutation.mutateAsync({
        formValues,
        images,
        userId: userId.toString(),
      });

      // Step 3: Payment processing (if needed)
      if (hasSelectedProducts) {
        console.log("💳 Step 3: Payment processing");
        const paymentSuccess = await handlePayment();
        if (!paymentSuccess) {
          message.error("فشل في معالجة عملية الدفع");
          return false;
        }
      }

      // Step 4: Create listing
      console.log("📝 Step 4: Creating listing");
      await createListingMutation.mutateAsync({
        formValues,
        images,
        hasProducts: hasSelectedProducts,
        productIds: hasSelectedProducts
          ? items.map((item) => item.productId)
          : undefined,
      });

      // Refresh status after successful creation
      await refreshStatus();

      return true;
    } catch (error) {
      console.error("❌ Listing creation flow failed:", error);
      return false;
    }
  };

  /**
   * Field validation function
   */
  const validateFields = async (
    fields: Partial<CreateListing>
  ): Promise<{ valid: boolean; errors?: string[]; warnings?: string[] }> => {
    try {
      const userId = authContext?.user?.id;
      if (!userId) {
        return {
          valid: false,
          errors: ["لم يتم العثور على معرف المستخدم"],
        };
      }

      const result = await fieldValidationMutation.mutateAsync({
        fields,
        userId: userId.toString(),
      });

      return {
        valid: result.valid,
        errors: result.errors,
        warnings: result.warnings,
      };
    } catch (error) {
      console.error("Field validation error:", error);
      return {
        valid: false,
        errors: ["فشل في التحقق من صحة الحقل"],
      };
    }
  };

  /**
   * Reset function
   */
  const resetValidation = () => {
    validationMutation.reset();
    createListingMutation.reset();
    fieldValidationMutation.reset();
  };

  return {
    // State
    isLoading,
    error,

    // Computed states for backward compatibility
    canSubmit: !isLoading && !error,
    canProceedToPayment: isAuthenticated && !needsSubscription,

    // Actions
    executeListingCreation,
    validateFields,
    resetValidation,

    // Individual mutations for advanced usage
    validationMutation,
    createListingMutation,
    fieldValidationMutation,

    // Utility
    clearError: () => {
      validationMutation.reset();
      createListingMutation.reset();
    },
  };
};
