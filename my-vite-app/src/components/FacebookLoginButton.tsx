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

    // Simply navigate to the backend auth endpoint
    // This bypasses React Router completely since it's an external navigation
    window.location.href = "/auth/facebook";
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
