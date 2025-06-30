/**
 * Utility functions for handling company-related logic
 * Implements DRY principles and modular architecture
 */

import { CarCardProps, SubscriptionStatus, SubscriptionPlan } from "../types";

/**
 * Determines if a listing should display company information
 * @param listing - Car listing data
 * @returns boolean indicating if company info should be shown
 */
export function shouldDisplayCompanyInfo(listing: CarCardProps): boolean {
  return Boolean(
    listing.is_company &&
      listing.company_name &&
      listing.company_name.trim().length > 0
  );
}

/**
 * Gets the display name for a seller (individual or company)
 * @param listing - Car listing data
 * @returns string with appropriate display name
 */
export function getSellerDisplayName(listing: CarCardProps): string {
  if (shouldDisplayCompanyInfo(listing)) {
    return listing.company_name!;
  }

  return listing.seller_name || listing.seller_username || "Unknown Seller";
}

/**
 * Gets company logo URL with fallback handling
 * @param listing - Car listing data
 * @returns string with logo URL or null
 */
export function getCompanyLogoUrl(listing: CarCardProps): string | null {
  if (!shouldDisplayCompanyInfo(listing)) {
    return null;
  }

  return listing.company_logo || null;
}

/**
 * Company badge configuration interface
 */
export interface CompanyBadgeConfig {
  show: boolean;
  name: string;
  logoUrl: string | null;
  className: string;
}

/**
 * Creates a company badge configuration
 * @param listing - Car listing data
 * @returns object with badge configuration or null
 */
export function getCompanyBadgeConfig(
  listing: CarCardProps
): CompanyBadgeConfig | null {
  if (!shouldDisplayCompanyInfo(listing)) {
    return null;
  }

  return {
    show: true,
    name: listing.company_name!,
    logoUrl: getCompanyLogoUrl(listing),
    className:
      "flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full text-[0.5rem] border border-blue-200 dark:border-blue-700",
  };
}

/**
 * Validates company data structure
 * @param listing - Car listing data
 * @returns boolean indicating if company data is valid
 */
export function isValidCompanyData(listing: CarCardProps): boolean {
  if (!listing.is_company) {
    return true; // Valid for individual sellers
  }

  // For company sellers, validate required fields
  return Boolean(
    listing.company_name &&
      listing.company_name.trim().length > 0 &&
      listing.company_name.length <= 255 // Reasonable length limit
  );
}

/**
 * Display variant types
 */
export type DisplayVariant = "badge" | "card" | "minimal";

/**
 * Display configuration interface
 */
export interface DisplayConfig {
  show: boolean;
  name: string;
  logoUrl: string | null;
  className: string;
  showLogo: boolean;
  showIcon: boolean;
  showDescription?: boolean;
}

/**
 * Factory pattern for creating company display components
 */
export class CompanyDisplayFactory {
  /**
   * Creates appropriate display element based on listing type
   * @param listing - Car listing data
   * @param variant - Display variant
   * @returns JSX element configuration
   */
  static createDisplayConfig(
    listing: CarCardProps,
    variant: DisplayVariant = "badge"
  ): DisplayConfig | null {
    const config = getCompanyBadgeConfig(listing);

    if (!config) {
      return null;
    }

    const baseConfig: DisplayConfig = {
      ...config,
      showLogo: true,
      showIcon: true,
    };

    switch (variant) {
      case "card":
        return {
          ...baseConfig,
          className:
            "bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm",
          showDescription: true,
        };
      case "minimal":
        return {
          ...baseConfig,
          className: "text-xs text-gray-600 dark:text-gray-400",
          showLogo: false,
          showIcon: false,
        };
      case "badge":
      default:
        return baseConfig;
    }
  }
}

/**
 * Type guard for company listings
 * @param listing - Car listing data
 * @returns boolean indicating if this is a company listing
 */
export function isCompanyListing(listing: CarCardProps): boolean {
  return shouldDisplayCompanyInfo(listing);
}

/**
 * Error boundary helper for company data
 * @param listing - Car listing data
 * @returns Error object if validation fails, null otherwise
 */
