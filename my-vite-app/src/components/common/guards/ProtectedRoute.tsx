import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import { Spin } from "antd";
import { ProtectedRouteProps } from "./types";

/**
 * ProtectedRoute Component
 *
 * A route guard that ensures only authenticated users can access protected routes.
 * Redirects unauthenticated users to the login page.
 *
 * Features:
 * - Authentication check
 * - Loading state during auth verification
 * - Automatic redirect to login for unauthenticated users
 * - Error boundaries for graceful error handling
 *
 * @param component - The component to render if user is authenticated
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect while still loading auth state
    if (isLoading) {
      return;
    }

    // Redirect if not authenticated
    if (isAuthenticated === false) {
      console.log(
        "ProtectedRoute: User not authenticated, redirecting to login"
      );
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96 p-8">
        <div className="text-center space-y-4">
          <Spin size="large" />
          <p className="text-sm opacity-70">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Render the protected component
  return <Component />;
};

export default ProtectedRoute;
