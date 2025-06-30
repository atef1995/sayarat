/**
 * @deprecated This component is deprecated and will be removed in future versions.
 */

import { useState, useEffect, useContext, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Tabs,
  Modal,
  Form,
  Input,
  Select,
  message,
  Progress,
  Descriptions,
  Avatar,
  List,
  Badge,
  Tooltip,
  Alert,
} from "antd";
import {
  CarOutlined,
  UserOutlined,
  DollarOutlined,
  EyeOutlined,
  MessageOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  TeamOutlined,
  CrownOutlined,
  ShopOutlined,
  TrophyOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../context/AuthContext";
import { CompanyUser, Company, ApiResponse } from "../types/api.types";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import styles from "./CompanyDashboard.module.css";
import SubscriptionModal from "./SubscriptionModal";
import { useSubscription } from "../hooks/useSubscription";
import { loadApiConfig } from "../config/apiConfig";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Meta } = Card;

const { apiUrl } = loadApiConfig();

interface CompanyStats {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalMessages: number;
  totalFavorites: number;
  monthlyViews: number;
  conversionRate: number;
}

interface CompanyListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: string;
  views: number;
  messages: number;
  favorites: number;
  createdAt: string;
  images?: string[];
  highlight: boolean;
}

interface CompanyMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "owner" | "admin" | "member";
  lastLogin: string;
  status: "active" | "inactive";
  avatar?: string;
}

interface CompanyUpdateValues {
  name: string;
  description: string;
  address: string;
  city: string;
  taxId: string;
  website?: string;
}

interface MemberAddValues {
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "member";
}

