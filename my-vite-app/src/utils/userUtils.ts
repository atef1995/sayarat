import { User } from "../types/api.types";

/**
 * Utility functions for user-related operations
 */

/**
 * @deprecated Use the unified account system instead
 *
 * MIGRATION GUIDE:
 * ================
 *
 * OLD: isCompanyUser(userDetails)
 * NEW: subscriptionData?.accountType === 'company'
 *
 * The new unified account system provides real-time account type detection
 * and supports account type switching. Use SubscriptionService.checkSubscription()
 * or SubscriptionService.getAccountType() to get current account information.
 *
 * Example migration:
 * ```tsx
 * // OLD
 * const isCompany = isCompanyUser(userDetails);
 *
 * // NEW
 * const [subscriptionData, setSubscriptionData] = useState(null);
 * useEffect(() => {
 *   SubscriptionService.checkSubscription().then(setSubscriptionData);
 * }, []);
 * const isCompany = subscriptionData?.accountType === 'company';
 * ```
 *
 * #TODO: Remove this function after all components migrate to unified system
 * #TODO: Add runtime warnings for usage in development
 *
 * Check if a user is a company user (LEGACY)
 * @param user - The user object
 * @returns boolean indicating if the user is a company user
 */
export const isCompanyUser = (user: User | null | undefined): boolean => {
  if (import.meta.env.DEV) {
    console.warn(
      "⚠️ DEPRECATION WARNING: isCompanyUser() is deprecated. " +
        'Use the unified account system instead: subscriptionData?.accountType === "company"'
    );
  }

  if (!user) return false;

  console.log("isCompanyUser check (DEPRECATED):", {
    user: user,
    isCompany: user.isCompany,
    accountType: user.accountType,
    hasCompanyId: !!user.companyId,
  });

  // Check multiple possible indicators for company status
  return (
    user.isCompany === true ||
    user.accountType === "company" ||
    // Fallback: if user has a company_id, they're likely a company user
    (user.companyId !== null && user.companyId !== undefined)
  );
};

/**
 * Get display name for a user
 * @param user - The user object
 * @returns formatted display name
 */
export const getUserDisplayName = (user: User | null | undefined): string => {
  if (!user) return "";

  const firstName = user.firstName || "";
  const lastName = user.lastName || "";

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return user.username || user.email || "";
};

/**
 * Check if user has complete profile information
 * @param user - The user object
 * @returns boolean indicating if profile is complete
 */
export const hasCompleteProfile = (user: User | null | undefined): boolean => {
  if (!user) return false;

  return !!(user.firstName && user.lastName && user.email && user.phone);
};
