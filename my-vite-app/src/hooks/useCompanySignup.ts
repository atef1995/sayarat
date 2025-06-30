import { useState, useEffect, useCallback } from "react";
import { message, FormInstance } from "antd";
import { ApiResponse } from "../types/api.types";
import { ValidationError } from "../components/common/ValidationErrorDisplay";
import { loadApiConfig } from "../config/apiConfig";

const { apiUrl } = loadApiConfig();

/**
 * Validation error codes from backend
 */
export enum ValidationErrorCode {
  COMPANY_EXISTS = "COMPANY_EXISTS",
  USER_EXISTS = "USER_EXISTS",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  SCHEMA_ERROR = "SCHEMA_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

/**
 * Field mapping for step navigation
 */
const FIELD_TO_STEP_MAP: Record<string, number> = {
  companyName: 0,
  companyDescription: 0,
  companyAddress: 0,
  companyCity: 0,
  taxId: 0,
  website: 0,
  email: 1,
  username: 1,
  firstName: 1,
  lastName: 1,
  phone: 1,
  password: 1,
  confirmPassword: 1,
};

/**
 * Utility for handling validation errors with structured responses
 */
const ValidationErrorHandler = {
  /**
   * Get the appropriate step for a given field
   */
  getStepForField: (field: string): number => {
    return FIELD_TO_STEP_MAP[field] ?? 0;
  },

  /**
   * Check if error code represents a field-specific error
   */
  isFieldError: (code?: string): boolean => {
    return (
      code === ValidationErrorCode.COMPANY_EXISTS ||
      code === ValidationErrorCode.USER_EXISTS ||
      code === ValidationErrorCode.MISSING_REQUIRED_FIELD
    );
  },

  /**
   * Get user-friendly error message based on error code
   */
  getErrorMessage: (code?: string, defaultMessage?: string): string => {
    switch (code) {
      case ValidationErrorCode.COMPANY_EXISTS:
        return "اسم الشركة مستخدم بالفعل";
      case ValidationErrorCode.USER_EXISTS:
        return "البيانات مستخدمة بالفعل";
      case ValidationErrorCode.MISSING_REQUIRED_FIELD:
        return "يرجى ملء جميع الحقول المطلوبة";
      case ValidationErrorCode.SCHEMA_ERROR:
        return "خطأ في قاعدة البيانات. يرجى المحاولة لاحقاً";
      case ValidationErrorCode.INTERNAL_ERROR:
        return "خطأ في الخادم. يرجى المحاولة لاحقاً";
      default:
        return defaultMessage || "حدث خطأ غير متوقع";
    }
  },
};

// Constants for form persistence and retry logic
const FORM_STORAGE_KEY = "companySignupFormData";
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export interface CompanyFormValues {
  // Company Information
  companyName: string;
  companyDescription: string;
  companyAddress: string;
  companyCity: string;
  taxId: string;
  website?: string;

  // Primary Contact Information
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface ApiError {
  message?: string;
  status?: number;
}

interface ValidationApiResponse {
  success: boolean;
  error?: string;
  field?: string;
  code?: string;
  metadata?: {
    validatedAt: string;
    duration: number;
  };
}

export interface UseCompanySignupProps {
  form?: FormInstance<CompanyFormValues>;
  onFormChange?: (values: Partial<CompanyFormValues>) => void;
  autoSave?: boolean;
}

/**
 * Utility functions for form persistence
 */
const FormPersistence = {
  save: (data: CompanyFormValues) => {
    try {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save form data to localStorage:", error);
    }
  },

  load: (): Partial<CompanyFormValues> | null => {
    try {
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn("Failed to load form data from localStorage:", error);
      return null;
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(FORM_STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear form data from localStorage:", error);
    }
  },
};

/**
 * Utility function for exponential backoff retry logic
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = MAX_RETRY_ATTEMPTS,
  initialDelay: number = INITIAL_RETRY_DELAY
): Promise<T> => {
  let attempt = 1;

  while (attempt <= maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.warn(
        `Attempt ${attempt} failed, retrying in ${delay}ms...`,
        error
      );
      await sleep(delay);
      attempt++;
    }
  }

  throw new Error("Max retry attempts exceeded");
};

/**
 * Custom hook for handling company signup form logic
 *
 * RESPONSIBILITIES:
 * - Manage form submission state
 * - Handle backend validation with retry logic
 * - Handle company creation
 * - Provide error handling utilities
 * - Persist form data to localStorage for better UX
 * - Track form analytics and completion rates
 *
 * ARCHITECTURE:
 * - Modular design with separated concerns
 * - Error boundary compatible
 * - Reusable validation and persistence utilities
 *
 * #TODO: Add form analytics tracking
 * #TODO: Implement progress indicators for long operations
 * #TODO: Add offline support with queue sync
 */
export const useCompanySignup = (props: UseCompanySignupProps = {}) => {
  const { form, onFormChange, autoSave = true } = props;

  const [loading, setLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validatedData, setValidatedData] = useState<CompanyFormValues | null>(
    null
  );
  const [companyCreated, setCompanyCreated] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  /**
   * Load saved form data on mount and integrate with form instance
   */
  useEffect(() => {
    const savedData = FormPersistence.load();
    if (savedData && form) {
      form.setFieldsValue(savedData);
      onFormChange?.(savedData);
      console.log("Loaded and applied saved form data from localStorage");
    } else if (savedData) {
      console.log(
        "Loaded saved form data from localStorage (no form instance provided)"
      );
    }
  }, [form, onFormChange]);

  /**
   * Save form data to localStorage
   */
  const saveFormData = useCallback((data: CompanyFormValues) => {
    FormPersistence.save(data);
  }, []);

  /**
   * Load saved form data
   */
  const loadSavedFormData =
    useCallback((): Partial<CompanyFormValues> | null => {
      return FormPersistence.load();
    }, []);

  /**
   * Clear saved form data (call after successful submission)
   */
  const clearSavedFormData = useCallback(() => {
    FormPersistence.clear();
  }, []);

  /**
   * Auto-save form data when it changes
   */
  const handleFormChange = useCallback(
    (
      changedValues: Partial<CompanyFormValues>,
      allValues: CompanyFormValues
    ) => {
      if (autoSave) {
        saveFormData(allValues);
      }
      onFormChange?.(changedValues);
    },
    [autoSave, onFormChange, saveFormData]
  );

  /**
   * Enhanced API error handler with detailed error categorization
   * Modular design allows for easy extension and testing
   */
  const handleApiError = useCallback((error: unknown, context: string) => {
    console.error(`${context} error:`, error);

    const errorObj = error as ApiError;

    // Network connectivity errors
    if (
      errorObj?.message?.includes("network") ||
      errorObj?.message?.includes("fetch") ||
      errorObj?.message?.includes("NetworkError")
    ) {
      message.error("مشكلة في الاتصال بالإنترنت. يرجى المحاولة مرة أخرى");
      return "NETWORK_ERROR";
    }

    // Conflict errors (duplicate data)
    if (errorObj?.status === 409) {
      message.error(
        "البيانات المدخلة مستخدمة مسبقاً. يرجى التحقق والمحاولة مرة أخرى"
      );
      return "CONFLICT_ERROR";
    }

    // Server errors
    if (errorObj?.status === 500) {
      message.error(
        "خطأ في الخادم. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني"
      );
      return "SERVER_ERROR";
    }

    // Validation errors
    if (errorObj?.status === 400) {
      message.error(
        "البيانات المدخلة غير صحيحة. يرجى المراجعة والمحاولة مرة أخرى"
      );
      return "VALIDATION_ERROR";
    }

    // Authentication/Authorization errors
    if (errorObj?.status === 401 || errorObj?.status === 403) {
      message.error("غير مصرح. يرجى تسجيل الدخول والمحاولة مرة أخرى");
      return "AUTH_ERROR";
    }

    // Generic error
    message.error("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى");
    return "UNKNOWN_ERROR";
  }, []);

  /**
   * Validate form data with backend before company creation using retry logic and structured error handling
   */
  const validateWithBackend = async (
    values: CompanyFormValues,
    form: FormInstance<CompanyFormValues>,
    setCurrentStep: (step: number) => void
  ) => {
    setValidationLoading(true);

    try {
      await retryWithBackoff(
        async () => {
          const response = await fetch(
            `${apiUrl}/api/auth/validate-company-signup`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                ...values,
                accountType: "company",
              }),
            }
          );

          const data: ValidationApiResponse = await response.json();

          if (!response.ok) {
            // Throw the full response for structured error handling
            throw { response: data, status: response.status };
          }

          return data;
        },
        MAX_RETRY_ATTEMPTS,
        INITIAL_RETRY_DELAY
      );

      // Validation successful - store data and auto-save progress
      setValidatedData(values);
      if (autoSave) {
        saveFormData(values);
      }
      setRetryCount(0);
      return true;
    } catch (error: unknown) {
      // Handle structured validation errors from backend
      if (error && typeof error === "object" && "response" in error) {
        const errorResponse = error.response as ValidationApiResponse;
        const { field, error: errorMessage, code } = errorResponse;

        if (field && errorMessage) {
          // Set specific field error using backend response
          form.setFields([
            {
              name: field as keyof CompanyFormValues,
              errors: [errorMessage],
            },
          ]);

          // Navigate to appropriate step based on field
          const step = ValidationErrorHandler.getStepForField(field);
          setCurrentStep(step);
        } else {
          // General error without specific field - use enhanced error message
          const userFriendlyMessage = ValidationErrorHandler.getErrorMessage(
            code,
            errorMessage
          );
          message.error(userFriendlyMessage);
        }
      } else {
        // Handle non-structured errors (network, etc.)
        handleApiError(error, "Validation");
      }
      return false;
    } finally {
      setValidationLoading(false);
    }
  };

