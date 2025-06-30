import { useState, useCallback, useContext } from "react";
import { message } from "antd";
import {
  ListingCreationStep,
  ListingCreationState,
  ListingCreationError,
  ListingErrorType,
} from "../types/listingTypes";
import { CreateListing } from "../types";
import { listingValidationService } from "../services/listingValidationService";
import { listingService } from "../services/listingService";
import { PaymentItem } from "../types/payment";
import { AuthContext } from "../context/AuthContext";

interface UseListingCreationProps {
  isAuthenticated: boolean;
  needsSubscription: boolean;
  hasSelectedProducts: boolean;
  items: PaymentItem[];
  refreshStatus: () => Promise<void>;
}

export const useListingCreation = ({
  isAuthenticated,
  needsSubscription,
  hasSelectedProducts,
  items,
  refreshStatus,
}: UseListingCreationProps) => {
  const authContext = useContext(AuthContext);
  const [state, setState] = useState<ListingCreationState>({
    currentStep: ListingCreationStep.FORM_VALIDATION,
    isLoading: false,
    error: null,
    validatedFormData: null,
    submissionImages: null,
    canProceedToPayment: false,
    canSubmit: false,
  });

  const createError = useCallback(
    (
      type: ListingErrorType,
      message: string,
      details?: Record<string, unknown>,
      isRetryable: boolean = true
    ): ListingCreationError => ({
      type,
      message,
      details,
      isRetryable,
    }),
    []
  );

  const updateState = useCallback((updates: Partial<ListingCreationState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const setLoading = useCallback(
    (loading: boolean) => {
      updateState({ isLoading: loading });
    },
    [updateState]
  );

  const createFormData = useCallback(
    (formValues: CreateListing, images?: File[]): FormData => {
      const formData = new FormData();

      // Add all form fields to FormData
      Object.entries(formValues).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
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

      return formData;
    },
    []
  );

  /**
   * Step 1: Validate form and check authentication/subscription
   */
  const validateFormAndAuth = useCallback(
    async (formValues: CreateListing): Promise<boolean> => {
      updateState({
        currentStep: ListingCreationStep.FORM_VALIDATION,
        isLoading: true,
        error: null,
      });

      try {
        // Log form values for debugging
        console.log(
          "Step 1 - Form validation with values:",
          Object.keys(formValues)
        );

        // Check authentication
        if (!isAuthenticated) {
          throw createError(
            ListingErrorType.AUTHENTICATION,
            "يجب تسجيل الدخول لنشر الإعلانات",
            undefined,
            false
          );
        }

        // Refresh and check subscription limits
        await refreshStatus();

        if (needsSubscription) {
          throw createError(
            ListingErrorType.SUBSCRIPTION_REQUIRED,
            "يجب ترقية الاشتراك لإنشاء المزيد من الإعلانات",
            { showSubscriptionModal: true },
            false
          );
        }

        updateState({
          isLoading: false,
          canProceedToPayment: true,
        });

        return true;
      } catch (error) {
        const listingError =
          error instanceof Error
            ? createError(ListingErrorType.FORM_VALIDATION, error.message)
            : (error as ListingCreationError);

        updateState({
          isLoading: false,
          error: listingError,
          canProceedToPayment: false,
        });

        message.error(listingError.message);
        return false;
      }
    },
    [
      isAuthenticated,
      needsSubscription,
      refreshStatus,
      createError,
      updateState,
    ]
  );

  /**
   * Step 2: Validate with backend (dry run)
   */
  const validateWithBackend = useCallback(
    async (formValues: CreateListing, images?: File[]): Promise<boolean> => {
      updateState({
        currentStep: ListingCreationStep.BACKEND_VALIDATION,
        isLoading: true,
        error: null,
      });

      try {
        // Get user ID from auth context
        const userId = authContext?.user?.id;

        if (!userId) {
          throw createError(
            ListingErrorType.AUTHENTICATION,
            "لم يتم العثور على معرف المستخدم، يرجى إعادة تسجيل الدخول",
            undefined,
            false
          );
        }

        console.log("Backend validation - Form values:", formValues);
        console.log("Backend validation - Images:", images?.length || 0);
        console.log("Backend validation - User ID:", userId);

        // Use the actual validation service with images
        const validationResult = await listingValidationService.validateListing(
          formValues,
          userId.toString(),
          images
        );

        console.log("Backend validation result:", validationResult);

        if (!validationResult.valid) {
          throw createError(
            ListingErrorType.BACKEND_VALIDATION,
            validationResult.errors?.join(", ") ||
              "فشل في التحقق من صحة البيانات",
            { errors: validationResult.errors }
          );
        }

        // Store validated form data and images for later submission
        const finalFormData = createFormData(formValues, images);
        if (hasSelectedProducts) {
          finalFormData.append(
            "productIds",
            JSON.stringify(items.map((item) => item.productId))
          );
        }

        updateState({
          isLoading: false,
          validatedFormData: finalFormData,
          submissionImages: images || null,
          canSubmit: true,
        });

        if (validationResult.warnings && validationResult.warnings.length > 0) {
          validationResult.warnings.forEach((warning) =>
            message.warning(warning)
          );
        }

        return true;
      } catch (error) {
        const listingError =
          error instanceof Error
            ? createError(ListingErrorType.BACKEND_VALIDATION, error.message)
            : (error as ListingCreationError);

        updateState({
          isLoading: false,
          error: listingError,
          canSubmit: false,
        });

        message.error(listingError.message);
        return false;
      }
    },
    [
      createFormData,
      hasSelectedProducts,
      items,
      createError,
      updateState,
      authContext?.user?.id,
    ]
  );

  /**
   * Step 3: Process payment (if needed)
   */
  const processPayment = useCallback(
    async (handlePayment: () => Promise<boolean>): Promise<boolean> => {
      if (!hasSelectedProducts) {
        return true; // No payment needed
      }

      updateState({
        currentStep: ListingCreationStep.PAYMENT_PROCESSING,
        isLoading: true,
        error: null,
      });

      try {
        const paymentSuccess = await handlePayment();

        if (!paymentSuccess) {
          throw createError(
            ListingErrorType.PAYMENT_FAILED,
            "فشل في معالجة عملية الدفع"
          );
        }

        updateState({ isLoading: false });
        return true;
      } catch (error) {
        const listingError =
          error instanceof Error
            ? createError(ListingErrorType.PAYMENT_FAILED, error.message)
            : (error as ListingCreationError);

        updateState({
          isLoading: false,
          error: listingError,
        });

        message.error(listingError.message);
        return false;
      }
    },
    [hasSelectedProducts, createError, updateState]
  );

  /**
   * Real-time field validation
   * Validates specific fields as user types
   */
  const validateFields = useCallback(
    async (
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

        const validationResult = await listingValidationService.validateFields(
          fields,
          userId.toString()
        );

        return {
          valid: validationResult.valid,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        };
      } catch (error) {
        console.error("Field validation error:", error);
        return {
          valid: false,
          errors: ["فشل في التحقق من صحة الحقل"],
        };
      }
    },
    [authContext?.user?.id]
  );

  /**
   * Check if validation service is available
   */
  const checkValidationHealth = useCallback(async (): Promise<boolean> => {
    try {
      return await listingValidationService.isValidationAvailable();
    } catch (error) {
      console.error("Validation health check failed:", error);
      return false;
    }
  }, []);

  /**
   * Enhanced logging for submission pipeline debugging
   */
  const logSubmissionProgress = useCallback(
    (stage: string, data?: Record<string, unknown>) => {
      console.group(`🚀 Listing Submission - ${stage}`);
      console.log("Current step:", state.currentStep);
      console.log("Is loading:", state.isLoading);
      console.log("Has validated data:", !!state.validatedFormData);
      console.log("Has images:", state.submissionImages?.length || 0);
      console.log("Has products:", hasSelectedProducts);
      console.log("Items count:", items.length);
      if (data) {
        console.log("Additional data:", data);
      }
      console.groupEnd();
    },
    [
      state.currentStep,
      state.isLoading,
      state.validatedFormData,
      state.submissionImages,
      hasSelectedProducts,
      items,
    ]
  );

  /**
   * Step 4: Submit the listing using the actual listing service
   */
  const submitListing = useCallback(async (): Promise<boolean> => {
    if (!state.validatedFormData) {
      throw createError(
        ListingErrorType.SUBMISSION_FAILED,
        "لم يتم التحقق من بيانات النموذج"
      );
    }

    updateState({
      currentStep: ListingCreationStep.SUBMISSION,
      isLoading: true,
      error: null,
    });

    try {
      console.log("Starting actual listing submission...");
      console.log(
        "Form data keys:",
        Array.from(state.validatedFormData.keys())
      );
      console.log("Has images:", state.submissionImages?.length || 0);

      // Log submission progress
      logSubmissionProgress("Starting Submission", {
        formDataKeys: Array.from(state.validatedFormData.keys()),
        imageCount: state.submissionImages?.length || 0,
      });

      // Use the actual listing service to submit the listing
      const success = await listingService.submitListing(
        state.validatedFormData,
        undefined, // initialValues - for updates (not used in creation)
        hasSelectedProducts
      );

      logSubmissionProgress("Service Call Complete", { success });

      if (!success) {
        throw createError(
          ListingErrorType.SUBMISSION_FAILED,
          "فشل في إنشاء الإعلان"
        );
      }

      updateState({
        currentStep: ListingCreationStep.SUCCESS,
        isLoading: false,
      });

      message.success("تم إنشاء الإعلان بنجاح!");

      // Refresh the listing status after successful creation
      await refreshStatus();

      return true;
    } catch (error) {
      console.error("Listing submission error:", error);

      // Handle specific error types
      if (
        error instanceof Error &&
        error.message === "listing_limit_exceeded"
      ) {
        const listingError = createError(
          ListingErrorType.SUBSCRIPTION_REQUIRED,
          "تم الوصول إلى الحد الأقصى للإعلانات. يرجى ترقية الاشتراك",
          { showSubscriptionModal: true },
          false
        );

        updateState({
          isLoading: false,
          error: listingError,
        });

        return false;
      }

      const listingError =
        error instanceof Error
          ? createError(ListingErrorType.SUBMISSION_FAILED, error.message)
          : (error as ListingCreationError);

      updateState({
        isLoading: false,
        error: listingError,
      });

      message.error(listingError.message);
      return false;
    }
  }, [
    state.validatedFormData,
    state.submissionImages,
    hasSelectedProducts,
    createError,
    updateState,
    refreshStatus,
    logSubmissionProgress,
  ]);

  /**
   * Main orchestration function - runs the complete flow
   */
  const executeListingCreation = useCallback(
    async (
      formValues: CreateListing,
      handlePayment: () => Promise<boolean>,
      images?: File[]
      // #TODO: Add initialValues parameter when implementing edit functionality
      // initialValues?: CarInfo
    ): Promise<boolean> => {
      try {
        // Step 1: Form and auth validation
        const authValid = await validateFormAndAuth(formValues);
        if (!authValid) return false;

        // Step 2: Backend validation (with images)
        const backendValid = await validateWithBackend(formValues, images);
        if (!backendValid) return false;

        // Step 3: Payment processing (if needed)
        const paymentSuccess = await processPayment(handlePayment);
        if (!paymentSuccess) return false;

        // Step 4: Final submission
        const submissionSuccess = await submitListing();
        return submissionSuccess;
      } catch (error) {
        const listingError =
          error instanceof Error
            ? createError(ListingErrorType.UNKNOWN, error.message)
            : (error as ListingCreationError);

        updateState({
          isLoading: false,
          error: listingError,
        });

        message.error(listingError.message);
        return false;
      }
    },
    [
      validateFormAndAuth,
      validateWithBackend,
      processPayment,
      submitListing,
      createError,
      updateState,
    ]
  );

  /**
   * Reset the entire flow
   */
  const resetFlow = useCallback(() => {
    setState({
      currentStep: ListingCreationStep.FORM_VALIDATION,
      isLoading: false,
      error: null,
      validatedFormData: null,
      submissionImages: null,
      canProceedToPayment: false,
      canSubmit: false,
    });
  }, []);

  return {
    // State
    ...state,

    // Actions
    validateFormAndAuth,
    validateWithBackend,
    processPayment,
    validateFields,
    checkValidationHealth,
    executeListingCreation,
    resetValidation: resetFlow,
    clearError,
    setLoading,
  };
};
