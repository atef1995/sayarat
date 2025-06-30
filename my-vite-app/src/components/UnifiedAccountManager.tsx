import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  AccountType,
  SubscriptionCheckResponse,
} from "../types/subscription.types";
import { SubscriptionService } from "../services/subscriptionService";
import { Card } from "antd";

/**
 * مكون إدارة الحساب الموحد
 *
 * يوضح تطبيق نظام الحساب الموحد مع:
 * - اكتشاف نوع الحساب والتبديل
 * - تصفية الخطط حسب نوع الحساب
 * - وظائف إدارة الشركة
 * - ميزات الاشتراك المحسنة
 * - أمان محسن لتبديل نوع الحساب
 *
 * يتبع مبادئ SOLID:
 * - مسؤولية واحدة: إدارة واجهة نوع الحساب
 * - مفتوح/مغلق: قابل للتوسيع لأنواع حسابات جديدة
 * - حقن التبعية: يستخدم SubscriptionService
 *
 * #TODO: إضافة نافذة إنشاء شركة
 * #TODO: إضافة تدفق ربط الشركة
 * #TODO: إضافة تأكيد نقل الاشتراك
 * #TODO: إضافة لوحة تحليلات لحسابات الشركة
 */

interface AccountManagerProps {
  onAccountTypeChange?: (accountType: AccountType) => void;
}

