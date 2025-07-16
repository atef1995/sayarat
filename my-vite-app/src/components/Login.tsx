import { Form, Input, Button, Card, Flex, Checkbox, App, Divider } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import Title from "antd/es/typography/Title";
import FacebookLoginButton from "./FacebookLoginButton";

interface LoginForm {
  username: string;
  password: string;
}

const Login = () => {
  const { message } = App.useApp();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [form] = Form.useForm();

  const onFinish = async (values: LoginForm) => {
    setIsLoading(true);
    const { username, password } = values;
    try {
      // Pass credentials as an object, not individual parameters
      const data = await login({ username, password });

      if (data.success === true) {
        console.log("Login successful, navigating to profile");
        message.success("تم تسجيل الدخول بنجاح");

        // Navigate immediately after successful login
        navigate("/profile", { replace: true });
      } else {
        console.error("Login failed:", data.error);
        message.error(String(data.error || "فشل في تسجيل الدخول"));
      }
    } catch (err) {
      console.error("Login error:", err);
      message.error("فشل في تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only redirect if already authenticated and not currently logging in
    if (isAuthenticated && !isLoading) {
      console.log("User already authenticated, redirecting...");
      navigate("/profile", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <Card className="min-w-[400px] min-h-fit h-56">
      <Form
        initialValues={{ remember: true }}
        form={form}
        name="login"
        onFinish={onFinish}
        layout="vertical"
      >
        <Form.Item>
          <Title level={2} className="text-pretty">
            تسجيل الدخول إلى حسابك
          </Title>
        </Form.Item>
        <Form.Item
          name="username"
          rules={[
            {
              required: true,
              message: "Please input your username!",
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Username"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            {
              required: true,
              message: "Please input your password!",
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            size="large"
          />
        </Form.Item>
        <Form.Item>
          <Flex justify="space-between" align="center">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>تذكرني</Checkbox>
            </Form.Item>
            <a onClick={() => navigate("/reset-password-req")}>
              نسيت كلمة المرور
            </a>
          </Flex>
        </Form.Item>

        <Form.Item>
          <Button block type="primary" htmlType="submit" loading={isLoading}>
            تسجيل الدخول
          </Button>
          أو <a onClick={() => navigate("/signup")}>سجل الآن!</a>
        </Form.Item>

        <Divider plain>أو</Divider>

        <Form.Item>
          <FacebookLoginButton
            block
            loading={isLoading}
            redirectTo="/profile"
          />
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Login;
