const MessageService = require('../service/messageService');
const logger = require('../utils/logger');

/**
 * Message Controller
 * Handles HTTP requests and responses for messaging operations
 */
class MessageController {
  constructor(knex) {
    this.messageService = new MessageService(knex);
  }

  /**
   * Get unread message count for authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const result = await this.messageService.getUnreadCount(userId);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error in getUnreadCount:', {
        error
      });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch unread messages'
      });
    }
  }

  /**
   * Mark messages in a conversation as read
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async markConversationAsRead(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const result = await this.messageService.markConversationAsRead(conversationId, userId);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error in markConversationAsRead:', {
        error
      });

      if (error.message === 'Unauthorized access') {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('required') || error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to mark messages as read'
      });
    }
  }

  /**
   * Send message to existing conversation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async sendMessageToConversation(req, res) {
    try {
      const { conversationId, newMessage, created_at } = req.body;
      const userId = req.user.id;

      const result = await this.messageService.sendMessageToConversation({
        conversationId: conversationId,
        newMessage,
        created_at,
        userId
      });

      res.status(201).json(result);
    } catch (error) {
      logger.error('Error in sendMessageToConversation:', {
        error
      });

      if (error.message === 'Unauthorized access') {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('required') || error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to process conversation'
      });
    }
  }

  /**
   * Send message to a listing (creates conversation if needed)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async sendMessageToListing(req, res) {
    try {
      const { listingId, newMessage, created_at } = req.body;
      const userId = req.user.id;

      const result = await this.messageService.sendMessageToListing({
        listingId: listingId,
        newMessage,
        created_at,
        userId
      });

      res.status(201).json(result);
    } catch (error) {
      logger.error('Error in sendMessageToListing:', {
        listingId: req.body.listingId,
        userId: req.user.id,
        error
      });

      if (error.message === 'Listing not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Cannot message yourself') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('required') || error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to process conversation'
      });
    }
  }

  /**
   * Get user conversations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserConversations(req, res) {
    try {
      const userId = req.user.id;
      const result = await this.messageService.getUserConversations(userId);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error in getUserConversations:', {
        error
      });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch conversations'
      });
    }
  }

  /**
   * Get conversations by car listing ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getConversationsByListingId(req, res) {
    try {
      const { carListingId } = req.params;
      const userId = req.user.id;

      const conversations = await this.messageService.getConversationsByListingId(carListingId, userId);

      res.status(200).json(conversations);
    } catch (error) {
      logger.error('Error in getConversationsByListingId:', {
        error
      });

      if (error.message.includes('Invalid') || error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get messages for a conversation with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getConversationMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const { page, limit } = req.query;
      const userId = req.user.id;

      const messages = await this.messageService.getConversationMessages({
        conversationId: conversationId,
        userId,
        page,
        limit
      });

      res.status(200).json(messages);
    } catch (error) {
      logger.error('Error in getConversationMessages:', {
        error
      });

      if (error.message === 'Unauthorized access') {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid') || error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages'
      });
    }
  }
}

module.exports = MessageController;
