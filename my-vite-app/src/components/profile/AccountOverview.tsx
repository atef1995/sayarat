import React from "react";
import { Card, Row, Col, Descriptions, Space, Tag, Badge, Alert } from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { SubscriptionCheckResponse } from "../../types/subscription.types";
import { User } from "../../types/api.types";
import FeaturesList from "./FeaturesList";

/**
 * Account Overview Component with Unified Account System Support
 *
 * Features:
 * - Enhanced account type display using unified account detection
 * - Company information display when available
 * - Account type badges with improved visual indicators
 * - Subscription status with account-type-aware features
 *
 * #TODO: Add account type switching quick action
 * #TODO: Add company-specific metrics for company accounts
 * #TODO: Implement account type change notifications
 */

interface AccountOverviewProps {
  subscriptionData: SubscriptionCheckResponse | null;
  userDetails: User | null; // Keep for future extensibility
}

const AccountOverview: React.FC<AccountOverviewProps> = ({
  subscriptionData,
  // userDetails - available for future use
}) => {
  console.log("Rendering AccountOverview with subscriptionData:", {
    hasSubscription: !!subscriptionData?.subscription,
    hasActiveSubscription: subscriptionData?.hasActiveSubscription,
    planDisplayName: subscriptionData?.subscription?.planDisplayName,
    subscriptionStatus: subscriptionData?.subscription?.status,
    featuresCount: subscriptionData?.features
      ? Object.keys(subscriptionData.features).length
      : 0,
  });

  const getSubscriptionStatus = () => {
    if (subscriptionData?.hasActiveSubscription) {
      return <Badge status="success" text="نشط" />;
    }
    return <Badge status="default" text="غير مفعل" />;
  };

  const getPlanDisplayName = () => {
    if (!subscriptionData?.subscription) return "غير محدد";

    // Handle both flattened and nested structures
    return (
      subscriptionData.subscription.planDisplayName ||
      subscriptionData.subscription.plan?.displayName ||
      subscriptionData.subscription.planName ||
      "غير محدد"
    );
  };
  const formatSubscriptionDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "تاريخ غير صحيح";
      }
      return date.toLocaleDateString("ar-SY");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "تاريخ غير صحيح";
    }
  };
  // Get account type from unified subscription data
  const getAccountTypeDisplay = () => {
    const accountType = subscriptionData?.accountType;
    const isCompany = accountType === "company";
    const companyInfo = subscriptionData?.company;

    if (isCompany) {
      return (
        <Space direction="vertical" size={4}>
          <Tag color="gold" icon={<ShopOutlined />}>
            حساب شركة
          </Tag>
          {companyInfo && (
            <div className="text-sm text-gray-600">
              <strong>{companyInfo.name}</strong>
              {companyInfo.isVerified && (
                <Badge
                  dot
                  status="success"
                  className="ml-2"
                  title="شركة موثقة"
                />
              )}
            </div>
          )}
        </Space>
      );
    }

    return (
      <Tag color="blue" icon={<UserOutlined />}>
        حساب شخصي
      </Tag>
    );
  };

  // #TODO: Add loading state handling
  // #TODO: Add error boundary for better error handling
  // #TODO: Consider memoizing expensive calculations
  return (
    <Row gutter={[16, 16]}>
      {/* Cancellation Alert */}
      {subscriptionData?.subscription?.cancelAtPeriodEnd && (
        <Col xs={24}>
          <Alert
            message="تنبيه: الاشتراك مجدول للإلغاء"
            description={`سيتم إلغاء اشتراكك في ${formatSubscriptionDate(
              subscriptionData.subscription.currentPeriodEnd
            )}. يمكنك إعادة تفعيل الاشتراك من صفحة إدارة الاشتراك.`}
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            className="mb-4"
          />
        </Col>
      )}

      <Col xs={24} lg={16}>
        <Card title="معلومات الحساب" className="h-full">
          <Descriptions column={1} size="middle">
            <Descriptions.Item label="نوع الحساب">
              {getAccountTypeDisplay()}
            </Descriptions.Item>
            <Descriptions.Item label="حالة الاشتراك">
              {getSubscriptionStatus()}
            </Descriptions.Item>
            {subscriptionData?.subscription && (
              <>
                <Descriptions.Item label="الخطة الحالية">
                  <Tag color="blue">{getPlanDisplayName()}</Tag>
                </Descriptions.Item>
                {subscriptionData.subscription.currentPeriodEnd && (
                  <Descriptions.Item label="تاريخ انتهاء الاشتراك">
                    <CalendarOutlined className="mr-1" />
                    {formatSubscriptionDate(
                      subscriptionData.subscription.currentPeriodEnd
                    )}
                  </Descriptions.Item>
                )}{" "}
                {subscriptionData.subscription.status && (
                  <Descriptions.Item label="حالة الاشتراك التفصيلية">
                    <Tag
                      color={
                        subscriptionData.subscription.status === "active"
                          ? "green"
                          : "orange"
                      }
                    >
                      {subscriptionData.subscription.status === "active"
                        ? "نشط"
                        : subscriptionData.subscription.status === "canceled"
                        ? "ملغى"
                        : subscriptionData.subscription.status === "past_due"
                        ? "متأخر"
                        : subscriptionData.subscription.status}
                    </Tag>
                  </Descriptions.Item>
                )}
                {subscriptionData.subscription.cancelAtPeriodEnd && (
                  <Descriptions.Item label="حالة الإلغاء">
                    <Tag color="orange">مجدول للإلغاء في نهاية الفترة</Tag>
                  </Descriptions.Item>
                )}
              </>
            )}
          </Descriptions>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        {" "}
        <Card title="المميزات المتاحة" className="h-full">
          {subscriptionData?.features ? (
            <FeaturesList features={subscriptionData.features} />
          ) : (
            <div className="text-center py-8">
              <span className="text-gray-500">
                {subscriptionData === null
                  ? "جاري تحميل البيانات..."
                  : "لا توجد بيانات متاحة"}
              </span>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default React.memo(AccountOverview);
