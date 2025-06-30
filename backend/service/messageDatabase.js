/**
 * Message Database Service
 * Handles all database operations related to messaging
 */
class MessageDatabase {
  constructor(knex) {
    this.knex = knex;
  }

  /**
   * Get unread message count for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} - Unread message count
   */
  async getUnreadMessageCount(userId) {
    const result = await this.knex('messages')
      .join('conversation_participants', 'messages.conversation_id', 'conversation_participants.conversation_id')
      .where('conversation_participants.user_id', userId)
      .andWhere('messages.sender_id', '!=', userId)
      .andWhere('messages.is_read', 0)
      .count('messages.id as count')
      .first();

    return result.count || 0;
  }

  /**
   * Check if user is participant in conversation
   * @param {number} conversationId - Conversation ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - True if user is participant
   */
  async isUserParticipant(conversationId, userId) {
    const participant = await this.knex('conversation_participants')
      .where('conversation_id', conversationId)
      .andWhere('user_id', userId)
      .first();

    return !!participant;
  }

  /**
   * Mark messages as read in a conversation
   * @param {number} conversationId - Conversation ID
   * @param {number} userId - User ID (to exclude their own messages)
   * @returns {Promise<void>}
   */
  async markMessagesAsRead(conversationId, userId) {
    await this.knex('messages')
      .where('conversation_id', conversationId)
      .andWhere('sender_id', '!=', userId)
      .update({ is_read: 1 });
  }

  /**
   * Insert a new message
   * @param {Object} messageData - Message data
   * @returns {Promise<void>}
   */
  async insertMessage(messageData) {
    const { conversationId, senderId, content, createdAt } = messageData;

    await this.knex('messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content,
      created_at: createdAt || new Date()
    });
  }

  /**
   * Get listing by ID
   * @param {number} listingId - Listing ID
   * @returns {Promise<Object|null>} - Listing data or null
   */
  async getListingById(listingId) {
    return await this.knex('listed_cars').select('seller_id').where('id', listingId).first();
  }
  /**
   * Find existing conversation between users for a listing
   * @param {number} listingId - Car listing ID
   * @param {number} sellerId - Seller user ID
   * @param {number} buyerId - Buyer user ID
   * @returns {Promise<Object|null>} - Conversation data or null
   */
  async findExistingConversation(listingId, sellerId, buyerId) {
    return await this.knex('conversations as c')
      .select('c.id')
      .join('conversation_participants as cp1', 'c.id', 'cp1.conversation_id')
      .join('conversation_participants as cp2', 'c.id', 'cp2.conversation_id')
      .where('c.car_listing_id', listingId)
      .andWhere('cp1.user_id', sellerId)
      .andWhere('cp2.user_id', buyerId)
      .first();
  }

  /**
   * Create a new conversation with participants
   * @param {Object} conversationData - Conversation data
   * @returns {Promise<number>} - New conversation ID
   */
  async createConversation(conversationData) {
    const { listingId, sellerId, buyerId, createdAt } = conversationData;

    return await this.knex.transaction(async trx => {
      // Insert conversation
      const [newConversation] = await trx('conversations')
        .insert({
          car_listing_id: listingId,
          created_at: createdAt || new Date(),
          updated_at: createdAt || new Date()
        })
        .returning('id');

      const convId = newConversation.id || newConversation;

      // Add participants
      await trx('conversation_participants').insert([
        {
          conversation_id: convId,
          user_id: sellerId,
          role: 'seller'
        },
        {
          conversation_id: convId,
          user_id: buyerId,
          role: 'buyer'
        }
      ]);

      return convId;
    });
  }

  /**
   * Get conversations for a user with detailed information
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Array of conversation data
   */
  async getUserConversations(userId) {
    return await this.knex('conversations as c')
      .select([
        'c.id as conversation_id',
        'c.car_listing_id',
        'c.created_at',
        'c.updated_at',
        'cp.role',
        'cl.make',
        'cl.model',
        'cl.title',
        // Subquery for buyer name
        this.knex('sellers as s')
          .select('s.first_name')
          .join('conversation_participants as cp2', 's.id', 'cp2.user_id')
          .whereRaw('cp2.conversation_id = c.id')
          .andWhere('cp2.role', 'buyer')
          .limit(1)
          .as('sender'),
        // Subquery for buyer picture
        this.knex('sellers as s')
          .select('s.picture')
          .join('conversation_participants as cp2', 's.id', 'cp2.user_id')
          .whereRaw('cp2.conversation_id = c.id')
          .andWhere('cp2.role', 'buyer')
          .limit(1)
          .as('picture'),
        // Subquery for seller name
        this.knex('sellers as s')
          .select('s.first_name')
          .join('conversation_participants as cp2', 's.id', 'cp2.user_id')
          .whereRaw('cp2.conversation_id = c.id')
          .andWhere('cp2.role', 'seller')
          .limit(1)
          .as('receiver'),
        // Subquery for car image
        this.knex('car_images').select('url').where('car_listing_id', this.knex.ref('cl.id')).limit(1).as('url'),
        // Subquery for last message content
        this.knex('messages')
          .select('content')
          .where('conversation_id', this.knex.ref('c.id'))
          .orderBy('created_at', 'desc')
          .limit(1)
          .as('last_message'),
        // Subquery for last message time
        this.knex('messages')
          .select('created_at')
          .where('conversation_id', this.knex.ref('c.id'))
          .orderBy('created_at', 'desc')
          .limit(1)
          .as('last_message_time'),
        // Subquery for read status
        this.knex('messages')
          .select('is_read')
          .where('conversation_id', this.knex.ref('c.id'))
          .orderBy('created_at', 'desc')
          .limit(1)
          .as('is_read'),
        // Subquery for sender ID of last message
        this.knex('messages')
          .select('sender_id')
          .where('conversation_id', this.knex.ref('c.id'))
          .orderBy('created_at', 'desc')
          .limit(1)
          .as('sender_id')
      ])
      .join('conversation_participants as cp', 'c.id', 'cp.conversation_id')
      .join('listed_cars as cl', 'c.car_listing_id', 'cl.id')
      .where('cp.user_id', userId)
      .orderBy('c.updated_at', 'desc');
  }

  /**
   * Get conversations by car listing ID for a user
   * @param {number} carListingId - Car listing ID
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Array of conversation data
   */
  async getConversationsByListingId(carListingId, userId) {
    const conversations = await this.knex('conversations as c')
      .select('c.*', 'cp.user_id')
      .join('conversation_participants as cp', 'c.id', 'cp.conversation_id')
      .where('c.car_listing_id', carListingId)
      .andWhere('cp.user_id', userId);

    return conversations.map(row => ({
      id: row.id,
      created_at: row.created_at
    }));
  }

  /**
   * Get messages for a conversation with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Array of message data
   */
  async getConversationMessages(params) {
    const { conversationId, userId, limit, offset, maxLimit } = params;

    return await this.knex('messages as m')
      .select([
        'm.id',
        'm.content',
        'm.created_at',
        'm.is_read',
        's.first_name',
        's.picture',
        's.username',
        this.knex.raw('CASE WHEN m.sender_id = ? THEN true ELSE false END as is_sender', [userId]),
        this.knex('messages').count('* as total').where('conversation_id', conversationId).as('total')
      ])
      .join('sellers as s', 'm.sender_id', 's.id')
      .where('m.conversation_id', conversationId)
      .orderBy('m.created_at', 'desc')
      .limit(Math.min(limit, maxLimit))
      .offset(offset);
  }
}

module.exports = MessageDatabase;
