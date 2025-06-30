/**
 * Company Signup Form - Enhanced Modular Architecture
 *
 * ARCHITECTURE PRINCIPLES:
 * ========================
 * 1. ✅ MODULAR DESIGN: Broken down into reusable components and custom hooks
 * 2. ✅ SEPARATION OF CONCERNS: Business logic in hooks, UI logic in components
 * 3. ✅ DRY PRINCIPLES: Reusable components and utility functions
 * 4. ✅ ERROR BOUNDARIES: Ready for error boundary integration
 * 5. ✅ TYPE SAFETY: Full TypeScript interfaces throughout
 * 6. ✅ PERFORMANCE OPTIMIZATION: React.memo and useCallback implemented
 * 7. ✅ ENHANCED HOOK INTEGRATION: Form persistence, retry logic, error handling
 *
 * PHASE 1 ENHANCEMENTS IMPLEMENTED:
 * =================================
 * - ✅ Form persistence across browser sessions
 * - ✅ Retry logic with exponential backoff
 * - ✅ Enhanced error handling with Arabic messages
 * - ✅ Field-specific error targeting
 * - ✅ Auto-save functionality
 * - ✅ Retry count indicators for user feedback
 * - ✅ Proper cleanup on navigation
 *
 * #TODO: Add error boundary wrapper component
 * #TODO: Implement accessibility improvements (ARIA labels, keyboard navigation)
 * #TODO: Add comprehensive loading states with progress indicators
 * #TODO: Implement form analytics tracking with conversion metrics
 * #TODO: Add unit tests for component interactions
 * #TODO: Create reusable StepIndicator component
 * #TODO: Add internationalization support for multi-language
 * #TODO: Implement real-time field validation on blur
 * #TODO: Add form data export/import functionality for testing
 * #TODO: Create custom error boundary specifically for signup flow
 * #TODO: Add unit tests for step navigation error scenarios
 * #TODO: Implement accessibility improvements for error announcements (ARIA live regions)
 * #TODO: Add progress indicators showing validation completion per step
 * #TODO: Consider adding confirmation dialog before navigating away with unsaved changes
 */

