import { Card, Flex, Spin } from "antd";
import { useAuth } from "../hooks/useAuth";
import { CreditCardTwoTone } from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import { useMemo } from "react";

const Payment = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const paymentIntentId = searchParams.get("payment_intent");
  const paymentStatus = searchParams.get("redirect_status");
  const paymentIntentClientSecret = searchParams.get(
    "payment_intent_client_secret"
  );

  // Use useMemo to compute content instead of state
  const content = useMemo(() => {
    if (!isAuthenticated) {
      return (
        <Title level={5}>يرجى تسجيل الدخول للوصول إلى معلومات الدفع.</Title>
      );
    }

    if (isLoading) {
      return <Spin size="large" tip="جارٍ تحميل معلومات الدفع..." />;
    }

    if (!paymentIntentId || !paymentStatus || !paymentIntentClientSecret) {
      return (
        <Title level={5}>
          لم يتم العثور على معلومات الدفع. يرجى المحاولة مرة أخرى.
        </Title>
      );
    }

    if (paymentStatus !== "succeeded") {
      return (
        <Title level={5}>حدث خطأ أثناء الدفع. يرجى المحاولة مرة أخرى</Title>
      );
    }

    return (
      <Flex align="center" justify="center" vertical>
        <CreditCardTwoTone style={{ fontSize: "48px", color: "#52c41a" }} />
        <Title level={4}>تم الدفع بنجاح!</Title>
        <Title level={5}>
          شكرًا لك، {user?.firstName} {user?.lastName}، على الدفع.
        </Title>
      </Flex>
    );
  }, [
    paymentIntentId,
    paymentStatus,
    paymentIntentClientSecret,
    user?.firstName,
    user?.lastName,
  ]);

  return (
    <Card title="تفاصيل الدفع" className="text-balance">
      {content}
    </Card>
  );
};

export default Payment;
