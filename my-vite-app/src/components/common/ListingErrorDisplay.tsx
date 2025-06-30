import React from "react";
import { Alert, Button, Space } from "antd";
import {
  ExclamationCircleOutlined,
  ReloadOutlined,
  CreditCardOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  ListingCreationError,
  ListingErrorType,
} from "../../types/listingTypes";

interface ListingErrorDisplayProps {
  error: ListingCreationError;
  onRetry?: () => void;
  onShowSubscription?: () => void;
  className?: string;
}

const errorConfig = {
  [ListingErrorType.FORM_VALIDATION]: {
    type: "error" as const,
    icon: <ExclamationCircleOutlined />,
    title: "خطأ في النموذج",
  },
  [ListingErrorType.BACKEND_VALIDATION]: {
    type: "error" as const,
    icon: <ExclamationCircleOutlined />,
    title: "خطأ في التحقق من البيانات",
  },
  [ListingErrorType.AUTHENTICATION]: {
    type: "warning" as const,
    icon: <InfoCircleOutlined />,
    title: "يجب تسجيل الدخول",
  },
  [ListingErrorType.SUBSCRIPTION_REQUIRED]: {
    type: "info" as const,
    icon: <CreditCardOutlined />,
    title: "مطلوب ترقية الاشتراك",
  },
  [ListingErrorType.PAYMENT_FAILED]: {
    type: "error" as const,
    icon: <ExclamationCircleOutlined />,
    title: "فشل في الدفع",
  },
  [ListingErrorType.SUBMISSION_FAILED]: {
    type: "error" as const,
    icon: <ExclamationCircleOutlined />,
    title: "فشل في إنشاء الإعلان",
  },
  [ListingErrorType.NETWORK_ERROR]: {
    type: "error" as const,
    icon: <ExclamationCircleOutlined />,
    title: "خطأ في الاتصال",
  },
  [ListingErrorType.UNKNOWN]: {
    type: "error" as const,
    icon: <ExclamationCircleOutlined />,
    title: "خطأ غير معروف",
  },
};

export const ListingErrorDisplay: React.FC<ListingErrorDisplayProps> = ({
  error,
  onRetry,
  onShowSubscription,
  className = "",
}) => {
  const config = errorConfig[error.type];

  const getActionButtons = () => {
    const buttons = [];

    // Show subscription button for subscription errors
    if (
      error.type === ListingErrorType.SUBSCRIPTION_REQUIRED &&
      onShowSubscription
    ) {
      buttons.push(
        <Button
          key="subscription"
          type="primary"
          icon={<CreditCardOutlined />}
          onClick={onShowSubscription}
          size="small"
        >
          اشترك الآن
        </Button>
      );
    }

    // Show retry button for retryable errors
    if (error.isRetryable && onRetry) {
      buttons.push(
        <Button
          key="retry"
          type="default"
          icon={<ReloadOutlined />}
          onClick={onRetry}
          size="small"
        >
          إعادة المحاولة
        </Button>
      );
    }

    return buttons.length > 0 ? <Space>{buttons}</Space> : null;
  };

  return (
    <Alert
      type={config.type}
      showIcon
      icon={config.icon}
      message={config.title}
      description={error.message}
      action={getActionButtons()}
      className={className}
      closable={false}
    />
  );
};
