const express = require('express');
const { param, validationResult } = require('express-validator');
const { ensureAuthenticated } = require('../middleware/auth');
const MessageController = require('../controllers/messageController');
const CompanyController = require('../controllers/companyController');

/**
 * Messages Router
 * Enhanced router with improved messaging system for company member management
 * @param {Knex} knex - Knex database instance
 * @returns {Router} - Express router for messages handling
 */
function messagesRouter(knex) {
  const router = express.Router();
  const messageController = new MessageController(knex);
  const companyController = new CompanyController(knex);

  /**
   * Get unread message count for authenticated user
   * GET /unread
   */
  router.get('/unread', ensureAuthenticated, (req, res) => messageController.getUnreadCount(req, res));

  /**
   * Mark messages in a conversation as read
   * PUT /:conversationId/read
   */
  router.put('/:conversationId/read', ensureAuthenticated, (req, res) =>
    messageController.markConversationAsRead(req, res)
  );

  /**
   * Send message to existing conversation
   * POST /messages
   */
  router.post('/messages', ensureAuthenticated, (req, res) => messageController.sendMessageToConversation(req, res));

  /**
   * Send message to a listing (creates conversation if needed)
   * POST /
   */
  router.post('/', ensureAuthenticated, (req, res) => messageController.sendMessageToListing(req, res));

  /**
   * Get user conversations
   * POST /user
   */
  router.post('/user', ensureAuthenticated, (req, res) => messageController.getUserConversations(req, res));

  /**
   * Get conversations by car listing ID
   * GET /:carListingId
   */
  router.get('/:carListingId', param('carListingId').isInt().notEmpty(), ensureAuthenticated, async(req, res) => {
    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    return messageController.getConversationsByListingId(req, res);
  });

  /**
   * Get messages for a conversation with pagination
   * GET /:conversationId/messages
   */
  router.get('/:conversationId/messages', ensureAuthenticated, (req, res) =>
    messageController.getConversationMessages(req, res)
  );

  /**
   * Get message recipient for a listing (Enhanced messaging system)
   * GET /listing/:listingId/recipient
   */
  router.get(
    '/listing/:listingId/recipient',
    param('listingId').isUUID().notEmpty(),
    ensureAuthenticated,
    async(req, res) => {
      // Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid listing ID format'
        });
      }

      await companyController.getListingMessageRecipient(req, res);
    }
  );

  /**
   * Get conversation ownership history
   * GET /conversation/:conversationId/ownership-history
   */
  router.get(
    '/conversation/:conversationId/ownership-history',
    param('conversationId').isUUID().notEmpty(),
    ensureAuthenticated,
    async(req, res) => {
      // Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid conversation ID format'
        });
      }

      await companyController.getConversationOwnershipHistory(req, res);
    }
  );

  return router;
}

module.exports = messagesRouter;
