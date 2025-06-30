import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Spin,
  message,
  Space,
  Alert,
  List,
} from "antd";
import {
  CrownOutlined,
  CheckOutlined,
  DollarOutlined,
  CreditCardOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { SubscriptionService } from "../services/subscriptionService";
import {
  SubscriptionPlan,
  SubscriptionCheckResponse,
} from "../types/subscription.types";

const { Title, Text, Paragraph } = Typography;

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionCheckResponse | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansResponse, subscriptionResponse] = await Promise.all([
        SubscriptionService.getPlans(),
        SubscriptionService.checkSubscription(),
      ]);

      if (plansResponse.success) {
        setPlans(plansResponse.plans);
      }
      setSubscriptionData(subscriptionResponse);
    } catch (error) {
      console.error("Error loading subscription data:", error);
      message.error("فشل في تحميل خطط الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setActionLoading(true);
    try {
      const response = await SubscriptionService.createSubscription({ planId });

      if (response.success && response.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.url;
      } else {
        message.error(response.error || "فشل في إنشاء الاشتراك");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      message.error("حدث خطأ أثناء إنشاء الاشتراك");
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualPayment = (plan: SubscriptionPlan) => {
    // Navigate to manual payment page or open modal
    navigate("/subscription/manual-payment", {
      state: {
        planId: plan.id,
        planName: plan.displayName,
        planPrice: plan.price,
        currency: plan.currency,
      },
    });
  };

  const isCurrentPlan = (planId: string) => {
    return subscriptionData?.subscription?.planId === planId;
  };

  const getPopularPlan = () => {
    // Return the most expensive annual plan as popular
    return plans.find(
      (plan) =>
        plan.interval === "year" &&
        plan.price ===
          Math.max(
            ...plans.filter((p) => p.interval === "year").map((p) => p.price)
          )
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  const popularPlan = getPopularPlan();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <Title level={1}>
          <CrownOutlined className="mr-2" />
          خطط الاشتراك
        </Title>
        <Paragraph className="text-lg" type="secondary">
          اختر الخطة التي تناسب احتياجاتك واستمتع بجميع المميزات المتقدمة
        </Paragraph>
      </div>

      {subscriptionData?.hasActiveSubscription && (
        <Alert
          message="لديك اشتراك نشط"
          description={`أنت مشترك حالياً في خطة ${subscriptionData.subscription?.plan?.displayName}. يمكنك ترقية أو تغيير خطتك في أي وقت.`}
          type="info"
          icon={<CrownOutlined />}
          showIcon
          className="mb-6"
        />
      )}

      <Row gutter={[24, 24]} justify="center">
        {plans.map((plan) => (
          <Col xs={24} sm={12} lg={8} key={plan.id}>
            <Card
              className={`h-full relative ${
                popularPlan?.id === plan.id
                  ? "border-2 border-yellow-400 shadow-lg"
                  : isCurrentPlan(plan.id)
                  ? "border-2 border-blue-500 bg-blue-50"
                  : ""
              }`}
              hoverable={!isCurrentPlan(plan.id)}
            >
              {popularPlan?.id === plan.id && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Tag
                    color="gold"
                    icon={<StarOutlined />}
                    className="px-4 py-1"
                  >
                    الأكثر شعبية
                  </Tag>
                </div>
              )}

              {isCurrentPlan(plan.id) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Tag
                    color="blue"
                    icon={<CheckOutlined />}
                    className="px-4 py-1"
                  >
                    خطتك الحالية
                  </Tag>
                </div>
              )}

              <div className="text-center mb-6 pt-4">
                <Title level={3} className="mb-2">
                  {plan.displayName}
                </Title>
                <Paragraph type="secondary" className="mb-4">
                  {plan.description}
                </Paragraph>

                <div className="mb-4">
                  <Text className="text-4xl font-bold text-blue-600">
                    {plan.price}
                  </Text>
                  <Text className="text-lg text-gray-500 mr-2">
                    {plan.currency}
                  </Text>
                  <br />
                  <Text type="secondary">
                    /{plan.interval === "month" ? "شهر" : "سنة"}
                  </Text>
                </div>

                {plan.interval === "year" && (
                  <Tag color="green" className="mb-4">
                    وفر شهرين مجاناً
                  </Tag>
                )}
              </div>

              <div className="mb-6">
                <Text strong className="block mb-3">
                  المميزات المشمولة:
                </Text>
                <List
                  size="small"
                  dataSource={plan.features}
                  renderItem={(feature) => (
                    <List.Item>
                      <div className="flex items-center gap-2">
                        <CheckOutlined className="text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    </List.Item>
                  )}
                />
              </div>

              <div className="space-y-3">
                {isCurrentPlan(plan.id) ? (
                  <Button disabled block size="large">
                    الخطة الحالية
                  </Button>
                ) : (
                  <>
                    <Button
                      type="primary"
                      block
                      size="large"
                      icon={<CreditCardOutlined />}
                      loading={actionLoading}
                      onClick={() => handleSubscribe(plan.id)}
                      className={
                        popularPlan?.id === plan.id
                          ? "bg-yellow-500 border-yellow-500 hover:bg-yellow-600"
                          : ""
                      }
                    >
                      اشترك الآن
                    </Button>
                    <Button
                      block
                      size="large"
                      icon={<DollarOutlined />}
                      onClick={() => handleManualPayment(plan)}
                    >
                      دفع يدوي
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="mt-12 text-center">
        <Card className="max-w-4xl mx-auto">
          <Title level={3} className="mb-4">
            لماذا تختار الاشتراك المدفوع؟
          </Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <div className="text-center">
                <CrownOutlined className="text-4xl text-yellow-500 mb-3" />
                <Title level={4}>مميزات حصرية</Title>
                <Paragraph type="secondary">
                  احصل على إمكانيات متقدمة وأدوات حصرية لا تتوفر في الحساب
                  المجاني
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center">
                <StarOutlined className="text-4xl text-blue-500 mb-3" />
                <Title level={4}>أولوية في النتائج</Title>
                <Paragraph type="secondary">
                  إعلاناتك ستظهر في المقدمة وتحصل على مشاهدات أكثر
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center">
                <CheckOutlined className="text-4xl text-green-500 mb-3" />
                <Title level={4}>دعم فني مميز</Title>
                <Paragraph type="secondary">
                  احصل على دعم سريع ومخصص من فريقنا المتخصص
                </Paragraph>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Space size="large">
          <Button size="large" onClick={() => navigate("/contact")}>
            تحتاج مساعدة؟
          </Button>
          <Button size="large" onClick={() => navigate("/profile")}>
            إدارة الاشتراك
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
