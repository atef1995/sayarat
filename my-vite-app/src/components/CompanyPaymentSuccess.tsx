import { Result, Button } from "antd";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";

const CompanyPaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      // Here you would verify the payment with your backend
      console.log("Payment session ID:", sessionId);
      setLoading(false);
    } else {
      navigate("/company-payment");
    }
  }, [searchParams, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Result
        status="success"
        title="تم تفعيل اشتراك الشركة بنجاح!"
        subTitle="مرحباً بك في شبكة وكلاء السيارات. يمكنك الآن الاستفادة من جميع المميزات المتقدمة."
        extra={[
          <Button type="primary" key="dashboard" onClick={() => navigate("/")}>
            الانتقال إلى الصفحة الرئيسية
          </Button>,
          <Button key="profile" onClick={() => navigate("/profile")}>
            إدارة حساب الشركة
          </Button>,
        ]}
      />
    </div>
  );
};

export default CompanyPaymentSuccess;
