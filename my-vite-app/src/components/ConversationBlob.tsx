import { List, Avatar, Typography, Space, Flex, Image, Badge } from "antd";
import { User } from "../types/api.types";
import { useNavigate } from "react-router";
import { formatMessageTime } from "../helper/time";
import { Conversation } from "../types/conversation.types";
import { loadApiConfig } from "../config/apiConfig";

interface ConversationProps {
  conversations: Conversation[];
  user: User;
  loading: boolean;
}

const { Text } = Typography;
const { apiUrl } = loadApiConfig();

const ConversationBlob = ({
  conversations,
  user,
  loading,
}: ConversationProps) => {
  const navigate = useNavigate();
  const handleConversationClick = async (conversationId: string) => {
    const res = await fetch(`${apiUrl}/conversations/${conversationId}/read`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to mark conversation as read");

    navigate(`/conversation/${conversationId}/`);
  };

  return (
    <List
      className="w-full "
      loading={loading}
      pagination={{
        position: "both",
        pageSize: 10,
        hideOnSinglePage: true,
      }}
      dataSource={conversations}
      itemLayout="horizontal"
      renderItem={(conversation) => (
        <List.Item
          key={conversation.conversation_id}
          onClick={() => handleConversationClick(conversation.conversation_id)}
          className={`my-5 min-h-40 min-w-fit cursor-pointer hover:bg-gray-50/10 dark:bg-gray-500 space-x-2 rounded-lg transition-colors ${
            conversation.is_read === 1 || conversation.sender_id === user?.id
              ? "bg-white"
              : "bg-blue-300"
          }`}
        >
          <List.Item.Meta
            title={
              <div className="flex items-center justify-start">
                <Badge
                  title="message"
                  dot={
                    !conversation.is_read && conversation.sender_id !== user?.id
                  }
                  className="m-2"
                >
                  <Text className="text-xs mx-2">
                    {conversation.sender_id === user.id
                      ? "انت"
                      : conversation.sender}
                  </Text>
                  <Avatar src={conversation.picture}></Avatar>
                </Badge>
              </div>
            }
            description={
              <Flex vertical align="center" justify="center">
                <Space
                  direction="vertical"
                  size={1}
                  align="center"
                  className="min-w-fit w-24 rounded-full bg-blue-500"
                >
                  <Text>{conversation.last_message.slice(0, 15) + ".."}</Text>
                  <Text type="secondary" className="text-xs">
                    {formatMessageTime(conversation.last_message_time)}
                  </Text>
                </Space>
              </Flex>
            }
          />
          <Flex vertical align="center" gap={5}>
            <Space align="center" direction="vertical">
              {conversation.title ? (
                <Text strong>{conversation.title}</Text>
              ) : (
                <>
                  <Text strong>{conversation.model}</Text>
                  <Text strong>{conversation.make}</Text>
                </>
              )}
            </Space>
            <Image className="rounded" src={conversation.url} width={110} />
          </Flex>
        </List.Item>
      )}
    />
  );
};

export default ConversationBlob;