const CompanyDashboard = () => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const navigate = useNavigate();

  // Modern subscription management
  const {
    subscriptionData,
    loading: subscriptionLoading,
    error: subscriptionError,
    hasFeature,
    refresh: refreshSubscription,
  } = useSubscription();

  console.log("Subscription Data:", subscriptionData);

  // Component state
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<CompanyStats>({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    totalMessages: 0,
    totalFavorites: 0,
    monthlyViews: 0,
    conversionRate: 0,
  });
  const [listings, setListings] = useState<CompanyListing[]>([]);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [editCompanyModal, setEditCompanyModal] = useState(false);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [form] = Form.useForm();
  const [memberForm] = Form.useForm();
  const companyUser = user as CompanyUser | null;

  // Memoize fetch functions to avoid infinite re-renders
  const fetchCompanyData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/company/profile`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch company data");

      const data: ApiResponse & { company: Company } = await response.json();
      console.log("Fetched company data:", data);

      setCompany(data.company);
      form.setFieldsValue(data.company);
    } catch (error) {
      message.error("خطأ في جلب بيانات الشركة");
      console.error("Error fetching company data:", error);
    } finally {
      setLoading(false);
    }
  }, [form]);

  const fetchCompanyStats = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/company/stats`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch company stats");

      const data: ApiResponse & { stats: CompanyStats } = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching company stats:", error);
      // Set default stats on error
      setStats({
        totalListings: 0,
        activeListings: 0,
        totalViews: 0,
        totalMessages: 0,
        totalFavorites: 0,
        monthlyViews: 0,
        conversionRate: 0,
      });
    }
  }, []);

  const fetchCompanyListings = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/company/listings`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch company listings");

      const data: ApiResponse & { listings: CompanyListing[] } =
        await response.json();
      setListings(data.listings);
    } catch (error) {
      console.error("Error fetching company listings:", error);
      setListings([]);
    }
  }, []);

  const fetchCompanyMembers = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/company/members`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch company members");

      const data: ApiResponse & { members: CompanyMember[] } =
        await response.json();
      setMembers(data.members);
    } catch (error) {
      console.error("Error fetching company members:", error);
      setMembers([]);
    }
  }, []);

  // Initialize component data
  useEffect(() => {
    if (user?.accountType !== "company") {
      navigate("/");
      return;
    }
    fetchCompanyData();
    fetchCompanyStats();
    fetchCompanyListings();
    fetchCompanyMembers();
  }, [
    user,
    navigate,
    fetchCompanyData,
    fetchCompanyStats,
    fetchCompanyListings,
    fetchCompanyMembers,
  ]);

  const handleUpdateCompany = async (values: CompanyUpdateValues) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/company/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to update company");

      const data: ApiResponse & { company: Company } = await response.json();
      setCompany(data.company);
      setEditCompanyModal(false);
      message.success("تم تحديث بيانات الشركة بنجاح");
    } catch (error) {
      message.error("خطأ في تحديث بيانات الشركة");
      console.error("Error updating company:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (values: MemberAddValues) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/company/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to add member");

      await fetchCompanyMembers();
      setAddMemberModal(false);
      memberForm.resetFields();
      message.success("تم إضافة العضو بنجاح");
    } catch (error) {
      message.error("خطأ في إضافة العضو");
      console.error("Error adding member:", error);
    } finally {
      setLoading(false);
    }
  };
  // Modern subscription management handlers
  const handleSubscriptionSuccess = useCallback(async () => {
    try {
      // Refresh subscription data using the modern hook
      refreshSubscription();

      // Refresh company data after successful subscription update
      await fetchCompanyData();
      await fetchCompanyStats(); // Refresh stats as subscription might affect features
      setShowSubscriptionModal(false);
      message.success("تم تحديث الاشتراك بنجاح!");
    } catch (error) {
      console.error("Error refreshing company data:", error);
      message.warning(
        "تم تحديث الاشتراك ولكن فشل في تحديث البيانات. يرجى تحديث الصفحة."
      );
    }
    // #TODO: Add analytics tracking for subscription success
    // #TODO: Consider adding webhook listener for real-time updates
  }, [refreshSubscription, fetchCompanyData, fetchCompanyStats]);

  const handleOpenSubscriptionModal = useCallback(() => {
    setShowSubscriptionModal(true);
  }, []);

  const handleCloseSubscriptionModal = useCallback(() => {
    setShowSubscriptionModal(false);
  }, []);

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
      case "trialing":
        return "blue";
      case "incomplete":
      case "past_due":
      case "unpaid":
        return "orange";
      case "canceled":
        return "red";
      case "inactive":
      default:
        return "default";
    }
  };

  const getSubscriptionStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "فعال";
      case "trialing":
        return "تجريبي";
      case "incomplete":
        return "غير مكتمل";
      case "past_due":
        return "متأخر السداد";
      case "unpaid":
        return "غير مدفوع";
      case "canceled":
        return "ملغى";
      case "inactive":
        return "غير فعال";
      default:
        return status || "غير محدد";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <CrownOutlined style={{ color: "#faad14" }} />;
      case "admin":
        return <SettingOutlined style={{ color: "#1890ff" }} />;
      case "member":
        return <UserOutlined style={{ color: "#52c41a" }} />;
      default:
        return <UserOutlined />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "owner":
        return "مالك";
      case "admin":
        return "مدير";
      case "member":
        return "عضو";
      default:
        return role;
    }
  };

  const listingColumns = [
    {
      title: "الإعلان",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: CompanyListing) => (
        <Space>
          <Avatar
            shape="square"
            size="large"
            src={record.images?.[0]}
            icon={<CarOutlined />}
          />
          <div>
            <div>{text}</div>
            <Text type="secondary">
              {record.price} {record.currency}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: CompanyListing) => (
        <Space>
          <Tag color={status === "active" ? "green" : "orange"}>
            {status === "active" ? "فعال" : "غير فعال"}
          </Tag>
          {record.highlight && <Tag color="gold">مميز</Tag>}
        </Space>
      ),
    },
    {
      title: "الإحصائيات",
      key: "stats",
      render: (_: unknown, record: CompanyListing) => (
        <Space>
          <Tooltip title="المشاهدات">
            <Badge count={record.views} showZero>
              <EyeOutlined />
            </Badge>
          </Tooltip>
          <Tooltip title="الرسائل">
            <Badge count={record.messages} showZero>
              <MessageOutlined />
            </Badge>
          </Tooltip>
          <Tooltip title="المفضلة">
            <Badge count={record.favorites} showZero>
              <TrophyOutlined />
            </Badge>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "تاريخ الإنشاء",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: unknown, record: CompanyListing) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/car-listing/${record.id}`)}
          >
            عرض
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/edit-listing/${record.id}`)}
          >
            تحرير
          </Button>
        </Space>
      ),
    },
  ];

  const OverviewTab = () => (
    <div>
      {/* Subscription Alert using modern hook */}
      {subscriptionError && (
        <Alert
          message="خطأ في تحميل بيانات الاشتراك"
          description={subscriptionError}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" onClick={refreshSubscription}>
              إعادة المحاولة
            </Button>
          }
        />
      )}
      {!subscriptionLoading &&
        !subscriptionError &&
        !subscriptionData?.hasActiveSubscription && (
          <Alert
            message="حالة الاشتراك"
            description={
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <Text>
                  اشتراكك{" "}
                  {getSubscriptionStatusText(
                    subscriptionData?.subscription?.status || "inactive"
                  )}
                  .
                </Text>
                {subscriptionData?.subscription?.status === "incomplete" && (
                  <Text type="secondary">
                    يرجى إكمال عملية الدفع لتفعيل جميع المميزات.
                  </Text>
                )}
                {subscriptionData?.subscription?.status === "canceled" && (
                  <Text type="secondary">
                    تم إلغاء اشتراكك. يمكنك تجديده للاستفادة من المميزات
                    المتقدمة.
                  </Text>
                )}
                {(!subscriptionData?.subscription?.status ||
                  !subscriptionData?.hasActiveSubscription) && (
                  <Text type="secondary">
                    لا يوجد اشتراك فعال. اشترك الآن للحصول على المميزات
                    المتقدمة.
                  </Text>
                )}
              </Space>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
            action={
              <Button
                size="small"
                type="primary"
                onClick={handleOpenSubscriptionModal}
                icon={<CrownOutlined />}
              >
                {subscriptionData?.subscription?.status === "canceled"
                  ? "تجديد الاشتراك"
                  : "تحديث الاشتراك"}
              </Button>
            }
          />
        )}
      {/* Active Subscription Success Alert using modern hook */}
      {!subscriptionLoading && subscriptionData?.hasActiveSubscription && (
        <Alert
          message="اشتراك فعال"
          description={
            <Space>
              <Text>
                اشتراكك فعال ويمكنك الاستفادة من جميع المميزات المتقدمة.
              </Text>
              {subscriptionData?.subscription?.planDisplayName && (
                <Tag color="blue">
                  {subscriptionData.subscription.planDisplayName}
                </Tag>
              )}
              {subscriptionData?.subscription?.currentPeriodEnd && (
                <Text type="secondary">
                  ينتهي في:{" "}
                  {dayjs(subscriptionData.subscription.currentPeriodEnd).format(
                    "DD/MM/YYYY"
                  )}
                </Text>
              )}
              <Button
                type="link"
                size="small"
                onClick={handleOpenSubscriptionModal}
                icon={<SettingOutlined />}
              >
                إدارة الاشتراك
              </Button>
            </Space>
          }
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
          closable
        />
      )}
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="إجمالي الإعلانات"
              value={stats.totalListings}
              prefix={<CarOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="الإعلانات الفعالة"
              value={stats.activeListings}
              prefix={<CarOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="إجمالي المشاهدات"
              value={stats.totalViews}
              prefix={<EyeOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="الرسائل"
              value={stats.totalMessages}
              prefix={<MessageOutlined />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
      </Row>
      {/* Performance Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="الأداء الشهري" extra={<LineChartOutlined />}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="المشاهدات الشهرية"
                  value={stats.monthlyViews}
                  suffix="مشاهدة"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="معدل التحويل"
                  value={stats.conversionRate}
                  suffix="%"
                  precision={1}
                />
              </Col>
            </Row>
            <Progress
              percent={Math.min(100, (stats.monthlyViews / 1000) * 100)}
              strokeColor={{
                "0%": "#108ee9",
                "100%": "#87d068",
              }}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="المميزات المتاحة" extra={<CrownOutlined />}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Space>
                <Tag color={hasFeature("aiCarAnalysis") ? "green" : "default"}>
                  {hasFeature("aiCarAnalysis") ? "✓" : "✗"} تحليل السيارة
                  بالذكاء الاصطناعي
                </Tag>
              </Space>
              <Space>
                <Tag
                  color={hasFeature("listingHighlights") ? "green" : "default"}
                >
                  {hasFeature("listingHighlights") ? "✓" : "✗"} الإعلانات
                  المميزة
                </Tag>
              </Space>
              <Space>
                <Tag
                  color={hasFeature("advancedAnalytics") ? "green" : "default"}
                >
                  {hasFeature("advancedAnalytics") ? "✓" : "✗"} التحليلات
                  المتقدمة
                </Tag>
              </Space>
              <Space>
                <Tag
                  color={hasFeature("prioritySupport") ? "green" : "default"}
                >
                  {hasFeature("prioritySupport") ? "✓" : "✗"} الدعم المتقدم
                </Tag>
              </Space>
              <Space>
                <Tag
                  color={hasFeature("unlimitedListings") ? "green" : "default"}
                >
                  {hasFeature("unlimitedListings") ? "✓" : "✗"} إعلانات غير
                  محدودة
                </Tag>
              </Space>
              {hasFeature("customBranding") && (
                <Space>
                  <Tag color="blue">✓ العلامة التجارية المخصصة</Tag>
                </Space>
              )}
              {subscriptionData?.features?.teamMembers && (
                <Space>
                  <Tag color="purple">
                    ✓ فريق العمل ({subscriptionData.features.teamMembers} أعضاء)
                  </Tag>
                </Space>
              )}
              {!subscriptionData?.hasActiveSubscription && (
                <Button
                  type="primary"
                  size="small"
                  onClick={handleOpenSubscriptionModal}
                  icon={<CrownOutlined />}
                >
                  ترقية الاشتراك
                </Button>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
      {/* Company Information */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title="معلومات الشركة"
            extra={<ShopOutlined />}
            actions={[
              <Button
                key="subscription"
                type="link"
                icon={<CrownOutlined />}
                onClick={handleOpenSubscriptionModal}
              >
                إدارة الاشتراك
              </Button>,
            ]}
          >
            <Descriptions column={1}>
              <Descriptions.Item label="اسم الشركة">
                {company?.name}
              </Descriptions.Item>
              <Descriptions.Item label="نوع الاشتراك">
                <Space>
                  {subscriptionData?.subscription ? (
                    <Tag
                      color={
                        subscriptionData.subscription.plan?.interval === "year"
                          ? "blue"
                          : "green"
                      }
                    >
                      {subscriptionData.subscription.plan?.interval === "year"
                        ? "سنوي"
                        : "شهري"}
                    </Tag>
                  ) : (
                    <Tag color="default">غير محدد</Tag>
                  )}
                  {!subscriptionData?.hasActiveSubscription && (
                    <Badge status="warning" text="يحتاج تحديث" />
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="حالة الاشتراك">
                <Space>
                  <Tag
                    color={getSubscriptionStatusColor(
                      subscriptionData?.subscription?.status || "inactive"
                    )}
                  >
                    {getSubscriptionStatusText(
                      subscriptionData?.subscription?.status || "inactive"
                    )}
                  </Tag>
                  {subscriptionData?.hasActiveSubscription && (
                    <Badge status="success" text="فعال" />
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="الخطة">
                {subscriptionData?.subscription?.planDisplayName || "لا يوجد"}
              </Descriptions.Item>
              {subscriptionData?.subscription?.currentPeriodEnd && (
                <Descriptions.Item label="تاريخ الانتهاء">
                  {dayjs(subscriptionData.subscription.currentPeriodEnd).format(
                    "DD/MM/YYYY"
                  )}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="تاريخ الإنشاء">
                {dayjs(company?.createdAt).format("DD/MM/YYYY")}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
      {/* Recent Listings */}
      <Card
        title="الإعلانات الحديثة"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/create-listing")}
              disabled={
                !hasFeature("unlimitedListings") && listings.length >= 5
              }
            >
              إضافة إعلان جديد
            </Button>
            {!hasFeature("unlimitedListings") && listings.length >= 5 && (
              <Tooltip title="تحتاج اشتراك مدفوع للمزيد من الإعلانات">
                <Button
                  size="small"
                  type="link"
                  onClick={handleOpenSubscriptionModal}
                  icon={<CrownOutlined />}
                >
                  ترقية
                </Button>
              </Tooltip>
            )}
          </Space>
        }
      >
        <Table
          columns={listingColumns}
          dataSource={listings.slice(0, 5)}
          rowKey="id"
          pagination={false}
          scroll={{ x: 800 }}
        />
        {listings.length > 5 && (
          <div className={styles.showAllListings}>
            <Button onClick={() => setActiveTab("listings")}>
              عرض جميع الإعلانات
            </Button>
          </div>
        )}
      </Card>
    </div>
  );

  const ListingsTab = () => (
    <Card
      title="جميع الإعلانات"
      extra={
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/create-listing")}
            disabled={!hasFeature("unlimitedListings") && listings.length >= 5}
          >
            إضافة إعلان جديد
          </Button>
          {!hasFeature("unlimitedListings") && (
            <Text type="secondary">({listings.length}/5 إعلانات مجانية)</Text>
          )}
        </Space>
      }
    >
      {!hasFeature("unlimitedListings") && listings.length >= 5 && (
        <Alert
          message="وصلت للحد الأقصى من الإعلانات المجانية"
          description="ترقى لاشتراك مدفوع للحصول على إعلانات غير محدودة ومميزات إضافية."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button
              size="small"
              type="primary"
              onClick={handleOpenSubscriptionModal}
              icon={<CrownOutlined />}
            >
              ترقية الآن
            </Button>
          }
        />
      )}
      <Table
        columns={listingColumns}
        dataSource={listings}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} من ${total} إعلان`,
        }}
        scroll={{ x: 800 }}
      />
    </Card>
  );

  const MembersTab = () => (
    <Card
      title="أعضاء الفريق"
      extra={
        (companyUser?.role === "owner" || companyUser?.role === "admin") && (
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddMemberModal(true)}
              disabled={
                !hasFeature("teamMembers") ||
                (typeof subscriptionData?.features?.teamMembers === "number" &&
                  members.length >= subscriptionData.features.teamMembers)
              }
            >
              إضافة عضو جديد
            </Button>
            {typeof subscriptionData?.features?.teamMembers === "number" && (
              <Text type="secondary">
                ({members.length}/{subscriptionData.features.teamMembers} أعضاء)
              </Text>
            )}
          </Space>
        )
      }
    >
      {!hasFeature("teamMembers") && (
        <Alert
          message="إدارة الفريق تحتاج اشتراك مدفوع"
          description="ترقى لاشتراك مدفوع لإضافة وإدارة أعضاء الفريق."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button
              size="small"
              type="primary"
              onClick={handleOpenSubscriptionModal}
              icon={<CrownOutlined />}
            >
              ترقية الآن
            </Button>
          }
        />
      )}
      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3 }}
        dataSource={members}
        renderItem={(member) => (
          <List.Item>
            <Card
              actions={
                (companyUser?.role === "owner" ||
                  companyUser?.role === "admin") &&
                member.role !== "owner" &&
                hasFeature("teamMembers")
                  ? [
                      <EditOutlined key="edit" />,
                      <SettingOutlined key="setting" />,
                    ]
                  : []
              }
            >
              <Meta
                avatar={
                  <Avatar
                    size={64}
                    src={member.avatar}
                    icon={<UserOutlined />}
                  />
                }
                title={
                  <Space>
                    {`${member.firstName} ${member.lastName}`}
                    {getRoleIcon(member.role)}
                  </Space>
                }
                description={
                  <div>
                    <div>{member.email}</div>
                    <div className={styles.memberStatusContainer}>
                      <Tag color={member.status === "active" ? "green" : "red"}>
                        {member.status === "active" ? "فعال" : "غير فعال"}
                      </Tag>
                      <Tag>{getRoleText(member.role)}</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      آخر دخول: {dayjs(member.lastLogin).format("DD/MM/YYYY")}
                    </Text>
                  </div>
                }
              />
            </Card>
          </List.Item>
        )}
      />
    </Card>
  );

  const SettingsTab = () => (
    <Card
      title="إعدادات الشركة"
      extra={
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => setEditCompanyModal(true)}
        >
          تحرير المعلومات
        </Button>
      }
    >
      <Descriptions bordered column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label="اسم الشركة">
          {company?.name}
        </Descriptions.Item>
        <Descriptions.Item label="المدينة">{company?.city}</Descriptions.Item>
        <Descriptions.Item label="العنوان" span={2}>
          {company?.address}
        </Descriptions.Item>
        <Descriptions.Item label="الوصف" span={2}>
          {company?.description}
        </Descriptions.Item>
        <Descriptions.Item label="الرقم الضريبي">
          {company?.taxId}
        </Descriptions.Item>
        <Descriptions.Item label="الموقع الإلكتروني">
          {company?.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer">
              {company.website}
            </a>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="نوع الاشتراك">
          {subscriptionData?.subscription ? (
            <Tag
              color={
                subscriptionData.subscription.plan?.interval === "year"
                  ? "blue"
                  : "green"
              }
            >
              {subscriptionData.subscription.plan?.interval === "year"
                ? "سنوي"
                : "شهري"}
            </Tag>
          ) : (
            <Tag color="default">غير محدد</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="حالة الاشتراك">
          <Space>
            <Tag
              color={getSubscriptionStatusColor(
                subscriptionData?.subscription?.status || "inactive"
              )}
            >
              {getSubscriptionStatusText(
                subscriptionData?.subscription?.status || "inactive"
              )}
            </Tag>
            {subscriptionData?.subscription?.planDisplayName && (
              <Tag color="cyan">
                {subscriptionData.subscription.planDisplayName}
              </Tag>
            )}
          </Space>
        </Descriptions.Item>
        {subscriptionData?.subscription?.currentPeriodEnd && (
          <Descriptions.Item label="تاريخ انتهاء الاشتراك">
            {dayjs(subscriptionData.subscription.currentPeriodEnd).format(
              "DD/MM/YYYY"
            )}
          </Descriptions.Item>
        )}
        {subscriptionData?.subscription?.price && (
          <Descriptions.Item label="السعر">
            {subscriptionData.subscription.price}{" "}
            {subscriptionData.subscription.currency?.toUpperCase()}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );

  // TODO: Add real-time notifications for subscription changes
  // TODO: Implement progressive web app features for offline access
  // TODO: Add comprehensive analytics dashboard with charts
  // TODO: Implement bulk operations for listings management
  // TODO: Add automated backup and data export functionality
  // TODO: Implement advanced search and filtering for listings
  // TODO: Add integration with third-party services (social media, etc.)
  // TODO: Implement custom branding features for premium users
  // TODO: Add API rate limiting indicators and usage statistics
  // TODO: Implement advanced team collaboration features

  if (!user || user.accountType !== "company") {
    return (
      <Card>
        <div className={styles.companyNotFound}>
          <Title level={4}>هذه الصفحة مخصصة للشركات فقط</Title>
          <Button type="primary" onClick={() => navigate("/")}>
            العودة للرئيسية
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <div className={styles.companyDashboardContainer}>
      <div className={styles.companyDashboardHeader}>
        <Title level={2}>
          <Space>
            <ShopOutlined />
            لوحة تحكم الشركة
          </Space>
        </Title>
        <Paragraph type="secondary">
          مرحباً {companyUser?.firstName}، إدارة شاملة لإعلانات وأنشطة شركتك
        </Paragraph>
      </div>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="نظرة عامة" key="overview" icon={<DollarOutlined />}>
          <OverviewTab />
        </TabPane>
        <TabPane tab="الإعلانات" key="listings" icon={<CarOutlined />}>
          <ListingsTab />
        </TabPane>
        <TabPane tab="الفريق" key="members" icon={<TeamOutlined />}>
          <MembersTab />
        </TabPane>
        <TabPane tab="الإعدادات" key="settings" icon={<SettingOutlined />}>
          <SettingsTab />
        </TabPane>
      </Tabs>
      {/* Edit Company Modal */}
      <Modal
        title="تحرير معلومات الشركة"
        open={editCompanyModal}
        onCancel={() => setEditCompanyModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateCompany}
          initialValues={company || {}}
        >
          <Form.Item
            name="name"
            label="اسم الشركة"
            rules={[{ required: true, message: "يرجى إدخال اسم الشركة" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="وصف الشركة"
            rules={[{ required: true, message: "يرجى إدخال وصف الشركة" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="city"
                label="المدينة"
                rules={[{ required: true, message: "يرجى اختيار المدينة" }]}
              >
                <Select placeholder="اختر المدينة">
                  <Select.Option value="الرياض">الرياض</Select.Option>
                  <Select.Option value="جدة">جدة</Select.Option>
                  <Select.Option value="دمشق">دمشق</Select.Option>
                  <Select.Option value="حلب">حلب</Select.Option>
                  <Select.Option value="بيروت">بيروت</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="taxId"
                label="الرقم الضريبي"
                rules={[
                  { required: true, message: "يرجى إدخال الرقم الضريبي" },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="العنوان">
            <Input />
          </Form.Item>
          <Form.Item name="website" label="الموقع الإلكتروني">
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                حفظ التغييرات
              </Button>
              <Button onClick={() => setEditCompanyModal(false)}>إلغاء</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      {/* Add Member Modal */}
      <Modal
        title="إضافة عضو جديد"
        open={addMemberModal}
        onCancel={() => setAddMemberModal(false)}
        footer={null}
        width={500}
      >
        <Form form={memberForm} layout="vertical" onFinish={handleAddMember}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="الاسم الأول"
                rules={[{ required: true, message: "يرجى إدخال الاسم الأول" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="الاسم الأخير"
                rules={[{ required: true, message: "يرجى إدخال الاسم الأخير" }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="email"
            label="البريد الإلكتروني"
            rules={[
              { required: true, message: "يرجى إدخال البريد الإلكتروني" },
              { type: "email", message: "يرجى إدخال بريد إلكتروني صالح" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="الدور"
            rules={[{ required: true, message: "يرجى اختيار الدور" }]}
          >
            <Select placeholder="اختر الدور">
              <Select.Option value="admin">مدير</Select.Option>
              <Select.Option value="member">عضو</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                إضافة العضو
              </Button>
              <Button onClick={() => setAddMemberModal(false)}>إلغاء</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      {/* Subscription Modal */}
      <SubscriptionModal
        open={showSubscriptionModal}
        onClose={handleCloseSubscriptionModal}
        onSubscriptionSuccess={handleSubscriptionSuccess}
        requiredFeature="إدارة الاشتراك للشركات"
      />
    </div>
  );
};

export default CompanyDashboard;
