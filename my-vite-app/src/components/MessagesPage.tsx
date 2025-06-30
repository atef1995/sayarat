import { useState, useEffect } from "react";
import { Typography, Flex } from "antd";
import { useAuth } from "../hooks/useAuth";
import { fetchConversations } from "../api/fetchConversations";
import { Conversation } from "../types/conversation.types";
import ConversationBlob from "./ConversationBlob";
import { User } from "../types/api.types";

const { Text, Title } = Typography;

const MessagesPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    try {
      fetchConversations().then((data) =>
        setConversations(data as Conversation[])
      );
      console.log("conversations", conversations);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className={`max-w-2xl w-full mx-auto p-4 `}>
      <Flex vertical gap={5} justify="center" align="center" className="w-full">
        <Title level={4}>الرسائل</Title>
        <Text type="secondary">
          {conversations.length}
          {conversations.length > 2 && conversations.length < 11
            ? "محادثات"
            : conversations.length === 2
            ? "محادثتان"
            : "محادثة"}
        </Text>
        <Text>
          {
            conversations.filter(
              (conversation) =>
                conversation.is_read === 0 &&
                conversation.sender_id !== user?.id
            ).length
          }{" "}
          محادثة غير مقروءة
        </Text>
        <ConversationBlob
          user={user as User}
          conversations={conversations}
          loading={loading}
        />
      </Flex>
    </div>
  );
};

export default MessagesPage;