export function validateCompanyData(listing: CarCardProps): Error | null {
  try {
    if (!isValidCompanyData(listing)) {
      return new Error(`Invalid company data for listing ${listing.id}`);
    }
    return null;
  } catch (error) {
    return error instanceof Error
      ? error
      : new Error("Unknown company data validation error");
  }
}

/**
 * Subscription utilities for company badges
 * Implements SOLID principles for subscription-based features
 */

/**
 * Determines if a company has an active subscription
 * @param listing - Car listing data
 * @returns boolean indicating if subscription is active
 */
export function hasActiveSubscription(listing: CarCardProps): boolean {
  return listing.subscription_status === SubscriptionStatus.ACTIVE;
}

/**
 * Determines if a company is verified
 * @param listing - Car listing data
 * @returns boolean indicating if company is verified
 */
export function isVerifiedCompany(listing: CarCardProps): boolean {
  return Boolean(listing.is_verified);
}

/**
 * Gets subscription badge type based on plan and status
 * @param listing - Car listing data
 * @returns badge type or null
 */
export function getSubscriptionBadgeType(
  listing: CarCardProps
): "premium" | "company" | null {
  if (!shouldDisplayCompanyInfo(listing)) {
    return null;
  }

  // Premium badge for premium/enterprise plans with active subscription
  if (
    hasActiveSubscription(listing) &&
    (listing.subscription_plan === SubscriptionPlan.PREMIUM ||
      listing.subscription_plan === SubscriptionPlan.ENTERPRISE)
  ) {
    return "premium";
  }

  // Company badge for basic plans or verified companies
  if (hasActiveSubscription(listing) || isVerifiedCompany(listing)) {
    return "company";
  }

  return null;
}

/**
 * Determines if subscription badge should be shown
 * @param listing - Car listing data
 * @returns boolean indicating if badge should be displayed
 */
export function shouldShowSubscriptionBadge(listing: CarCardProps): boolean {
  return getSubscriptionBadgeType(listing) !== null;
}

/**
 * Gets subscription status display text
 * @param listing - Car listing data
 * @returns status text for display
 */
export function getSubscriptionStatusText(listing: CarCardProps): string {
  if (!listing.subscription_status) {
    return "";
  }

  const statusMap: Record<string, string> = {
    [SubscriptionStatus.ACTIVE]: "نشط",
    [SubscriptionStatus.PENDING]: "معلق",
    [SubscriptionStatus.EXPIRED]: "منتهي",
    [SubscriptionStatus.INACTIVE]: "غير نشط",
  };

  return statusMap[listing.subscription_status] || "";
}

/**
 * Enhanced company badge configuration interface including subscription
 */
export interface EnhancedCompanyBadgeConfig extends CompanyBadgeConfig {
  subscriptionBadgeType?: "premium" | "company" | null;
  isVerified?: boolean;
  hasActiveSubscription?: boolean;
  subscriptionStatusText?: string;
  showSubscriptionBadge?: boolean;
}

/**
 * Creates enhanced company badge configuration with subscription support
 * @param listing - Car listing data
 * @returns enhanced badge configuration or null
 */
export function getEnhancedCompanyBadgeConfig(
  listing: CarCardProps
): EnhancedCompanyBadgeConfig | null {
  const baseConfig = getCompanyBadgeConfig(listing);

  if (!baseConfig) {
    return null;
  }

  return {
    ...baseConfig,
    subscriptionBadgeType: getSubscriptionBadgeType(listing),
    isVerified: isVerifiedCompany(listing),
    hasActiveSubscription: hasActiveSubscription(listing),
    subscriptionStatusText: getSubscriptionStatusText(listing),
    showSubscriptionBadge: shouldShowSubscriptionBadge(listing),
  };
}

/**
 * #TODO: Add caching mechanism for frequently accessed company data
 * #TODO: Add localization support for company display text
 * #TODO: Add analytics tracking for company listing interactions
 * #TODO: Implement lazy loading for company logos
 */
