import { useState, useEffect, useCallback } from "react";
import { deduplicateMessages } from "../utils/messageUtils";
import { loadApiConfig } from "../config/apiConfig";
const { apiUrl } = loadApiConfig();

export interface Message {
  id: string;
  picture: string;
  first_name: string;
  username: string;
  content: string;
  is_sender: boolean;
  created_at: string;
}

export const useMessages = (
  conversationId: string,
  messageLimit: number = 20
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `${apiUrl}/conversations/${conversationId}/messages?page=${page}?limit=${messageLimit}`,
        { credentials: "include" }
      );

      if (!response.ok) throw new Error("Failed to fetch messages");

      const data = await response.json();
      console.log(data);

      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, ...data].reverse();
        return deduplicateMessages(newMessages);
      });
      setHasMore(data.total === 20);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }, [conversationId, page, messageLimit]);

  useEffect(() => {
    fetchMessages();
  }, []);

  const loadMoreMessages = () => {
    if (!hasMore) return;
    setPage((prev) => prev + 1);
    fetchMessages();
  };

  const addMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages, message];
      return deduplicateMessages(newMessages);
    });
  }, []);

  return { messages, loadMoreMessages, hasMore, addMessage, fetchMessages };
};
