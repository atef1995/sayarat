import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Tag,
  Popconfirm,
  Alert,
  Typography,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { CompanyMember } from "../../types/company.types";
import { CompanyService } from "../../services/companyService";
import "../../styles/mobile-responsive.css";

const { Option } = Select;
const { Title, Text } = Typography;

interface CompanyMembersManagerProps {
  members: CompanyMember[];
  onMembersUpdate: (members: CompanyMember[]) => void;
}

/**
 * Mobile-friendly Company Members Manager component
 *
 * Features:
 * - Responsive table with adaptive column visibility
 * - Mobile-optimized card layout with proper button positioning
 * - Touch-friendly interface with proper spacing
 * - Accessible modal with mobile-friendly form
 * - Arabic localization support
 *
 * Mobile optimizations:
 * - Simplified column layout for small screens
 * - Condensed member information display
 * - Touch-friendly button sizes and spacing
 * - Responsive pagination controls
 *
 * #TODO: Add swipe gestures for mobile table navigation
 * #TODO: Implement pull-to-refresh functionality
 * #TODO: Add member photo upload capability
 * #TODO: Implement bulk member operations
 */

const CompanyMembersManager: React.FC<CompanyMembersManagerProps> = ({
  members,
  onMembersUpdate,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = async (values: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: "admin" | "member";
    birthdate: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const newMember = await CompanyService.addCompanyMember({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        role: values.role,
        birthdate: values.birthdate,
      });
      const updatedMembers = [...members, newMember];
      onMembersUpdate(updatedMembers);
      setIsModalVisible(false);
      form.resetFields();
      message.success("تم إضافة العضو بنجاح وإرسال دعوة بالبريد الإلكتروني");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "فشل في إضافة العضو";
      setError(errorMessage);
      message.error(errorMessage);
      console.error("Error adding member:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      await CompanyService.removeCompanyMember(memberId);
      const updatedMembers = members.filter((member) => member.id !== memberId);
      onMembersUpdate(updatedMembers);
      message.success("تم حذف العضو بنجاح");
    } catch (error) {
      message.error("فشل في حذف العضو");
      console.error("Error removing member:", error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "gold";
      case "admin":
        return "blue";
      case "member":
        return "green";
      default:
        return "default";
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
  const columns: ColumnsType<CompanyMember> = [
    {
      title: "العضو",
      key: "member",
      responsive: ["md"],
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <UserOutlined className="text-blue-600" />
          </div>
          <div>
            <div className="font-medium">
              {record.firstName} {record.lastName}
            </div>
            <div className="text-gray-500 text-sm">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "الاسم",
      key: "name",
      responsive: ["xs", "sm"],
      render: (_, record) => (
        <div>
          <div className="font-medium text-sm">
            {record.firstName} {record.lastName}
          </div>
          <div className="text-gray-500 text-xs">{record.email}</div>{" "}
          <div className="mt-1 flex gap-1">
            <Tag color={getRoleColor(record.role)} className="text-xs">
              {getRoleText(record.role)}
            </Tag>
            {record.status === "pending" && (
              <Tag color="orange" className="text-xs">
                في انتظار
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "البريد الإلكتروني",
      dataIndex: "email",
      key: "email",
      responsive: ["lg"],
      render: (email) => (
        <Space>
          <MailOutlined />
          <span>{email}</span>
        </Space>
      ),
    },
    {
      title: "الدور",
      dataIndex: "role",
      key: "role",
      responsive: ["md"],
      render: (role) => (
        <Tag color={getRoleColor(role)}>{getRoleText(role)}</Tag>
      ),
    },
    {
      title: "تاريخ الانضمام",
      dataIndex: "joinedAt",
      key: "joinedAt",
      responsive: ["lg"],
      width: 100,
      render: (date) => new Date(date).toLocaleDateString("ar-SY"),
    },
    {
      title: "آخر تسجيل دخول",
      dataIndex: "lastLogin",
      key: "lastLogin",
      responsive: ["xl"],
      render: (date) =>
        date
          ? new Date(date).toLocaleDateString("ar-SY", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "لم يسجل الدخول بعد",
    },
    {
      title: "الحالة",
      key: "status",
      responsive: ["md"],
      render: (_, record) => {
        if (record.status === "pending") {
          return <Tag color="orange">في انتظار التفعيل</Tag>;
        }
        return (
          <Tag color={record.status === "active" ? "green" : "red"}>
            {record.status === "active" ? "نشط" : "غير نشط"}
          </Tag>
        );
      },
    },
    {
      title: "الإجراءات",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {record.role !== "owner" && (
            <Popconfirm
              title="هل أنت متأكد من حذف هذا العضو؟"
              onConfirm={() => handleRemoveMember(record.id)}
              okText="نعم"
              cancelText="إلغاء"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                className="flex items-center"
              >
                <span className="hidden sm:inline">حذف</span>
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];
  return (
    <div className="w-full">
      {/* Members Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Title level={3} className="mb-1">
            أعضاء الفريق
          </Title>
          <Text type="secondary">إدارة أعضاء فريق الشركة وصلاحياتهم</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          size="large"
          className="flex items-center whitespace-nowrap"
        >
          <span className="hidden sm:inline">إضافة عضو جديد</span>
          <span className="inline sm:hidden">إضافة عضو</span>
        </Button>
      </div>
      {/* Members Table */}
      <Card
        className="w-full"
        bodyStyle={{
          padding: "0",
          overflow: "hidden",
        }}
      >
        <Table
          columns={columns}
          dataSource={members}
          rowKey="id"
          scroll={{ x: "max-content" }}
          size="middle"
          className="mobile-friendly-table"
          style={{ width: "100%" }}
          pagination={{
            total: members.length,
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: false,
            responsive: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} من ${total} عضو`,
            simple: false,
            size: "default",
            style: { padding: "16px" },
          }}
        />
      </Card>{" "}
      {/* Add Member Modal */}
      <Modal
        title="إضافة عضو جديد"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setError(null);
        }}
        footer={null}
        destroyOnClose
        centered
        width="90%"
        style={{ maxWidth: "500px" }}
        className="mobile-friendly-modal"
      >
        {error && (
          <Alert
            message="خطأ"
            description={error}
            type="error"
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setError(null)}
          />
        )}
        <Form form={form} layout="vertical" onFinish={handleAddMember}>
          <Form.Item
            name="firstName"
            label="الاسم الأول"
            rules={[
              { required: true, message: "يرجى إدخال الاسم الأول" },
              { min: 2, message: "الاسم الأول يجب أن يكون على الأقل حرفين" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="الاسم الأول"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="الاسم الأخير"
            rules={[
              { required: true, message: "يرجى إدخال الاسم الأخير" },
              { min: 2, message: "الاسم الأخير يجب أن يكون على الأقل حرفين" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="الاسم الأخير"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="البريد الإلكتروني"
            rules={[
              { required: true, message: "يرجى إدخال البريد الإلكتروني" },
              { type: "email", message: "يرجى إدخال بريد إلكتروني صالح" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="البريد الإلكتروني للعضو الجديد"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="phone"
            label="رقم الهاتف "
            rules={[
              {
                required: true,
                message: "يرجى إدخال رقم الهاتف",
              },
              {
                pattern: /^\+?[0-9\s-]{7,}$/,
                message: "يرجى إدخال رقم هاتف صالح",
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="رقم الهاتف للعضو الجديد"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="الدور"
            rules={[{ required: true, message: "يرجى اختيار دور العضو" }]}
          >
            <Select placeholder="اختر دور العضو" size="large">
              <Option value="admin">مدير</Option>
              <Option value="member">عضو</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="birthdate"
            label="تاريخ الميلاد"
            rules={[
              {
                required: true,
                message: "يرجى إدخال تاريخ الميلاد",
              },
            ]}
          >
            <Input
              type="date"
              placeholder="تاريخ الميلاد للعضو الجديد"
              size="large"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item>
            <Alert
              message="معلومة"
              description="سيتم إرسال دعوة بالبريد الإلكتروني للعضو الجديد مع تعليمات التفعيل"
              type="info"
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 16 }}
            />
          </Form.Item>

          <Form.Item>
            <Space className="w-full flex justify-end">
              <Button onClick={() => setIsModalVisible(false)}>إلغاء</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<PlusOutlined />}
              >
                إضافة العضو
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CompanyMembersManager;
