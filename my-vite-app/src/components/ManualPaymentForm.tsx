import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Typography,
  Alert,
  message,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  BankOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { User } from "../types/api.types";

const { Title, Text } = Typography;
const { Option } = Select;

interface ManualPaymentFormProps {
  open: boolean;
  onClose: () => void;
  planName: string;
  planPrice: number;
  currency: string;
  onSubmit: (data: ManualPaymentData) => void;
  user?: User | null;
}

export interface ManualPaymentData {
  fullName: string;
  phone: string;
  email: string;
  paymentMethod: "bank_transfer" | "cash" | "mobile_wallet";
  preferredContact: "phone" | "email" | "whatsapp";
  notes?: string;
  planName: string;
  planPrice: number;
  currency: string;
}

const ManualPaymentForm: React.FC<ManualPaymentFormProps> = ({
  open,
  onClose,
  planName,
  planPrice,
  currency,
  onSubmit,
  user = { firstName: "", lastName: "", phone: "", email: "" }, // Default user data
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (
    values: Omit<ManualPaymentData, "planName" | "planPrice" | "currency">
  ) => {
    setLoading(true);
    try {
      const paymentData: ManualPaymentData = {
        ...values,
        planName,
        planPrice,
        currency,
      };

      onSubmit(paymentData);
      form.resetFields();
      onClose();
      message.success("تم إرسال طلب الدفع اليدوي بنجاح! سنتواصل معك قريباً.");
    } catch (error) {
      console.error("Manual payment submission error:", error);
      message.error("حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="text-center">
          <CreditCardOutlined className="text-2xl text-blue-500 mr-2" />
          <span>طلب دفع يدوي</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
    >
      <div className="mb-6">
        <Alert
          message="الدفع اليدوي"
          description={`تريد الاشتراك في خطة ${planName} بمبلغ ${planPrice} ${currency}. املأ النموذج أدناه وسنتواصل معك لترتيب عملية الدفع.`}
          type="info"
          showIcon
          className="mb-4"
        />
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          name="fullName"
          label="الاسم الكامل"
          rules={[{ required: true, message: "يرجى إدخال الاسم الكامل" }]}
          initialValue={user?.firstName + " " + user?.lastName || ""}
        >
          <Input
            autoComplete="name"
            prefix={<UserOutlined />}
            size="large"
            placeholder="اسمك الكامل"
          />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item
            name="phone"
            label="رقم الهاتف"
            initialValue={user?.phone}
            rules={[
              { required: true, message: "يرجى إدخال رقم الهاتف" },
              { pattern: /^[0-9]{10,15}$/, message: "رقم الهاتف غير صحيح" },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              size="large"
              placeholder="رقم الهاتف"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="البريد الإلكتروني"
            initialValue={user?.email}
            rules={[
              { required: true, message: "يرجى إدخال البريد الإلكتروني" },
              { type: "email", message: "البريد الإلكتروني غير صحيح" },
            ]}
          >
            <Input size="large" placeholder="البريد الإلكتروني" />
          </Form.Item>
        </div>

        <Form.Item
          name="paymentMethod"
          label="طريقة الدفع المفضلة"
          rules={[{ required: true, message: "يرجى اختيار طريقة الدفع" }]}
        >
          <Select size="large" placeholder="اختر طريقة الدفع">
            <Option value="bank_transfer">حوالة بنكية</Option>
            <Option value="cash">دفع نقدي</Option>
            <Option value="mobile_wallet">محفظة إلكترونية</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="preferredContact"
          label="طريقة التواصل المفضلة"
          rules={[{ required: true, message: "يرجى اختيار طريقة التواصل" }]}
        >
          <Select size="large" placeholder="كيف تفضل أن نتواصل معك؟">
            <Option value="phone">مكالمة هاتفية</Option>
            <Option value="whatsapp">واتساب</Option>
            <Option value="email">بريد إلكتروني</Option>
          </Select>
        </Form.Item>

        <Form.Item name="notes" label="ملاحظات إضافية (اختياري)">
          <Input.TextArea
            rows={3}
            placeholder="أي ملاحظات أو تفاصيل إضافية..."
          />
        </Form.Item>

        <div className=" p-4 rounded-lg mb-4">
          <Title level={5} className="mb-2">
            تفاصيل الاشتراك:
          </Title>
          <Text>
            <strong>الخطة:</strong> {planName}
          </Text>
          <br />
          <Text>
            <strong>المبلغ:</strong> {planPrice} {currency}
          </Text>
        </div>

        <div className="flex gap-3 justify-end">
          <Button size="large" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            loading={loading}
            icon={<BankOutlined />}
          >
            إرسال طلب الدفع
          </Button>
        </div>
      </Form>

      <div className="mt-4 pt-4 border-t">
        <Text type="secondary" className="text-xs">
          سنتواصل معك خلال 24 ساعة لترتيب عملية الدفع وتفعيل اشتراكك.
        </Text>
      </div>
    </Modal>
  );
};

export default ManualPaymentForm;
