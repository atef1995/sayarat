import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import {
  AuthContextType,
  LoginCredentials,
  AuthResponse,
  AUTH_STORAGE_KEY,
} from "../types/auth.types";

/**
 * AuthProviderContent - Internal component that provides auth context
 * This is separated to use hooks after QueryClientProvider is available
 * Enhanced for Samsung Internet browser compatibility
 */
const AuthProviderContent = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  const [initAttempted, setInitAttempted] = useState(false);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (initAttempted) return;
      setInitAttempted(true);

      try {
        const storedAuth = authService.getAuthState();
        console.log("Stored auth state:", storedAuth);

        if (storedAuth?.isAuthenticated) {
          // For Samsung Internet, add a delay to ensure cookies are available
          const isSamsungBrowser =
            navigator.userAgent.includes("SamsungBrowser");
          if (isSamsungBrowser) {
            console.log(
              "Samsung Internet detected, adding initialization delay"
            );
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          // Only check session if we're not already loading and data is stale
          if (!auth.isLoading && auth.user === null) {
            console.log("Checking session after page refresh");
            await auth.checkSession();
          }
        } else {
          console.log("No stored auth state found");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear potentially corrupted auth state
        if (authService.getAuthState()) {
          localStorage.removeItem("auth_state");
        }
      }
    };

    // Only initialize if not already authenticated or loading
    if (!auth.isAuthenticated && !auth.isLoading && !initAttempted) {
      initializeAuth();
    }
    // Use a more stable dependency array to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, auth.isLoading, initAttempted]);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (initAttempted) return;
      setInitAttempted(true);

      try {
        const storedAuth = authService.getAuthState();
        console.log("Stored auth state:", storedAuth);

        if (storedAuth?.isAuthenticated) {
          // For Samsung Internet, add a delay to ensure cookies are available
          const isSamsungBrowser =
            navigator.userAgent.includes("SamsungBrowser");
          if (isSamsungBrowser) {
            console.log(
              "Samsung Internet detected, adding initialization delay"
            );
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          // Only check session if we're not already loading and data is stale
          if (!auth.isLoading && auth.user === null) {
            console.log("Checking session after page refresh");
            await auth.checkSession();
          }
        } else {
          console.log("No stored auth state found");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear potentially corrupted auth state
        if (authService.getAuthState()) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    };

    // Only initialize if not already authenticated or loading
    if (!auth.isAuthenticated && !auth.isLoading && !initAttempted) {
      initializeAuth();
    }
    // Use a more stable dependency array to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, auth.isLoading, initAttempted]);

  // Create adapter to match AuthContextType interface
  const authContextValue: AuthContextType = {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
    error: auth.error,
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      return await auth.login(credentials);
    },
    logout: async (): Promise<void> => {
      await auth.logout();
    },
    checkSession: async (): Promise<void> => {
      await auth.checkSession();
    },
    clearError: auth.clearError,
    permissions: auth.permissions,
    isLoggingIn: auth.isLoggingIn,
    isLoggingOut: auth.isLoggingOut,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * AuthProvider - Main authentication provider component
 *
 * Features:
 * - TanStack Query integration for optimized state management
 * - Automatic session validation and refresh
 * - Persistent authentication state
 * - Error handling and retry logic
 *
 * Note: Expects to be wrapped by QueryProvider for TanStack Query context
 */
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <AuthProviderContent>{children}</AuthProviderContent>;
};

export default AuthProvider;
