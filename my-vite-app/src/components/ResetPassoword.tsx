import { Button, Card, Form, Input, message } from "antd";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ApiResponse } from "../types/api.types";
import { LockOutlined } from "@ant-design/icons";
import { loadApiConfig } from "../config/apiConfig";

const { apiUrl } = loadApiConfig();

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const { token } = useParams();
  const router = useNavigate();

  // Use useEffect to handle invalid token navigation
  useEffect(() => {
    if (!token) {
      message.error("رمز إعادة تعيين كلمة المرور غير صالح");
      router("/login", { replace: true });
    }
  }, [token, router]);

  // Don't render if no token
  if (!token) {
    return null;
  }

  const resetPassword = async () => {
    setLoading(true);
    const formValues = form.getFieldsValue();
    console.log({ formValues });
    const password = formValues.password;
    try {
      const response = await fetch(`${apiUrl}/reset-password`, {
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

      // Wait a moment for the success message to show, then navigate
      setTimeout(() => {
        router("/login", { replace: true });
      }, 1500);
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
    <Card
      title="إعادة تعيين كلمة المرور"
      className="w-full min-w-max max-w-sm mx-auto mt-10"
    >
      <Form form={form} onFinish={resetPassword} layout="vertical">
        <Form.Item
          label="كلمة السر"
          name="password"
          layout="vertical"
          rules={[
            { required: true, message: "الرجاء إدخال كلمة المرور" },
            { min: 8, message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
            { max: 20, message: "كلمة المرور يجب أن لا تتجاوز 20 حرفًا" },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();

                const hasLowerCase = /[a-z]/.test(value);
                const hasUpperCase = /[A-Z]/.test(value);
                const hasNumber = /\d/.test(value);
                const hasSpecialChar =
                  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(value);

                if (!hasLowerCase) {
                  return Promise.reject(
                    new Error(
                      "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل"
                    )
                  );
                }
                if (!hasUpperCase) {
                  return Promise.reject(
                    new Error(
                      "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل"
                    )
                  );
                }
                if (!hasNumber) {
                  return Promise.reject(
                    new Error("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل")
                  );
                }
                if (!hasSpecialChar) {
                  return Promise.reject(
                    new Error(
                      "كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل"
                    )
                  );
                }

                return Promise.resolve();
              },
            },
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
