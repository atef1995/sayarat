import React from "react";
import { Button, Card, Typography } from "antd";
import {
  ShopOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { SellerCompanyInfo } from "../../types";

const { Title, Text, Paragraph, Link } = Typography;

/**
 * Props for the CompanyCard component
 */
interface CompanyCardProps {
  /** Company information */
  companyInfo: SellerCompanyInfo;
  /** Additional CSS classes */
  className?: string;
  /** Show contact actions */
  showActions?: boolean;
  /** Callback for contact action */
  onContact?: (companyId: number) => void;
}

/**
 * CompanyCard Component
 *
 * Displays detailed company information in a card format.
 * Designed to be shown at the end of car listings for company sellers.
 * Uses Tailwind CSS for styling and follows SOLID principles.
 *
 * Features:
 * - Company logo and branding
 * - Detailed company information
 * - Verification status badges
 * - Contact information and actions
 * - Statistics display
 * - Responsive design with RTL support
 */
const CompanyCard: React.FC<CompanyCardProps> = ({
  companyInfo,
  className = "",
  showActions = true,
  onContact,
}) => {
  /**
   * Get verification status configuration
   */
  const getVerificationStatus = () => {
    const status = companyInfo.verificationStatus || "unverified";

    const statusConfig = {
      verified: {
        color: "text-green-600 bg-green-50 border-green-200",
        icon: <CheckCircleOutlined className="text-green-600" />,
        text: "شركة موثقة",
      },
      pending: {
        color: "text-yellow-600 bg-yellow-50 border-yellow-200",
        icon: <ClockCircleOutlined className="text-yellow-600" />,
        text: "قيد التحقق",
      },
      unverified: {
        color: " bg-gray-50 border-gray-200",
        icon: <ExclamationCircleOutlined className="" />,
        text: "غير موثقة",
      },
    };

    return statusConfig[status];
  };

  /**
   * Renders company header with logo and name
   */
  const renderCompanyHeader = () => {
    const verificationStatus = getVerificationStatus();

    return (
      <div className="flex items-start gap-4 mb-6">
        {/* Company Logo */}
        <div className="flex-shrink-0">
          {companyInfo.logo ? (
            <img
              src={companyInfo.logo}
              alt={`${companyInfo.name} logo`}
              className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200 shadow-sm"
              onError={(e) => {
                e.currentTarget.src = "/images/company-placeholder.png";
              }}
            />
          ) : (
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center border-2 border-gray-200">
              <ShopOutlined className="text-2xl text-blue-600" />
            </div>
          )}
        </div>

        {/* Company Name and Status */}
        <div className="flex-1 min-w-0">
          <Title level={3} className="text-gray-900 mb-2">
            {companyInfo.name}
          </Title>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${verificationStatus.color}`}
            >
              {verificationStatus.icon}
              <span>{verificationStatus.text}</span>
            </div>
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              شركة
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders company description
   */
  const renderDescription = () => {
    if (!companyInfo.description) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FileTextOutlined className="text-gray-400" />
          <Text className="text-sm font-medium">نبذة عن الشركة</Text>
        </div>
        <Paragraph className="leading-relaxed text-sm">
          {companyInfo.description}
        </Paragraph>
      </div>
    );
  };

  /**
   * Renders company contact information
   */
  const renderContactInfo = () => {
    return (
      <div className="mb-6">
        <Text className="text-sm font-medium block mb-3">معلومات الاتصال</Text>
        <div className="space-y-3">
          {/* Address */}
          {companyInfo.address && (
            <div className="flex items-start gap-3 text-sm">
              <EnvironmentOutlined className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <Text className="">{companyInfo.address}</Text>
                {companyInfo.city && (
                  <Text className="text-gray-500"> - {companyInfo.city}</Text>
                )}
              </div>
            </div>
          )}

          {/* Phone */}
          {companyInfo.phone && (
            <div className="flex items-center gap-3 text-sm">
              <PhoneOutlined className="text-gray-400 flex-shrink-0" />
              <Link
                href={`tel:${companyInfo.phone}`}
                className=" hover:text-blue-600"
              >
                {companyInfo.phone}
              </Link>
            </div>
          )}

          {/* Website */}
          {companyInfo.website && (
            <div className="flex items-center gap-3 text-sm">
              <GlobalOutlined className="text-gray-400 flex-shrink-0" />
              <Link
                href={companyInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className=" hover:text-blue-600"
              >
                زيارة الموقع الإلكتروني
              </Link>
            </div>
          )}

          {/* Email */}
          {companyInfo.email && (
            <div className="flex items-center gap-3 text-sm">
              <MailOutlined className="text-gray-400 flex-shrink-0" />
              <Link
                href={`mailto:${companyInfo.email}`}
                className=" hover:text-blue-600"
              >
                {companyInfo.email}
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Renders company statistics
   */
  const renderStatistics = () => {
    const hasStats = companyInfo.totalListings || companyInfo.memberSince;
    if (!hasStats) return null;

    return (
      <div className="mb-6">
        <Text className="text-sm font-medium block mb-3">إحصائيات الشركة</Text>
        <div className="grid grid-cols-2 gap-4">
          {companyInfo.totalListings && (
            <div className="bg-gray-50/10 text rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {companyInfo.totalListings}
              </div>
              <Text className="text-xs ">إعلان منشور</Text>
            </div>
          )}

          {companyInfo.memberSince && (
            <div className="bg-gray-50/10 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CalendarOutlined className="text-blue-600" />
              </div>
              <Text className="text-xs ">
                عضو منذ {companyInfo.memberSince}
              </Text>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Renders action buttons
   */
  const renderActions = () => {
    if (!showActions) return null;

    return (
      <div className="pt-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="primary"
            size="large"
            className="flex-1 bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700 h-12"
            onClick={() => onContact?.(companyInfo.id)}
          >
            <PhoneOutlined />
            اتصل بالشركة
          </Button>

          <Button
            size="large"
            className="flex-1 h-12"
            onClick={() => {
              // #TODO: Implement view all listings functionality
              window.location.href = `/user/${companyInfo.username}`;
            }}
          >
            <ShopOutlined />
            عرض جميع الإعلانات
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className={`min-w-full ${className}`}>
      {renderCompanyHeader()}
      {renderDescription()}
      {renderContactInfo()}
      {renderStatistics()}
      {renderActions()}
    </Card>
  );
};

export default CompanyCard;
