import React, { useState, useEffect } from "react";
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
  Alert,
} from "antd";
import {
  CrownOutlined,
  SettingOutlined,
  SecurityScanOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { User } from "../../types/api.types";
import { loadApiConfig } from "../../config/apiConfig";

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

interface ProfileFormProps {
  userDetails: User | null;
  isCompany?: boolean;
  onProfileUpdate: (user: User) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  userDetails,
  isCompany,
  onProfileUpdate,
}) => {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);

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

      onProfileUpdate(data.user);
      setIsEditing(false);
      message.success("تم تحديث الملف الشخصي بنجاح");
    } catch (error) {
      console.error(error);
      message.error("فشل في تحديث الملف الشخصي");
    }
  };

  const resetPasswordRequest = async () => {
    const email = form.getFieldValue("email");
    const firstName = form.getFieldValue("firstName");

    try {
      const response = await fetch(`${apiUrl}/reset-password-request`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          to: { email, name: firstName },
        }),
      });

      if (response.ok) {
        message.info("تفقد بريدك الالكتروني للرابط");
      } else {
        throw new Error("فشل في إرسال رابط إعادة تعيين كلمة المرور");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      message.error("فشل في إرسال رابط إعادة تعيين كلمة المرور");
    }
  };
  // Set form values when userDetails changes
  useEffect(() => {
    if (userDetails) {
      form.setFieldsValue({
        ...userDetails,
        dateOfBirth: userDetails.dateOfBirth
          ? dayjs(userDetails.dateOfBirth)
          : null,
      });
    }
  }, [userDetails, form]);

  return (
    <Card title="الملف الشخصي" className="min-h-[544px]">
      {isCompany && (
        <Alert
          message="حساب شركة"
          description="أنت تستخدم حساب شركة مع مميزات إضافية."
          type="info"
          icon={<CrownOutlined />}
          showIcon
          className="mb-4"
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleSave}>
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
                onClick={resetPasswordRequest}
              >
                تغيير كلمة السر
              </Button>
            </Space>
          )}
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ProfileForm;
