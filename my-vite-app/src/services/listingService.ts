import { message } from "antd";
import { CarInfo } from "../types";
import { loadApiConfig } from "../config/apiConfig";

interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  timeoutMs: number;
}

export class ListingService {
  private apiUrl: string;
  private defaultRetryOptions: RetryOptions = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    timeoutMs: 60000, // 60 seconds
  };

  constructor() {
    this.apiUrl = loadApiConfig().apiUrl;
  }

  /**
   * Enhanced fetch with timeout and retry logic
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retryOptions: Partial<RetryOptions> = {}
  ): Promise<Response> {
    const config = { ...this.defaultRetryOptions, ...retryOptions };
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${config.maxRetries} for ${url}`);

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          config.timeoutMs
        );

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // If response is ok, return it
        if (response.ok) {
          console.log(`✅ Success on attempt ${attempt}`);
          return response;
        }

        // If it's a client error (4xx), don't retry
        if (response.status >= 400 && response.status < 500) {
          console.log(`❌ Client error ${response.status}, not retrying`);
          return response;
        }

        // For server errors (5xx), prepare for retry
        lastError = new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
        console.log(
          `⚠️ Server error on attempt ${attempt}:`,
          lastError.message
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a timeout or network error
        if (lastError.name === "AbortError") {
          console.log(
            `⏱️ Timeout on attempt ${attempt} (${config.timeoutMs}ms)`
          );
        } else {
          console.log(
            `🌐 Network error on attempt ${attempt}:`,
            lastError.message
          );
        }
      }

      // Wait before retrying (except on last attempt)
      if (attempt < config.maxRetries) {
        const delay = config.retryDelay * attempt; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // All retries failed
    console.error(`❌ All ${config.maxRetries} attempts failed`);
    throw lastError!;
  }
  async createListing(formData: FormData): Promise<boolean> {
    try {
      console.log("🚀 Starting listing creation with retry logic...");

      const response = await this.fetchWithRetry(
        `${this.apiUrl}/listings/create-listing`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
        {
          maxRetries: 3,
          retryDelay: 2000, // 2 seconds for listing creation
          timeoutMs: 90000, // 90 seconds for file uploads
        }
      );

      console.log(
        `📡 Response received: ${response.status} ${response.statusText}`
      );

      // Handle JSON parsing with better error handling
      let data;
      try {
        const responseText = await response.text();
        console.log(`📄 Response size: ${responseText.length} chars`);
        data = JSON.parse(responseText);
        console.log(`📋 Parsed response:`, data);
      } catch (parseError) {
        console.error("❌ JSON parsing failed:", parseError);
        throw new Error("Invalid response format from server");
      }

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

      console.log("✅ Listing created successfully:", data);
      message.success("تم نشر السيارة بنجاح");
      return true;
    } catch (error) {
      console.error("❌ Error creating listing:", error);

      // Don't show generic error message for limit exceeded - let the component handle it
      if (
        error instanceof Error &&
        error.message === "listing_limit_exceeded"
      ) {
        throw error;
      }

      // Check if it's a network/timeout error
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          message.error("انتهت مهلة الطلب. يرجى المحاولة مرة أخرى");
        } else if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError")
        ) {
          message.error("مشكلة في الاتصال. يرجى التحقق من الإنترنت");
        } else if (error.message.includes("Invalid response format")) {
          message.error("خطأ في استجابة الخادم. يرجى المحاولة مرة أخرى");
        } else {
          message.error("حدث خطأ أثناء نشر السيارة");
        }
      }

      return false;
    }
  }
  async updateListing(listingId: string, formData: FormData): Promise<boolean> {
    try {
      console.log("🔄 Starting listing update with retry logic...");

      const response = await this.fetchWithRetry(
        `${this.apiUrl}/listings/update/${listingId}`,
        {
          method: "PUT",
          credentials: "include",
          body: formData,
        },
        {
          maxRetries: 3,
          retryDelay: 2000,
          timeoutMs: 90000,
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

      console.log("✅ Listing updated successfully:", data);
      message.success("تم تحديث الإعلان بنجاح");
      return true;
    } catch (error) {
      console.error("❌ Error updating listing:", error);

      // Don't show generic error message for limit exceeded - let the component handle it
      if (
        error instanceof Error &&
        error.message === "listing_limit_exceeded"
      ) {
        throw error;
      }

      // Check if it's a network/timeout error
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          message.error("انتهت مهلة الطلب. يرجى المحاولة مرة أخرى");
        } else if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError")
        ) {
          message.error("مشكلة في الاتصال. يرجى التحقق من الإنترنت");
        } else {
          message.error("حدث خطأ أثناء تحديث الإعلان");
        }
      }

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