import React, { useState, useCallback, useMemo } from "react";
import { Card, Steps, Form, message, Button } from "antd";
import { useNavigate } from "react-router";
import {
  UserOutlined,
  ShopOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";

// Import modular components
import CompanyInfoStep from "./company-signup/CompanyInfoStep";
import AdminInfoStep from "./company-signup/AdminInfoStep";
import CompletionStep from "./company-signup/CompletionStep";
import SubscriptionModal from "./SubscriptionModal";
import ValidationErrorDisplay, {
  ValidationError,
} from "./common/ValidationErrorDisplay";

// Import enhanced hook and types
import { useCompanySignup, CompanyFormValues } from "../hooks/useCompanySignup";
import { useStepValidation } from "../utils/stepValidation";

const { Step } = Steps;

/**
 * Main Company Signup Form Component with Enhanced Hook Integration
 *
 * Now uses the enhanced useCompanySignup hook for:
 * - Form persistence across sessions
 * - Retry logic with exponential backoff
 * - Better error handling and categorization
 * - Automatic form state management
 */
const CompanySignupForm: React.FC = () => {
  const [form] = Form.useForm<CompanyFormValues>();
  const navigate = useNavigate();

  // Local state for UI management
  const [currentStep, setCurrentStep] = useState(0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [validationError, setValidationError] =
    useState<ValidationError | null>(null);

  // Store step-specific errors to ensure they persist across step changes
  const [stepErrors, setStepErrors] = useState<
    Record<number, ValidationError | null>
  >({});

  // Effect to show step-specific errors when step changes
  React.useEffect(() => {
    const stepError = stepErrors[currentStep];
    if (stepError) {
      setValidationError(stepError);
      // Clear the step error after showing it to prevent re-showing
      setStepErrors((prev) => ({ ...prev, [currentStep]: null }));
    }
  }, [currentStep, stepErrors]);

  // Enhanced hook integration with form persistence and retry logic
  const {
    loading,
    validationLoading,
    companyCreated,
    retryCount,
    validateWithBackendStructured,
    createCompany,
    handleFormChange,
    clearSavedFormData,
  } = useCompanySignup({
    form,
    onFormChange: (values) => {
      console.log("Form auto-saved:", Object.keys(values));
      // Clear validation error when form changes
      setValidationError(null);
    },
    autoSave: true,
  });

  // Step validation utilities
  const { validateStep } = useStepValidation();

  // Step configuration - memoized for performance
  const steps = useMemo(
    () => [
      {
        title: "معلومات الشركة",
        description: "تفاصيل عن وكالة السيارات",
        icon: <ShopOutlined />,
      },
      {
        title: "معلومات المسؤول",
        description: "بيانات المسؤول الرئيسي",
        icon: <UserOutlined />,
      },
      {
        title: "اكتمال التسجيل",
        description: "المراجعة النهائية والاشتراك",
        icon: <CreditCardOutlined />,
      },
    ],
    []
  );

  /**
   * Handle step navigation with enhanced validation using modular utilities
   */
  const handleNextStep = useCallback(async () => {
    try {
      // Clear any previous validation errors
      setValidationError(null);

      if (currentStep === 0) {
        // Step 0: Validate company information using utility
        const result = await validateStep(currentStep, form);

        if (result.success) {
          setCurrentStep(1);
        } else {
          setValidationError({
            message: result.error || "خطأ في التحقق من بيانات الشركة",
            code: "VALIDATION_ERROR",
          });
        }
      } else if (currentStep === 1) {
        // Step 1: Validate admin information with backend
        const result = await validateStep(
          currentStep,
          form,
          validateWithBackendStructured
        );

        if (result.success) {
          setCurrentStep(2);
        } else {
          // Check if we need to navigate to a different step due to field error
          if (
            result.targetStep !== undefined &&
            result.targetStep !== currentStep
          ) {
            // Store the error for the target step
            const errorToStore = result.validationError || {
              message: result.error || "خطأ في التحقق من البيانات",
              code: "VALIDATION_ERROR",
            };
            console.log(
              "Storing error for step:",
              result.targetStep,
              errorToStore
            );

            setStepErrors((prev) => ({
              ...prev,
              [result.targetStep!]: errorToStore,
            }));
            message.error(
              `خطأ في التحقق من البيانات. الرجاء مراجعة الخطوة ${
                errorToStore.message ? `: ${errorToStore.message}` : ""
              }`
            );

            // Navigate to the target step
            setCurrentStep(result.targetStep);
          } else {
            // Error is for the current step
            setValidationError(
              result.validationError || {
                message: result.error || "خطأ في التحقق من بيانات المسؤول",
                code: "VALIDATION_ERROR",
              }
            );
          }
        }
      } else if (currentStep === 2) {
        // Step 2: Create company using enhanced hook
        const result = await createCompany();
        if (result.success) {
          setShowSubscriptionModal(true);
        } else {
          setValidationError({
            message: "فشل إنشاء حساب الشركة. يرجى المحاولة مرة أخرى",
            code: "INTERNAL_ERROR",
          });
        }
      }
    } catch (error) {
      console.error("Step validation failed:", error);
      setValidationError({
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء التحقق من الخطوة الحالية",
        code: "VALIDATION_ERROR",
      });
    }
  }, [
    currentStep,
    form,
    validateStep,
    validateWithBackendStructured,
    createCompany,
    setValidationError,
    setStepErrors,
  ]);

  /**
   * Handle previous step
   */
  const handlePrevStep = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
    // Clear current validation error when navigating backwards
    setValidationError(null);
  }, []);
  /**
   * Handle subscription success
   */
  const handleSubscriptionSuccess = useCallback(() => {
    setShowSubscriptionModal(false);
    clearSavedFormData(); // Clear saved data after successful completion
    message.success(
      "تم تفعيل اشتراك الشركة بنجاح! مرحباً بك في منصة Cars Bids"
    );
    navigate("/profile");
  }, [navigate, clearSavedFormData]);

  /**
   * Handle subscription modal close
   */
  const handleSubscriptionModalClose = useCallback(() => {
    if (companyCreated) {
      message.warning(
        "تم إنشاء حساب الشركة ولكن لم يتم تفعيل الاشتراك. يمكنك تفعيله لاحقاً من إعدادات الحساب"
      );
      clearSavedFormData(); // Clear saved data when navigating away
      navigate("/profile");
    } else {
      setShowSubscriptionModal(false);
    }
  }, [companyCreated, navigate, clearSavedFormData]);
  /**
   * Render current step content
   */
  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 0:
        return <CompanyInfoStep />;
      case 1:
        return <AdminInfoStep form={form} />;
      case 2:
        return <CompletionStep />;
      default:
        return null;
    }
  }, [currentStep, form]);

  /**
   * Render navigation buttons with enhanced step-specific labels
   */
  const renderNavigation = useCallback(() => {
    const getNextButtonText = () => {
      switch (currentStep) {
        case 0:
          return "التالي: معلومات المسؤول";
        case 1:
          return "التالي: المراجعة النهائية";
        case 2:
          return "إنشاء الحساب";
        default:
          return "التالي";
      }
    };

    const getNextButtonLoadingText = () => {
      switch (currentStep) {
        case 1:
          return "جاري التحقق من البيانات...";
        case 2:
          return "جاري إنشاء الحساب...";
        default:
          return "جاري المعالجة...";
      }
    };

    return (
      <div className="flex justify-between pt-6 border-t">
        {currentStep > 0 && (
          <Button
            size="large"
            onClick={handlePrevStep}
            disabled={loading || validationLoading}
          >
            السابق
          </Button>
        )}
        <div className="mr-auto">
          {currentStep < steps.length - 1 ? (
            <Button
              type="primary"
              size="large"
              onClick={handleNextStep}
              loading={validationLoading || loading}
            >
              {validationLoading || loading
                ? getNextButtonLoadingText()
                : getNextButtonText()}
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              onClick={handleNextStep}
              loading={loading}
            >
              {loading ? getNextButtonLoadingText() : getNextButtonText()}
            </Button>
          )}
        </div>
      </div>
    );
  }, [
    currentStep,
    steps.length,
    handlePrevStep,
    handleNextStep,
    loading,
    validationLoading,
  ]);

  return (
    <Card className="w-full max-w-4xl shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          إنشاء حساب وكالة سيارات
        </h1>
        <p className="text-center text-gray-400">
          انضم إلى شبكة وكلاء السيارات المعتمدين
        </p>
      </div>

      {/* Steps Indicator */}
      <Steps current={currentStep} className="mb-8" direction="horizontal">
        {steps.map((step, index) => (
          <Step
            key={index}
            title={step.title}
            description={step.description}
            icon={step.icon}
          />
        ))}
      </Steps>

      {/* Retry Indicator */}
      {retryCount > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            🔄 محاولة رقم {retryCount} - جاري إعادة المحاولة...
          </p>
        </div>
      )}

      {/* Validation Error Display */}
      <ValidationErrorDisplay
        error={validationError}
        showFieldInfo={import.meta.env.DEV}
      />

      {/* Form Content */}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
        className="space-y-4"
        scrollToFirstError={{ behavior: "instant", block: "end", focus: true }}
      >
        {/* Dynamic Step Content */}
        {renderStepContent()}

        {/* Navigation Controls */}
        {renderNavigation()}
      </Form>

      {/* Individual Account Link */}
      <div className="text-center mt-8 pt-6 border-t border-gray-200">
        <p className="text-gray-500 text-sm">
          هل تريد إنشاء حساب شخصي بدلاً من ذلك؟{" "}
          <Button
            type="link"
            onClick={() => navigate("/signup")}
            className="p-0 text-blue-500 hover:text-blue-600"
          >
            إنشاء حساب شخصي
          </Button>
        </p>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        open={showSubscriptionModal}
        onClose={handleSubscriptionModalClose}
        onSubscriptionSuccess={handleSubscriptionSuccess}
        requiredFeature={`اشتراك الشركة - ${
          form.getFieldValue("companyName") || "شركتك"
        }`}
      />
    </Card>
  );
};

export default CompanySignupForm;
