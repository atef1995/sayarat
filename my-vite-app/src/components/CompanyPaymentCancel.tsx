import { Result, Button } from "antd";
import { useNavigate } from "react-router";

const CompanyPaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Result
        status="warning"
        title="تم إلغاء عملية الدفع"
        subTitle="لم يتم إكمال عملية تفعيل اشتراك الشركة. يمكنك إعادة المحاولة في أي وقت."
        extra={[
          <Button
            type="primary"
            key="retry"
            onClick={() => navigate("/company-payment")}
          >
            إعادة المحاولة
          </Button>,
          <Button key="home" onClick={() => navigate("/")}>
            الصفحة الرئيسية
          </Button>,
        ]}
      />
    </div>
  );
};

export default CompanyPaymentCancel;
