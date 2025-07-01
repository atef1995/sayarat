import { message } from "antd";
import { CarInfo } from "../types";
import { loadApiConfig } from "../config/apiConfig";

export class ListingService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = loadApiConfig().apiUrl;
  }
  async createListing(formData: FormData): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/listings/create-listing`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a listing limit error
        if (
          response.status === 403 &&
          data.error === "listing_limit_exceeded"
        ) {
          throw new Error("listing_limit_exceeded");
        }
        throw new Error(data.message || "Failed to create listing");
      }

      console.log("Response:", data);
      message.success("تم نشر السيارة بنجاح");
      return true;
    } catch (error) {
      console.error("Error creating listing:", error);

      // Don't show generic error message for limit exceeded - let the component handle it
      if (
        error instanceof Error &&
        error.message === "listing_limit_exceeded"
      ) {
        throw error;
      }

      message.error("حدث خطأ أثناء نشر السيارة");
      return false;
    }
  }
  async updateListing(listingId: string, formData: FormData): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiUrl}/listings/update/${listingId}`,
        {
          method: "PUT",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a listing limit error
        if (
          response.status === 403 &&
          data.error === "listing_limit_exceeded"
        ) {
          throw new Error("listing_limit_exceeded");
        }
        throw new Error(data.message || "Failed to update listing");
      }

      console.log("Update response:", data);
      message.success("تم تحديث الإعلان بنجاح");
      return true;
    } catch (error) {
      console.error("Error updating listing:", error);

      // Don't show generic error message for limit exceeded - let the component handle it
      if (
        error instanceof Error &&
        error.message === "listing_limit_exceeded"
      ) {
        throw error;
      }

      message.error("حدث خطأ أثناء تحديث الإعلان");
      return false;
    }
  }
  async submitListing(
    formData: FormData,
    initialValues?: CarInfo,
    hasProducts: boolean = false
  ): Promise<boolean> {
    const isUpdate = !!initialValues;

    try {
      const success = isUpdate
        ? await this.updateListing(initialValues.id.toString(), formData)
        : await this.createListing(formData);

      if (success && hasProducts) {
        message.info("سيتم توجيهك إلى صفحة الدفع", 5);
        message.info("سيتم نشر السيارة بعد الدفع بنجاح", 5);
      }

      return success;
    } catch (error) {
      console.error("Error submitting listing:", error);

      // Re-throw listing limit errors so the component can handle them
      if (
        error instanceof Error &&
        error.message === "listing_limit_exceeded"
      ) {
        throw error;
      }

      return false;
    }
  }
}

export const listingService = new ListingService();