export const UnifiedAccountManager: React.FC<AccountManagerProps> = ({
  onAccountTypeChange,
}) => {
  // State management with proper error handling
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastNotifiedAccountType, setLastNotifiedAccountType] =
    useState<AccountType | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingSwitchType, setPendingSwitchType] =
    useState<AccountType | null>(null);
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  /**
   * تحميل حالة الاشتراك الحالية والخطط المتاحة
   * يستخدم callback محفوظ لمنع الحلقات اللانهائية
   */
  const loadSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("UnifiedAccountManager - عم نحمل بيانات الاشتراك...");

      // Get current subscription status with account type info
      const subscription = await SubscriptionService.checkSubscription();
      setSubscriptionData(subscription);
      console.log("UnifiedAccountManager - تم تحميل بيانات الاشتراك:", {
        accountType: subscription.accountType,
        isCompany: subscription.isCompany,
        hasCompany: !!subscription.company,
        companyName: subscription.company?.name,
        canSwitchAccountType: subscription.canSwitchAccountType,
        fullSubscriptionData: subscription,
      });

      // Only notify parent when account type actually changes, not on every reload
      // This prevents infinite loops by checking if we've already notified about this account type
      if (subscription.accountType !== lastNotifiedAccountType) {
        console.log(
          "UnifiedAccountManager - تغير نوع الحساب، عم نخبر المكون الأساسي:",
          {
            from: lastNotifiedAccountType,
            to: subscription.accountType,
          }
        );
        setLastNotifiedAccountType(subscription.accountType);
        onAccountTypeChange?.(subscription.accountType);
      } else {
        console.log(
          "UnifiedAccountManager - نوع الحساب ما تغير، ما عم نخبر المكون الأساسي"
        );
      }
    } catch (err) {
      const errorMessage = "فشل في تحميل بيانات الاشتراك";
      setError(errorMessage);
      console.error(
        "UnifiedAccountManager - خطأ في تحميل بيانات الاشتراك:",
        err
      );
    } finally {
      setLoading(false);
    }
  }, [lastNotifiedAccountType, onAccountTypeChange]);

  // Load subscription data on component mount
  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);
  /**
   * Initiate secure account type switch with confirmation
   * Implements proper security measures and user confirmation
   */
  const initiateAccountTypeSwitch = (targetType: AccountType) => {
    setPendingSwitchType(targetType);
    setShowConfirmationModal(true);
    setPasswordError(null);
    setConfirmationPassword("");
  };

  /**
   * Confirm account type switch with password verification
   * Enhanced security with password confirmation
   */
  const confirmAccountTypeSwitch = async () => {
    if (!pendingSwitchType) return;

    if (!confirmationPassword.trim()) {
      setPasswordError("يجب إدخال كلمة المرور للتأكيد");
      return;
    }

    try {
      setSwitching(true);
      setPasswordError(null);

      console.log("UnifiedAccountManager - تأكيد تبديل نوع الحساب:", {
        targetType: pendingSwitchType,
        hasPassword: !!confirmationPassword,
      });

      const result = await SubscriptionService.switchAccountType({
        targetAccountType: pendingSwitchType,
        confirmationPassword: confirmationPassword,
      });

      if (result.success) {
        console.log("UnifiedAccountManager - تم تبديل نوع الحساب بنجاح");
        setShowConfirmationModal(false);
        setPendingSwitchType(null);
        setConfirmationPassword("");
        await loadSubscriptionData();
      } else {
        const errorMessage = result.error || "فشل في تبديل نوع الحساب";
        setPasswordError(errorMessage);
        console.error(
          "UnifiedAccountManager - فشل تبديل نوع الحساب:",
          errorMessage
        );
      }
    } catch (err) {
      const errorMessage = "حدث خطأ أثناء تبديل نوع الحساب";
      setPasswordError(errorMessage);
      console.error("UnifiedAccountManager - خطأ في تبديل نوع الحساب:", err);
    } finally {
      setSwitching(false);
    }
  };

  /**
   * Cancel account type switch
   */
  const cancelAccountTypeSwitch = () => {
    setShowConfirmationModal(false);
    setPendingSwitchType(null);
    setConfirmationPassword("");
    setPasswordError(null);
  }; // Get features for current account type
  const accountTypeFeatures = useMemo(() => {
    if (!subscriptionData) return [];

    try {
      return SubscriptionService.getFeaturesForAccountType(
        subscriptionData.accountType
      );
    } catch (err) {
      console.error(
        "UnifiedAccountManager - Error getting account type features:",
        err
      );
      return [];
    }
  }, [subscriptionData]);
  // Loading state with proper accessibility
  if (loading) {
    return (
      <div
        className="flex items-center justify-center p-8"
        role="status"
        aria-label="تحميل معلومات الحساب"
        dir="rtl"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">عم نحمل معلومات الحساب...</span>
      </div>
    );
  }

  // Error state with retry functionality
  if (!subscriptionData) {
    return (
      <div className="p-6 text-center" dir="rtl">
        <p className="text-red-600 mb-4">فشل في تحميل بيانات الاشتراك</p>
        <button
          onClick={loadSubscriptionData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          حاول مرة تانية
        </button>
      </div>
    );
  }
  return (
    <Card className="space-y-6">
      {/* Error Display with dismissible functionality */}
      {error && (
        <div className="border border-red-200 rounded-lg p-4" role="alert">
          <div className="flex items-start">
            <div className="text-red-800 flex-1">
              <p>{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800 transition-colors"
              aria-label="إزالة التنبيه"
            >
              ×
            </button>
          </div>
        </div>
      )}{" "}
      {/* Confirmation Modal for Account Type Switch */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="backdrop-blur-2xl bg-black/50 rounded-lg p-6 w-full max-w-md mx-4 border shadow-lg">
            <h3 className="text-lg font-bold mb-4 ">تأكيد تبديل نوع الحساب</h3>
            <p className="mb-4">
              {pendingSwitchType === "company"
                ? "هل أنت متأكد إنك بدك تحول لحساب شركة؟"
                : "هل أنت متأكد إنك بدك تحول لحساب شخصي؟"}
            </p>
            <p className="text-sm  mb-4">
              هاد التغيير ممكن يأثر على اشتراكك الحالي والخدمات المتاحة.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium  mb-2">
                أدخل كلمة المرور للتأكيد
              </label>
              <input
                type="password"
                value={confirmationPassword}
                onChange={(e) => setConfirmationPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="كلمة المرور"
                required
                onKeyPress={(e) => {
                  if (e.key === "Enter" && confirmationPassword.trim()) {
                    confirmAccountTypeSwitch();
                  }
                }}
              />
              {passwordError && (
                <p className="text-red-600 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={confirmAccountTypeSwitch}
                disabled={switching || !confirmationPassword.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {switching ? "عم نبدل..." : "تأكيد التبديل"}
              </button>
              <button
                onClick={cancelAccountTypeSwitch}
                disabled={switching}
                className="flex-1 px-4 py-2 bg-gray-500   rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Account Type Display */}
      <div className="rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">معلومات الحساب</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium  mb-2">
              نوع الحساب الحالي
            </label>
            <div className="flex items-center space-x-4 space-x-reverse">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  subscriptionData.accountType === "individual"
                    ? "text-blue-800"
                    : "text-green-800"
                }`}
              >
                {subscriptionData.accountType === "individual"
                  ? "حساب شخصي"
                  : "حساب شركة"}
              </span>

              {subscriptionData.canSwitchAccountType && (
                <button
                  onClick={() => {
                    const targetType =
                      subscriptionData.accountType === "individual"
                        ? "company"
                        : "individual";
                    initiateAccountTypeSwitch(targetType);
                  }}
                  disabled={switching}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
                >
                  {switching
                    ? "عم نبدل..."
                    : `بدل ل${
                        subscriptionData.accountType === "individual"
                          ? "حساب شركة"
                          : "حساب شخصي"
                      }`}
                </button>
              )}
            </div>
          </div>{" "}
          {/* Company Information Display */}
          {subscriptionData.company && (
            <div>
              <label className="block text-sm font-medium  mb-2">
                الشركة المرتبطة
              </label>
              <div className="p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium ">
                      {subscriptionData.company.name}
                    </h3>
                    {subscriptionData.company.email && (
                      <p className="text-sm ">
                        {subscriptionData.company.email}
                      </p>
                    )}
                  </div>
                  {subscriptionData.company.isVerified && (
                    <span className="px-2 py-1 text-green-800 text-xs rounded-full">
                      موثق
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Current Subscription Display */}
      {subscriptionData.hasActiveSubscription &&
        subscriptionData.subscription && (
          <div className="rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">الاشتراك الحالي</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium ">الخطة:</span>
                <span className="">
                  {subscriptionData.subscription.planDisplayName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium ">الحالة:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    subscriptionData.subscription.status === "active"
                      ? " text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {subscriptionData.subscription.status === "active"
                    ? "نشط"
                    : "معلق"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium ">نوع الحساب:</span>
                <span className="">
                  {subscriptionData.subscription.accountType === "individual"
                    ? "شخصي"
                    : "شركة"}
                </span>
              </div>
            </div>
          </div>
        )}
      {/* Account Type Features */}
      <div className="rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">
          مميزات{" "}
          {subscriptionData.accountType === "individual"
            ? "الحساب الشخصي"
            : "حساب الشركة"}
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {accountTypeFeatures.map((feature, index) => (
            <div key={index} className="flex items-center">
              <span className="text-green-500 ml-3 flex-shrink-0">✓</span>
              <span className="text-sm ">{feature}</span>
            </div>
          ))}
        </div>
        {accountTypeFeatures.length === 0 && (
          <p className="text-sm">ما في مميزات محددة لهاد النوع من الحسابات.</p>
        )}
      </div>
    </Card>
  );
};

export default UnifiedAccountManager;
