import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { authService } from "../services/authService";
import {
  LoginCredentials,
  AuthResponse,
  AuthCheckResponse,
  authKeys,
} from "../types/auth.types";

/**
 * Hook for session check query
 * Optimized to prevent infinite loops and excessive API calls
 */
export const useSessionQuery = () => {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: () => authService.checkSession(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry 401 (unauthorized) or 429 (rate limit) errors
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;
        if (status === 401 || status === 429) {
          return false;
        }
      }
      return failureCount < 1; // Only retry once for other errors
    },
    retryOnMount: false, // Don't retry immediately on mount
    refetchOnWindowFocus: false, // Disable focus refetch to prevent loops
    refetchOnReconnect: true,
    refetchInterval: false, // Disable automatic refetching
    select: (data: AuthCheckResponse) => ({
      isAuthenticated: data.isAuthenticated,
      user: data.user || null,
      error: data.error || null,
    }),
  });
};

/**
 * Hook for user profile query
 * Optimized to prevent excessive API calls
 */
export const useUserQuery = (enabled = true) => {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => authService.getCurrentUser(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - longer stale time for user data
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error) => {
      // Don't retry 401 (unauthorized) or 429 (rate limit) errors
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;
        if (status === 401 || status === 429) {
          return false;
        }
      }
      return failureCount < 1;
    },
    refetchOnWindowFocus: false, // Disable to prevent loops
    refetchInterval: false, // Disable automatic refetching
  });
};

/**
 * Hook for login mutation
 */
export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials): Promise<AuthResponse> =>
      authService.login(credentials),
    onSuccess: (data) => {
      if (data.success && data.user) {
        // Invalidate auth queries to refetch with new data
        queryClient.invalidateQueries({ queryKey: authKeys.all });

        // Set user data in cache
        queryClient.setQueryData(authKeys.user(), data.user);
        queryClient.setQueryData(authKeys.session(), {
          isAuthenticated: true,
          user: data.user,
          error: null,
        });

        message.success(data.message || "تم تسجيل الدخول بنجاح");
      }
    },
    onError: (error: Error) => {
      console.error("Login failed:", error);
      message.error(error.message || "فشل في تسجيل الدخول");

      // Clear any stale auth data
      queryClient.setQueryData(authKeys.session(), {
        isAuthenticated: false,
        user: null,
        error: error.message,
      });
    },
  });
};

/**
 * Hook for logout mutation
 */
export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: authKeys.all });

      // Set logged out state
      queryClient.setQueryData(authKeys.session(), {
        isAuthenticated: false,
        user: null,
        error: null,
      });

      message.success("تم تسجيل الخروج بنجاح");
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);

      // Even if logout fails, clear local state
      queryClient.removeQueries({ queryKey: authKeys.all });
      queryClient.setQueryData(authKeys.session(), {
        isAuthenticated: false,
        user: null,
        error: null,
      });

      message.warning("تم تسجيل الخروج محلياً");
    },
  });
};

/**
 * Hook for checking if user has specific permissions
 */
export const useUserPermissions = () => {
  const { data: user } = useUserQuery();

  return {
    isAdmin: user?.isAdmin === true,
    isCompany: user?.isCompany === true,
    isIndividual: user?.accountType === "personal",
    canCreatePosts: user?.isAdmin === true || user?.isCompany === true,
    canManageUsers: user?.isAdmin === true,
    canAccessDashboard: user?.isAdmin === true || user?.isCompany === true,
  };
};

/**
 * Hook for session management with automatic refresh
 * Fixed to prevent infinite loops
 */
export const useSessionManager = () => {
  const queryClient = useQueryClient();

  // Auto-refresh session every 30 minutes with proper handling
  return useQuery({
    queryKey: ["sessionRefresh"],
    queryFn: async () => {
      try {
        const data = await authService.checkSession();

        // Only update cache if session is valid
        if (data.success && data.isAuthenticated && data.user) {
          queryClient.setQueryData(authKeys.session(), {
            isAuthenticated: true,
            user: data.user,
            error: null,
          });
        } else if (!data.isAuthenticated) {
          // Session expired, clear auth state
          queryClient.removeQueries({ queryKey: authKeys.all });
        }

        return data;
      } catch (error) {
        // Session check failed, clear auth state
        queryClient.removeQueries({ queryKey: authKeys.all });
        throw error;
      }
    },
    refetchInterval: 30 * 60 * 1000, // 30 minutes
    refetchIntervalInBackground: false,
    enabled: authService.isAuthenticated(),
    retry: false, // Don't retry failed session checks
    gcTime: 0, // Don't cache failed session checks
  });
};

/**
 * Combined auth hook that provides all auth functionality
 * Fixed to prevent infinite loops
 */
export const useAuth = () => {
  const sessionQuery = useSessionQuery();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const permissions = useUserPermissions();

  // Disable session manager temporarily to fix infinite loop
  // useSessionManager();

  const queryClient = useQueryClient();

  return {
    // State
    isAuthenticated: sessionQuery.data?.isAuthenticated ?? false,
    user: sessionQuery.data?.user ?? null,
    isLoading: sessionQuery.isLoading || loginMutation.isPending,
    error: sessionQuery.data?.error || loginMutation.error?.message || null,

    // Actions
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    checkSession: () => sessionQuery.refetch(),
    clearError: () => {
      queryClient.setQueryData(authKeys.session(), (old: unknown) => ({
        ...(old as object),
        error: null,
      }));
    },

    // Permissions
    permissions,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
};
