import React, { useState, useEffect } from "react";
import { FloatButton, Tooltip, message } from "antd";
import { UserAddOutlined, CarOutlined, CloseOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router";

/**
 * Floating Join Button
 *
 * A subtle floating action button that encourages non-authenticated users to sign up
 * Appears after a delay and can be dismissed
 */
const FloatingJoinButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show on auth pages
    const authPages = ["/login", "/signup", "/company-signup"];
    if (authPages.includes(location.pathname)) {
      setVisible(false);
      return;
    }

    // Check if user has dismissed this session
    const sessionDismissed = sessionStorage.getItem("floating-join-dismissed");
    if (sessionDismissed) {
      setDismissed(true);
      return;
    }

    // Show after 5 seconds
    const timer = setTimeout(() => {
      setVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleJoin = () => {
    message.success("مرحباً بك! سنقوم بتوجيهك لإنشاء حساب جديد");
    navigate("/signup");
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("floating-join-dismissed", "true");
  };

  if (!visible || dismissed) {
    return null;
  }

  return (
    <div style={{ position: "fixed", bottom: 100, left: 24, zIndex: 1000 }}>
      <FloatButton.Group
        trigger="hover"
        type="primary"
        style={{
          left: 24,
        }}
        icon={
          <div className="relative">
            <UserAddOutlined />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        }
        tooltip={
          <div className="text-center">
            <div className="font-medium">انضم إلى سيارات</div>
            <div className="text-xs text-gray-400">إنشاء حساب مجاني</div>
          </div>
        }
      >
        <Tooltip title="إنشاء حساب مجاني" placement="right">
          <FloatButton
            icon={<UserAddOutlined />}
            onClick={handleJoin}
            style={{
              backgroundColor: "#1890ff",
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
            }}
          />
        </Tooltip>

        <Tooltip title="بيع سيارتك" placement="right">
          <FloatButton
            icon={<CarOutlined />}
            onClick={() => {
              message.info("سجل دخولك أولاً لتتمكن من بيع سيارتك");
              navigate("/signup");
            }}
            style={{
              backgroundColor: "#52c41a",
              boxShadow: "0 4px 12px rgba(82, 196, 26, 0.3)",
            }}
          />
        </Tooltip>

        <Tooltip title="إخفاء" placement="right">
          <FloatButton
            icon={<CloseOutlined />}
            onClick={handleDismiss}
            style={{
              backgroundColor: "#8c8c8c",
              boxShadow: "0 4px 12px rgba(140, 140, 140, 0.3)",
            }}
          />
        </Tooltip>
      </FloatButton.Group>
    </div>
  );
};

export default FloatingJoinButton;
