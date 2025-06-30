const MessageDatabase = require('./messageDatabase');
const MessageValidation = require('../middleware/messageValidation');

/**
 * Enhanced Message Service with improved routing for company member management
 * Handles business logic for messaging operations with proper ownership tracking
 */
class EnhancedMessageService {
  constructor(knex) {
    this.knex = knex;
    this.db = new MessageDatabase(knex);
  }

  /**
   * Get unread message count for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Response object with count
   */
  async getUnreadCount(userId) {
    try {
      const count = await this.db.getUnreadCount(userId);
      return {
        success: true,
        count
      };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw new Error('Failed to fetch unread count');
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
   * Enhanced version with proper message routing
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} - Response object
   */
  async sendMessageToListing(messageData) {
    const { listingId, newMessage, created_at, userId } = messageData;

    try {
      MessageValidation.validateCreateMessage({ listingId, newMessage });

      // Get the appropriate message recipient for this listing
      const recipient = await this.getListingMessageRecipient(listingId);
      if (!recipient) {
        throw new Error('Listing not found or no valid recipient');
      }

      const sellerId = recipient.recipientId;

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
        message: 'Message sent successfully',
        recipient: {
          type: recipient.recipientType,
          name: recipient.recipientName,
          isOriginalSeller: recipient.isOriginalSeller
        }
      };
    } catch (error) {
      console.error('Error sending message to listing:', error);
      throw error;
    }
  }

  /**
   * Get the appropriate message recipient for a listing
   * Uses enhanced routing logic to handle transferred/company-managed listings
   * @param {string} listingId - Listing ID
   * @returns {Promise<Object>} - Recipient information
   */
  async getListingMessageRecipient(listingId) {
    try {
      const result = await this.knex.raw(
        `
        SELECT * FROM get_listing_message_recipient(?)
      `,
        [listingId]
      );

      if (!result.rows || result.rows.length === 0) {
        throw new Error('No valid message recipient found for listing');
      }

      const recipient = result.rows[0];
      return {
        recipientId: recipient.recipient_id,
        recipientType: recipient.recipient_type,
        recipientName: recipient.recipient_name,
        recipientEmail: recipient.recipient_email,
        isOriginalSeller: recipient.is_original_seller,
        companyName: recipient.company_name
      };
    } catch (error) {
      console.error('Error getting listing message recipient:', error);

      // Fallback to original logic for backward compatibility
      return await this._getLegacyListingRecipient(listingId);
    }
  }

