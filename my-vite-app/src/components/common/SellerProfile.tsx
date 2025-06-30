import React from "react";
import { Avatar, Typography } from "antd";
import {
  UserOutlined,
  ShopOutlined,
  PhoneOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { Seller, SellerCompanyInfo } from "../../types";
import { StartConvoBtn } from "../StartConvoBtn";

const { Text, Link } = Typography;

/**
 * Props for the SellerProfile component
 */
interface SellerProfileProps {
  /** Seller information */
  seller: Seller;
  /** Company information (if seller is a company) */
  companyInfo?: SellerCompanyInfo;
  /** Current user username to hide contact button for own listings */
  currentUserUsername?: string;
  /** Listing ID for contact purposes */
  listingId?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show compact version */
  compact?: boolean;
}

/**
 * SellerProfile Component
 *
 * Displays seller information with profile picture or company logo.
 * Can show either individual user information or company details.
 * Uses Tailwind CSS for styling and follows SOLID principles.
 *
 * Features:
 * - Individual user profile display
 * - Company profile display with logo
 * - Responsive design with Tailwind CSS
 * - RTL support for Arabic content
 * - Contact button integration
 * - Verification badges
 */
const SellerProfile: React.FC<SellerProfileProps> = ({
  seller,
  companyInfo,
  currentUserUsername,
  listingId,
  className = "",
  compact = false,
}) => {
  const isCompany = seller.is_company && companyInfo;
  const isOwnListing =
    currentUserUsername && currentUserUsername === seller.username;

  /**
   * Renders the profile avatar (user picture or company logo)
   */
  const renderAvatar = () => {
    if (isCompany && companyInfo?.logo) {
      return (
        <div className="relative">
          <img
            src={companyInfo.logo}
            alt={`${companyInfo.name} logo`}
            className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200 shadow-sm"
            onError={(e) => {
              e.currentTarget.src = "/images/company-placeholder.png";
            }}
          />
          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
            <ShopOutlined className="text-white text-xs" />
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <Avatar
          size={48}
          src={seller.picture}
          icon={<UserOutlined />}
          className="border-2 border-gray-200 shadow-sm"
        />
        {isCompany && (
          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
            <ShopOutlined className="text-white text-xs" />
          </div>
        )}
      </div>
    );
  };

  /**
   * Renders seller name and verification status
   */
  const renderSellerName = () => {
    const displayName = isCompany ? companyInfo?.name : seller.first_name;
    const isVerified = isCompany
      ? companyInfo?.verificationStatus === "verified"
      : false;

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href={`/user/${seller.username}`}
          className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
        >
          {displayName}
        </Link>
        {isVerified && (
          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            ✓ موثق
          </div>
        )}
        {isCompany && (
          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            شركة
          </div>
        )}
      </div>
    );
  };

  /**
   * Renders additional seller information
   */
  const renderSellerInfo = () => {
    if (compact) return null;

    return (
      <div className="mt-2 space-y-1">
        {/* Location */}
        {seller.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <EnvironmentOutlined className="text-gray-400" />
            <Text className="text-gray-600">{seller.location}</Text>
          </div>
        )}

        {/* Phone number - always show if available */}
        {seller.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <PhoneOutlined className="text-gray-400" />
            <Link
              href={`tel:${seller.phone}`}
              className="text-gray-600 hover:text-blue-600"
            >
              {seller.phone}
            </Link>
          </div>
        )}

        {/* Company website */}
        {isCompany && companyInfo?.website && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <GlobalOutlined className="text-gray-400" />
            <Link
              href={companyInfo.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600"
            >
              الموقع الإلكتروني
            </Link>
          </div>
        )}

        {/* Company member since */}
        {isCompany && companyInfo?.memberSince && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarOutlined className="text-gray-400" />
            <Text className="text-gray-600">
              عضو منذ {companyInfo.memberSince}
            </Text>
          </div>
        )}

        {/* Total listings for companies */}
        {isCompany && companyInfo?.totalListings && (
          <div className="text-sm text-gray-600">
            <Text className="text-gray-600">
              {companyInfo.totalListings} إعلان
            </Text>
          </div>
        )}
      </div>
    );
  };

  /**
   * Renders contact button using StartConvoBtn component
   */
  const renderContactButton = () => {
    if (isOwnListing || compact || !listingId) return null;

    return (
      <div className="mt-3">
        <StartConvoBtn listingId={listingId} />
      </div>
    );
  };

  return (
    <div
      className={` rounded-lg border border-gray-200/20 p-4 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start gap-3">
        {renderAvatar()}

        <div className="flex-1 min-w-0">
          {renderSellerName()}
          {renderSellerInfo()}
          {renderContactButton()}
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
