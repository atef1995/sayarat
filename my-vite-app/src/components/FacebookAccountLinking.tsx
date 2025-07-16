import React, { useState } from "react";
import { Card, Button, Typography, Divider, Alert } from "antd";
import {
  FacebookOutlined,
  DisconnectOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";

const { Title, Text } = Typography;

// Extended user type for Facebook properties
interface ExtendedUser {
  id: number;
  email: string;
  facebook_id?: string;
  auth_provider?: string;
  facebook_picture_url?: string;
}

/**
 * Facebook Account Linking Component for Profile Page
 * Allows users to link/unlink their Facebook account
 */
const FacebookAccountLinking: React.FC = () => {
  const { user } = useAuth();
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Check if Facebook is linked - safely cast to handle Facebook properties
  const extendedUser = user as unknown as ExtendedUser;
  const isFacebookLinked =
    extendedUser?.facebook_id &&
    extendedUser?.auth_provider?.includes("facebook");

  const handleLinkFacebook = () => {
    // Store current page for post-link redirect
    sessionStorage.setItem("postLoginRedirect", "/profile");

    // Redirect to Facebook linking endpoint
    window.location.href = "/auth/facebook/link";
  };

  const handleUnlinkFacebook = async () => {
    // Show confirmation
    const confirmed = window.confirm(
      "هل أنت متأكد من إلغاء ربط حساب فيسبوك؟ ستحتاج إلى كلمة مرور للدخول مرة أخرى."
    );

    if (!confirmed) {
      return;
    }

    setIsUnlinking(true);
    setMessage(null);

    try {
      const response = await fetch("/auth/facebook/unlink", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          text: "تم إلغاء ربط حساب فيسبوك بنجاح",
          type: "success",
        });

        // Refresh the page to update user data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage({
          text: data.message || "فشل في إلغاء ربط حساب فيسبوك",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error unlinking Facebook:", error);
      setMessage({
        text: "حدث خطأ أثناء إلغاء ربط حساب فيسبوك",
        type: "error",
      });
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <Card title="الحسابات المرتبطة" className="mb-6">
      <div className="space-y-4">
        {/* Facebook Account Section */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <FacebookOutlined style={{ fontSize: 24, color: "#1877f2" }} />
            <div>
              <Title level={5} className="mb-1">
                فيسبوك
              </Title>
              <Text type="secondary">
                {isFacebookLinked
                  ? "تم ربط حسابك بفيسبوك"
                  : "اربط حسابك بفيسبوك لتسجيل دخول سريع"}
              </Text>
            </div>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {isFacebookLinked ? (
              <>
                <CheckCircleOutlined
                  style={{ color: "#52c41a", fontSize: 16 }}
                />
                <Text type="success" className="mx-2">
                  مرتبط
                </Text>
                <Button
                  icon={<DisconnectOutlined />}
                  onClick={handleUnlinkFacebook}
                  loading={isUnlinking}
                  danger
                  size="small"
                >
                  {isUnlinking ? "جاري الإلغاء..." : "إلغاء الربط"}
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<FacebookOutlined />}
                onClick={handleLinkFacebook}
                style={{ backgroundColor: "#1877f2", borderColor: "#1877f2" }}
              >
                ربط الحساب
              </Button>
            )}
          </div>
        </div>

        {/* Show message if any */}
        {message && (
          <Alert
            message={message.text}
            type={message.type}
            showIcon
            closable
            onClose={() => setMessage(null)}
          />
        )}

        {/* Information Section */}
        <Divider />

        <div className="bg-blue-50 p-4 rounded-lg">
          <Title level={5} className="text-blue-800 mb-2">
            فوائد ربط حساب فيسبوك:
          </Title>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• تسجيل دخول سريع بنقرة واحدة</li>
            <li>• مزامنة صورة الملف الشخصي</li>
            <li>• أمان إضافي لحسابك</li>
            <li>• لن نقوم بالنشر على حسابك بدون إذنك</li>
          </ul>
        </div>

        {/* Security Note */}
        <Alert
          message="ملاحظة أمنية"
          description="نحن نحترم خصوصيتك. نحصل فقط على المعلومات الأساسية من فيسبوك (الاسم، البريد الإلكتروني، الصورة الشخصية) ولن نقوم بالوصول إلى أي معلومات أخرى أو النشر باسمك."
          type="info"
          showIcon
          className="text-sm"
        />
      </div>
    </Card>
  );
};

export default FacebookAccountLinking;
