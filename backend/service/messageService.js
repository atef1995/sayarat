const MessageDatabase = require('./messageDatabase');
const { MessageValidation } = require('../middleware/messageValidation');

/**
 * Message Service
 * Handles business logic for messaging operations
 */
class MessageService {
  constructor(knex) {
    this.db = new MessageDatabase(knex);
  }

  /**
   * Get unread message count for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Response object with count
   */
  async getUnreadCount(userId) {
    try {
      const count = await this.db.getUnreadMessageCount(userId);

      return {
        success: true,
        count: count
      };
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw new Error('Failed to fetch unread messages');
    }
  }

  /**
   * Mark messages as read in a conversation
   * @param {number} conversationId - Conversation ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Response object
   */
  async markConversationAsRead(conversationId, userId) {
    try {
      MessageValidation.validateConversationId(conversationId);

      const isParticipant = await this.db.isUserParticipant(conversationId, userId);
      if (!isParticipant) {
        throw new Error('Unauthorized access');
      }

      await this.db.markMessagesAsRead(conversationId, userId);

      return {
        success: true,
        message: 'Messages marked as read'
      };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Send a message to an existing conversation
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} - Response object
   */
  async sendMessageToConversation(messageData) {
    const { conversationId, newMessage, created_at, userId } = messageData;

    try {
      MessageValidation.validateCreateMessage({ conversationId, newMessage });

      const isParticipant = await this.db.isUserParticipant(conversationId, userId);
      if (!isParticipant) {
        throw new Error('Unauthorized access');
      }

      await this.db.insertMessage({
        conversationId,
        senderId: userId,
        content: newMessage,
        createdAt: created_at
      });

      return {
        success: true,
        message: 'Message sent successfully'
      };
    } catch (error) {
      console.error('Error sending message to conversation:', error);
      throw error;
    }
  }

  /**
   * Send a message to a listing (creates conversation if needed)
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} - Response object
   */
  async sendMessageToListing(messageData) {
    const { listingId, newMessage, created_at, userId } = messageData;

    try {
      MessageValidation.validateCreateMessage({ listingId, newMessage });

      // Get seller ID for the listing
      const listing = await this.db.getListingById(listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }

      const sellerId = listing.seller_id;

      if (sellerId === userId) {
        throw new Error('Cannot message yourself');
      }

      // Check if conversation exists or create new one
      const conversationId = await this._findOrCreateConversation(listingId, sellerId, userId, created_at);

      // Add message
      await this.db.insertMessage({
        conversationId,
        senderId: userId,
        content: newMessage,
        createdAt: created_at
      });

      return {
        success: true,
        conversationId,
        message: 'Message sent successfully'
      };
    } catch (error) {
      console.error('Error sending message to listing:', error);
      throw error;
    }
  }

  /**
   * Get user conversations
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Response object with conversations
   */
  async getUserConversations(userId) {
    try {
      const conversations = await this.db.getUserConversations(userId);

      return {
        success: true,
        data: conversations
      };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw new Error('Failed to fetch conversations');
    }
  }

  /**
   * Get conversations by car listing ID
   * @param {number} carListingId - Car listing ID
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Array of conversations
   */
  async getConversationsByListingId(carListingId, userId) {
    try {
      MessageValidation.validateListingId(carListingId);

      return await this.db.getConversationsByListingId(carListingId, userId);
    } catch (error) {
      console.error('Error fetching conversations by listing ID:', error);
      throw new Error('Internal server error');
    }
  }

  /**
   * Get messages for a conversation with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Array of messages
   */
  async getConversationMessages(params) {
    const { conversationId, userId, page = 1, limit = 20 } = params;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = 50; // Safety cap

    try {
      MessageValidation.validatePagination({ page, limit });

      const isParticipant = await this.db.isUserParticipant(conversationId, userId);
      if (!isParticipant) {
        throw new Error('Unauthorized access');
      }

      return await this.db.getConversationMessages({
        conversationId,
        userId,
        limit: parseInt(limit),
        offset,
        maxLimit
      });
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      throw error;
    }
  }

  /**
   * Find existing conversation or create new one
   * @param {number} listingId - Listing ID
   * @param {number} sellerId - Seller ID
   * @param {number} buyerId - Buyer ID
   * @param {Date} createdAt - Creation timestamp
   * @returns {Promise<number>} - Conversation ID
   * @private
   */
  async _findOrCreateConversation(listingId, sellerId, buyerId, createdAt) {
    const existingConversation = await this.db.findExistingConversation(listingId, sellerId, buyerId);

    if (existingConversation) {
      console.log('Using existing conversation:', existingConversation.id, 'for listingId:', listingId);
      return existingConversation.id;
    }

    console.log('Creating new conversation for listingId:', listingId);
    return await this.db.createConversation({
      listingId,
      sellerId,
      buyerId,
      createdAt
    });
  }
}

module.exports = MessageService;
