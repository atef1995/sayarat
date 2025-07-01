/**
 * @deprecated This component is deprecated and will be removed in future versions.
 */
import { Card, Button, message, Result } from "antd";
import { useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { CreditCardOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { loadApiConfig } from "../config/apiConfig";

const { apiUrl, stripePublicKey } = loadApiConfig();
const stripePromise = loadStripe(stripePublicKey || "VITE_STRIPE_PUBLIC_KEY");

interface PaymentState {
  companyId: string;
  subscriptionType: "monthly" | "yearly";
}

const CompanyPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "success" | "error"
  >("pending");

  const state = location.state as PaymentState | null;

  useEffect(() => {
    if (!state?.companyId) {
      message.error("معلومات الدفع غير مكتملة");
      navigate("/company-signup");
    }
  }, [state, navigate]);

  const handlePayment = async () => {
    if (!state?.companyId || !state?.subscriptionType) {
      message.error("معلومات الدفع غير مكتملة");
      return;
    }

    setLoading(true);

    try {
      // Create checkout session
      const response = await fetch(`${apiUrl}/payment/company-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          companyId: state.companyId,
          subscriptionType: state.subscriptionType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل في إنشاء جلسة الدفع");
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("فشل في تحميل معالج الدفع");
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Payment error:", error);
      message.error(
        error instanceof Error ? error.message : "حدث خطأ في الدفع"
      );
      setPaymentStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionFeatures = () => [
    "إعلانات غير محدودة",
    "أولوية في نتائج البحث",
    "إحصائيات تفصيلية",
    "دعم فني متقدم",
    "إدارة متعددة المستخدمين",
    "تخصيص صفحة الشركة",
    "إدارة المخزون",
    "تقارير المبيعات",
  ];

  if (paymentStatus === "success") {
    return (
      <Card className="w-full max-w-2xl shadow-lg">
        <Result
          status="success"
          title="تم تفعيل اشتراك الشركة بنجاح!"
          subTitle="يمكنك الآن الاستفادة من جميع مميزات حساب الوكالة"
          extra={[
            <Button
              type="primary"
              key="dashboard"
              onClick={() => navigate("/")}
            >
              الانتقال إلى الصفحة الرئيسية
            </Button>,
            <Button key="profile" onClick={() => navigate("/profile")}>
              إدارة الحساب
            </Button>,
          ]}
        />
      </Card>
    );
  }

  if (paymentStatus === "error") {
    return (
      <Card className="w-full max-w-2xl shadow-lg">
        <Result
          status="error"
          title="فشل في عملية الدفع"
          subTitle="حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى."
          extra={[
            <Button
              type="primary"
              key="retry"
              onClick={() => setPaymentStatus("pending")}
            >
              إعادة المحاولة
            </Button>,
            <Button key="support" onClick={() => navigate("/contact")}>
              التواصل مع الدعم
            </Button>,
          ]}
        />
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <div className="text-center mb-8">
        <CreditCardOutlined className="text-4xl text-blue-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">تفعيل اشتراك الوكالة</h1>
        <p className="text-gray-400">أكمل عملية الدفع لتفعيل حساب الوكالة</p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            اشتراك {state?.subscriptionType === "yearly" ? "سنوي" : "شهري"}
          </h3>
          <div className="text-2xl font-bold text-blue-600">
            قريباً
            {/* {getSubscriptionPrice()} */}
          </div>
        </div>

        {state?.subscriptionType === "yearly" && (
          <div className="bg-green-100 text-green-800 px-3 py-2 rounded mb-4 text-sm">
            ✨ وفر شهرين مجاناً مع الاشتراك السنوي!
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium mb-3">المميزات المتضمنة:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {getSubscriptionFeatures().map((feature, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <CheckCircleOutlined className="text-green-500 text-sm" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h4 className="font-medium mb-2">💳 معلومات الدفع:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• دفع آمن عبر Stripe</li>
          <li>• يمكن إلغاء الاشتراك في أي وقت</li>
          <li>• فاتورة ضريبية رسمية</li>
          <li>• دعم فني متاح 24/7</li>
        </ul>
      </div>

      <div className="space-y-4">
        <Button
          type="primary"
          size="large"
          block
          onClick={handlePayment}
          loading={loading}
          icon={<CreditCardOutlined />}
        >
          {loading ? "جاري التحويل للدفع..." : "المتابعة للدفع"}
        </Button>

        <div className="text-center">
          <Button type="link" onClick={() => navigate("/company-signup")}>
            العودة إلى التسجيل
          </Button>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t text-center text-xs text-gray-400">
        <p>بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية</p>
      </div>
    </Card>
  );
};

export default CompanyPayment;
