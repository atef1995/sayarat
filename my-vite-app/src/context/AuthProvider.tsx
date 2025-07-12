import { useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import {
  AuthContextType,
  LoginCredentials,
  AuthResponse,
} from "../types/auth.types";

/**
 * AuthProviderContent - Internal component that provides auth context
 * This is separated to use hooks after QueryClientProvider is available
 * Fixed to prevent infinite loops
 */
const AuthProviderContent = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedAuth = authService.getAuthState();
      if (storedAuth?.isAuthenticated) {
        // Only check session if we're not already loading and data is stale
        if (!auth.isLoading && auth.user === null) {
          await auth.checkSession();
        }
      }
    };

    // Only initialize if not already authenticated or loading
    if (!auth.isAuthenticated && !auth.isLoading) {
      initializeAuth();
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
