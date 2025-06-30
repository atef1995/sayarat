import { Form, Input } from "antd";
import type { Rule } from "antd/es/form";
import type { FormInstance } from "antd/es/form";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

/**
 * Admin Information Step Component
 *
 * RESPONSIBILITIES:
 * - Collect primary contact/admin information
 * - Handle form validation for user credentials
 * - Validate password matching
 *
 * #TODO: Add email verification in real-time
 * #TODO: Implement username availability checking
 * #TODO: Add phone number international format support
 */
interface AdminInfoStepProps {
  form: FormInstance; // Form instance passed from parent
}

const AdminInfoStep: React.FC<AdminInfoStepProps> = ({ form }) => {
  const validatePassword = (_: Rule, value: string) => {
    if (!value || form.getFieldValue("password") === value) {
      return Promise.resolve();
    }
    return Promise.reject(new Error("كلمة المرور غير متطابقة"));
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">معلومات المسؤول الرئيسي</h3>
        <p className="text-gray-400">
          هذا الشخص سيكون المدير الرئيسي لحساب الشركة
        </p>
      </div>

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
            {
              min: 3,
              message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
            },
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
    </div>
  );
};

export default AdminInfoStep;
