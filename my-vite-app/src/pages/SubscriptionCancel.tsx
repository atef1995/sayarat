import React from "react";
import { Result, Button } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";

const SubscriptionCancel: React.FC = () => {
  const navigate = useNavigate();

  console.log("SubscriptionCancel component mounted");

  const handleGoHome = () => {
    navigate("/");
  };

  const handleTryAgain = () => {
    navigate("-1"); // Go back to the previous page
  };

  const handleGoThreeStepsBack = () => {
    navigate(-3);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Result
          icon={<CloseCircleOutlined className="text-orange-500" />}
          status="warning"
          title="تم إلغاء عملية الاشتراك"
          subTitle="لم يتم إتمام عملية الدفع. لا تقلق، لم يتم خصم أي مبلغ من حسابك."
          extra={[
            <Button
              key="retry"
              type="primary"
              onClick={handleTryAgain}
              className="mb-2"
            >
              المحاولة مرة أخرى
            </Button>,
            <Button
              key="back"
              onClick={handleGoThreeStepsBack}
              className="mb-2"
            >
              العودة للخلف
            </Button>,
            <Button key="home" onClick={handleGoHome}>
              العودة للرئيسية
            </Button>,
          ]}
        />

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-lg font-semibold mb-2 text-blue-800">
            هل تحتاج مساعدة؟
          </h4>
          <p className="text-blue-700 text-sm mb-3">
            إذا واجهت أي مشاكل في عملية الدفع، يمكنك:
          </p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• التأكد من صحة بيانات البطاقة الائتمانية</li>
            <li>• التحقق من رصيد الحساب</li>
            <li>• المحاولة باستخدام بطاقة أخرى</li>
            <li>• التواصل مع خدمة العملاء</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCancel;
