import { User } from "./api.types";

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
  permissions: {
    isAdmin: boolean;
    isCompany: boolean;
    isIndividual: boolean;
    canCreatePosts: boolean;
    canManageUsers: boolean;
    canAccessDashboard: boolean;
  };
  isLoggingIn: boolean;
  isLoggingOut: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
}

export interface AuthCheckResponse extends AuthResponse {
  isAuthenticated: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  sessionId?: string;
}

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

// Storage keys
export const AUTH_STORAGE_KEY = "auth_state";
export const SESSION_KEY = "session_id";

// Query keys
export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  user: () => [...authKeys.all, "user"] as const,
} as const;
