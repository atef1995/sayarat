// Enhanced types for listing creation process
export enum ListingCreationStep {
  FORM_VALIDATION = "form_validation",
  BACKEND_VALIDATION = "backend_validation",
  PAYMENT_PROCESSING = "payment_processing",
  SUBMISSION = "submission",
  SUCCESS = "success",
}

export enum ListingErrorType {
  FORM_VALIDATION = "form_validation",
  BACKEND_VALIDATION = "backend_validation",
  AUTHENTICATION = "authentication",
  SUBSCRIPTION_REQUIRED = "subscription_required",
  PAYMENT_FAILED = "payment_failed",
  SUBMISSION_FAILED = "submission_failed",
  NETWORK_ERROR = "network_error",
  UNKNOWN = "unknown",
}

export interface ListingCreationState {
  currentStep: ListingCreationStep;
  isLoading: boolean;
  error: ListingCreationError | null;
  validatedFormData: FormData | null;
  submissionImages: File[] | null;
  canProceedToPayment: boolean;
  canSubmit: boolean;
}

export interface ListingCreationError {
  type: ListingErrorType;
  message: string;
  details?: Record<string, unknown>;
  isRetryable: boolean;
}

export interface BackendValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ListingSubmissionResult {
  success: boolean;
  listingId?: string;
  redirectUrl?: string;
  error?: string;
}
