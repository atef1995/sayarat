import { useState, useEffect, useCallback } from "react";
import { Tabs, Badge, Typography, message } from "antd";
import {
  UserOutlined,
  CrownOutlined,
  SettingOutlined,
  ShopOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { SubscriptionService } from "../services/subscriptionService";
import {
  SubscriptionCheckResponse,
  AccountType,
  AccountTypeResponse,
} from "../types/subscription.types";
import { useAuth } from "../hooks/useAuth";
import SubscriptionManagement from "./SubscriptionManagement";
import AccountOverview from "./profile/AccountOverview";
import ProfileForm from "./profile/ProfileForm";
import ErrorBoundary from "./common/ErrorBoundary";
import LoadingState from "./common/LoadingState";
import CompanyDashboard from "./company/CompanyDashboard";
import UnifiedAccountManager from "./UnifiedAccountManager";

const { Title } = Typography;

/**
 * Enhanced User Profile component with Unified Account System
 *
 * Features:
 * - Unified account type management (individual/company)
 * - Responsive design with mobile-optimized tabs
 * - Account type switching capabilities
 * - Enhanced subscription management
 * - Accessible navigation with proper ARIA labels
 * - Loading states and error handling
 * - Arabic (Syrian dialect) localization support
 *
 * #TODO: Add profile completion percentage indicator
 * #TODO: Implement profile photo upload functionality
 * #TODO: Add settings export/import functionality
 * #TODO: Implement dark mode toggle
 * #TODO: Add accessibility audit and improve screen reader support
 * #TODO: Integrate account type switching UI with company creation flow
 */

const UserProfile = () => {
  const { user: userDetails, isLoading: authLoading, checkSession } = useAuth();
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionCheckResponse | null>(null);
  const [accountTypeData, setAccountTypeData] =
    useState<AccountTypeResponse | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  // Load both subscription and account type data
  const loadAccountData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load subscription data with enhanced account type information
      const subscriptionResponse =
        await SubscriptionService.checkSubscription();
      setSubscriptionData(subscriptionResponse);

      // Load detailed account type information
      const accountTypeResponse = await SubscriptionService.getAccountType();
      setAccountTypeData(accountTypeResponse);

      // Log account type detection for debugging
      console.log("Account data loaded:", {
        subscriptionAccountType: subscriptionResponse.accountType,
        detailedAccountType: accountTypeResponse.accountType,
        hasCompany: !!subscriptionResponse.company,
        companyName: subscriptionResponse.company?.name,
      });
    } catch (error) {
      console.error("Error fetching account data:", error);
      message.error("فشل في تحميل بيانات الحساب");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only load account data when user is available and auth is done loading
    if (userDetails && !authLoading) {
      loadAccountData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [userDetails, authLoading, loadAccountData]);
  const handleProfileUpdate = async () => {
    // Refresh the user data and account information after profile update
    try {
      await checkSession();
      await loadAccountData(); // Reload account data to reflect any changes
      message.success("تم تحديث الملف الشخصي بنجاح");
    } catch (error) {
      console.error("Failed to refresh user session:", error);
      message.error("فشل في تحديث البيانات");
    }
  };
  const handleAccountTypeChange = async (newAccountType: AccountType) => {
    // Only reload data and show message for actual account type changes
    // Check if this is a real change vs initial load
    const currentAccountType =
      subscriptionData?.accountType || accountTypeData?.accountType;

    console.log("UserProfile - Account type change handler called:", {
      newAccountType,
      currentAccountType,
      isRealChange: currentAccountType && currentAccountType !== newAccountType,
    });

    if (currentAccountType && currentAccountType !== newAccountType) {
      // Only reload and show success message for actual changes (not initial load)
      await loadAccountData();
      message.success(
        `تم التبديل إلى حساب ${
          newAccountType === "company" ? "الشركة" : "فردي"
        }`
      );
    }
  };
  // Determine if user has company account using new unified system
  // Prioritize subscription data over account type data for consistency
  const isCompanyAccount =
    subscriptionData?.accountType === "company" ||
    (!subscriptionData?.accountType &&
      accountTypeData?.accountType === "company");

  return (
    <ErrorBoundary>
      <div className="p-3 sm:p-6 max-w-6xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <Title level={2} className="text-lg sm:text-2xl">
            <UserOutlined className="mr-2" />
            إعدادات الحساب
            {subscriptionData?.accountType && (
              <Badge
                count={
                  subscriptionData.accountType === "company" ? "شركة" : "فردي"
                }
                color={
                  subscriptionData.accountType === "company" ? "blue" : "green"
                }
                className="mr-2"
              />
            )}
          </Title>
        </div>
        {isLoading || authLoading ? (
          <LoadingState message="جاري تحميل بيانات الحساب..." size="large" />
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            tabPosition="top"
            className="mobile-friendly-tabs"
            tabBarStyle={{
              marginBottom: "16px",
              paddingLeft: 0,
              paddingRight: 0,
            }}
            aria-label="إعدادات الحساب"
            items={[
              {
                key: "overview",
                label: (
                  <span
                    className="text-xs sm:text-sm"
                    aria-label="نظرة عامة على الحساب"
                  >
                    <UserOutlined aria-hidden="true" />
                    <span className="hidden sm:inline ml-1">نظرة عامة</span>
                  </span>
                ),
                children: (
                  <AccountOverview
                    subscriptionData={subscriptionData}
                    userDetails={userDetails}
                  />
                ),
              },
              {
                key: "profile",
                label: (
                  <span
                    className="text-xs sm:text-sm"
                    aria-label="تعديل الملف الشخصي"
                  >
                    <SettingOutlined aria-hidden="true" />
                    <span className="hidden sm:inline ml-1">الملف الشخصي</span>
                  </span>
                ),
                children: (
                  <ProfileForm
                    userDetails={userDetails}
                    isCompany={isCompanyAccount}
                    onProfileUpdate={handleProfileUpdate}
                  />
                ),
              },
              {
                key: "account-management",
                label: (
                  <span
                    className="text-xs sm:text-sm"
                    aria-label="إدارة نوع الحساب"
                  >
                    <SwapOutlined aria-hidden="true" />
                    <span className="hidden sm:inline ml-1">إدارة الحساب</span>
                  </span>
                ),
                children: (
                  <UnifiedAccountManager
                    onAccountTypeChange={handleAccountTypeChange}
                  />
                ),
              },
              ...(isCompanyAccount
                ? [
                    {
                      key: "company",
                      label: (
                        <span
                          className="text-xs sm:text-sm"
                          aria-label="لوحة تحكم الشركة"
                        >
                          <ShopOutlined aria-hidden="true" />
                          <span className="hidden sm:inline ml-1">
                            لوحة الشركة
                          </span>
                        </span>
                      ),
                      children: <CompanyDashboard />,
                    },
                  ]
                : []),
              {
                key: "subscription",
                label: (
                  <span
                    className="text-xs sm:text-sm"
                    aria-label="إدارة الاشتراك"
                  >
                    <CrownOutlined aria-hidden="true" />
                    <span className="hidden sm:inline ml-1">الاشتراك</span>
                    {subscriptionData?.hasActiveSubscription && (
                      <Badge
                        dot
                        status="success"
                        className="ml-1"
                        aria-label="اشتراك نشط"
                      />
                    )}
                  </span>
                ),
                children: <SubscriptionManagement />,
              },
            ]}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default UserProfile;
