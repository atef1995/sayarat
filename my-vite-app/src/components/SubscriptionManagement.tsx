import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Badge,
  Descriptions,
  Alert,
  Modal,
  message,
  Spin,
  Divider,
  Typography,
  Tag,
  Space,
} from "antd";
import {
  CrownOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { SubscriptionService } from "../services/subscriptionService";
import {
  UserSubscription,
  SubscriptionFeatures,
  SubscriptionCheckResponse,
} from "../types/subscription.types";
import SubscriptionModal from "./SubscriptionModal";

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

/**
 * SubscriptionManagement Component
 *
 * CURRENT STATE: Refactored to use shared SubscriptionModal and fixed backend data mismatches
 *
 * RECENT FIXES:
 * =============
 * - Fixed backend subscription database service to properly join with subscription_plans table
 * - Added missing subscription plan for price_1RbhnwPIR1o3pZmObQQrJgs2
 * - Synced subscription period dates from Stripe to database
 * - Enhanced date formatting to handle null/undefined values
 * - Improved plan name fallback logic for better UX
 *
 * #TODO: Add comprehensive error boundary for better error handling
 * #TODO: Implement retry logic for failed API calls with exponential backoff
 * #TODO: Add offline detection and proper offline state handling
 * #TODO: Add skeleton loading states for better perceived performance
 * #TODO: Implement subscription renewal reminders and notifications
 * #TODO: Add subscription analytics dashboard integration
 * #TODO: Consider adding subscription usage tracking (API calls, features used, etc.)
 * #TODO: Add accessibility improvements (ARIA labels, keyboard navigation)
 * #TODO: Implement subscription trial extension functionality
 * #TODO: Add subscription downgrade/upgrade preview with cost calculations
 */
const SubscriptionManagement = () => {
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionCheckResponse | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // Helper function to get plan display name from subscription
  const getSubscriptionPlanName = (subscription?: UserSubscription) => {
    if (!subscription) return "غير محدد";

    // Handle both flattened and nested structures
    return (
      subscription.planDisplayName ||
      subscription.plan?.displayName ||
      subscription.planName ||
      subscription.plan?.name ||
      "خطة مميزة" // fallback for active subscriptions
    );
  };
  // Helper function to format subscription dates
  const formatSubscriptionDate = (
    dateString: string | Date | null | undefined
  ) => {
    try {
      if (!dateString) {
        return "غير محدد";
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "تاريخ غير صحيح";
      }

      return date.toLocaleDateString("ar-SY", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "تاريخ غير صحيح";
    }
  };

  // Handle subscription success from SubscriptionModal
  const handleSubscriptionSuccess = () => {
    setShowUpgradeModal(false);
    loadSubscriptionData(); // Refresh the subscription data
    message.success("تم تفعيل الاشتراك بنجاح!");
  };

  // #TODO: Add loading state management
  // #TODO: Add error boundary for better error handling
  // #TODO: Consider implementing retry logic for failed API calls

  useEffect(() => {
    loadSubscriptionData();
  }, []);
  const loadSubscriptionData = async () => {
    setLoading(true);

    try {
      const subscriptionResponse =
        await SubscriptionService.checkSubscription();

      setSubscriptionData(subscriptionResponse);
      console.log("Subscription data loaded:", {
        hasSubscription: !!subscriptionResponse?.subscription,
        hasActiveSubscription: subscriptionResponse?.hasActiveSubscription,
        planDisplayName: subscriptionResponse?.subscription?.planDisplayName,
        planName: subscriptionResponse?.subscription?.planName,
        subscriptionStatus: subscriptionResponse?.subscription?.status,
        currentPeriodStart:
          subscriptionResponse?.subscription?.currentPeriodStart,
        currentPeriodEnd: subscriptionResponse?.subscription?.currentPeriodEnd,
        featuresCount: subscriptionResponse?.features
          ? Object.keys(subscriptionResponse.features).length
          : 0,
      });
    } catch (error) {
      console.error("Error loading subscription data:", error);
      message.error("فشل في تحميل بيانات الاشتراك");

      // #TODO: Implement retry logic
      // #TODO: Add offline detection and handling
    } finally {
      setLoading(false);
    }
  };
  const handleCancelSubscription = () => {
    confirm({
      title: "إلغاء الاشتراك",
      content:
        "هل أنت متأكد من إلغاء اشتراكك؟ ستفقد جميع المميزات المدفوعة في نهاية الفترة الحالية.",
      okText: "نعم، إلغاء الاشتراك",
      cancelText: "إلغاء",
      okType: "danger",
      onOk: async () => {
        setActionLoading(true);
        try {
          const response = await SubscriptionService.cancelSubscription();
          if (response.success) {
            message.success("تم إلغاء الاشتراك بنجاح");
            loadSubscriptionData();
          } else {
            message.error(response.error || "فشل في إلغاء الاشتراك");
          }
        } catch (error) {
          console.error("Error canceling subscription:", error);
          message.error("حدث خطأ أثناء إلغاء الاشتراك");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReactivateSubscription = () => {
    confirm({
      title: "إعادة تفعيل الاشتراك",
      content:
        "هل تريد إعادة تفعيل اشتراكك؟ سيتم استمرار الاشتراك تلقائياً في نهاية الفترة الحالية.",
      okText: "نعم، إعادة التفعيل",
      cancelText: "إلغاء",
      okType: "primary",
      onOk: async () => {
        setActionLoading(true);
        try {
          const response = await SubscriptionService.reactivateSubscription();
          if (response.success) {
            message.success("تم إعادة تفعيل الاشتراك بنجاح");
            loadSubscriptionData();
          } else {
            message.error(response.error || "فشل في إعادة تفعيل الاشتراك");
          }
        } catch (error) {
          console.error("Error reactivating subscription:", error);
          message.error("حدث خطأ أثناء إعادة تفعيل الاشتراك");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };
  const getStatusBadge = (subscription?: UserSubscription) => {
    if (!subscription) {
      return <Badge status="default" text="غير مفعل" />;
    }

    // Check if subscription is scheduled for cancellation
    if (subscription.cancelAtPeriodEnd && subscription.status === "active") {
      return <Badge status="warning" text="سيتم إلغاؤه" />;
    }

    switch (subscription.status) {
      case "active":
        return <Badge status="success" text="نشط" />;
      case "canceled":
        return <Badge status="error" text="ملغي" />;
      case "past_due":
        return <Badge status="error" text="متأخر الدفع" />;
      case "unpaid":
        return <Badge status="error" text="غير مدفوع" />;
      case "incomplete":
        return <Badge status="warning" text="غير مكتمل" />;
      default:
        return <Badge status="default" text="غير معروف" />;
    }
  };
  const FeaturesList = ({ features }: { features: SubscriptionFeatures }) => (
    <div className="space-y-2">
      {Object.entries({
        aiCarAnalysis: "تحليل السيارات بالذكاء الاصطناعي",
        listingHighlights: "تمييز الإعلانات",
        prioritySupport: "دعم فني مميز",
        advancedAnalytics: "إحصائيات متقدمة",
        unlimitedListings: "إعلانات غير محدودة",
      }).map(([key, label]) => (
        <div key={key} className="flex items-center gap-2">
          {features[key as keyof SubscriptionFeatures] ? (
            <CheckCircleOutlined className="text-green-500" />
          ) : (
            <CloseCircleOutlined className="text-red-500" />
          )}
          <span>{label}</span>
        </div>
      ))}
      {features.customBranding && (
        <div className="flex items-center gap-2">
          <CheckCircleOutlined className="text-green-500" />
          <span>علامة تجارية مخصصة</span>
        </div>
      )}
      {features.teamMembers && features.teamMembers > 0 && (
        <div className="flex items-center gap-2">
          <CheckCircleOutlined className="text-green-500" />
          <span>أعضاء الفريق: {features.teamMembers}</span>
        </div>
      )}
    </div>
  );
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Text type="secondary">جاري تحميل بيانات الاشتراك...</Text>
          </div>
        </div>
      </div>
    );
  }

  // #TODO: Add error state handling
  // #TODO: Add empty state handling
  if (!subscriptionData) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <Alert
            message="فشل في تحميل البيانات"
            description="حدث خطأ أثناء تحميل بيانات الاشتراك"
            type="error"
            action={
              <Button size="small" onClick={loadSubscriptionData}>
                إعادة المحاولة
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Title level={2}>
          <CrownOutlined className="mr-2" />
          إدارة الاشتراك
        </Title>
        <Paragraph type="secondary">
          اعرض وأدر تفاصيل اشتراكك وخططك المتاحة
        </Paragraph>
      </div>
      <Row gutter={[24, 24]}>
        {/* Current Subscription Card */}
        <Col xs={24} lg={12}>
          <Card
            title="الاشتراك الحالي"
            extra={getStatusBadge(subscriptionData?.subscription)}
            className="h-full"
          >
            {subscriptionData?.subscription ? (
              <div>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="الخطة">
                    <Tag color="blue">
                      {getSubscriptionPlanName(subscriptionData.subscription)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="السعر">
                    {subscriptionData.subscription.price}{" "}
                    {subscriptionData.subscription.currency}
                  </Descriptions.Item>
                  <Descriptions.Item label="تاريخ البداية">
                    <CalendarOutlined className="mr-1" />
                    {formatSubscriptionDate(
                      subscriptionData.subscription.currentPeriodStart
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="تاريخ النهاية">
                    <CalendarOutlined className="mr-1" />
                    {formatSubscriptionDate(
                      subscriptionData.subscription.currentPeriodEnd
                    )}
                  </Descriptions.Item>
                  {subscriptionData.subscription.canceledAt && (
                    <Descriptions.Item label="تاريخ الإلغاء">
                      <Text type="warning">
                        {formatSubscriptionDate(
                          subscriptionData.subscription.canceledAt
                        )}
                      </Text>
                    </Descriptions.Item>
                  )}
                  {subscriptionData.subscription.cancelAtPeriodEnd && (
                    <Descriptions.Item label="حالة الإلغاء">
                      <Text type="warning">
                        سيتم إلغاء الاشتراك في نهاية الفترة الحالية
                      </Text>
                    </Descriptions.Item>
                  )}
                  {subscriptionData.subscription.cancellationReason && (
                    <Descriptions.Item label="سبب الإلغاء">
                      <Text type="secondary">
                        {subscriptionData.subscription.cancellationReason}
                      </Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
                {/* Cancellation Alert */}
                {subscriptionData.subscription.cancelAtPeriodEnd && (
                  <Alert
                    message="تنبيه: الاشتراك مجدول للإلغاء"
                    description={`سيتم إلغاء اشتراكك في ${formatSubscriptionDate(
                      subscriptionData.subscription.currentPeriodEnd
                    )}. يمكنك إعادة تفعيل الاشتراك في أي وقت قبل هذا التاريخ.`}
                    type="warning"
                    showIcon
                    className="mb-4"
                  />
                )}
                <Divider />
                <Space wrap>
                  {subscriptionData.subscription.status === "active" &&
                    !subscriptionData.subscription.cancelAtPeriodEnd && (
                      <Button
                        type="primary"
                        danger
                        icon={<ExclamationCircleOutlined />}
                        onClick={handleCancelSubscription}
                        loading={actionLoading}
                      >
                        إلغاء الاشتراك
                      </Button>
                    )}
                  {subscriptionData.subscription.cancelAtPeriodEnd && (
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={handleReactivateSubscription}
                      loading={actionLoading}
                    >
                      إعادة تفعيل الاشتراك
                    </Button>
                  )}
                  <Button
                    type="default"
                    icon={<SettingOutlined />}
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    تغيير الخطة
                  </Button>
                </Space>
              </div>
            ) : (
              <div className="text-center py-8">
                <ExclamationCircleOutlined className="text-4xl text-gray-400 mb-4" />
                <Title level={4} type="secondary">
                  لا يوجد اشتراك نشط
                </Title>
                <Paragraph type="secondary">
                  اشترك الآن للاستفادة من جميع المميزات المتقدمة
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  icon={<CrownOutlined />}
                  onClick={() => setShowUpgradeModal(true)}
                >
                  اشترك الآن
                </Button>
              </div>
            )}
          </Card>
        </Col>

        {/* Features Card */}
        <Col xs={24} lg={12}>
          <Card title="المميزات المتاحة" className="h-full">
            {subscriptionData?.features ? (
              <FeaturesList features={subscriptionData.features} />
            ) : (
              <div className="text-center py-8">
                <Text type="secondary">لا توجد بيانات متاحة</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Account Type Alert */}
        <Col xs={24}>
          {subscriptionData?.isCompany && (
            <Alert
              message="حساب شركة"
              description="أنت تستخدم حساب شركة مع مميزات إضافية لإدارة الفريق والعلامة التجارية."
              type="info"
              icon={<CrownOutlined />}
              showIcon
            />
          )}
        </Col>
      </Row>
      {/* Subscription Modal */}
      <SubscriptionModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSubscriptionSuccess={handleSubscriptionSuccess}
        requiredFeature="إدارة الاشتراك المتقدمة"
      />
    </div>
  );
};

export default React.memo(SubscriptionManagement);
