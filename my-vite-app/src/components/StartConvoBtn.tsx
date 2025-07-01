import { useState } from "react";
import { Button, Modal, Form, Input, message } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router";
import { loadApiConfig } from "../config/apiConfig";

const { apiUrl } = loadApiConfig();

interface StartConvoBtnProps {
  listingId: string;
}

interface ConversationPayload {
  listingId: string;
  newMessage: string;
  created_at: string;
}

export const StartConvoBtn: React.FC<StartConvoBtnProps> = ({ listingId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const checkAuth = () => {
    if (!isAuthenticated) {
      message.error("الرجاء تسجيل الدخول لبدء المحادثة");
      navigate("/login");
      return;
    }
  };

  const handleStartConversation = async (values: { message: string }) => {
    setLoading(true);
    try {
      const payload: ConversationPayload = {
        listingId,
        newMessage: values.message,
        created_at: new Date().toISOString(),
      };

      const response = await fetch(`${apiUrl}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to start conversation");

      message.success("Conversation started successfully");
      setIsModalOpen(false);
      form.resetFields();
    } catch (error: unknown) {
      message.error(
        `Failed to start conversation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="primary"
        icon={<MessageOutlined />}
        onClick={() => {
          checkAuth();
          setIsModalOpen(true);
        }}
      >
        ارسل البائع
      </Button>

      <Modal
        title="بدء محادثة"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleStartConversation} layout="vertical">
          <Form.Item
            name="message"
            label="الرسالة"
            rules={[
              { required: true, message: "الرجاء إدخال رسالة" },
              { max: 500, message: "لا يمكن أن تتجاوز الرسالة 500 حرف" },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              ارسل
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
