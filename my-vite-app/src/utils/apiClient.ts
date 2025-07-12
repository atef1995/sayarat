/**
 * Generic API Client Utility
 *
 * Handles HTTP requests with proper error handling, authentication,
 * and follows modular architecture principles.
 * Implements Singleton pattern for configuration management.
 */

import { loadApiConfig } from "../config/apiConfig";

// #TODO: Add request/response interceptors for logging and monitoring
// #TODO: Implement request retry mechanism with exponential backoff
// #TODO: Add request caching layer for GET requests

/**
 * API Request Configuration Interface
 */
export interface ApiRequestConfig extends RequestInit {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

/**
 * API Response Interface with generic typing
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * API Error Class for better error handling
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly response?: Response;

  constructor(
    message: string,
    status: number,
    statusText: string,
    response?: Response
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }
}

/**
 * Generic API Client Class implementing Singleton pattern
 */
class ApiClient {
  private static instance: ApiClient;
  private readonly baseUrl: string;

  private constructor() {
    const { apiUrl } = loadApiConfig();
    this.baseUrl = apiUrl;
  }

  /**
   * Get singleton instance of ApiClient
   */
  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Type guard for File objects
   */
  private isFile(value: unknown): value is File {
    return (
      typeof value === "object" &&
      value !== null &&
      "name" in value &&
      "size" in value &&
      "type" in value
    );
  }

  /**
   * Generic API request method with comprehensive error handling
   */
  public async request<TResponse = unknown>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<TResponse> {
    try {
      const defaultHeaders: HeadersInit = {};

      // Only set Content-Type if body is not FormData
      if (!(config.body instanceof FormData)) {
        defaultHeaders["Content-Type"] = "application/json";
      }

      const requestConfig: RequestInit = {
        ...config,
        credentials: "include", // Include session cookies for authentication
        headers: {
          ...defaultHeaders,
          ...config.headers,
        },
      };

      const url = config.baseUrl
        ? `${config.baseUrl}${endpoint}`
        : `${this.baseUrl}${endpoint}`;

      const response = await fetch(url, requestConfig);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error ||
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          response
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors and other exceptions
      console.error("API request failed:", error);
      throw new ApiError(
        error instanceof Error ? error.message : "Unknown API error",
        0,
        "Network Error"
      );
    }
  }

  /**
   * GET request method
   */
  public async get<TResponse = unknown>(
    endpoint: string,
    config?: Omit<ApiRequestConfig, "method" | "body">
  ): Promise<TResponse> {
    return this.request<TResponse>(endpoint, { ...config, method: "GET" });
  }

  /**
   * POST request method
   */
  public async post<TResponse = unknown>(
    endpoint: string,
    data?: unknown,
    config?: Omit<ApiRequestConfig, "method" | "body">
  ): Promise<TResponse> {
    let body: BodyInit | undefined;

    if (data instanceof FormData) {
      body = data;
    } else if (data) {
      body = JSON.stringify(data);
    }

    return this.request<TResponse>(endpoint, {
      ...config,
      method: "POST",
      body,
    });
  }

  /**
   * PUT request method
   */
  public async put<TResponse = unknown>(
    endpoint: string,
    data?: unknown,
    config?: Omit<ApiRequestConfig, "method" | "body">
  ): Promise<TResponse> {
    let body: BodyInit | undefined;

    if (data instanceof FormData) {
      body = data;
    } else if (data) {
      body = JSON.stringify(data);
    }

    return this.request<TResponse>(endpoint, {
      ...config,
      method: "PUT",
      body,
    });
  }

  /**
   * DELETE request method
   */
  public async delete<TResponse = unknown>(
    endpoint: string,
    config?: Omit<ApiRequestConfig, "method" | "body">
  ): Promise<TResponse> {
    return this.request<TResponse>(endpoint, { ...config, method: "DELETE" });
  }

  /**
   * Create FormData from object, handling File objects properly
   */
  public createFormData(data: Record<string, unknown>): FormData {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (this.isFile(value)) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return formData;
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Export error handling utilities
export const isNetworkError = (error: Error | ApiError): boolean => {
  return error instanceof ApiError && error.status === 0;
};

export const isAuthError = (error: Error | ApiError): boolean => {
  return error instanceof ApiError && error.status === 401;
};

export const isValidationError = (error: Error | ApiError): boolean => {
  return error instanceof ApiError && error.status === 400;
};

export const isServerError = (error: Error | ApiError): boolean => {
  return error instanceof ApiError && error.status >= 500;
};
