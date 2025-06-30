import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Card,
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Spin,
  Form,
  message,
} from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";
import { memo } from "react";
import { Message, useMessages } from "../hooks/useMessages";
import { createStandardDate, formatMessageTime } from "../helper/time";
import { Virtuoso } from "react-virtuoso";
import { User } from "../types/api.types";
import { loadApiConfig } from "../config/apiConfig";

const { Text } = Typography;
const { apiUrl } = loadApiConfig();

// Memoized Message Component
interface MessageItemProps {
  message: Message;
  userId?: Blob;
  className?: string;
  isLastMessage?: boolean;
  user: User;
}

const MessageItem = memo(
  ({ message, className, isLastMessage, user }: MessageItemProps) => {
    const navigate = useNavigate();
    const messageRef = useRef<HTMLDivElement | null>(null);
    const [time, setTime] = useState<string>(
      formatMessageTime(message.created_at)
    );
    console.log(user.username, message.username);

    useEffect(() => {
      if (isLastMessage && messageRef.current) {
        messageRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, [isLastMessage]);

    return (
      <List.Item className={className} key={message.id}>
        <Card
          ref={messageRef}
          bordered={false}
          className={`shadow-xl w-fit min-w-52 max-w-md mx-1  ${
            message.is_sender
              ? "bg-blue-50 dark:bg-blue-700 dark:opacity-80 before:absolute before:w-10 before:h-10 before:blur-3xl before:bg-blue-500/50 dark:before:bg-blue-300/50 after:absolute after:w-10 after:h-10 after:blur-3xl dark:after:bg-red-500/50"
              : "bg-gray-50 dark:bg-gray-500 dark:opacity-80"
          }`}
        >
          <div
            className={`flex items-center gap-2 mb-2 ${
              message.is_sender ? "flex-row" : "flex-row-reverse"
            }`}
          >
            <Avatar
              src={message.picture}
              className="cursor-pointer"
              alt={message.first_name}
              onClick={(e) => {
                e?.preventDefault();
                e?.stopPropagation();
                navigate(`/user/${message.username}`);
              }}
            />

            <Text className="text-start">
              {user.username === message.username ? "انت" : message.first_name}
            </Text>
          </div>
          <Text className="text-balance text-ellipsis">{message.content}</Text>
          <Text
            className="block text-start text-[0.5rem] dark:brightness-0 dark:invert mt-2"
            onMouseOverCapture={() => setTime(message.created_at)}
            onMouseLeave={() => setTime((prev) => formatMessageTime(prev))}
          >
            {time}
          </Text>
        </Card>
      </List.Item>
    );
  }
);

const ConversationDetail = () => {
  const { conversationId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { messages, loadMoreMessages, hasMore, addMessage } = useMessages(
    conversationId as string
  );
  console.log(messages, hasMore);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await loadMoreMessages();
    setIsLoadingMore(false);
  };

  const handleSendMessage = async (values: { newMessage: string }) => {
    const { newMessage } = values;
    const { local } = createStandardDate();
    const created_at = local;

    if (!newMessage.trim()) return;
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/conversations/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newMessage, conversationId, created_at }),
      });

      if (!response.ok) throw new Error("Failed to fetch conversations");
      const { message: responseMessage } = await response.json();

      if (response.ok) {
        // mock adding message to the list of messages for now until we get the real data from the server response to avoid another fetch request and re-render the list
        addMessage({
          id: "new-message" + Math.random(),
          picture: user?.picture as string,
          first_name: user?.firstName as string,
          username: user?.username as string,
          content: newMessage,
          is_sender: true,
          created_at,
        });
        message.success(responseMessage);
        form.resetFields();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Virtuoso
        className="flex-1 w-full max-w-3xl mx-auto my-4"
        data={messages}
        totalCount={messages.length}
        followOutput={true} // Add this to follow new messages
        alignToBottom={true} // Add this to align to bottom
        components={{
          Footer: () => (isLoadingMore ? <Spin className="p-4" /> : null),
        }}
        startReached={handleLoadMore} // Add this for infinite scroll
        itemContent={(index, message) => (
          <MessageItem
            className={`flex w-full min-h-fit my-2 ${
              message.is_sender ? "justify-start" : "justify-end"
            }`}
            message={message}
            isLastMessage={index === messages.length - 1}
            user={user as User}
          />
        )}
      />

      <Form
        form={form}
        className="relative flex justify-center items-center gap-2 p-3 backdrop-blur-3xl rounded-xl shadow-md w-full"
        onFinish={handleSendMessage}
      >
        <Form.Item
          required
          rules={[{ required: true }]}
          name="newMessage"
          className="flex-1"
        >
          <Input.TextArea
            enterKeyHint="send"
            onPressEnter={form.submit}
            ref={inputRef}
            required
            placeholder="اكتب رسالة..."
            autoSize={{ minRows: 2, maxRows: 4 }}
            className=""
          />
        </Form.Item>
        <Form.Item>
          <Button
            size="small"
            type="primary"
            icon={<SendOutlined />}
            htmlType="submit"
            loading={loading}
          >
            إرسال
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default memo(ConversationDetail);
