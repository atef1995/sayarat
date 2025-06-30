import { Button, Card, Form, Input, message } from "antd";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ApiResponse } from "../types/api.types";
import { LockOutlined } from "@ant-design/icons";
import { loadApiConfig } from "../config/apiConfig";

const { apiUrl } = loadApiConfig();

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>();
  const { token } = useParams();
  const router = useNavigate();
  if (!token) {
    message.error("رمز إعادة تعيين كلمة المرور غير صالح");
    router("/login");
    return null;
  }

  const resetPassword = async () => {
    setLoading(true);
    const formValues = form.getFieldsValue();
    console.log({ formValues });
    const password = formValues.password;
    try {
      const response = await fetch(`${apiUrl}/api/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const errorData: ApiResponse = await response.json();
        message.error(errorData.error || "فشل في إعادة تعيين كلمة المرور");
        return;
      }

      const data: ApiResponse = await response.json();
      message.success("تم إعادة تعيين كلمة المرور بنجاح");
      console.log({ data });
      router("/login");
    } catch (error) {
      console.error("Error resetting password:", error);
      message.error("حدث خطأ أثناء إعادة تعيين كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = {
    validator: (_: unknown, value: string) => {
      if (!value || form.getFieldValue("password") === value) {
        return Promise.resolve();
      }
      return Promise.reject(new Error("كلمات المرور غير متطابقة"));
    },
  };

  return (
    <Card>
      <Form form={form} onFinish={resetPassword} layout="vertical">
        <Form.Item
          label="كلمة السر"
          name="password"
          layout="vertical"
          rules={[
            { required: true, message: "الرجاء إدخال كلمة المرور" },
            { min: 8, message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>
        <Form.Item
          label="نأكيد كلمة السر"
          name="confirmPassword"
          layout="vertical"
          dependencies={["password"]}
          rules={[
            { required: true, message: "الرجاء تأكيد كلمة المرور" },
            validatePassword,
          ]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
          >
            تم
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ResetPassword;
