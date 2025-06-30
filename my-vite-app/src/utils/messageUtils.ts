import { Message } from "../hooks/useMessages";

export const deduplicateMessages = (messages: Message[]): Message[] => {
  return Array.from(new Map(messages.map((msg) => [msg.id, msg])).values());
};
