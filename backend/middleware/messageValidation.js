const logger = require('../utils/logger');

/**
 * Validation middleware for messages operations
 */
class MessageValidation {
  /**
   * Validate message creation data
   * @param {Object} messageData - Message data to validate
   * @throws {Error} - Validation error
   */
  static validateCreateMessage(messageData) {
    const { conversationId, newMessage, listingId } = messageData;

    if (conversationId && !newMessage) {
      throw new Error('Message content is required');
    }

    if (listingId && (!newMessage || !listingId)) {
      throw new Error('Listing ID and message content are required');
    }

    if (newMessage && typeof newMessage !== 'string') {
      throw new Error('Message content must be a string');
    }

    if (newMessage && newMessage.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    if (newMessage && newMessage.length > 1000) {
      throw new Error('Message content is too long (max 1000 characters)');
    }
  }
  /**
   * Validate conversation ID parameter
   * @param {string} conversationId - Conversation ID to validate
   * @throws {Error} - Validation error
   */
  static validateConversationId(conversationId) {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    // Support both integer and UUID formats for backward compatibility
    const isValidInteger = Number.isInteger(parseInt(conversationId));
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      conversationId
    );

    if (!isValidInteger && !isValidUUID) {
      throw new Error('Invalid conversation ID format');
    }
  }

  /**
   * Validate listing ID parameter
   * @param {string} listingId - Listing ID to validate
   * @throws {Error} - Validation error
   */
  static validateListingId(listingId) {
    if (!listingId) {
      throw new Error('Listing ID is required');
    }

    // Support both integer and UUID formats for backward compatibility
    const isValidInteger = Number.isInteger(parseInt(listingId));
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId);

    if (!isValidInteger && !isValidUUID) {
      throw new Error('Invalid listing ID format');
    }
  }

  /**
   * Validate listing ID parameter
   * @param {string} listingId - Listing ID to validate
   * @throws {Error} - Validation error
   */
  static validateListingId(listingId) {
    if (!listingId) {
      throw new Error('Listing ID is required');
    }

    if (!Number.isInteger(parseInt(listingId))) {
      throw new Error('Invalid listing ID format');
    }
  }

  /**
   * Validate pagination parameters
   * @param {Object} paginationData - Pagination data to validate
   * @throws {Error} - Validation error
   */
  static validatePagination(paginationData) {
    const { page = 1, limit = 20 } = paginationData;

    if (!Number.isInteger(parseInt(page)) || parseInt(page) < 1) {
      throw new Error('Invalid page number');
    }

    if (!Number.isInteger(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 50) {
      throw new Error('Invalid limit (must be between 1 and 50)');
    }
  }

  /**
   * Validate user authorization for conversation access
   * @param {number} userId - User ID
   * @param {number} conversationId - Conversation ID
   * @param {Object} knex - Knex instance
   * @returns {Promise<boolean>} - Authorization result
   */
  static async validateConversationAccess(userId, conversationId, knex) {
    try {
      const isParticipant = await knex('conversation_participants')
        .where('conversation_id', conversationId)
        .andWhere('user_id', userId)
        .first();

      return !!isParticipant;
    } catch (error) {
      logger.error('Error validating conversation access', {
        error: error.message,
        userId,
        conversationId
      });
      throw new Error('Failed to validate conversation access');
    }
  }
}

module.exports = { MessageValidation };