  /**
   * Enhanced validation with backend that returns structured error information
   * for better integration with ValidationErrorDisplay component
   */
  const validateWithBackendStructured = async (
    values: CompanyFormValues,
    form: FormInstance<CompanyFormValues>
  ): Promise<{
    success: boolean;
    error?: ValidationError;
    targetStep?: number;
  }> => {
    setValidationLoading(true);

    try {
      await retryWithBackoff(
        async () => {
          const response = await fetch(
            `${apiUrl}/api/auth/validate-company-signup`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                ...values,
                accountType: "company",
              }),
            }
          );

          const data: ValidationApiResponse = await response.json();

          if (!response.ok) {
            // Throw the full response for structured error handling
            throw { response: data, status: response.status };
          }

          return data;
        },
        MAX_RETRY_ATTEMPTS,
        INITIAL_RETRY_DELAY
      );

      // Validation successful - store data and auto-save progress
      setValidatedData(values);
      if (autoSave) {
        saveFormData(values);
      }
      setRetryCount(0);
      return { success: true };
    } catch (error: unknown) {
      // Handle structured validation errors from backend
      if (error && typeof error === "object" && "response" in error) {
        const errorResponse = error.response as ValidationApiResponse;
        const { field, error: errorMessage, code } = errorResponse;

        if (field && errorMessage) {
          // Set specific field error using backend response
          form.setFields([
            {
              name: field as keyof CompanyFormValues,
              errors: [errorMessage],
            },
          ]);

          // Navigate to appropriate step based on field using utility
          const targetStep = ValidationErrorHandler.getStepForField(field);

          // Create structured error for the target step
          const structuredError = {
            field,
            message: errorMessage,
            code,
          };

          // If we need to navigate to a different step, don't change step here
          // Return the target step so the caller can handle navigation and error display
          if (targetStep !== undefined) {
            return {
              success: false,
              error: structuredError,
              targetStep,
            };
          }

          return {
            success: false,
            error: structuredError,
          };
        } else {
          // General error without specific field - use enhanced error message
          const userFriendlyMessage = ValidationErrorHandler.getErrorMessage(
            code,
            errorMessage
          );
          return {
            success: false,
            error: {
              message: userFriendlyMessage,
              code,
            },
          };
        }
      } else {
        // Handle non-structured errors (network, etc.)
        const errorType = handleApiError(error, "Validation");
        return {
          success: false,
          error: {
            message: "حدث خطأ في التحقق من البيانات",
            code: errorType,
          },
        };
      }
    } finally {
      setValidationLoading(false);
    }
  };

  /**
   * Create company account after validation using retry logic
   */
  const createCompany = async () => {
    if (!validatedData) {
      message.error("يرجى التحقق من البيانات أولاً");
      return { success: false };
    }

    setLoading(true);
    try {
      const data = await retryWithBackoff(
        async () => {
          const response = await fetch(`${apiUrl}/api/auth/company-signup`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              ...validatedData,
              accountType: "company",
            }),
          });

          const responseData: ApiResponse = await response.json();

          if (!response.ok) {
            throw new Error(responseData.error || "Company creation failed");
          }

          return responseData;
        },
        MAX_RETRY_ATTEMPTS,
        INITIAL_RETRY_DELAY
      );

      message.success(
        "تم إنشاء حساب الشركة بنجاح! يرجى اختيار خطة الاشتراك لتفعيل حسابك"
      );

      setCompanyCreated(true);

      // Clear saved form data after successful creation
      clearSavedFormData();
      setRetryCount(0);

      return { success: true, data };
    } catch (error) {
      handleApiError(error, "Company Signup");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    loading,
    validationLoading,
    validatedData,
    companyCreated,
    retryCount,

    // Core functionality
    validateWithBackend,
    validateWithBackendStructured,
    createCompany,

    // Utilities
    handleApiError,
    handleFormChange,
    saveFormData,
    loadSavedFormData,
    clearSavedFormData,
  };
};
