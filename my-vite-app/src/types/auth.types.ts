import { ApiResponse, User } from "./api.types";

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  login: (username: string, password: string) => Promise<ApiResponse>;
  logout: () => void;
  checkSession: () => Promise<void>;
}
