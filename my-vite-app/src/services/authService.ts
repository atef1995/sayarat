import { loadApiConfig } from "../config/apiConfig";
import {
  LoginCredentials,
  AuthResponse,
  AuthCheckResponse,
  AuthState,
  AUTH_STORAGE_KEY,
} from "../types/auth.types";
import { User } from "../types/api.types";

const { apiUrl } = loadApiConfig();

/**
 * AuthService - Centralized authentication service
 *
 * Handles all authentication-related API calls and state management
 * Enhanced with rate limiting to prevent infinite loops
 */
export class AuthService {
  private static instance: AuthService;
  private lastSessionCheck: number = 0;
  private sessionCheckThrottle: number = 5000; // 5 seconds minimum between calls

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Login user with credentials
   * Enhanced with better error handling and debugging
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Validate credentials before sending
      if (!credentials || !credentials.username || !credentials.password) {
        throw new Error("Username and password are required");
      }

      // Clean the credentials object to ensure no unexpected properties
      const cleanCredentials = {
        username: String(credentials.username).trim(),
        password: String(credentials.password).trim(),
      };

      console.log("Attempting login for:", cleanCredentials.username);

      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(cleanCredentials),
      });

      // Check if response is ok first
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Login response error:", response.status, errorText);
        throw new Error(`Login failed: ${response.status} - ${errorText}`);
      }

      const data: AuthResponse = await response.json();

      if (data.success && data.user) {
        this.saveAuthState({
          user: data.user,
          isAuthenticated: true,
        });
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);

      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Network error: Unable to connect to server");
      }

      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        throw new Error("Server response error: Invalid response format");
      }

      throw error instanceof Error ? error : new Error("Login failed");
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with local logout even if server logout fails
    } finally {
      this.clearAuthState();
    }
  }

  /**
   * Check current session status with throttling to prevent infinite loops
   */
  async checkSession(): Promise<AuthCheckResponse> {
    const now = Date.now();

    // Throttle session checks to prevent excessive API calls
    if (now - this.lastSessionCheck < this.sessionCheckThrottle) {
      console.warn("Session check throttled to prevent excessive API calls");

      // Return cached state if available
      const cachedState = this.getAuthState();
      if (cachedState) {
        return {
          success: true,
          isAuthenticated: cachedState.isAuthenticated,
          user: cachedState.user || undefined,
        };
      }

      // Return default unauthenticated state
      return {
        success: false,
        isAuthenticated: false,
        error: "Throttled",
      };
    }

    this.lastSessionCheck = now;

    try {
      const response = await fetch(`${apiUrl}/auth/check`, {
        credentials: "include",
      });

      if (!response.ok) {
        // Session is invalid, clear local state
        this.clearAuthState();
        return {
          success: false,
          isAuthenticated: false,
          error: "Session invalid",
        };
      }

      const data: AuthCheckResponse = await response.json();

      if (data.success && data.isAuthenticated && data.user) {
        this.saveAuthState({
          user: data.user,
          isAuthenticated: true,
        });
      } else {
        this.clearAuthState();
      }

      return data;
    } catch (error) {
      console.error("Session check error:", error);
      this.clearAuthState();
      throw error instanceof Error ? error : new Error("Session check failed");
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch(`${apiUrl}/auth/profile`, {
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user || null;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  }

  /**
   * Save authentication state to localStorage
   */
  private saveAuthState(authState: AuthState): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    } catch (error) {
      console.error("Failed to save auth state:", error);
    }
  }

  /**
   * Get authentication state from localStorage
   */
  getAuthState(): AuthState | null {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to get auth state:", error);
      return null;
    }
  }

  /**
   * Clear authentication state from localStorage
   */
  private clearAuthState(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear auth state:", error);
    }
  }

  /**
   * Check if user is authenticated based on stored state
   */
  isAuthenticated(): boolean {
    const authState = this.getAuthState();
    return authState?.isAuthenticated ?? false;
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const authState = this.getAuthState();
    return authState?.user ?? null;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
