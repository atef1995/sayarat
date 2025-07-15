import { Form, Input, Button, Card, Flex, Checkbox, App } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import Title from "antd/es/typography/Title";

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
        navigate("/");
      } else {
        message.error(String(data.error));
      }
    } catch (err) {
      console.log("Login error:", err);
      message.error("فشل في تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate(-1);
    }
  }, [isAuthenticated, navigate]);

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
      </Form>
    </Card>
  );
};

export default Login;
