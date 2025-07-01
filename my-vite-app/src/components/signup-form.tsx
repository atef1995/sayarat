import { Form, Input, Button, Card, Select, DatePicker, message } from "antd";
import type { Rule } from "antd/es/form";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { ApiResponse } from "../types/api.types";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useNavigate } from "react-router";
import { loadApiConfig } from "../config/apiConfig";

const { apiUrl } = loadApiConfig();
dayjs.extend(customParseFormat);

interface FormValues {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: dayjs.Dayjs;
  gender: "male" | "female";
}

const SignupForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const onFinish = async (values: FormValues) => {
    console.log("Form values:", values);
    const {
      email,
      username,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
    } = values;

    try {
      // Handle form submission here
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          username,
          password,
          firstName,
          lastName,
          phone,
          dateOfBirth,
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        message.error(data.error + " " + ":خطأ");
        if (data.error?.includes("اسم المستخدم")) {
          form.setFields([
            {
              name: "username",
              errors: [data.error],
            },
          ]);
        } else if (data.error?.includes("البريد الإلكتروني")) {
          form.setFields([
            {
              name: "email",
              errors: [data.error],
            },
          ]);
        }
        throw "error";
      }

      console.log(data);

      message.success(
        "تم إنشاء الحساب بنجاح! سيتم إرسال رسالة تحقق إلى بريدك الإلكتروني"
      );
      form.resetFields();
      navigate("/");
    } catch (error) {
      console.log(error);
      message.error("حدث خطأ أثناء إنشاء الحساب");
    }
  };
  const validatePassword = (_: Rule, value: string) => {
    if (!value || form.getFieldValue("password") === value) {
      return Promise.resolve();
    }
    return Promise.reject(new Error("كلمة المرور غير متطابقة"));
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-6">إنشاء حساب جديد</h1>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="space-y-4"
        scrollToFirstError={{ behavior: "instant", block: "end", focus: true }}
      >
        <div className="flex gap-4">
          <Form.Item
            name="firstName"
            label="الاسم الأول"
            rules={[{ required: true, message: "الرجاء إدخال الاسم الأول" }]}
            className="flex-1"
          >
            <Input prefix={<UserOutlined />} size="large" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="الاسم الأخير"
            rules={[{ required: true, message: "الرجاء إدخال الاسم الأخير" }]}
            className="flex-1"
          >
            <Input prefix={<UserOutlined />} size="large" />
          </Form.Item>
        </div>
        <div className="flex gap-4">
          <Form.Item
            name="email"
            label="البريد الإلكتروني"
            className="flex-1"
            rules={[
              { required: true, message: "الرجاء إدخال البريد الإلكتروني" },
              { type: "email", message: "البريد الإلكتروني غير صالح" },
            ]}
          >
            <Input prefix={<MailOutlined />} size="large" />
          </Form.Item>
          <Form.Item
            name="username"
            label="اسم المستخدم"
            className="flex-1"
            rules={[
              { required: true, message: "الرجاء إدخال اسم المستخدم" },
              { type: "string", message: "اسم المستخدم غير صالح" },
            ]}
          >
            <Input prefix={<UserOutlined />} size="large" />
          </Form.Item>
        </div>

        <Form.Item
          name="phone"
          label="رقم الهاتف"
          rules={[
            { required: true, message: "الرجاء إدخال رقم الهاتف" },
            { pattern: /^[0-9]{10}$/, message: "رقم الهاتف غير صالح" },
          ]}
        >
          <Input prefix={<PhoneOutlined />} size="large" />
        </Form.Item>

        <Form.Item
          name="dateOfBirth"
          label="تاريخ الميلاد"
          rules={[
            { required: true, message: "الرجاء إدخال تاريخ الميلاد" },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const age = new Date().getFullYear() - value.year();
                if (age < 16) {
                  return Promise.reject("يجب أن يكون عمرك 16 سنة على الأقل");
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker
            defaultValue={dayjs().subtract(8, "year")}
            maxDate={dayjs().subtract(8, "year")}
            className="w-full"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="gender"
          label="الجنس"
          rules={[{ required: true, message: "الرجاء اختيار الجنس" }]}
        >
          <Select size="large">
            <Select.Option value="male">ذكر</Select.Option>
            <Select.Option value="female">أنثى</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="password"
          label="كلمة المرور"
          rules={[
            { required: true, message: "الرجاء إدخال كلمة المرور" },
            { min: 8, message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
            {
              pattern:
                /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
              message: "كلمة المرور يجب أن تحتوي على حروف وأرقام ورموز خاصة",
            },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} size="large" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="تأكيد كلمة المرور"
          dependencies={["password"]}
          rules={[
            { required: true, message: "الرجاء تأكيد كلمة المرور" },
            { validator: validatePassword },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} size="large" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" block>
            إنشاء الحساب
          </Button>
        </Form.Item>
      </Form>

      <div className="mt-6 pt-4 border-t text-center">
        <p className="text-gray-400">
          هل أنت وكيل سيارات أو تمتلك معرض؟{" "}
          <Button
            type="link"
            onClick={() => navigate("/company-signup")}
            className="p-0"
          >
            إنشاء حساب شركة
          </Button>
        </p>
      </div>
    </Card>
  );
};

export default SignupForm;
