import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { Form, Button, Card, Alert, message } from "antd";
import { useListingCreation } from "../hooks/useListingCreation";
import { useSubscription } from "../hooks/useSubscription";
import { CreateListing } from "../types";
import { PaymentState } from "../types/payment";

interface CreateListingContainerProps {
  initialValues?: CreateListing;
  paymentState: PaymentState;
}

const CreateListingContainer: React.FC<CreateListingContainerProps> = ({
  initialValues,
  paymentState,
}) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Payment state destructuring
  const { items, hasSelectedProducts, handlePayment } = paymentState;

  // Subscription system
  const { isAuthenticated, subscriptionData } = useSubscription();

  // Derived subscription state
  const needsSubscription = !subscriptionData?.hasActiveSubscription;
  const statusMessage = needsSubscription
    ? "يجب ترقية الاشتراك لإنشاء المزيد من الإعلانات"
    : "يمكنك إنشاء الإعلانات";

  // Listing creation with TanStack Query
  const {
    execute: executeListingCreation,
    isLoading,
    isSuccess,
    error,
    reset,
  } = useListingCreation();

  // Show subscription modal when needed
  useEffect(() => {
    if (needsSubscription && !showSubscriptionModal) {
      message.info(statusMessage);
      setShowSubscriptionModal(true);
    }
  }, [needsSubscription, showSubscriptionModal, statusMessage]);

  // Navigate to success page after successful creation
  useEffect(() => {
    if (isSuccess) {
      message.success("تم إنشاء الإعلان بنجاح!");
      // Optional: navigate to listings page or stay on current page
      // navigate("/my-listings");
    }
  }, [isSuccess]);

  // Form submission handler
  const handleSubmit = useCallback(
    async (formValues: CreateListing) => {
      console.log("🚀 Starting form submission...");

      if (!isAuthenticated) {
        message.error("يجب تسجيل الدخول لنشر الإعلانات");
        return;
      }

      if (needsSubscription) {
        message.error("يجب ترقية الاشتراك لإنشاء المزيد من الإعلانات");
        setShowSubscriptionModal(true);
        return;
      }

      try {
        // Create a wrapper for handlePayment to match expected signature
        const paymentWrapper = hasSelectedProducts
          ? async (): Promise<boolean> => {
              const result = await handlePayment();
              return result !== null; // Convert string | null to boolean
            }
          : undefined;

        // Execute the complete listing creation flow
        await executeListingCreation({
          formValues,
          images: imageFiles,
          hasProducts: hasSelectedProducts,
          items,
          handlePayment: paymentWrapper,
        });
      } catch (error) {
        console.error("Form submission failed:", error);
        // Error handling is done by the hook
      }
    },
    [
      isAuthenticated,
      needsSubscription,
      imageFiles,
      hasSelectedProducts,
      items,
      handlePayment,
      executeListingCreation,
    ]
  );

  // Retry handler for failed submissions
  const handleRetry = useCallback(() => {
    const formValues = form.getFieldsValue();
    handleSubmit(formValues);
  }, [form, handleSubmit]);

  // Reset handler
  const handleReset = useCallback(() => {
    form.resetFields();
    setImageFiles([]);
    reset();
  }, [form, reset]);

  // Close subscription modal handler
  const handleCloseSubscriptionModal = useCallback(() => {
    setShowSubscriptionModal(false);
  }, []);

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    return (
      isAuthenticated &&
      !needsSubscription &&
      !isLoading &&
      imageFiles.length > 0
    );
  }, [isAuthenticated, needsSubscription, isLoading, imageFiles.length]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card title="إنشاء إعلان جديد" className="shadow-lg">
        {/* Error Display */}
        {error && (
          <Alert
            type="error"
            message="خطأ في إنشاء الإعلان"
            description={error.message}
            action={
              <Button size="small" onClick={handleRetry}>
                إعادة المحاولة
              </Button>
            }
            className="mb-4"
            closable
            onClose={() => reset()}
          />
        )}

        {/* Success Display */}
        {isSuccess && (
          <Alert
            type="success"
            message="تم إنشاء الإعلان بنجاح!"
            description="سيظهر إعلانك في القائمة قريباً"
            className="mb-4"
            closable
          />
        )}

        {/* Loading state */}
        {isLoading && (
          <Alert
            type="info"
            message="جارٍ إنشاء الإعلان..."
            description="يرجى الانتظار، لا تغلق هذه الصفحة"
            className="mb-4"
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={initialValues}
          disabled={isLoading}
        >
          {/* Basic Car Info */}
          <Card title="معلومات السيارة الأساسية" className="mb-4">
            <Form.Item
              name="title"
              label="عنوان الإعلان"
              rules={[{ required: true, message: "يرجى إدخال عنوان الإعلان" }]}
            >
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="مثال: تويوتا كامري 2020 فل كامل"
              />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="make"
                label="الماركة"
                rules={[{ required: true, message: "يرجى اختيار الماركة" }]}
              >
                <select
                  className="w-full p-3 border border-gray-300 rounded-md"
                  aria-label="اختيار ماركة السيارة"
                >
                  <option value="">اختر الماركة</option>
                  <option value="Toyota">تويوتا</option>
                  <option value="Honda">هوندا</option>
                  <option value="BMW">بي إم دبليو</option>
                  {/* Add more options */}
                </select>
              </Form.Item>

              <Form.Item
                name="model"
                label="الموديل"
                rules={[{ required: true, message: "يرجى إدخال الموديل" }]}
              >
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="مثال: كامري"
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Form.Item
                name="year"
                label="سنة الصنع"
                rules={[{ required: true, message: "يرجى إدخال سنة الصنع" }]}
              >
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="2020"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                />
              </Form.Item>

              <Form.Item
                name="price"
                label="السعر"
                rules={[{ required: true, message: "يرجى إدخال السعر" }]}
              >
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="50000"
                  min="0"
                />
              </Form.Item>

              <Form.Item
                name="currency"
                label="العملة"
                rules={[{ required: true, message: "يرجى اختيار العملة" }]}
              >
                <select
                  className="w-full p-3 border border-gray-300 rounded-md"
                  aria-label="اختيار عملة السعر"
                >
                  <option value="usd">دولار أمريكي</option>
                  <option value="sar">ريال سعودي</option>
                  <option value="aed">درهم إماراتي</option>
                </select>
              </Form.Item>
            </div>

            <Form.Item
              name="description"
              label="وصف السيارة"
              rules={[{ required: true, message: "يرجى إدخال وصف السيارة" }]}
            >
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                placeholder="اكتب وصفاً مفصلاً للسيارة..."
              />
            </Form.Item>
          </Card>

          {/* Image Upload Section */}
          <Card title="صور السيارة" className="mb-4">
            <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-md">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) =>
                  setImageFiles(Array.from(e.target.files || []))
                }
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-800"
              >
                انقر لاختيار الصور
              </label>
              <p className="text-gray-500 mt-2">
                اختر حتى 10 صور عالية الجودة لسيارتك
              </p>
              {imageFiles.length > 0 && (
                <p className="text-green-600 mt-2">
                  تم اختيار {imageFiles.length} صورة
                </p>
              )}
            </div>
          </Card>

          {/* Product Selection (if applicable) */}
          {hasSelectedProducts && (
            <Card title="خدمات إضافية" className="mb-4">
              <Alert
                type="info"
                message={`تم اختيار ${items.length} خدمة إضافية`}
                description="سيتم توجيهك إلى صفحة الدفع بعد إنشاء الإعلان"
                className="mb-4"
              />
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-between items-center pt-6">
            <Button type="default" onClick={handleReset} disabled={isLoading}>
              إعادة تعيين
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              disabled={!canSubmit}
              size="large"
              className="px-8"
            >
              {isLoading ? "جارٍ النشر..." : "نشر الإعلان"}
            </Button>
          </div>
        </Form>
      </Card>

      {/* Subscription Modal (if needed) */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card title="ترقية الاشتراك" className="max-w-md">
            <p className="mb-4">{statusMessage}</p>
            <div className="flex justify-end gap-2">
              <Button onClick={handleCloseSubscriptionModal}>إلغاء</Button>
              <Button type="primary" onClick={() => navigate("/subscription")}>
                ترقية الاشتراك
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CreateListingContainer;
