import React, { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Typography, Tabs, Badge, message, Spin } from "antd";
import {
  ShopOutlined,
  SettingOutlined,
  TeamOutlined,
  BarChartOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import {
  Company,
  CompanyStats,
  CompanyMember,
} from "../../types/company.types";
import { CompanyService } from "../../services/companyService";
import ErrorBoundary from "../common/ErrorBoundary";
import CompanyProfileForm from "./CompanyProfileForm";
import CompanyImageManager from "./CompanyImageManager";
import CompanyStatsOverview from "./CompanyStatsOverview";
import CompanyMembersManager from "./CompanyMembersManager";

const { Title } = Typography;

/**
 * Mobile-friendly and responsive Company Dashboard component
 *
 * Features:
 * - Responsive layout that adapts to different screen sizes
 * - Mobile-optimized tabs with icons and abbreviated text
 * - Accessible design with proper ARIA labels and keyboard navigation
 * - Loading states and error handling
 * - Modular architecture with reusable components
 * - Focused on company operations (subscription management handled separately)
 *
 * Note: Subscription management is handled in the account settings page.
 * This dashboard focuses on company profile, images, team management, and analytics.
 *
 * #TODO: Add unit tests for responsive behavior
 * #TODO: Implement keyboard shortcuts for tab navigation
 * #TODO: Add analytics tracking for dashboard usage
 * #TODO: Consider implementing lazy loading for tab content
 * #TODO: Add company branding customization features
 * #TODO: Implement export functionality for company data
 */
const CompanyDashboard: React.FC = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);

  const loadCompanyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [companyData, statsData, membersData] = await Promise.all([
        CompanyService.getCompanyProfile(),
        CompanyService.getCompanyStats(),
        CompanyService.getCompanyMembers(),
      ]);

      setCompany(companyData);
      setStats(statsData);
      setMembers(membersData);
    } catch (error) {
      message.error("فشل في تحميل بيانات الشركة");
      console.error("Error loading company data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);

  const handleCompanyUpdate = useCallback((updatedCompany: Company) => {
    setCompany(updatedCompany);
    message.success("تم تحديث بيانات الشركة بنجاح");
  }, []);

  const handleImageUpdate = useCallback(
    (imageType: "logo" | "header", imageUrl: string) => {
      if (company) {
        setCompany({
          ...company,
          [imageType === "logo" ? "logo" : "headerImage"]: imageUrl,
        });
        message.success(
          `تم تحديث ${imageType === "logo" ? "الشعار" : "صورة الرأس"} بنجاح`
        );
      }
    },
    [company]
  );

  const handleMemberUpdate = useCallback((updatedMembers: CompanyMember[]) => {
    setMembers(updatedMembers);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card>
          <div className="text-center py-8">
            <Title level={4}>لم يتم العثور على بيانات الشركة</Title>
            <p>يرجى التواصل مع الدعم الفني</p>
          </div>
        </Card>
      </div>
    );
  }
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <div className="p-3 sm:p-6 max-w-7xl mx-auto">
          {/* Company Header */}
          <div className="mb-4 sm:mb-6">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={24}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  {company.logo && (
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <Title
                      level={2}
                      className="mb-0 text-lg sm:text-2xl break-words"
                      style={{ margin: 0 }}
                    >
                      <ShopOutlined className="mr-2" />
                      {company.name}
                    </Title>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {company.city && (
                        <Badge color="blue" text={company.city} />
                      )}
                      {company.taxId && <Badge color="green" text="مرخصة" />}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Header Image */}
            {company.headerImage && (
              <div className="mt-3 sm:mt-4">
                <img
                  src={company.headerImage}
                  alt="Company Header"
                  className="w-full h-32 sm:h-48 rounded-lg object-cover border border-gray-200"
                />
              </div>
            )}
          </div>

          {/* Dashboard Tabs Container */}
          <div className="rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="large"
              tabPosition="top"
              className="mobile-friendly-tabs company-dashboard-tabs"
              tabBarStyle={{
                marginBottom: "0",
                paddingLeft: "16px",
                paddingRight: "16px",
                paddingTop: "16px",
                borderBottom: "1px solid #f0f0f0",
              }}
              aria-label="لوحة تحكم الشركة"
              items={[
                {
                  key: "overview",
                  label: (
                    <span
                      className="text-xs sm:text-sm"
                      aria-label="نظرة عامة على الشركة"
                    >
                      <BarChartOutlined aria-hidden="true" />
                      <span className="hidden sm:inline ml-1">نظرة عامة</span>
                    </span>
                  ),
                  children: (
                    <div className="p-4 sm:p-6">
                      <CompanyStatsOverview stats={stats} />
                    </div>
                  ),
                },
                {
                  key: "profile",
                  label: (
                    <span
                      className="text-xs sm:text-sm"
                      aria-label="إعدادات الشركة"
                    >
                      <SettingOutlined aria-hidden="true" />
                      <span className="hidden sm:inline ml-1">
                        إعدادات الشركة
                      </span>
                    </span>
                  ),
                  children: (
                    <div className="p-4 sm:p-6">
                      <CompanyProfileForm
                        company={company}
                        onUpdate={handleCompanyUpdate}
                      />
                    </div>
                  ),
                },
                {
                  key: "images",
                  label: (
                    <span
                      className="text-xs sm:text-sm"
                      aria-label="الصور والشعار"
                    >
                      <PictureOutlined aria-hidden="true" />
                      <span className="hidden sm:inline ml-1">
                        الصور والشعار
                      </span>
                    </span>
                  ),
                  children: (
                    <div className="p-4 sm:p-6">
                      <CompanyImageManager
                        company={company}
                        onImageUpdate={handleImageUpdate}
                      />
                    </div>
                  ),
                },
                {
                  key: "members",
                  label: (
                    <span
                      className="text-xs sm:text-sm"
                      aria-label={`أعضاء الفريق - ${members.length} عضو`}
                    >
                      <TeamOutlined aria-hidden="true" />
                      <span className="hidden sm:inline ml-1">
                        أعضاء الفريق
                      </span>
                      <Badge
                        count={members.length}
                        size="small"
                        className="ml-1"
                        style={{ fontSize: "10px" }}
                        aria-label={`${members.length} عضو`}
                      />
                    </span>
                  ),
                  children: (
                    <div className="p-4 sm:p-6">
                      <CompanyMembersManager
                        members={members}
                        onMembersUpdate={handleMemberUpdate}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CompanyDashboard;
