import { useState } from "react";
import { Form, Input, Button, Card, Typography, Radio, message } from "antd";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { loadApiConfig } from "../config/apiConfig";

const { Title } = Typography;
const { TextArea } = Input;
const { apiUrl } = loadApiConfig();

interface ReportFormValues {
  reason: string;
  details: string;
  reportType: "SCAM" | "INAPPROPRIATE" | "WRONG_INFO" | "OTHER";
}

const ReportListing = () => {
  const { id, toReport } = useParams<{
    id: string;
    toReport: "user" | "listing";
  }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<ReportFormValues>();

  const onFinish = async (values: ReportFormValues) => {
    if (!user) {
      message.error("يجب تسجيل الدخول للإبلاغ عن إعلان");
      return;
    }
    if (!id) {
      message.error("لا يمكن الإبلاغ عن إعلان بدون معرف");
      return;
    }
    const url = `${apiUrl}/api/report`;

    setLoading(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id,
          toReport,
          ...values,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit report");

      message.success("تم إرسال البلاغ بنجاح");
      navigate(-1);
    } catch (error) {
      console.error("Report submission error:", error);
      message.error("حدث خطأ أثناء إرسال البلاغ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <Title level={2} className="text-center mb-8">
        الإبلاغ عن إعلان
      </Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="space-y-4"
      >
        <Form.Item
          name="reportType"
          label="نوع البلاغ"
          rules={[{ required: true, message: "الرجاء اختيار نوع البلاغ" }]}
        >
          <Radio.Group>
            <Radio.Button value="SCAM">احتيال</Radio.Button>
            <Radio.Button value="INAPPROPRIATE">محتوى غير لائق</Radio.Button>
            <Radio.Button value="WRONG_INFO">معلومات خاطئة</Radio.Button>
            <Radio.Button value="OTHER">أخرى</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="reason"
          label="سبب البلاغ"
          rules={[{ required: true, message: "الرجاء كتابة سبب البلاغ" }]}
        >
          <Input placeholder="اكتب سبب البلاغ باختصار" />
        </Form.Item>

        <Form.Item
          name="details"
          label="تفاصيل إضافية"
          rules={[{ required: true, message: "الرجاء كتابة تفاصيل البلاغ" }]}
        >
          <TextArea
            rows={4}
            placeholder="اشرح تفاصيل البلاغ"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item className="text-center">
          <Button type="primary" htmlType="submit" loading={loading}>
            إرسال البلاغ
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ReportListing;
