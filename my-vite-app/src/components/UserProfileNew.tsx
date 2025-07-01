import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  DatePicker,
  message,
  Space,
  Tabs,
  Badge,
  Tag,
  Alert,
  Descriptions,
  Typography,
} from "antd";
import {
  UserOutlined,
  CrownOutlined,
  SettingOutlined,
  SecurityScanOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { ApiResponse, User } from "../types/api.types";
import { SubscriptionService } from "../services/subscriptionService";
import { SubscriptionCheckResponse } from "../types/subscription.types";
import SubscriptionManagement from "./SubscriptionManagement";
import { loadApiConfig } from "../config/apiConfig";

const { Title } = Typography;
const { TabPane } = Tabs;
const { apiUrl } = loadApiConfig();

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: dayjs.Dayjs;
}

interface ProfileUpdateResponse {
  user: User;
}

const UserProfile = () => {
  const [form] = Form.useForm();
  const formValues = Form.useWatch([], form);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionCheckResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchUserDetails();
    fetchSubscriptionData();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`${apiUrl}/auth/profile`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("فشل في جلب الملف الشخصي");

      const data: ApiResponse = await response.json();
      setUserDetails(data.user ?? null);
      console.log(typeof data.user?.dateOfBirth, data.user?.dateOfBirth);

      form.setFieldsValue({
        ...data.user,
        dateOfBirth: dayjs(data.user?.dateOfBirth),
      });
    } catch (error) {
      message.error(
        `فشل في تحميل الملف الشخصي: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const fetchSubscriptionData = async () => {
    try {
      const data = await SubscriptionService.checkSubscription();
      setSubscriptionData(data);
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    }
  };

  const handleSave = async (values: ProfileFormValues) => {
    try {
      const response = await fetch(`${apiUrl}/profile/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("فشل في تحديث الملف الشخصي");

      const data: ProfileUpdateResponse = await response.json();
      console.log("data:", data);

      setUserDetails(data.user);
      setIsEditing(false);
      message.success("تم تحديث الملف الشخصي بنجاح");
    } catch (error) {
      console.error(error);
      message.error("فشل في تحديث الملف الشخصي");
    }
  };

  const resetPasswordRequest = async () => {
    console.log(formValues.email);

    const response = await fetch(`${apiUrl}/reset-password-request`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        to: { email: formValues.email, name: formValues.firstName },
      }),
    });
    if (response.ok) message.info("تفقد بريدك الالكتروني للرابط");
  };

  const getSubscriptionStatus = () => {
    if (subscriptionData?.hasActiveSubscription) {
      return <Badge status="success" text="نشط" />;
    }
    return <Badge status="default" text="غير مفعل" />;
  };

  const AccountOverview = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
        <Card title="معلومات الحساب" className="h-full">
          <Descriptions column={1} size="middle">
            <Descriptions.Item label="نوع الحساب">
              <Space>
                {subscriptionData?.isCompany ? (
                  <Tag color="gold" icon={<CrownOutlined />}>
                    حساب شركة
                  </Tag>
                ) : (
                  <Tag color="blue" icon={<UserOutlined />}>
                    حساب شخصي
                  </Tag>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="حالة الاشتراك">
              {getSubscriptionStatus()}
            </Descriptions.Item>
            {subscriptionData?.subscription && (
              <>
                <Descriptions.Item label="الخطة الحالية">
                  <Tag color="blue">
                    {subscriptionData.subscription.plan?.displayName}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="تاريخ انتهاء الاشتراك">
                  <CalendarOutlined className="mr-1" />
                  {new Date(
                    subscriptionData.subscription.currentPeriodEnd
                  ).toLocaleDateString("ar-SY")}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="المميزات المتاحة" className="h-full">
          {subscriptionData?.features && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {subscriptionData.features.aiCarAnalysis ? (
                  <CheckCircleOutlined className="text-green-500" />
                ) : (
                  <CloseCircleOutlined className="text-red-500" />
                )}
                <span className="text-sm">
                  تحليل السيارات بالذكاء الاصطناعي
                </span>
              </div>
              <div className="flex items-center gap-2">
                {subscriptionData.features.listingHighlights ? (
                  <CheckCircleOutlined className="text-green-500" />
                ) : (
                  <CloseCircleOutlined className="text-red-500" />
                )}
                <span className="text-sm">تمييز الإعلانات</span>
              </div>
              <div className="flex items-center gap-2">
                {subscriptionData.features.prioritySupport ? (
                  <CheckCircleOutlined className="text-green-500" />
                ) : (
                  <CloseCircleOutlined className="text-red-500" />
                )}
                <span className="text-sm">دعم فني مميز</span>
              </div>
              <div className="flex items-center gap-2">
                {subscriptionData.features.unlimitedListings ? (
                  <CheckCircleOutlined className="text-green-500" />
                ) : (
                  <CloseCircleOutlined className="text-red-500" />
                )}
                <span className="text-sm">إعلانات غير محدودة</span>
              </div>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );

  const ProfileForm = () => (
    <Card title="الملف الشخصي" className="min-h-[544px]">
      {subscriptionData?.isCompany && (
        <Alert
          message="حساب شركة"
          description="أنت تستخدم حساب شركة مع مميزات إضافية."
          type="info"
          icon={<CrownOutlined />}
          showIcon
          className="mb-4"
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={userDetails || {}}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="firstName"
              label="الاسم الأول"
              rules={[{ required: true, message: "الرجاء إدخال الاسم الأول" }]}
            >
              <Input disabled={!isEditing} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label="الاسم الأخير"
              rules={[{ required: true, message: "الرجاء إدخال الاسم الأخير" }]}
            >
              <Input disabled={!isEditing} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="البريد الإلكتروني"
              rules={[
                { required: true, message: "الرجاء إدخال البريد الإلكتروني" },
                { type: "email", message: "الرجاء إدخال بريد إلكتروني صالح" },
              ]}
            >
              <Input disabled={!isEditing} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="رقم الهاتف"
              rules={[{ required: true, message: "الرجاء إدخال رقم الهاتف" }]}
            >
              <Input disabled={!isEditing} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="dateOfBirth"
              label="تاريخ الميلاد"
              rules={[
                { required: true, message: "الرجاء إدخال تاريخ الميلاد" },
              ]}
            >
              <DatePicker disabled={!isEditing} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          {isEditing ? (
            <Space>
              <Button type="primary" htmlType="submit">
                حفظ التغييرات
              </Button>
              <Button onClick={() => setIsEditing(false)}>إلغاء</Button>
            </Space>
          ) : (
            <Space align="center" wrap size={24}>
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={() => setIsEditing(true)}
              >
                تعديل الملف الشخصي
              </Button>
              <Button
                type="default"
                icon={<SecurityScanOutlined />}
                onClick={() => resetPasswordRequest()}
              >
                تغيير كلمة السر
              </Button>
            </Space>
          )}
        </Form.Item>
      </Form>
    </Card>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Title level={2}>
          <UserOutlined className="mr-2" />
          إعدادات الحساب
        </Title>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        <TabPane
          tab={
            <span>
              <UserOutlined />
              نظرة عامة
            </span>
          }
          key="overview"
        >
          <AccountOverview />
        </TabPane>

        <TabPane
          tab={
            <span>
              <SettingOutlined />
              الملف الشخصي
            </span>
          }
          key="profile"
        >
          <ProfileForm />
        </TabPane>

        <TabPane
          tab={
            <span>
              <CrownOutlined />
              الاشتراك
              {subscriptionData?.hasActiveSubscription && (
                <Badge dot status="success" className="ml-1" />
              )}
            </span>
          }
          key="subscription"
        >
          <SubscriptionManagement />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default UserProfile;
