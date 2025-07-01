import { useParams } from "react-router";
import { useState, useEffect } from "react";
import {
  Card,
  Avatar,
  Tabs,
  Typography,
  Statistic,
  Row,
  Col,
  Space,
} from "antd";
import {
  UserOutlined,
  CarOutlined,
  HeartOutlined,
  StarOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CalendarOutlined,
  BuildOutlined,
} from "@ant-design/icons";
import type { TabsProps } from "antd";
import UserReviews from "./UserReviews";
import PaginatedCards from "./PaginatedCards";
import ReportBtn from "./buttons/ReportBtn";
import { User as UserType } from "../types/api.types";
import { loadApiConfig } from "../config/apiConfig";

const { Title, Text, Paragraph } = Typography;
const { apiUrl } = loadApiConfig();

interface UserProfile extends Omit<UserType, "phone" | "accountType"> {
  // User statistics
  total_listings: number;
  active_listings: number;
  total_sales: number;
  pending_listings: number;
  sales_ratio: number;

  // User basic fields (override base types for optional fields)
  location?: string;
  phone?: string;

  // Company fields from backend
  isCompany: boolean;
  companyName?: string;
  companyLogo?: string;
  companyDescription?: string;
  companyAddress?: string;
  companyCity?: string;
  companyWebsite?: string;
  companyCreatedAt?: string;
  companyHeaderImage?: string;

  // Enhanced fields
  memberStatus?: string;
  accountType?: "personal" | "company";

  // #TODO: Add reputation_score when review system is fully integrated
  reputation_score?: number;
}

interface UserProfileResponse {
  success: boolean;
  data: UserProfile;
  error?: string;
}

/**
 * User Profile Component
 *
 * Displays user profile information and listings with pagination.
 * Uses PaginatedCards component with username search parameter for efficient
 * server-side filtering and pagination of user-specific listings.
 *
 * Features:
 * - User profile display with statistics
 * - Company information for business accounts
 * - Paginated user listings using search params
 * - User reviews tab
 *
 * #TODO: Add loading states for individual sections
 * #TODO: Implement error boundaries for profile fetching
 * #TODO: Add reputation score when review system is fully integrated
 * #TODO: Consider adding user listing sorting options
 */
const User = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Create search params for PaginatedCards to filter by username
  const userListingsSearchParams = username
    ? new URLSearchParams({ username })
    : undefined;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!username) {
          setProfile(null);
          setLoading(false);
          return;
        }
        const response = await fetch(`${apiUrl}/users/${username}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }
        const result: UserProfileResponse = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch user profile");
        }
        const data = result.data;
        console.log("Fetched user profile:", data);

        setProfile(data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: (
        <span>
          <CarOutlined />
          السيارات المعروضة
        </span>
      ),
      children: <PaginatedCards searchParams={userListingsSearchParams} />,
    },
    {
      key: "2",
      label: (
        <span>
          <StarOutlined />
          التقييمات
        </span>
      ),
      children: <UserReviews username={username as string} />,
    },
  ];
  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>User not found</div>;

  /**
   * Render company information section
   */
  const renderCompanyInfo = () => {
    if (!profile.isCompany) return null;

    return (
      <Card
        className="mb-4"
        title={
          <Space>
            <BuildOutlined />
            <span>معلومات الشركة</span>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          {/* Company Header Image */}
          {profile.companyHeaderImage && (
            <Col span={24}>
              <img
                src={profile.companyHeaderImage}
                alt="Company Header"
                className="w-full h-48 object-cover rounded-lg"
              />
            </Col>
          )}

          {/* Company Logo and Basic Info */}
          <Col xs={24} md={12}>
            <div className="flex items-start gap-4">
              {profile.companyLogo ? (
                <Avatar size={80} src={profile.companyLogo} shape="square" />
              ) : (
                <Avatar size={80} icon={<BuildOutlined />} shape="square" />
              )}
              <div className="flex-1">
                <Title level={4} className="mb-2">
                  {profile.companyName}
                </Title>
                {profile.companyDescription && (
                  <Paragraph className="text-gray-600">
                    {profile.companyDescription}
                  </Paragraph>
                )}
              </div>
            </div>
          </Col>

          {/* Company Details */}
          <Col xs={24} md={12}>
            <Space direction="vertical" size="small" className="w-full">
              {profile.companyAddress && (
                <div className="flex items-center gap-2">
                  <EnvironmentOutlined className="text-gray-500" />
                  <Text>
                    {profile.companyAddress}
                    {profile.companyCity && `, ${profile.companyCity}`}
                  </Text>
                </div>
              )}

              {profile.companyWebsite && (
                <div className="flex items-center gap-2">
                  <GlobalOutlined className="text-gray-500" />
                  <a
                    href={
                      profile.companyWebsite.startsWith("http")
                        ? profile.companyWebsite
                        : `https://${profile.companyWebsite}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {profile.companyWebsite}
                  </a>
                </div>
              )}

              {profile.phone && (
                <div className="flex items-center gap-2">
                  <PhoneOutlined className="text-gray-500" />
                  <Text>{profile.phone}</Text>
                </div>
              )}

              {profile.companyCreatedAt && (
                <div className="flex items-center gap-2">
                  <CalendarOutlined className="text-gray-500" />
                  <Text>
                    تأسست في{" "}
                    {new Date(profile.companyCreatedAt).toLocaleDateString(
                      "ar-SY"
                    )}
                  </Text>
                </div>
              )}
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl sm:max-w-screen-lg">
      {/* User/Company Profile Header */}
      <Card className="mb-4">
        <div className="flex items-start gap-4">
          <Avatar size={64} src={profile.picture} icon={<UserOutlined />} />
          <div className="flex-1">
            <Title level={3}>
              {profile.isCompany ? (
                <Space>
                  <BuildOutlined className="text-blue-500" />
                  <span className="text-blue-500">{profile.companyName}</span>
                </Space>
              ) : (
                <span>
                  {profile.firstName} {profile.lastName}
                </span>
              )}
            </Title>
            <Text type="secondary" className="text-xs">
              @{profile.username}
            </Text>
            <Text className="block text-xs">
              عضو منذ {new Date(profile.createdAt).toLocaleDateString("ar-SY")}
            </Text>
            {profile.location && (
              <div className="flex items-center gap-1 mt-1">
                <EnvironmentOutlined className="text-gray-500 text-xs" />
                <Text className="text-xs text-gray-600">
                  {profile.location}
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <Row gutter={16} className="mt-4">
          <Col xs={24} sm={6}>
            <Statistic
              title="التقييم"
              value={profile.reputation_score || 0}
              prefix={<StarOutlined />}
              precision={1}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="إجمالي السيارات"
              value={profile.total_listings}
              prefix={<CarOutlined />}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="المبيعات"
              value={profile.total_sales}
              prefix={<HeartOutlined />}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="معدل البيع"
              value={profile.sales_ratio}
              suffix="%"
              prefix={<StarOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* Company Information Section */}
      {renderCompanyInfo()}

      {/* Tabs for Listings and Reviews */}
      <Card>
        <Tabs defaultActiveKey="1" items={items} />
      </Card>

      <ReportBtn id={profile.id} toReport="user" />
    </div>
  );
};

export default User;
