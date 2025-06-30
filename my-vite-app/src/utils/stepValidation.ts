/**
 * Step Validation Utilities
 *
 * Modular utilities for handling multi-step form validation
 * Implements DRY principles and modular architecture
 */

import { FormInstance } from "antd";
import { CompanyFormValues } from "../hooks/useCompanySignup";
import { ValidationError } from "../components/common/ValidationErrorDisplay";

/**
 * Step field definitions for validation
 */
export const STEP_FIELDS = {
  COMPANY_INFO: [
    "companyName",
    "companyDescription",
    "companyAddress",
    "companyCity",
    "taxId",
    "website",
  ] as (keyof CompanyFormValues)[],

  ADMIN_INFO: [
    "firstName",
    "lastName",
    "email",
    "username",
    "phone",
    "password",
    "confirmPassword",
  ] as (keyof CompanyFormValues)[],

  COMPLETION: [] as (keyof CompanyFormValues)[],
};

/**
 * Step validation configuration
 */
export interface StepValidationConfig {
  step: number;
  title: string;
  fields: (keyof CompanyFormValues)[];
  requiresBackendValidation: boolean;
}

export const STEP_VALIDATION_CONFIG: StepValidationConfig[] = [
  {
    step: 0,
    title: "معلومات الشركة",
    fields: STEP_FIELDS.COMPANY_INFO,
    requiresBackendValidation: false,
  },
  {
    step: 1,
    title: "معلومات المسؤول",
    fields: STEP_FIELDS.ADMIN_INFO,
    requiresBackendValidation: true,
  },
  {
    step: 2,
    title: "اكتمال التسجيل",
    fields: STEP_FIELDS.COMPLETION,
    requiresBackendValidation: false,
  },
];

/**
 * Step Validation Service
 *
 * Provides utilities for validating form steps with enhanced error handling
 */
export class StepValidationService {
  /**
   * Validate a specific step
   */
  static async validateStep(
    step: number,
    form: FormInstance<CompanyFormValues>,
    validateWithBackendStructured?: (
      values: CompanyFormValues,
      form: FormInstance<CompanyFormValues>
    ) => Promise<{
      success: boolean;
      error?: ValidationError;
      targetStep?: number;
    }>
  ): Promise<{
    success: boolean;
    error?: string;
    validationError?: ValidationError;
    targetStep?: number;
  }> {
    const config = STEP_VALIDATION_CONFIG[step];

    if (!config) {
      return { success: false, error: "خطوة غير صحيحة" };
    }

    try {
      // First, validate required fields locally
      if (config.fields.length > 0) {
        await form.validateFields(config.fields);
      }

      // If backend validation is required, perform it
      if (config.requiresBackendValidation && validateWithBackendStructured) {
        const values = form.getFieldsValue(true) as CompanyFormValues;
        const result = await validateWithBackendStructured(values, form);

        if (!result.success) {
          return {
            success: false,
            error: result.error?.message || "فشل التحقق من البيانات مع الخادم",
            validationError: result.error,
            targetStep: result.targetStep,
          };
        }
      }

      return { success: true };
    } catch (error) {
      console.error(`Step ${step} validation failed:`, error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "خطأ في التحقق من البيانات",
      };
    }
  }

  /**
   * Get field names for a specific step
   */
  static getStepFields(step: number): (keyof CompanyFormValues)[] {
    const config = STEP_VALIDATION_CONFIG[step];
    return config ? config.fields : [];
  }

  /**
   * Check if a step requires backend validation
   */
  static requiresBackendValidation(step: number): boolean {
    const config = STEP_VALIDATION_CONFIG[step];
    return config ? config.requiresBackendValidation : false;
  }

  /**
   * Get step configuration
   */
  static getStepConfig(step: number): StepValidationConfig | null {
    return STEP_VALIDATION_CONFIG[step] || null;
  }

  /**
   * Validate all completed steps up to current step
   */
  static async validateAllStepsUpTo(
    currentStep: number,
    form: FormInstance<CompanyFormValues>
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (let step = 0; step <= currentStep; step++) {
      const config = STEP_VALIDATION_CONFIG[step];
      if (!config) continue;

      try {
        if (config.fields.length > 0) {
          await form.validateFields(config.fields);
        }
      } catch (error) {
        errors.push(
          `خطأ في ${config.title}: ${
            error instanceof Error ? error.message : "خطأ غير معروف"
          }`
        );
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }
}

/**
 * Hook for step validation with enhanced error handling
 */
export const useStepValidation = () => {
  const validateStep = StepValidationService.validateStep;
  const getStepFields = StepValidationService.getStepFields;
  const requiresBackendValidation =
    StepValidationService.requiresBackendValidation;
  const getStepConfig = StepValidationService.getStepConfig;
  const validateAllStepsUpTo = StepValidationService.validateAllStepsUpTo;

  return {
    validateStep,
    getStepFields,
    requiresBackendValidation,
    getStepConfig,
    validateAllStepsUpTo,
    STEP_VALIDATION_CONFIG,
  };
};

export default StepValidationService;
