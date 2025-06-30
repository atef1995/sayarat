/**
 * ValidationErrorDisplay Component
 *
 * A reusable component for displaying validation errors with enhanced UX
 * Follows modular architecture and DRY principles
 */

import React from "react";
import { Alert, Typography } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

export interface ValidationError {
  field?: string;
  message: string;
  code?: string;
}

interface ValidationErrorDisplayProps {
  error: ValidationError | null;
  className?: string;
  showFieldInfo?: boolean;
}

/**
 * Component to display validation errors with enhanced styling and information
 *
 * @param error - The validation error object
 * @param className - Additional CSS classes
 * @param showFieldInfo - Whether to show field information for debugging
 */
export const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  error,
  className = "",
  showFieldInfo = false,
}) => {
  if (!error) return null;

  const getErrorType = (code?: string): "error" | "warning" => {
    switch (code) {
      case "COMPANY_EXISTS":
      case "USER_EXISTS":
        return "warning";
      default:
        return "error";
    }
  };

  const getErrorTitle = (code?: string): string => {
    switch (code) {
      case "COMPANY_EXISTS":
        return "اسم الشركة مستخدم";
      case "USER_EXISTS":
        return "البيانات موجودة مسبقاً";
      case "VALIDATION_ERROR":
        return "خطأ في البيانات";
      case "SCHEMA_ERROR":
        return "خطأ في النظام";
      case "INTERNAL_ERROR":
        return "خطأ داخلي";
      default:
        return "خطأ في التحقق";
    }
  };

  return (
    <div className={`validation-error-display ${className}`}>
      <Alert
        message={getErrorTitle(error.code)}
        description={
          <div>
            <Text>{error.message}</Text>
            {showFieldInfo && error.field && (
              <div className="mt-2">
                <Text type="secondary" className="text-xs">
                  الحقل المتأثر: {error.field}
                </Text>
              </div>
            )}
          </div>
        }
        type={getErrorType(error.code)}
        icon={<ExclamationCircleOutlined />}
        showIcon
        closable
        className="mb-4"
      />
    </div>
  );
};

export default ValidationErrorDisplay;
