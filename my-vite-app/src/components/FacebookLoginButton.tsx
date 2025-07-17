import React from "react";
import { Button } from "antd";
import { FacebookOutlined } from "@ant-design/icons";

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
    // Store redirect URL for post-login navigation
    if (redirectTo) {
      sessionStorage.setItem("postLoginRedirect", redirectTo);
    }

    try {
      // Use window.location.replace to fully navigate away from React app
      // This prevents React Router from intercepting the /auth/facebook route
      const facebookUrl = `${window.location.origin}/auth/facebook`;

      console.log("Facebook login URL:", facebookUrl);
      console.log("Navigating away from React app to:", facebookUrl);

      window.location.replace(facebookUrl);
    } catch (error) {
      console.error("Facebook login error:", error);
      // Fallback: try direct navigation
      window.location.replace(`${window.location.origin}/auth/facebook`);
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
