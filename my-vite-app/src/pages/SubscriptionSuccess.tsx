import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Result, Button, Spin, message, Card } from "antd";
import { CheckCircleOutlined, CrownOutlined } from "@ant-design/icons";
import { useSubscription } from "../hooks/useSubscription";

const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [sessionVerified, setSessionVerified] = useState(false);

  const sessionId = searchParams.get("session_id");
  useEffect(() => {
    console.log(
      "SubscriptionSuccess component mounted with sessionId:",
      sessionId
    );

    const verifySession = async () => {
      if (!sessionId) {
        message.error("معرف الجلسة مفقود");
        navigate("/");
        return;
      }

      try {
        // Wait a moment for the webhook to process
        setTimeout(async () => {
          await refresh(); // Refresh subscription status
          setSessionVerified(true);
          setLoading(false);
          message.success("تم تفعيل اشتراكك بنجاح!");
        }, 3000);
      } catch (error) {
        console.error("Error verifying session:", error);
        setLoading(false);
        message.error("حدث خطأ أثناء التحقق من الاشتراك");
      }
    };

    verifySession();
  }, [sessionId, navigate, refresh]);

  const handleGoToProfile = () => {
    navigate("/profile");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleTryAI = () => {
    navigate("/create-listing");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <Card className="text-center p-8">
          <Spin size="large" />
          <div className="mt-4">
            <h3>جاري التحقق من الاشتراك...</h3>
            <p className="text-gray-500">
              يرجى الانتظار بينما نقوم بتفعيل اشتراكك
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <div className="max-w-md w-full">
        <Result
          icon={<CheckCircleOutlined className="text-green-500" />}
          status="success"
          title="تم الاشتراك بنجاح!"
          subTitle={
            sessionVerified
              ? "تم تفعيل اشتراكك المميز. يمكنك الآن الاستفادة من جميع الميزات المتاحة."
              : "يتم تفعيل اشتراكك حالياً. ستتمكن من الوصول للميزات المميزة قريباً."
          }
          extra={[
            <Button
              key="ai"
              type="primary"
              icon={<CrownOutlined />}
              onClick={handleTryAI}
              className="mb-2"
            >
              جرب المساعد الذكي
            </Button>,
            <Button key="profile" onClick={handleGoToProfile} className="mb-2">
              إدارة الاشتراك
            </Button>,
            <Button key="home" onClick={handleGoHome}>
              العودة للرئيسية
            </Button>,
          ]}
        />

        <Card className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <div className="text-center">
            <CrownOutlined className="text-3xl text-yellow-500 mb-2" />
            <h4 className="text-lg font-semibold mb-2">
              مرحباً بك في النادي المميز!
            </h4>
            <p className="text-gray-600 text-sm">يمكنك الآن الاستفادة من:</p>
            <ul className="text-sm text-gray-700 mt-2 space-y-1">
              <li>• المساعد الذكي لتحليل السيارات</li>
              <li>• إبراز الإعلانات</li>
              <li>• إحصائيات متقدمة</li>
              <li>• أولوية في الدعم</li>
              <li>• إعلانات غير محدودة</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
