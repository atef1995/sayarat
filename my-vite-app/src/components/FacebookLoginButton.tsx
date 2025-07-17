import React from "react";
import { Button } from "antd";
import { FacebookOutlined } from "@ant-design/icons";
import { loadApiConfig } from "../config/apiConfig";

interface FacebookLoginButtonProps {
  loading?: boolean;
  block?: boolean;
  size?: "small" | "middle" | "large";
  className?: string;
  redirectTo?: string;
}

/**
 * Facebook Login Button Component
 * Integrates with Ant Design styling and handles Facebook OAuth redirection
 */
export const FacebookLoginButton: React.FC<FacebookLoginButtonProps> = ({
  loading = false,
  block = false,
  size = "large",
  className = "",
  redirectTo = "/profile",
}) => {
  const handleFacebookLogin = () => {
    try {
      // Store redirect URL for post-login navigation
      if (redirectTo) {
        sessionStorage.setItem("postLoginRedirect", redirectTo);
      }

      // Get the correct API URL and construct the Facebook auth endpoint
      const { apiUrl } = loadApiConfig();
      const facebookAuthUrl = `${apiUrl}/auth/facebook`;

      console.log("Navigating to Facebook auth:", facebookAuthUrl);
      console.log("API URL from config:", apiUrl);

      // Force external navigation by using window.location.replace
      // This ensures React Router doesn't intercept the navigation
      window.location.replace(facebookAuthUrl);
    } catch (error) {
      console.error("Error initiating Facebook login:", error);
      // #TODO: Add proper error handling UI feedback
    }
  };

  return (
    <Button
      icon={<FacebookOutlined />}
      onClick={handleFacebookLogin}
      loading={loading}
      block={block}
      size={size}
      className={`facebook-login-btn ${className}`}
      style={{
        backgroundColor: "#1877f2",
        borderColor: "#1877f2",
        color: "white",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.backgroundColor = "#166fe5";
          e.currentTarget.style.borderColor = "#166fe5";
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.backgroundColor = "#1877f2";
          e.currentTarget.style.borderColor = "#1877f2";
        }
      }}
    >
      تسجيل الدخول عبر فيسبوك
    </Button>
  );
};

export default FacebookLoginButton;
