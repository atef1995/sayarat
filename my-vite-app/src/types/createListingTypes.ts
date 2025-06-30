/**
 * Create Listing Container Types and Enums
 * Provides type-safe interfaces and enums for the listing creation flow
 * Following TypeScript best practices and type safety guidelines
 */

import { CarInfo, CreateListing } from "../types";
import { PaymentState } from "../types/payment";
import { ListingCreationStep } from "../types/listingTypes";
import type { CarAnalysisResult } from "../services/aiCarAnalysis";

/**
 * Enum for form validation states
 */
export enum FormValidationState {
  IDLE = "idle",
  VALIDATING = "validating",
  VALID = "valid",
  INVALID = "invalid",
  ERROR = "error",
}

/**
 * Enum for subscription modal states
 */
export enum SubscriptionModalState {
  HIDDEN = "hidden",
  SHOWING = "showing",
  PROCESSING = "processing",
  SUCCESS = "success",
  ERROR = "error",
}

/**
 * Interface for Create Listing Container props
 */
export interface CreateListingContainerProps {
  initialValues?: CarInfo;
  paymentState: PaymentState;
}

/**
 * Interface for form submission context
 */
export interface FormSubmissionContext {
  formValues: CreateListing;
  imageFiles: File[];
  paymentRequired: boolean;
  isRetry?: boolean;
}

/**
 * Interface for validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Interface for listing creation progress
 */
export interface ListingCreationProgress {
  currentStep: ListingCreationStep;
  completed: ListingCreationStep[];
  failed?: ListingCreationStep;
  retryCount: number;
}

/**
 * Type for field change handler
 */
export type FieldChangeHandler = (
  changedFields: Array<{ name: string | string[]; value?: unknown }>
) => Promise<void>;

/**
 * Type for form completion handler
 */
export type FormCompletionHandler = (values?: CreateListing) => Promise<void>;

/**
 * Type for retry handler
 */
export type RetryHandler = () => void;

/**
 * Interface for computed form state
 */
export interface ComputedFormState {
  isLoading: boolean;
  canSubmit: boolean;
  showSteps: boolean;
  validationState: FormValidationState;
}

/**
 * Interface for UI handlers
 */
export interface UIHandlers {
  onMakeChange: () => void;
  onAIAnalysisComplete: (data: CarAnalysisResult) => void;
  onSubscriptionSuccess: () => void;
  onFieldChange: FieldChangeHandler;
  onFormSubmit: FormCompletionHandler;
  onRetry: RetryHandler;
  onShowSubscription: () => void;
}

/**
 * Utility functions for listing creation
 */
export const getStepLabel = (step: ListingCreationStep): string => {
  switch (step) {
    case ListingCreationStep.FORM_VALIDATION:
      return "التحقق من النموذج";
    case ListingCreationStep.BACKEND_VALIDATION:
      return "التحقق من الخادم";
    case ListingCreationStep.PAYMENT_PROCESSING:
      return "معالجة الدفع";
    case ListingCreationStep.SUBMISSION:
      return "إرسال الإعلان";
    case ListingCreationStep.SUCCESS:
      return "تم بنجاح";
    default:
      return "غير معروف";
  }
};

export const isStepCompleted = (
  currentStep: ListingCreationStep,
  targetStep: ListingCreationStep
): boolean => {
  return currentStep >= targetStep;
};

export const canRetry = (step: ListingCreationStep): boolean => {
  return step !== ListingCreationStep.SUCCESS;
};

/**
 * Type guards for runtime type checking
 */
export const isCreateListing = (value: unknown): value is CreateListing => {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    "price" in value &&
    "make" in value &&
    "model" in value
  );
};

export const isFormSubmissionContext = (
  value: unknown
): value is FormSubmissionContext => {
  return (
    typeof value === "object" &&
    value !== null &&
    "formValues" in value &&
    "imageFiles" in value &&
    "paymentRequired" in value
  );
};

/**
 * Constants for the listing creation flow
 */
export const LISTING_CREATION_CONSTANTS = {
  MAX_RETRY_ATTEMPTS: 3,
  VALIDATION_TIMEOUT: 30000, // 30 seconds
  SUCCESS_REDIRECT_DELAY: 2000, // 2 seconds
  MAX_IMAGE_COUNT: 10,
  MAX_DESCRIPTION_LENGTH: 850,
  SUPPORTED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/bmp",
  ],
} as const;
