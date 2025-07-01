import { loadApiConfig } from "../config/apiConfig";

const { apiUrl } = loadApiConfig();

export interface MessageRecipient {
  id: string;
  type: "seller" | "company_handler";
  name: string;
  email: string;
  isCompanyHandler: boolean;
  originalSeller?: string;
  currentOwner?: string;
  handlerRole?: string;
}

export interface ConversationOwnershipHistoryItem {
  id: string;
  conversation_id: string;
  old_owner_id: string;
  old_owner_type: string;
  new_owner_id: string;
  new_owner_type: string;
  change_reason: string;
  changed_by: string;
  changed_at: string;
}

export interface MessageStats {
  totalConversations: number;
  conversationsWithTransfers: number;
  activeMessageHandlers: number;
}

export interface EnhancedCompanyStats {
  members: {
    total: number;
    active: number;
    removed: number;
    pending: number;
  };
  messaging: MessageStats;
}

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Enhanced Message Service
 * Handles messaging operations with enhanced company member management
 */
class MessageService {
  private baseUrl = `${apiUrl}/messages`;

  /**
   * Handle fetch requests with error handling
   */
  private async fetchWithCredentials(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    return response;
  }

  /**
   * Get message recipient for a listing
   * Uses enhanced routing that considers company member status
   */
  async getListingMessageRecipient(listingId: string): Promise<{
    success: boolean;
    recipient: MessageRecipient;
  }> {
    try {
      const response = await this.fetchWithCredentials(
        `${this.baseUrl}/listing/${listingId}/recipient`
      );
      return await response.json();
    } catch (error) {
      console.error("Error getting listing message recipient:", error);
      throw new Error("Failed to get message recipient");
    }
  }

  /**
   * Get conversation ownership history
   */
  async getConversationOwnershipHistory(conversationId: string): Promise<{
    success: boolean;
    history: ConversationOwnershipHistoryItem[];
  }> {
    try {
      const response = await this.fetchWithCredentials(
        `${this.baseUrl}/conversation/${conversationId}/ownership-history`
      );
      return await response.json();
    } catch (error) {
      console.error("Error getting conversation ownership history:", error);
      throw new Error("Failed to get ownership history");
    }
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<{
    success: boolean;
    count: number;
  }> {
    try {
      const response = await this.fetchWithCredentials(
        `${this.baseUrl}/unread`
      );
      return await response.json();
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw new Error("Failed to get unread count");
    }
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await this.fetchWithCredentials(
        `${this.baseUrl}/${conversationId}/read`,
        {
          method: "PUT",
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      throw new Error("Failed to mark conversation as read");
    }
  }

  /**
   * Send message to listing (creates conversation if needed)
   */
  async sendMessageToListing(data: {
    listingId: string;
    message: string;
  }): Promise<{
    success: boolean;
    conversation: Conversation;
  }> {
    try {
      const response = await this.fetchWithCredentials(this.baseUrl, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error("Error sending message to listing:", error);
      throw new Error("Failed to send message");
    }
  }

  /**
   * Send message to existing conversation
   */
  async sendMessageToConversation(data: {
    conversationId: string;
    message: string;
  }): Promise<{
    success: boolean;
    message: Message;
  }> {
    try {
      const response = await this.fetchWithCredentials(
        `${this.baseUrl}/messages`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error sending message to conversation:", error);
      throw new Error("Failed to send message");
    }
  }

  /**
   * Get user conversations
   */
  async getUserConversations(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    success: boolean;
    data: Conversation[];
  }> {
    try {
      const response = await this.fetchWithCredentials(`${this.baseUrl}/user`, {
        method: "POST",
        body: JSON.stringify({ page, limit }),
      });
      return await response.json();
    } catch (error) {
      console.error("Error getting user conversations:", error);
      throw new Error("Failed to get conversations");
    }
  }

  /**
   * Get conversation messages with pagination
   */
  async getConversationMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    success: boolean;
    data: Message[];
  }> {
    try {
      const url = new URL(`${this.baseUrl}/${conversationId}/messages`);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("limit", limit.toString());

      const response = await this.fetchWithCredentials(url.toString());
      return await response.json();
    } catch (error) {
      console.error("Error getting conversation messages:", error);
      throw new Error("Failed to get conversation messages");
    }
  }

  /**
   * Get conversations by listing ID
   */
  async getConversationsByListingId(listingId: string): Promise<{
    success: boolean;
    data: Conversation[];
  }> {
    try {
      const response = await this.fetchWithCredentials(
        `${this.baseUrl}/${listingId}`
      );
      return await response.json();
    } catch (error) {
      console.error("Error getting conversations by listing ID:", error);
      throw new Error("Failed to get conversations");
    }
  }

  /**
   * Get enhanced company stats (includes messaging statistics)
   */
  async getEnhancedCompanyStats(): Promise<{
    success: boolean;
    data: EnhancedCompanyStats;
  }> {
    try {
      const response = await this.fetchWithCredentials(
        `${apiUrl}/company/stats/enhanced`
      );
      return await response.json();
    } catch (error) {
      console.error("Error getting enhanced company stats:", error);
      throw new Error("Failed to get company statistics");
    }
  }
}

// Export singleton instance
export const messageService = new MessageService();
export default messageService;
