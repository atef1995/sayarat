import { useState } from "react";

/**
 * Custom hook for managing multi-step form navigation
 *
 * RESPONSIBILITIES:
 * - Handle step navigation logic
 * - Manage current step state
 * - Provide step validation utilities
 *
 * #TODO: Add step completion tracking
 * #TODO: Implement step validation requirements
 * #TODO: Add step progress persistence
 */
export const useStepNavigation = (totalSteps: number) => {
  const [currentStep, setCurrentStep] = useState(0);

  /**
   * Get required fields for validation based on current step
   */
  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 0:
        return [
          "companyName",
          "companyDescription",
          "companyAddress",
          "companyCity",
          "taxId",
        ];
      case 1:
        return [
          "firstName",
          "lastName",
          "email",
          "username",
          "phone",
          "password",
          "confirmPassword",
        ];
      case 2:
        return []; // No form fields to validate in the final step
      default:
        return [];
    }
  };

  /**
   * Navigate to next step with validation
   */
  const nextStep = async (
    form: any,
    onStepValidation?: (step: number) => Promise<boolean>
  ) => {
    try {
      const fieldsToValidate = getFieldsForStep(currentStep);
      await form.validateFields(fieldsToValidate);

      // Custom validation for specific steps
      if (onStepValidation) {
        const isValid = await onStepValidation(currentStep);
        if (!isValid) {
          return; // Stay on current step if validation fails
        }
      }

      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    } catch (error) {
      console.log("Validation failed:", error);
    }
  };

  /**
   * Navigate to previous step
   */
  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  /**
   * Navigate to specific step
   */
  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  };

  /**
   * Check if current step is the last step
   */
  const isLastStep = currentStep === totalSteps - 1;

  /**
   * Check if current step is the first step
   */
  const isFirstStep = currentStep === 0;

  return {
    currentStep,
    setCurrentStep,
    getFieldsForStep,
    nextStep,
    prevStep,
    goToStep,
    isLastStep,
    isFirstStep,
  };
};
