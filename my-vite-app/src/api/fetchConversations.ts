"use server";

import { loadApiConfig } from "../config/apiConfig";
import { ConversationResponse } from "../types/api.types";

const { apiUrl } = loadApiConfig();

const fetchConversations = async () => {
  const response = await fetch(`${apiUrl}/api/conversations/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to fetch conversations");
  const { data }: ConversationResponse = await response.json();
  console.log("Fetched conversations:", data);

  return data;
};

export { fetchConversations };
