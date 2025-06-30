import { loadApiConfig } from "../config/apiConfig";
import {
  UserSubscription,
  SubscriptionCheckResponse,
  SubscriptionCreateRequest,
  SubscriptionCreateResponse,
  SubscriptionPlansResponse,
  SubscriptionReactivateRequest,
  SubscriptionReactivateResponse,
  SubscriptionCancelRequest,
  SubscriptionCancelResponse,
  SubscriptionPlan,
  // New: Account type interfaces
  AccountType,
  AccountTypeResponse,
  AccountTypeSwitchRequest,
  AccountTypeSwitchResponse,
  CompanyCreateRequest,
  CompanyCreateResponse,
  CompanyAssociationRequest,
  CompanyAssociationResponse,
  SubscriptionPlansRequest,
} from "../types/subscription.types";

const { apiUrl } = loadApiConfig();

/**
 * Subscription Service - Handles all subscription-related API calls and utilities
 *
 * ARCHITECTURE PRINCIPLES:
 * ========================
 *
 * 1. SINGLE RESPONSIBILITY: Handles subscription API communication and status utilities
 * 2. STATIC METHODS: All methods are static for easy access without instantiation
 * 3. ERROR BOUNDARIES: Comprehensive error handling with fallback responses
 * 4. DRY PRINCIPLE: Reusable utility methods for common subscription operations
 * 5. MODULARITY: Clean separation between API calls and utility functions
 *
 * #TODO: Add caching layer for subscription data to reduce API calls
 * #TODO: Implement retry logic with exponential backoff for failed requests
 * #TODO: Add offline detection and queue for subscription operations
 * #TODO: Add subscription analytics tracking methods
 * #TODO: Implement subscription webhook status synchronization
 */
export class SubscriptionService {
  /**
   * Get all available subscription plans with optional filtering
   * @param options Optional filtering options for account type
   * @returns Promise<SubscriptionPlansResponse> List of available plans
   */
  static async getPlans(
    options?: SubscriptionPlansRequest
  ): Promise<SubscriptionPlansResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (options?.accountType) {
        queryParams.append("accountType", options.accountType);
      }
      if (options?.companyId) {
        queryParams.append("companyId", options.companyId);
      }

