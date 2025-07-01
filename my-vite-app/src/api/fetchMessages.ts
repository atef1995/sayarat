import { loadApiConfig } from "../config/apiConfig";

const { apiUrl } = loadApiConfig();

interface Message {
  count: number;
}

export const fetchUnreadMessagesCount = async (): Promise<number> => {
  try {
    const response = await fetch(`${apiUrl}/conversations/unread`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch unread messages");
    }

    const messages: Message = await response.json();
    console.log({ messages });

    return messages.count;
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    throw error;
  }
};
