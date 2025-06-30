import { Button, Card, Form, Input, message } from "antd";
import React, { useState } from "react";
import { loadApiConfig } from "../config/apiConfig";

const { apiUrl } = loadApiConfig();

const ResetPasswordReq: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const { email } = form.getFieldsValue();
    console.log("Submitting reset password request for email:", email);

    try {
      // Replace with your actual API call
      const response = await fetch(`${apiUrl}/api/reset-password-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        message.info("Password reset link has been sent to your email.");
      } else {
        message.error("Failed to send reset link. Please try again.");
      }
    } catch (error) {
      console.log("Error sending reset link:", error);

      message.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
      form.resetFields();
    }
  };

  return (
    <Card>
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="email"
          label="البريد الإلكتروني"
          className="flex-1"
          rules={[
            { required: true, message: "الرجاء إدخال البريد الإلكتروني" },
            { type: "email", message: "البريد الإلكتروني غير صالح" },
          ]}
        >
          <Input size="large" />
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

export default ResetPasswordReq;