  /**
   * Legacy recipient lookup for backward compatibility
   * @param {string} listingId - Listing ID
   * @returns {Promise<Object>} - Recipient information
   * @private
   */
  async _getLegacyListingRecipient(listingId) {
    const listing = await this.db.getListingById(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    return {
      recipientId: listing.seller_id,
      recipientType: 'seller',
      recipientName: null,
      recipientEmail: null,
      isOriginalSeller: true,
      companyName: null
    };
  }

  /**
   * Update conversation ownership when listings are transferred
   * @param {string} listingId - Listing ID
   * @param {string} newOwnerId - New owner's user ID
   * @param {string} changeReason - Reason for the change
   * @param {string} changedBy - User ID who made the change
   * @returns {Promise<Object>} - Response object
   */
  async updateConversationOwnership(listingId, newOwnerId, changeReason, changedBy) {
    try {
      const result = await this.knex.raw(
        `
        SELECT update_conversation_ownership(?, ?, ?, ?) as updated_count
      `,
        [listingId, newOwnerId, changeReason, changedBy]
      );

      const updatedCount = result.rows[0]?.updated_count || 0;

      console.log(`Updated ownership for ${updatedCount} conversations for listing ${listingId}`);

      return {
        success: true,
        updatedConversations: updatedCount,
        message: `Updated ${updatedCount} conversation(s) for listing transfer`
      };
    } catch (error) {
      console.error('Error updating conversation ownership:', error);
      throw new Error('Failed to update conversation ownership');
    }
  }

  /**
   * Get conversation ownership history
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Array>} - Array of ownership changes
   */
  async getConversationOwnershipHistory(conversationId) {
    try {
      const history = await this.knex('conversation_ownership_log as col')
        .select([
          'col.id',
          'col.change_reason',
          'col.owner_type',
          'col.created_at',
          'old_owner.first_name as old_owner_name',
          'old_owner.email as old_owner_email',
          'new_owner.first_name as new_owner_name',
          'new_owner.email as new_owner_email',
          'changed_by_user.first_name as changed_by_name'
        ])
        .leftJoin('sellers as old_owner', 'col.old_owner_id', 'old_owner.id')
        .leftJoin('sellers as new_owner', 'col.new_owner_id', 'new_owner.id')
        .leftJoin('sellers as changed_by_user', 'col.changed_by', 'changed_by_user.id')
        .where('col.conversation_id', conversationId)
        .orderBy('col.created_at', 'desc');

      return history;
    } catch (error) {
      console.error('Error fetching conversation ownership history:', error);
      throw new Error('Failed to fetch ownership history');
    }
  }

  /**
   * Check if a seller is active in their company
   * @param {string} sellerId - Seller ID
   * @param {string} companyId - Company ID (optional)
   * @returns {Promise<boolean>} - True if seller is active
   */
  async isSellerActiveInCompany(sellerId, companyId) {
    if (!companyId) {
      return true; // Individual seller, assume active
    }

    try {
      const member = await this.knex('company_members')
        .where('seller_id', sellerId)
        .where('company_id', companyId)
        .where('member_status', 'active')
        .first();

      return !!member;
    } catch (error) {
      console.error('Error checking seller status:', error);
      return false;
    }
  }

  /**
   * Get active company member to handle messages
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} - Handler information
   */
  async getCompanyMessageHandler(companyId) {
    try {
      // Try to find designated message handler
      let handler = await this.knex('company_message_handlers as cmh')
        .select(['cmh.member_id', 'cmh.priority_order', 's.first_name', 's.email', 'cm.role'])
        .join('company_members as cm', function() {
          this.on('cmh.company_id', 'cm.company_id').andOn('cmh.member_id', 'cm.seller_id');
        })
        .join('sellers as s', 'cmh.member_id', 's.id')
        .where('cmh.company_id', companyId)
        .where('cmh.is_active', true)
        .where('cmh.can_handle_transferred_listings', true)
        .where('cm.member_status', 'active')
        .orderBy('cmh.priority_order')
        .first();

      if (!handler) {
        // Fallback to any active admin/manager
        handler = await this.knex('company_members as cm')
          .select(['cm.seller_id as member_id', 's.first_name', 's.email', 'cm.role'])
          .join('sellers as s', 'cm.seller_id', 's.id')
          .where('cm.company_id', companyId)
          .where('cm.member_status', 'active')
          .whereIn('cm.role', ['admin', 'manager', 'owner'])
          .first();
      }

      if (!handler) {
        throw new Error('No active company member available to handle messages');
      }

      return handler;
    } catch (error) {
      console.error('Error getting company message handler:', error);
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

  /**
   * Notify buyers of ownership change (for future implementation)
   * @param {string} conversationId - Conversation ID
   * @param {string} newOwnerId - New owner ID
   * @returns {Promise<void>}
   * @private
   */
  async notifyBuyersOfOwnershipChange(conversationId, newOwnerId) {
    // TODO: Implement notification logic
    // This could send email notifications or in-app notifications
    // to buyers informing them of the ownership change
    console.log(`TODO: Notify buyers in conversation ${conversationId} of new owner ${newOwnerId}`);
  }

  /**
   * Handle member removal messaging transition
   * Called when a company member is removed to transfer their conversations
   * @param {string} memberId - Member being removed
   * @param {string} companyId - Company ID
   * @param {string} removedBy - User performing the removal
   * @returns {Promise<Object>} - Transition result
   */
  async handleMemberRemovalMessaging(memberId, companyId, removedBy) {
    const trx = await this.knex.transaction();

    try {
      // Get all active conversations for the member's listings
      const conversations = await trx('conversations as c')
        .join('listed_cars as l', 'c.listing_id', 'l.id')
        .where('l.current_owner_id', memberId)
        .andWhere('l.current_owner_type', 'seller')
        .select('c.id as conversation_id', 'l.id as listing_id', 'c.buyer_id');

      if (conversations.length === 0) {
        await trx.commit();
        return {
          success: true,
          message: 'No conversations to transfer',
          transferredCount: 0
        };
      }

      // Get primary company handler
      const primaryHandler = await this.getCompanyMessageHandler(companyId);

      if (!primaryHandler) {
        throw new Error('No active message handlers found for company');
      }

      // Update listing ownership to company handler
      await trx('listed_cars').where('current_owner_id', memberId).andWhere('current_owner_type', 'seller').update({
        current_owner_id: primaryHandler.member_id,
        current_owner_type: 'company_handler',
        updated_at: new Date()
      });

      // Log ownership changes for each conversation
      for (const conv of conversations) {
        await trx('conversation_ownership_log').insert({
          conversation_id: conv.conversation_id,
          old_owner_id: memberId,
          old_owner_type: 'seller',
          new_owner_id: primaryHandler.member_id,
          new_owner_type: 'company_handler',
          change_reason: `Member removal: ${memberId}`,
          changed_by: removedBy,
          created_at: new Date()
        });
      }

      await trx.commit();

      console.log('Member messaging transition completed:', {
        memberId,
        companyId,
        transferredConversations: conversations.length,
        newHandler: primaryHandler.member_id
      });

      return {
        success: true,
        message: 'Member conversations transferred successfully',
        transferredCount: conversations.length,
        newHandler: {
          id: primaryHandler.member_id,
          name: primaryHandler.first_name,
          role: primaryHandler.role
        }
      };
    } catch (error) {
      await trx.rollback();
      console.error('Error handling member removal messaging:', error);
      throw new Error(`Failed to handle member removal messaging: ${error.message}`);
    }
  }

  /**
   * Handle member reactivation messaging transition
   * Called when a company member is reactivated to transfer conversations back
   * @param {string} memberId - Member being reactivated
   * @param {string} companyId - Company ID
   * @param {string} reactivatedBy - User performing the reactivation
   * @returns {Promise<Object>} - Transition result
   */
  async handleMemberReactivationMessaging(memberId, companyId, reactivatedBy) {
    const trx = await this.knex.transaction();

    try {
      // Get all conversations for listings originally owned by this member
      const conversations = await trx('conversations as c')
        .join('listed_cars as l', 'c.listing_id', 'l.id')
        .where('l.original_seller_id', memberId)
        .andWhere('l.current_owner_type', 'company_handler')
        .select('c.id as conversation_id', 'l.id as listing_id', 'l.current_owner_id as current_handler');

      if (conversations.length === 0) {
        await trx.commit();
        return {
          success: true,
          message: 'No conversations to transfer back',
          transferredCount: 0
        };
      }

      // Update listing ownership back to original seller
      await trx('listed_cars')
        .where('original_seller_id', memberId)
        .andWhere('current_owner_type', 'company_handler')
        .update({
          current_owner_id: memberId,
          current_owner_type: 'seller',
          updated_at: new Date()
        });

      // Log ownership changes for each conversation
      for (const conv of conversations) {
        await trx('conversation_ownership_log').insert({
          conversation_id: conv.conversation_id,
          old_owner_id: conv.current_handler,
          old_owner_type: 'company_handler',
          new_owner_id: memberId,
          new_owner_type: 'seller',
          change_reason: `Member reactivation: ${memberId}`,
          changed_by: reactivatedBy,
          created_at: new Date()
        });
      }

      await trx.commit();

      console.log('Member reactivation messaging transition completed:', {
        memberId,
        companyId,
        transferredConversations: conversations.length
      });

      return {
        success: true,
        message: 'Member conversations transferred back successfully',
        transferredCount: conversations.length
      };
    } catch (error) {
      await trx.rollback();
      console.error('Error handling member reactivation messaging:', error);
      throw new Error(`Failed to handle member reactivation messaging: ${error.message}`);
    }
  }

  /**
   * Set company message handlers for a company
   * @param {string} companyId - Company ID
   * @param {Array} handlers - Array of handler objects
   * @returns {Promise<Object>} - Setup result
   */
  async setCompanyMessageHandlers(companyId, handlers) {
    const trx = await this.knex.transaction();

    try {
      // Remove existing handlers for the company
      await trx('company_message_handlers').where('company_id', companyId).del();

      // Add new handlers
      if (handlers && handlers.length > 0) {
        const handlerRecords = handlers.map(handler => ({
          company_id: companyId,
          member_id: handler.memberId,
          priority_order: handler.priority || 1,
          is_active: handler.isActive !== false, // Default to true
          can_handle_transferred_listings: handler.canHandleTransferredListings !== false,
          created_at: new Date(),
          updated_at: new Date()
        }));

        await trx('company_message_handlers').insert(handlerRecords);
      }

      await trx.commit();

      return {
        success: true,
        message: 'Company message handlers updated successfully',
        handlersCount: handlers ? handlers.length : 0
      };
    } catch (error) {
      await trx.rollback();
      console.error('Error setting company message handlers:', error);
      throw new Error(`Failed to set message handlers: ${error.message}`);
    }
  }

  /**
   * Get active company message handlers
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} - Active handlers
   */
  async getCompanyMessageHandlers(companyId) {
    try {
      const handlers = await this.knex('company_message_handlers as cmh')
        .select([
          'cmh.member_id',
          'cmh.priority_order',
          'cmh.is_active',
          'cmh.can_handle_transferred_listings',
          's.first_name',
          's.last_name',
          's.email',
          'cm.role'
        ])
        .join('company_members as cm', function() {
          this.on('cmh.company_id', 'cm.company_id').andOn('cmh.member_id', 'cm.seller_id');
        })
        .join('sellers as s', 'cmh.member_id', 's.id')
        .where('cmh.company_id', companyId)
        .where('cmh.is_active', true)
        .where('cm.member_status', 'active')
        .orderBy('cmh.priority_order', 'asc');

      return {
        success: true,
        handlers
      };
    } catch (error) {
      console.error('Error getting company message handlers:', error);
      throw new Error(`Failed to get message handlers: ${error.message}`);
    }
  }

  // ...existing code...
}

module.exports = EnhancedMessageService;
