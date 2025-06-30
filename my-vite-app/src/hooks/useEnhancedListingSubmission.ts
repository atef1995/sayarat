/**
 * Enhanced listing creation with validation-first approach
 * This addresses the critical issue of payment before validation
 */

import { useState, useCallback } from "react";
import { message } from "antd";

// Simplified state management for listing creation
export enum ListingSubmissionStep {
  IDLE = "idle",
  FORM_VALIDATION = "form_validation",
  BACKEND_VALIDATION = "backend_validation",
  PAYMENT_PROCESSING = "payment_processing",
  LISTING_CREATION = "listing_creation",
  SUCCESS = "success",
}

export interface ListingSubmissionState {
  currentStep: ListingSubmissionStep;
  isLoading: boolean;
  error: string | null;
  canProceedToPayment: boolean;
  validatedData: FormData | null;
}

export const useEnhancedListingSubmission = (
  isAuthenticated: boolean,
  needsSubscription: boolean,
  refreshStatus: () => Promise<void>
) => {
  const [state, setState] = useState<ListingSubmissionState>({
    currentStep: ListingSubmissionStep.IDLE,
    isLoading: false,
    error: null,
    canProceedToPayment: false,
    validatedData: null,
  });

  const updateState = useCallback(
    (updates: Partial<ListingSubmissionState>) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * Step 1: Validate form data and user permissions
   */
  const validateFormAndPermissions = useCallback(
    async (_formData: FormData): Promise<boolean> => {
      updateState({
        currentStep: ListingSubmissionStep.FORM_VALIDATION,
        isLoading: true,
        error: null,
      });

      try {
        // Check authentication
        if (!isAuthenticated) {
          throw new Error("يجب تسجيل الدخول لنشر الإعلانات");
        }

        // Check subscription limits
        await refreshStatus();
        if (needsSubscription) {
          throw new Error("يجب ترقية الاشتراك لإنشاء المزيد من الإعلانات");
        }

        updateState({
          isLoading: false,
          canProceedToPayment: true,
        });

        return true;
      } catch (error) {
        updateState({
          isLoading: false,
          error: error instanceof Error ? error.message : "خطأ غير معروف",
          canProceedToPayment: false,
        });

        return false;
      }
    },
    [isAuthenticated, needsSubscription, refreshStatus, updateState]
  );

  /**
   * Step 2: Validate with backend (dry run)
   * This is the critical step that prevents payment before validation
   */
  const validateWithBackend = useCallback(
    async (formData: FormData): Promise<boolean> => {
      updateState({
        currentStep: ListingSubmissionStep.BACKEND_VALIDATION,
        isLoading: true,
        error: null,
      });

      try {
        // Create dry run form data
        const dryRunData = new FormData();

        // Copy all form data
        for (const [key, value] of formData.entries()) {
          dryRunData.append(key, value);
        }

        // Add dry run flag
        dryRunData.append("dryRun", "true");

        // TODO: Replace with actual backend validation call
        const response = await fetch("/api/listings/validate", {
          method: "POST",
          body: dryRunData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "فشل في التحقق من البيانات");
        }

        const validationResult = await response.json();

        if (!validationResult.valid) {
          throw new Error(
            validationResult.errors?.join(", ") || "البيانات غير صالحة"
          );
        }

        // Store validated data for later submission
        updateState({
          isLoading: false,
          validatedData: formData,
          canProceedToPayment: true,
        });

        return true;
      } catch (error) {
        updateState({
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "خطأ في التحقق من البيانات",
          canProceedToPayment: false,
        });

        return false;
      }
    },
    [updateState]
  );

  /**
   * Step 3: Process payment (only after successful validation)
   */
  const processPayment = useCallback(
    async (
      handlePayment: () => Promise<string | null>
    ): Promise<string | null> => {
      if (!state.canProceedToPayment) {
        throw new Error("لا يمكن المعالجة قبل التحقق من البيانات");
      }

      updateState({
        currentStep: ListingSubmissionStep.PAYMENT_PROCESSING,
        isLoading: true,
        error: null,
      });

      try {
        const clientSecret = await handlePayment();

        if (!clientSecret) {
          throw new Error("فشل في معالجة عملية الدفع");
        }

        updateState({ isLoading: false });
        return clientSecret;
      } catch (error) {
        updateState({
          isLoading: false,
          error: error instanceof Error ? error.message : "خطأ في معالجة الدفع",
        });

        return null;
      }
    },
    [state.canProceedToPayment, updateState]
  );

  /**
   * Step 4: Create the listing (final submission)
   */
  const createListing = useCallback(
    async (
      clientSecret?: string | null,
      _hasSelectedProducts?: boolean
    ): Promise<boolean> => {
      if (!state.validatedData) {
        throw new Error("لا توجد بيانات محققة للإرسال");
      }

      updateState({
        currentStep: ListingSubmissionStep.LISTING_CREATION,
        isLoading: true,
        error: null,
      });

      try {
        const finalFormData = new FormData();

        // Copy validated data
        for (const [key, value] of state.validatedData.entries()) {
          if (key !== "dryRun") {
            // Remove dry run flag
            finalFormData.append(key, value);
          }
        }

        // Add client secret if payment was processed
        if (clientSecret) {
          finalFormData.append("clientSecret", clientSecret);
        }

        // Submit to backend
        const response = await fetch("/api/listings", {
          method: "POST",
          body: finalFormData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "فشل في إنشاء الإعلان");
        }

        updateState({
          currentStep: ListingSubmissionStep.SUCCESS,
          isLoading: false,
        });

        message.success("تم إنشاء الإعلان بنجاح!");
        return true;
      } catch (error) {
        updateState({
          isLoading: false,
          error:
            error instanceof Error ? error.message : "خطأ في إنشاء الإعلان",
        });

        return false;
      }
    },
    [state.validatedData, updateState]
  );

  /**
   * Main orchestration function - ensures validation before payment
   */
  const submitListing = useCallback(
    async (
      formData: FormData,
      handlePayment: () => Promise<string | null>,
      hasSelectedProducts: boolean = false
    ): Promise<boolean> => {
      try {
        // Step 1: Validate form and permissions
        const formValid = await validateFormAndPermissions(formData);
        if (!formValid) return false;

        // Step 2: Validate with backend BEFORE any payment
        const backendValid = await validateWithBackend(formData);
        if (!backendValid) return false;

        // Step 3: Process payment (only if validation passed)
        let clientSecret: string | null = null;
        if (hasSelectedProducts) {
          clientSecret = await processPayment(handlePayment);
          if (!clientSecret) return false;
        }

        // Step 4: Create the listing
        const listingCreated = await createListing(
          clientSecret,
          hasSelectedProducts
        );
        return listingCreated;
      } catch (error) {
        updateState({
          isLoading: false,
          error: error instanceof Error ? error.message : "خطأ غير متوقع",
        });

        message.error("حدث خطأ أثناء إنشاء الإعلان");
        return false;
      }
    },
    [
      validateFormAndPermissions,
      validateWithBackend,
      processPayment,
      createListing,
      updateState,
    ]
  );

  /**
   * Reset the submission state
   */
  const resetSubmission = useCallback(() => {
    setState({
      currentStep: ListingSubmissionStep.IDLE,
      isLoading: false,
      error: null,
      canProceedToPayment: false,
      validatedData: null,
    });
  }, []);

  return {
    state,
    submitListing,
    clearError,
    resetSubmission,
  };
};
