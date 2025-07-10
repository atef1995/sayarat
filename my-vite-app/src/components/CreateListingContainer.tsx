import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Form, Button, Card, Divider, Alert, message, SelectProps } from "antd";
import { CarOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { CreateListing } from "../types";
import { ListingCreationStep, ListingErrorType } from "../types/listingTypes";
import type { CreateListingContainerProps } from "../types/createListingTypes";
import BasicCarInfoForm from "./forms/BasicCarInfoForm";
import TechnicalSpecsForm from "./forms/TechnicalSpecsForm";
import ImageUploadForm from "./forms/ImageUploadForm";
import ProductSelectionForm from "./forms/ProductSelectionForm";
import AICarAnalysis from "./AICarAnalysis";
import SubscriptionModal from "./SubscriptionModal";
import { ListingCreationSteps } from "./common/ListingCreationSteps";
import { ListingErrorDisplay } from "./common/ListingErrorDisplay";
import { useListingForm } from "../hooks/useListingForm";
import { useImageHandler } from "../hooks/useImageHandler";
import { useAuth } from "../hooks/useAuth";
import { useListingLimits } from "../hooks/useListingLimits";
import { useListingCreation } from "../hooks/useListingCreation";
import { useNavigate } from "react-router";
import type { CarAnalysisResult } from "../services/aiCarAnalysis";
import TextArea from "antd/es/input/TextArea";
import ErrorBoundary from "./common/ErrorBoundary";
import {
  validateFormFields,
  convertImageListToFiles,
  createPaymentWrapper,
  extractFieldChanges,
  canProceedWithSubmission,
  validateRequiredFields,
  validateAndEnsureBackendFields,
  traceFieldValues,
  debugFormFields,
} from "../utils/formValidationUtils";
import { fetchCarModels } from "../api/fetchCars";

/**
 * Enhanced CreateListingContainer with comprehensive validation flow
 *
 * Features:
 * - Step-by-step validation process
 * - Real-time field validation
 * - Comprehensive error handling
 * - Payment integration
 * - Subscription management
 * - Performance optimizations
 */

const CreateListingContainer: React.FC<CreateListingContainerProps> = ({
  initialValues,
  paymentState,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Form and UI state
  const [form] = Form.useForm();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [carModels, setCarModels] = useState<SelectProps["options"]>([]);

  // Listing limits and subscription management
  const {
    status: limitStatus,
    loading: limitLoading,
    needsSubscription,
    statusMessage,
    refreshStatus,
  } = useListingLimits();

  // Form management
  const {
    loading: formLoading,
    imageList,
    setImageList,
    carMakes,
    currency,
    setCurrency,
  } = useListingForm({ initialValues });

  // Image handling
  const imageHandler = useImageHandler({
    initialValues,
    setInitialImagesUrls: () => {}, // Empty function since we're not using it
  });

  // Payment state destructuring
  const {
    products,
    items,
    onProductChange,
    hasSelectedProducts,
    handlePayment,
  } = paymentState;

  // Enhanced listing creation flow
  const {
    // State properties
    currentStep,
    isLoading: creationLoading,
    error: creationError,
    validatedFormData,
    canProceedToPayment,
    canSubmit: canSubmitListing,

    // Action functions
    validateFields,
    executeListingCreation,
    resetValidation,
    clearError,
  } = useListingCreation({
    isAuthenticated,
    needsSubscription,
    hasSelectedProducts,
    items,
    refreshStatus,
  });

  // Create a unified state object for easier access
  const creationState = {
    currentStep,
    isLoading: creationLoading,
    error: creationError,
    validatedFormData,
    canProceedToPayment,
    canSubmit: canSubmitListing,
  };

  // Show subscription modal when needed
  useEffect(() => {
    if (needsSubscription && !showSubscriptionModal) {
      message.info(statusMessage);
      setShowSubscriptionModal(true);
    }
  }, [needsSubscription, statusMessage, showSubscriptionModal]);

  // Handle subscription requirement from creation flow
  useEffect(() => {
    if (creationState.error?.type === ListingErrorType.SUBSCRIPTION_REQUIRED) {
      setShowSubscriptionModal(true);
    }
  }, [creationState.error]);

  // Handle successful listing creation
  useEffect(() => {
    if (creationState.currentStep === ListingCreationStep.SUCCESS) {
      // Navigate to listings or show success page after a delay
      setTimeout(() => {
        navigate("/my-listings");
      }, 2000);
    }
  }, [creationState.currentStep, navigate]);

  const handleMakeChange = useCallback(async () => {
    form.setFieldValue("model", undefined); // Reset model when make changes
    const data = await fetchCarModels(form.getFieldValue("make"));
    console.log("Fetched car models:", data);
    setCarModels(
      data?.map((model) => ({
        label: model,
        value: model,
      }))
    );
  }, []);

  const handleAIAnalysisComplete = useCallback((data: CarAnalysisResult) => {
    console.log("AI analysis completed:", data);
    // #TODO: Update form fields with AI analysis results
    // #TODO: Consider showing analysis results to user for confirmation
  }, []);

  const handleSubscriptionSuccess = useCallback(() => {
    setShowSubscriptionModal(false);
    refreshStatus();
    resetValidation(); // Reset the creation flow
    message.success(
      "تم تفعيل الاشتراك بنجاح! يمكنك الآن إنشاء إعلانات غير محدودة"
    );
  }, [refreshStatus, resetValidation]);

  /**
   * Main form submission handler - uses the orchestrated validation flow
   */
  const onFinish = useCallback(
    async (values?: CreateListing) => {
      clearError();

      try {
        // Validate form fields using utility
        const formValues = await validateFormFields(form, values);
        if (!formValues) {
          return; // Error message already shown by utility
        }

        console.log("Starting enhanced submission flow with values:", {
          formValues,
        });

        // Debug the form fields to trace the issue
        debugFormFields(formValues, currency, "Pre-Enhancement");

        // Add currency from useListingForm state to form values
        const enhancedFormValues = {
          ...formValues,
          currency, // Include currency from useListingForm hook
        };

        // Enhanced validation and field completion
        const backendValidation = validateAndEnsureBackendFields(
          enhancedFormValues,
          currency
        );

        if (!backendValidation.isValid) {
          console.error("Backend validation failed:", backendValidation.errors);
          message.error(
            `خطأ في التحقق من البيانات: ${backendValidation.errors.join(", ")}`
          );
          return;
        }

        // Use the validated and complete data
        const completeFormData = backendValidation.data;

        console.log("Enhanced form values with currency:", completeFormData);
        console.log("Current currency state:", currency);

        // Trace the final form data
        traceFieldValues(completeFormData, "Final Submission Data");

        // Validate required fields before proceeding (legacy check)
        const fieldValidation = validateRequiredFields(
          completeFormData as CreateListing
        );
        if (!fieldValidation.isValid) {
          console.error(
            "Missing required fields:",
            fieldValidation.missingFields
          );
          message.error(
            `الحقول المطلوبة مفقودة: ${fieldValidation.missingFields.join(
              ", "
            )}`
          );
          return;
        }

        // Convert imageList to File objects using utility
        const imageFiles = convertImageListToFiles(imageList);

        // Create payment handler wrapper using utility
        const handlePaymentWrapper = createPaymentWrapper(
          hasSelectedProducts,
          handlePayment
        );

        // Use the orchestrated creation function with complete form data
        const success = await executeListingCreation(
          completeFormData as CreateListing,
          handlePaymentWrapper,
          imageFiles
          // #TODO: Add initialValues parameter when implementing edit functionality
        );

        if (success) {
          console.log("Listing creation completed successfully!");
          // The hook will handle state updates and navigation
        } else {
          console.error("Listing creation failed");
          // Error handling is done by the hook
        }
      } catch (error) {
        console.error("Unexpected error in onFinish:", error);
        message.error("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
      }
    },
    [
      clearError,
      form,
      imageList,
      currency,
      hasSelectedProducts,
      handlePayment,
      executeListingCreation,
    ]
  );

  /**
   * Retry the current step
   */
  const handleRetry = useCallback(() => {
    clearError();
    // Re-trigger form submission
    onFinish();
  }, [clearError, onFinish]);

  /**
   * Handle opening subscription modal
   */
  const handleShowSubscription = useCallback(() => {
    setShowSubscriptionModal(true);
  }, []);

  // Computed values using useMemo for performance optimization
  const isLoading = useMemo(
    () => formLoading || limitLoading || creationState.isLoading,
    [formLoading, limitLoading, creationState.isLoading]
  );

  const canSubmit = useMemo(
    () =>
      canProceedWithSubmission(isAuthenticated, needsSubscription, isLoading),
    [isAuthenticated, needsSubscription, isLoading]
  );

  const showSteps = useMemo(
    () =>
      creationState.currentStep !== ListingCreationStep.FORM_VALIDATION ||
      creationState.isLoading,
    [creationState.currentStep, creationState.isLoading]
  );

  // Real-time field validation handler with performance optimization
  const handleFieldChange = useCallback(
    async (
      changedFields: Array<{ name: string | string[]; value?: unknown }>
    ) => {
      const changedValues = extractFieldChanges(changedFields);

      // Always include currency from state in field validation
      const enhancedChangedValues = {
        ...changedValues,
        currency, // Include currency from useListingForm state
      };

      // Debug the field validation process
      debugFormFields(
        enhancedChangedValues,
        currency,
        "Real-time Field Validation"
      );

      // Only validate if we have meaningful changes
      if (Object.keys(enhancedChangedValues).length > 0) {
        try {
          await validateFields(enhancedChangedValues as Partial<CreateListing>);
        } catch (error) {
          console.error("Real-time validation error:", error);
        }
      }
    },
    [validateFields, currency] // Add currency to dependencies
  );

  return (
    <>
      <div className=" flex flex-col items-center w-full px-2 sm:px-4 lg:px-6 mx-auto my-4 sm:my-8">
        <Card
          className="w-full max-w-4xl mx-auto shadow-lg"
          loading={limitLoading}
        >
          <div className="text-center mb-4 sm:mb-6">
            <CarOutlined className="text-3xl sm:text-4xl text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold mt-2">
              {initialValues ? "تعديل السيارة" : "إضافة سيارة جديدة"}
            </h1>
          </div>

          {/* Listing Limits Alert */}
          {(limitStatus || needsSubscription) && (
            <Alert
              message={statusMessage}
              type={needsSubscription ? "warning" : "info"}
              showIcon
              icon={<InfoCircleOutlined />}
              className="mb-4"
              action={
                needsSubscription ? (
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => setShowSubscriptionModal(true)}
                  >
                    اشترك الآن
                  </Button>
                ) : null
              }
            />
          )}

          {/* Creation Steps Progress */}
          {showSteps && (
            <ListingCreationSteps
              currentStep={creationState.currentStep}
              isLoading={creationState.isLoading}
              hasPayment={hasSelectedProducts}
              className="mb-6"
            />
          )}

          {/* Error Display */}
          {creationState.error && (
            <ListingErrorDisplay
              error={creationState.error}
              onRetry={
                creationState.error.isRetryable ? handleRetry : undefined
              }
              onShowSubscription={
                creationState.error.type ===
                ListingErrorType.SUBSCRIPTION_REQUIRED
                  ? handleShowSubscription
                  : undefined
              }
              className="mb-4"
            />
          )}

          {/* Success State - Hide form when successful */}
          {creationState.currentStep === ListingCreationStep.SUCCESS ? (
            <div className="text-center py-8">
              <div className="text-green-600 mb-4">
                <CarOutlined className="text-5xl" />
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                تم إنشاء الإعلان بنجاح!
              </h2>
              <p className="text-gray-600 mb-4">
                سيتم توجيهك إلى قائمة إعلاناتك خلال ثوانٍ...
              </p>
              <Button type="primary" onClick={() => navigate("/my-listings")}>
                عرض إعلاناتي
              </Button>
            </div>
          ) : (
            /* Main Form - Only show when not successful */
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              disabled={isLoading}
              className="space-y-6"
              onFieldsChange={handleFieldChange}
            >
              {/* AI Analysis */}
              <AICarAnalysis
                form={form}
                onAnalysisComplete={handleAIAnalysisComplete}
                setImageList={setImageList}
              />
              <Divider />

              {/* Basic Car Info */}
              <BasicCarInfoForm
                carMakes={carMakes}
                carModels={carModels}
                setCurrency={setCurrency}
                onMakeChange={handleMakeChange}
              />

              {/* Technical Specifications */}
              <TechnicalSpecsForm />

              <Form.Item
                name="description"
                label="وصف السيارة"
                rules={[
                  { required: true, message: "يرجى إدخال وصف السيارة" },
                  { max: 850, message: "الوصف يجب أن لا يتجاوز 500 حرف" },
                ]}
                className="mb-4"
              >
                <TextArea
                  rows={7}
                  placeholder="أدخل وصفًا تفصيليًا للسيارة"
                  maxLength={850}
                  showCount
                />
              </Form.Item>

              <Divider />

              {/* Image Upload */}
              <ImageUploadForm
                imageList={imageList}
                setImageList={setImageList}
                imageUploading={imageHandler.imageUploading}
                previewOpen={imageHandler.previewOpen}
                imageUrl={imageHandler.imageUrl}
                beforeUpload={imageHandler.beforeUpload}
                handleImageChange={imageHandler.handleImageChange}
                handlePreview={imageHandler.handlePreview}
                handleCancel={imageHandler.handleCancel}
                deleteImage={imageHandler.deleteImage}
                customRequest={imageHandler.customRequest}
              />

              <Divider />

              {/* Product Selection */}
              <ProductSelectionForm
                products={products}
                onProductChange={onProductChange}
              />

              {/* Submit Button */}
              <div className="text-center pt-6">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={isLoading}
                  disabled={!canSubmit}
                  className="px-8 py-2 h-auto"
                >
                  {isLoading
                    ? "جاري المعالجة..."
                    : initialValues
                    ? "تحديث الإعلان"
                    : "إنشاء الإعلان"}
                </Button>

                {!isAuthenticated && (
                  <p className="text-sm text-gray-500 mt-2">
                    يجب تسجيل الدخول لنشر الإعلانات
                  </p>
                )}
              </div>
            </Form>
          )}
        </Card>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        open={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />
    </>
  );
};

// Enhanced export with error boundary for better error handling
const CreateListingContainerWithErrorBoundary: React.FC<
  CreateListingContainerProps
> = (props) => (
  <ErrorBoundary>
    <CreateListingContainer {...props} />
  </ErrorBoundary>
);

export default CreateListingContainerWithErrorBoundary;
