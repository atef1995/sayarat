import { loadApiConfig } from "../config/apiConfig";

const { apiUrl } = loadApiConfig();

export interface ListingStatus {
  canCreate: boolean;
  reason: string;
  activeListings: number;
  remainingListings: number | null;
  totalLimit: number | null;
  accountType: "personal" | "company";
  hasActivePremium: boolean;
}

export interface ListingStatusResponse {
  success: boolean;
  status: ListingStatus;
  error?: string;
}

export class ListingLimitService {
  /**
   * Check if user can create a new listing
   */
  static async checkListingStatus(): Promise<ListingStatusResponse> {
    try {
      const response = await fetch(`${apiUrl}/listings/status`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check listing status");
      }

      return data;
    } catch (error) {
      console.error("Error checking listing status:", error);
      return {
        success: false,
        status: {
          canCreate: false,
          reason: "error",
          activeListings: 0,
          remainingListings: null,
          totalLimit: null,
          accountType: "personal",
          hasActivePremium: false,
        },
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get user-friendly message based on listing status
   */
  static getStatusMessage(status: ListingStatus): string {
    if (status.accountType === "company") {
      return "حساب الشركة - إعلانات غير محدودة";
    }

    if (status.hasActivePremium) {
      return "اشتراك مميز - إعلانات غير محدودة";
    }

    if (status.canCreate && status.remainingListings !== null) {
      return `متبقي ${status.remainingListings} إعلانات مجانية من أصل ${status.totalLimit}`;
    }

    if (!status.canCreate && status.reason === "limit_exceeded") {
      return `لقد استنفدت الحد المسموح من الإعلانات المجانية (${status.totalLimit}). اشترك للحصول على إعلانات غير محدودة.`;
    }

    return "تحقق من حالة الإعلانات";
  }

  /**
   * Check if user needs subscription modal
   */
  static needsSubscription(status: ListingStatus): boolean {
    return (
      !status.canCreate &&
      status.reason === "limit_exceeded" &&
      status.accountType !== "company" &&
      !status.hasActivePremium
    );
  }
}
