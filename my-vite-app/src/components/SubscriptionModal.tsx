import React, { useState, useEffect } from "react";
import {
  Modal,
  Card,
  Button,
  Typography,
  Row,
  Col,
  Spin,
  message,
  Alert,
  Divider,
} from "antd";
import {
  CheckOutlined,
  CrownOutlined,
  StarOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { SubscriptionService } from "../services/subscriptionService";
import { SubscriptionPlan } from "../types/subscription.types";
import ManualPaymentForm, { ManualPaymentData } from "./ManualPaymentForm";
import { useAuth } from "../hooks/useAuth";

const { Title, Text } = Typography;

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSubscriptionSuccess?: () => void;
  requiredFeature?: string;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  open,
  onClose,
  onSubscriptionSuccess,
  requiredFeature = "AI Car Analysis",
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (open) {
      loadPlans();
    }
  }, [open]);

  // close manual and subscribe payment form when modal closes
  useEffect(() => {
    if (!open) {
      setShowManualPayment(false);
      onClose();
    }
  }, [open, onClose]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await SubscriptionService.getPlans();
      if (response.success) {
        setPlans(
          response.plans
            .filter((plan) => plan.isActive)
            .sort((a, b) => a.order - b.order)
        );
      } else {
        message.error("فشل في تحميل خطط الاشتراك");
      }
    } catch (error) {
      console.error("Error loading plans:", error);
      message.error("حدث خطأ في تحميل خطط الاشتراك");
    } finally {
      setLoading(false);
    }
  };
  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setSubscribing(plan.id);
    try {
      message.info("جاري إنشاء جلسة الدفع...");

      // Create subscription with real Stripe integration
      const response = await SubscriptionService.createSubscription({
        planId: plan.id,
      });

      if (response.success && response.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.url;
      } else {
        message.error(response.error || "فشل في إنشاء الاشتراك");
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      message.error("فشل في إنشاء الاشتراك");
    } finally {
      setSubscribing(null);
    }
  };

  const handleManualPayment = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowManualPayment(true);
  };

  const handleManualPaymentSubmit = async (data: ManualPaymentData) => {
    try {
      // Submit manual payment request
      const response = await SubscriptionService.submitManualPayment(data);

      if (response.success) {
        message.success("تم إرسال طلب الدفع اليدوي بنجاح! سنتواصل معك قريباً.");
        setShowManualPayment(false);
        if (onSubscriptionSuccess) {
          onSubscriptionSuccess();
        }
      } else {
        message.error(response.error || "فشل في إرسال طلب الدفع اليدوي");
      }
    } catch (error) {
      console.error("Manual payment error:", error);
      message.error("حدث خطأ في إرسال طلب الدفع اليدوي");
    }
  };

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes("premium")) return <CrownOutlined />;
    if (planName.toLowerCase().includes("pro")) return <StarOutlined />;
    return <CheckOutlined />;
  };

  const getPlanColor = (planName: string) => {
    if (planName.toLowerCase().includes("premium")) return "#gold";
    if (planName.toLowerCase().includes("pro")) return "#722ed1";
    return "#1890ff";
  };

  return (
    <Modal
      title={
        <div className="text-center">
          <CrownOutlined className="text-2xl text-yellow-500 mr-2" />
          <span>الاشتراك المميز مطلوب</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      <div className="text-center mb-6">
        <Alert
          message={`للوصول إلى ${requiredFeature}`}
          description="يتطلب هذا الأمر اشتراكاً أو حساب شركة. اختر الخطة المناسبة لك:"
          type="info"
          showIcon
          className="mb-4"
        />
      </div>
      {loading ? (
        <div className="text-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 24]}>
          {plans.map((plan) => (
            <Col xs={24} md={8} key={plan.id}>
              <Card
                className="h-full"
                style={{ borderColor: getPlanColor(plan.name) }}
                hoverable
              >
                <div className="text-center min-h-max h-full">
                  <div
                    className="text-3xl mb-2"
                    style={{ color: getPlanColor(plan.name) }}
                  >
                    {getPlanIcon(plan.name)}
                  </div>
                  <Title level={4} className="mb-2">
                    {plan.displayName}
                  </Title>
                  <div className="mb-4">
                    <span
                      className="text-3xl font-bold"
                      style={{ color: getPlanColor(plan.name) }}
                    >
                      ${plan.price}
                    </span>
                    <Text type="secondary">
                      /{plan.interval === "month" ? "شهر" : "سنة"}
                    </Text>
                  </div>
                  <Text type="secondary" className="block mb-4">
                    {plan.description}
                  </Text>
                  <div className="mb-6">
                    {plan.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-start mb-2"
                      >
                        <CheckOutlined className="text-green-500 ml-2" />
                        <Text className="text-sm">{feature}</Text>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col items-end justify-end w-full h-full">
                    <Button
                      type="primary"
                      size="large"
                      block
                      loading={subscribing === plan.id}
                      onClick={() => handleSubscribe(plan)}
                      className="mb-2"
                      style={{
                        backgroundColor: getPlanColor(plan.name),
                        borderColor: getPlanColor(plan.name),
                      }}
                    >
                      {subscribing === plan.id
                        ? "جاري الاشتراك..."
                        : "اشترك الآن"}
                    </Button>
                    <Divider className="my-2">أو</Divider>
                    <Button
                      size="large"
                      block
                      icon={<BankOutlined />}
                      onClick={() => handleManualPayment(plan)}
                    >
                      دفع يدوي
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      <div className="text-center mt-6">
        <Text type="secondary" className="text-xs">
          يمكنك إلغاء الاشتراك في أي وقت. سيتم تطبيق الشروط والأحكام.
        </Text>
      </div>

      {selectedPlan && (
        <ManualPaymentForm
          open={showManualPayment}
          onClose={() => setShowManualPayment(false)}
          onSubmit={handleManualPaymentSubmit}
          planName={selectedPlan.displayName}
          planPrice={selectedPlan.price}
          currency="USD"
          user={isAuthenticated ? user : null}
        />
      )}
    </Modal>
  );
};

export default SubscriptionModal;
