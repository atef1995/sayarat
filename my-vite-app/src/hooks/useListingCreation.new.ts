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

// Types for TanStack Query
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

interface PaymentProcessingData {
  handlePayment: () => Promise<boolean>;
}

// Utility function to create FormData from form values
const createFormDataFromValues = (
  formValues: CreateListing,
  images?: File[],
  productIds?: string[]
): FormData => {
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
    if (value !== null && value !== undefined && !excludeFields.includes(key)) {
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

  // Add products if provided
  if (productIds && productIds.length > 0) {
    formData.append("productIds", JSON.stringify(productIds));
  }

  return formData;
};

/**
 * Hook for listing status check
 */
export const useListingStatus = () => {
  const authContext = useContext(AuthContext);
  const isAuthenticated = !!authContext?.user?.id;

  return useQuery({
    queryKey: listingKeys.status(),
    queryFn: async () => {
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
 * Hook for creating listings with TanStack Query and automatic retry
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
      console.log("🚀 Starting listing creation with TanStack Query...");

      const formData = createFormDataFromValues(formValues, images, productIds);

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

      return {
        success: true,
        message: "تم إنشاء الإعلان بنجاح",
        formValues,
        hasProducts,
      };
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
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    onSuccess: (data) => {
      console.log("✅ Listing created successfully");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: listingKeys.status() });
      queryClient.invalidateQueries({ queryKey: listingKeys.userListings() });

      message.success(data.message);
    },
    onError: (error: Error) => {
      console.error("❌ Listing creation failed:", error);

      // Handle specific error types with user-friendly messages
      if (error.message === "listing_limit_exceeded") {
        message.error(
          "تم الوصول إلى الحد الأقصى للإعلانات. يرجى ترقية الاشتراك"
        );
      } else if (error.name === "AbortError") {
        message.error("انتهت مهلة الطلب. سيتم المحاولة مرة أخرى تلقائياً");
      } else if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        message.error("مشكلة في الاتصال. سيتم المحاولة مرة أخرى تلقائياً");
      } else if (error.message.includes("Invalid response format")) {
        message.error("خطأ في استجابة الخادم. سيتم المحاولة مرة أخرى");
      } else {
        message.error(error.message || "حدث خطأ أثناء إنشاء الإعلان");
      }
    },
  });
};

/**
 * Hook for payment processing
 */
export const usePaymentProcessing = () => {
  return useMutation({
    mutationFn: async ({ handlePayment }: PaymentProcessingData) => {
      console.log("💳 Processing payment...");

      const success = await handlePayment();

      if (!success) {
        throw new Error("فشل في معالجة عملية الدفع");
      }

      return { success: true };
    },
    retry: 1, // Retry payment once
    onError: (error: Error) => {
      console.error("❌ Payment processing failed:", error);
      message.error(error.message || "فشل في معالجة عملية الدفع");
    },
  });
};

/**
 * Main orchestration hook that coordinates the entire listing creation process
 * This is the new simplified API that components should use
 */
export const useListingCreation = () => {
  const authContext = useContext(AuthContext);
  const queryClient = useQueryClient();

  // Get individual mutations
  const validateListing = useListingValidation();
  const createListing = useCreateListing();
  const processPayment = usePaymentProcessing();
  const fieldValidation = useFieldValidation();
  const { refetch: refreshStatus } = useListingStatus();

  // Combined loading state
  const isLoading =
    validateListing.isPending ||
    createListing.isPending ||
    processPayment.isPending;

  // Combined error state
  const error =
    validateListing.error || createListing.error || processPayment.error;

  /**
   * Main execution function - handles the complete flow
   */
  const execute = useMutation({
    mutationFn: async ({
      formValues,
      images,
      hasProducts = false,
      items = [],
      handlePayment,
    }: {
      formValues: CreateListing;
      images?: File[];
      hasProducts?: boolean;
      items?: PaymentItem[];
      handlePayment?: () => Promise<boolean>;
    }) => {
      console.log("🎯 Starting complete listing creation flow...");

      // Step 1: Authentication check
      const userId = authContext?.user?.id;
      if (!userId) {
        throw new Error("يجب تسجيل الدخول لنشر الإعلانات");
      }

      // Step 2: Refresh and check status
      console.log("🔄 Checking listing status...");
      const statusResult = await refreshStatus();

      if (statusResult.data?.needsSubscription) {
        throw new Error("يجب ترقية الاشتراك لإنشاء المزيد من الإعلانات");
      }

      // Step 3: Backend validation
      console.log("🔍 Validating listing data...");
      await validateListing.mutateAsync({
        formValues,
        images,
        userId: userId.toString(),
      });

      // Step 4: Payment processing (if needed)
      if (hasProducts && handlePayment) {
        console.log("💳 Processing payment...");
        await processPayment.mutateAsync({ handlePayment });
      }

      // Step 5: Create listing
      console.log("📝 Creating listing...");
      const result = await createListing.mutateAsync({
        formValues,
        images,
        hasProducts,
        productIds: items.map((item) => item.productId),
      });

      console.log("🎉 Listing creation flow completed successfully!");
      return result;
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: listingKeys.status() });
      queryClient.invalidateQueries({ queryKey: listingKeys.userListings() });

      message.success("تم إنشاء الإعلان بنجاح!");
    },
    onError: (error: Error) => {
      console.error("❌ Complete listing creation flow failed:", error);
      message.error(error.message);
    },
  });

  /**
   * Field validation helper
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

      const result = await fieldValidation.mutateAsync({
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
   * Reset all mutations
   */
  const reset = () => {
    validateListing.reset();
    createListing.reset();
    processPayment.reset();
    fieldValidation.reset();
    execute.reset();
  };

  return {
    // Main execution function (new simplified API)
    execute: execute.mutate,
    executeAsync: execute.mutateAsync,

    // State
    isLoading: isLoading || execute.isPending,
    isSuccess: execute.isSuccess,
    error: error || execute.error,

    // Individual actions (for advanced usage)
    validateListing: validateListing.mutate,
    createListing: createListing.mutate,
    processPayment: processPayment.mutate,
    validateFields,

    // Utilities
    reset,
    refreshStatus,

    // Individual mutation objects (for accessing detailed state)
    mutations: {
      validate: validateListing,
      create: createListing,
      payment: processPayment,
      fieldValidation,
      execute,
    },
  };
};