      const url = `${apiUrl}/api/subscription/plans${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      return {
        success: false,
        plans: [],
        error: "Failed to fetch subscription plans",
      };
    }
  }

  /**
   * Check user's current subscription status
   * @returns Promise<SubscriptionCheckResponse> Current subscription status and features
   */
  static async checkSubscription(): Promise<SubscriptionCheckResponse> {
    try {
      const response = await fetch(`${apiUrl}/api/subscription/status`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to check subscription status");
      }

      const result = await response.json();
      console.log("Subscription check result:", result);

      return result;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return {
        hasActiveSubscription: false,
        features: {
          aiCarAnalysis: false,
          listingHighlights: false,
          prioritySupport: false,
          advancedAnalytics: false,
          unlimitedListings: false,
        },
        isCompany: false,
        accountType: "individual",
        canSwitchAccountType: true,
      };
    }
  }

  /**
   * Create a new subscription
   * @param request Subscription creation request data
   * @returns Promise<SubscriptionCreateResponse> Creation result with checkout URL
   */
  static async createSubscription(
    request: SubscriptionCreateRequest
  ): Promise<SubscriptionCreateResponse> {
    try {
      const response = await fetch(`${apiUrl}/api/subscription/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error creating subscription:", error);
      return {
        success: false,
        error: "Failed to create subscription",
      };
    }
  }

  /**
   * Cancel subscription (schedules cancellation at period end)
   * @param request Optional cancellation request with reason
   * @returns Promise<SubscriptionCancelResponse> Cancellation result
   */
  static async cancelSubscription(
    request?: SubscriptionCancelRequest
  ): Promise<SubscriptionCancelResponse> {
    try {
      const response = await fetch(`${apiUrl}/api/subscription/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request || {}),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error canceling subscription:", error);
      return {
        success: false,
        error: "Failed to cancel subscription",
      };
    }
  }

  /**
   * Reactivate subscription that was set to cancel at period end
   * @param request Optional reactivation request data
   * @returns Promise<SubscriptionReactivateResponse> Reactivation result
   */
  static async reactivateSubscription(
    request?: SubscriptionReactivateRequest
  ): Promise<SubscriptionReactivateResponse> {
    try {
      const response = await fetch(`${apiUrl}/api/subscription/reactivate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request || {}),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      return {
        success: false,
        error: "Failed to reactivate subscription",
      };
    }
  }

  /**
   * Update subscription plan
   * @param planId New plan ID to switch to
   * @returns Promise<SubscriptionCreateResponse> Update result
   */
  static async updateSubscription(
    planId: string
  ): Promise<SubscriptionCreateResponse> {
    try {
      const response = await fetch(`${apiUrl}/api/subscription/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error updating subscription:", error);
      return {
        success: false,
        error: "Failed to update subscription",
      };
    }
  }

  /**
   * Submit manual payment request for offline payment processing
   * @param data Manual payment request data
   * @returns Promise<{success: boolean, error?: string}> Submission result
   */
  static async submitManualPayment(data: {
    fullName: string;
    phone: string;
    email: string;
    paymentMethod: string;
    preferredContact: string;
    notes?: string;
    planName: string;
    planPrice: number;
    currency: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${apiUrl}/api/subscription/manual-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error submitting manual payment:", error);
      return {
        success: false,
        error: "Failed to submit manual payment request",
      };
    }
  }

  // =============================================================================
  // UTILITY METHODS - Subscription Status Helpers
  // =============================================================================

  /**
   * Utility method to determine if subscription is scheduled for cancellation
   * @param subscription User subscription object
   * @returns boolean indicating if subscription is scheduled for cancellation
   */
  static isScheduledForCancellation(subscription?: UserSubscription): boolean {
    if (!subscription) return false;
    return (
      subscription.cancelAtPeriodEnd === true &&
      subscription.status === "active"
    );
  }

  /**
   * Utility method to check if subscription is currently providing benefits
   * @param subscription User subscription object
   * @returns boolean indicating if subscription provides current benefits
   */
  static isProvidingBenefits(subscription?: UserSubscription): boolean {
    if (!subscription) return false;

    const isActiveStatus = ["active", "trialing"].includes(subscription.status);

    // Check if still within current period
    if (subscription.currentPeriodEnd) {
      const now = new Date();
      const periodEnd = new Date(subscription.currentPeriodEnd);
      const isWithinPeriod = now <= periodEnd;
      return isActiveStatus && isWithinPeriod;
    }

    return isActiveStatus;
  }

  /**
   * Utility method to get human-readable subscription status
   * @param subscription User subscription object
   * @returns string describing the current subscription state
   */
  static getSubscriptionStatusText(subscription?: UserSubscription): string {
    if (!subscription) return "غير مفعل";

    if (this.isScheduledForCancellation(subscription)) {
      return "نشط - مجدول للإلغاء";
    }

    switch (subscription.status) {
      case "active":
        return "نشط";
      case "canceled":
        return "ملغي";
      case "past_due":
        return "متأخر الدفع";
      case "unpaid":
        return "غير مدفوع";
      case "incomplete":
        return "غير مكتمل";
      case "trialing":
        return "فترة تجريبية";
      default:
        return "غير معروف";
    }
  }

  /**
   * Utility method to calculate days remaining until cancellation
   * @param subscription User subscription object
   * @returns number of days until subscription expires, or null if not applicable
   */
  static getDaysUntilCancellation(
    subscription?: UserSubscription
  ): number | null {
    if (!subscription || !this.isScheduledForCancellation(subscription)) {
      return null;
    }

    if (!subscription.currentPeriodEnd) {
      return null;
    }

    const endDate = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Utility method to get cancellation warning message
   * @param subscription User subscription object
   * @returns string with cancellation warning or null if not applicable
   */
  static getCancellationWarning(
    subscription?: UserSubscription
  ): string | null {
    if (!this.isScheduledForCancellation(subscription)) {
      return null;
    }

    const daysRemaining = this.getDaysUntilCancellation(subscription);

    if (daysRemaining === null) {
      return "الاشتراك مجدول للإلغاء في نهاية الفترة الحالية";
    }

    if (daysRemaining === 0) {
      return "الاشتراك سينتهي اليوم";
    }

    if (daysRemaining === 1) {
      return "الاشتراك سينتهي غداً";
    }

    return `الاشتراك سينتهي خلال ${daysRemaining} يوم`;
  }

  /**
   * Utility method to format subscription date in Arabic locale
   * @param dateString Date string or Date object
   * @returns formatted date string in Arabic
   */
  static formatSubscriptionDate(
    dateString: string | Date | null | undefined
  ): string {
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
  }

  // =============================================================================
  // ENHANCED METHODS - Account Type Aware Subscription Management
  // =============================================================================

  /**
   * Detect current user's account type for appropriate subscription flow
   * @returns Promise<'individual' | 'company'> Current user's account type
   */
  static async detectAccountType(): Promise<"individual" | "company"> {
    try {
      const response = await fetch(`${apiUrl}/api/user/account-type`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        console.warn("Failed to detect account type, defaulting to individual");
        return "individual";
      }

      const result = await response.json();
      return result.accountType || "individual";
    } catch (error) {
      console.error("Error detecting account type:", error);
      return "individual";
    }
  }

  /**
   * Get subscription plans filtered by account type
   * @param accountType Optional account type filter
   * @returns Promise<SubscriptionPlansResponse> Filtered plans
   */
  static async getPlansForAccountType(
    accountType?: "individual" | "company"
  ): Promise<SubscriptionPlansResponse> {
    try {
      // If no account type provided, detect it
      const targetAccountType = accountType || (await this.detectAccountType());

      const response = await fetch(
        `${apiUrl}/api/subscription/plans?accountType=${targetAccountType}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const result = await response.json(); // Filter plans on client side as fallback
      if (result.success && result.plans) {
        result.plans = result.plans.filter(
          (plan: { accountTypes?: string[] }) =>
            !plan.accountTypes || plan.accountTypes.includes(targetAccountType)
        );
      }

      return result;
    } catch (error) {
      console.error("Error fetching plans for account type:", error);
      return {
        success: false,
        plans: [],
        error: "Failed to fetch subscription plans",
      };
    }
  }

  /**
   * Enhanced subscription creation with account type awareness
   * @param request Enhanced subscription request with account type
   * @returns Promise<SubscriptionCreateResponse> Creation result
   */
  static async createEnhancedSubscription(request: {
    planId: string;
    accountType?: "individual" | "company";
    subscriptionType?: "monthly" | "yearly";
    paymentMethodId?: string;
    companyId?: string;
    teamSize?: number;
  }): Promise<SubscriptionCreateResponse> {
    try {
      // Auto-detect account type if not provided
      const accountType =
        request.accountType || (await this.detectAccountType());

      // Use appropriate endpoint based on account type
      const endpoint =
        accountType === "company"
          ? `${apiUrl}/api/subscription/create-company`
          : `${apiUrl}/api/subscription/create`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...request,
          accountType,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error creating enhanced subscription:", error);
      return {
        success: false,
        error: "Failed to create subscription",
      };
    }
  }

  /**
   * Get company-specific subscription features
   * @returns Array of company features
   */
  static getCompanySubscriptionFeatures(): string[] {
    return [
      "إعلانات غير محدودة",
      "أولوية في نتائج البحث",
      "إحصائيات تفصيلية",
      "دعم فني متقدم",
      "إدارة متعددة المستخدمين",
      "تخصيص صفحة الشركة",
      "إدارة المخزون",
      "تقارير المبيعات",
      "API للتكامل",
      "العلامة التجارية المخصصة",
    ];
  }

  /**
   * Get individual-specific subscription features
   * @returns Array of individual features
   */
  static getIndividualSubscriptionFeatures(): string[] {
    return [
      "تحليل السيارات بالذكاء الاصطناعي",
      "تمييز الإعلانات",
      "دعم فني مميز",
      "إحصائيات متقدمة",
      "إعلانات إضافية",
      "أولوية في البحث",
      "إشعارات فورية",
      "تقارير شخصية",
    ];
  }
  /**
   * Check if current subscription supports company features
   * @param subscription Current subscription data
   * @returns boolean indicating company feature support
   */
  static supportsCompanyFeatures(subscription?: UserSubscription): boolean {
    if (!subscription) return false;

    // Check if plan name indicates company support
    const companyPlans = ["company", "business", "enterprise", "pro"];
    const planName = subscription.planName?.toLowerCase() || "";

    return companyPlans.some((keyword) => planName.includes(keyword));
  }

  // ============================================================================
  // ACCOUNT TYPE MANAGEMENT METHODS
  // ============================================================================

  /**
   * Get current user's account type information
   * @returns Promise<AccountTypeResponse> Account type details
   */
  static async getAccountType(): Promise<AccountTypeResponse> {
    try {
      const response = await fetch(`${apiUrl}/api/subscription/account-type`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to get account type");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error getting account type:", error);
      return {
        success: false,
        accountType: "individual",
        canSwitchAccountType: false,
        error: "Failed to get account type information",
      };
    }
  }

  /**
   * Switch user's account type
   * @param request Account type switch request
   * @returns Promise<AccountTypeSwitchResponse> Switch result
   */
  static async switchAccountType(
    request: AccountTypeSwitchRequest
  ): Promise<AccountTypeSwitchResponse> {
    try {
      const response = await fetch(
        `${apiUrl}/api/subscription/switch-account-type`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to switch account type");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error switching account type:", error);
      return {
        success: false,
        newAccountType: request.targetAccountType,
        error: "Failed to switch account type",
      };
    }
  }

  /**
   * Create a new company
   * @param request Company creation request
   * @returns Promise<CompanyCreateResponse> Creation result
   */
  static async createCompany(
    request: CompanyCreateRequest
  ): Promise<CompanyCreateResponse> {
    try {
      const response = await fetch(`${apiUrl}/api/subscription/companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error("Failed to create company");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error creating company:", error);
      return {
        success: false,
        error: "Failed to create company",
      };
    }
  }

  /**
   * Associate user with an existing company
   * @param request Company association request
   * @returns Promise<CompanyAssociationResponse> Association result
   */
  static async associateWithCompany(
    request: CompanyAssociationRequest
  ): Promise<CompanyAssociationResponse> {
    try {
      const response = await fetch(
        `${apiUrl}/api/subscription/associate-company`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to associate with company");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error associating with company:", error);
      return {
        success: false,
        error: "Failed to associate with company",
      };
    }
  }
  // ============================================================================
  // UTILITY METHODS FOR ACCOUNT TYPE MANAGEMENT
  // ============================================================================

  /**
   * Check if a plan is available for a specific account type
   * @param plan Subscription plan to check
   * @param accountType Target account type
   * @returns boolean indicating availability
   */
  static isPlanAvailableForAccountType(
    plan: SubscriptionPlan,
    accountType: AccountType
  ): boolean {
    if (!plan.targetAudience) return true; // Legacy plans support all types
    return plan.targetAudience.includes(accountType);
  }

  /**
   * Filter plans by account type
   * @param plans Array of subscription plans
   * @param accountType Target account type
   * @returns Filtered array of plans
   */
  static filterPlansByAccountType(
    plans: SubscriptionPlan[],
    accountType: AccountType
  ): SubscriptionPlan[] {
    return plans.filter((plan) =>
      this.isPlanAvailableForAccountType(plan, accountType)
    );
  }

  /**
   * Get features for a specific account type
   * @param accountType Account type
   * @returns Array of features
   */
  static getFeaturesForAccountType(accountType: AccountType): string[] {
    if (accountType === "company") {
      return [
        "إدارة فريق العمل",
        "لوحة تحكم الشركة",
        "تقارير مفصلة",
        "إعلانات غير محدودة",
        "دعم مخصص للشركات",
        "إحصائيات متقدمة",
        "تحليل السوق",
        "أولوية في البحث",
      ];
    }

    return this.getIndividualSubscriptionFeatures();
  }

  // #TODO: Add subscription analytics tracking methods
  // #TODO: Implement subscription usage monitoring
  // #TODO: Add subscription recommendation engine based on usage
  // #TODO: Implement automatic plan suggestions for growing companies
  // #TODO: Add company member management methods
  // #TODO: Implement subscription transfer between account types
}
