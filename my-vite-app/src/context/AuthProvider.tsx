import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { User, ApiResponse, AuthCheckResponse } from "../types/api.types";
import { loadApiConfig } from "../config/apiConfig";

const { apiUrl } = loadApiConfig();

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionCheckInterval, setSessionCheckInterval] =
    useState<NodeJS.Timeout | null>(null);
  console.log("isauth:", isAuthenticated);

  const checkSession = async () => {
    if (!localStorage.getItem("isAuthenticated")) return;
    try {
      const response = await fetch(`${apiUrl}/api/auth/check`, {
        credentials: "include",
      });

      if (!response.ok) {
        console.log("Session check failed, logging out");

        await logout();
        return;
      }
      const data: AuthCheckResponse = await response.json();
      console.log("Session check response:", data);
      console.log("User data from auth check:", data.user);
      console.log("User accountType:", data.user?.accountType);
      console.log("User isCompany:", data.user?.isCompany);

      // Update auth state based on response

      setUser(data.user ?? null);
      setIsAuthenticated(data.isAuthenticated ?? false);
      localStorage.setItem("isAuthenticated", "true");
    } catch (error) {
      console.error("Session check failed:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    checkSession();
    setIsAuthenticated(isAuth === "true");

    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, []);

  const login = async (
    username: User["username"],
    password: string
  ): Promise<ApiResponse> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data: ApiResponse = await response.json();
      console.log({ data });

      if (response.ok && data.success) {
        setUser(data.user as User);
        console.log("user data:", data.user);

        setIsAuthenticated(true);
        localStorage.setItem("isAuthenticated", "true");

        // Set session check interval
        const interval = setInterval(checkSession, 5 * 60 * 1000);
        setSessionCheckInterval(interval);
        setUser(data.user as User);
      } else {
        throw new Error(data.error || "Login failed");
      }
      return data;
    } catch (err) {
      setError(err as string);
      return { success: false, error: err as string };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("isAuthenticated");

      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
      // if (!response.ok) {
      //   throw Error("error logging out");
      // }
    } catch (err) {
      setError("Failed to logout");
      console.error(err);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        error,
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
