import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Card, Spin, Result, Button } from "antd";
import {
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";

/**
 * Facebook Authentication Callback Handler
 * Handles the callback from Facebook OAuth and processes the authentication result
 */
const FacebookCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSession } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if there's an error parameter from Facebook
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (error) {
          console.error("Facebook OAuth error:", error, errorDescription);
          setStatus("error");
          setMessage(getErrorMessage(error, errorDescription));
          return;
        }

        // Check if we have a code parameter (successful OAuth)
        const code = searchParams.get("code");

        if (!code) {
          setStatus("error");
          setMessage("لم يتم تلقي رمز التحقق من فيسبوك");
          return;
        }

        // The backend should handle the code exchange automatically
        // We just need to check if the user is now authenticated
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Small delay for backend processing

        const authResult = await checkSession();

        if (authResult.data?.isAuthenticated) {
          setStatus("success");
          setMessage("تم تسجيل الدخول بنجاح عبر فيسبوك");

          // Get redirect URL from session storage or default to profile
          const redirectTo =
            sessionStorage.getItem("postLoginRedirect") || "/profile";
          sessionStorage.removeItem("postLoginRedirect");

          // Redirect after a short delay to show success message
          setTimeout(() => {
            navigate(redirectTo, { replace: true });
          }, 1500);
        } else {
          setStatus("error");
          setMessage("فشل في تسجيل الدخول عبر فيسبوك");
        }
      } catch (error) {
        console.error("Facebook callback error:", error);
        setStatus("error");
        setMessage("حدث خطأ أثناء معالجة تسجيل الدخول");
      }
    };

    handleCallback();
  }, [searchParams, checkSession, navigate]);

  const getErrorMessage = (
    error: string,
    description?: string | null
  ): string => {
    switch (error) {
      case "access_denied":
        return "تم إلغاء تسجيل الدخول عبر فيسبوك";
      case "invalid_request":
        return "طلب غير صالح من فيسبوك";
      case "unauthorized_client":
        return "تطبيق غير مصرح له";
      case "unsupported_response_type":
        return "نوع استجابة غير مدعوم";
      case "invalid_scope":
        return "صلاحيات غير صالحة";
      case "server_error":
        return "خطأ في خادم فيسبوك";
      case "temporarily_unavailable":
        return "فيسبوك غير متاح مؤقتاً";
      default:
        return description || "فشل في تسجيل الدخول عبر فيسبوك";
    }
  };

  const handleRetry = () => {
    navigate("/login");
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <Card className="min-w-[400px] text-center">
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
              size="large"
            />
            <div className="mt-4">
              <h3>جاري معالجة تسجيل الدخول...</h3>
              <p className="text-gray-600">
                يرجى الانتظار بينما نقوم بتسجيل دخولك عبر فيسبوك
              </p>
            </div>
          </Card>
        );

      case "success":
        return (
          <Result
            icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            title="تم تسجيل الدخول بنجاح!"
            subTitle={message}
            extra={
              <Button type="primary" onClick={() => navigate("/profile")}>
                انتقل إلى الملف الشخصي
              </Button>
            }
          />
        );

      case "error":
        return (
          <Result
            icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
            title="فشل في تسجيل الدخول"
            subTitle={message}
            extra={[
              <Button type="primary" onClick={handleRetry} key="retry">
                المحاولة مرة أخرى
              </Button>,
              <Button onClick={() => navigate("/")} key="home">
                العودة للرئيسية
              </Button>,
            ]}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {renderContent()}
    </div>
  );
};

export default FacebookCallback;
