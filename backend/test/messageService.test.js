const MessageService = require('../service/messageService');
const MessageDatabase = require('../service/messageDatabase');

// Mock the MessageDatabase
jest.mock('../service/messageDatabase');

/**
 * Unit tests for MessageService
 */
describe('MessageService', () => {
  let messageService;
  let mockKnex;
  let mockDb;

  beforeEach(() => {
    mockKnex = {};
    mockDb = {
      getUnreadMessageCount: jest.fn(),
      isUserParticipant: jest.fn(),
      markMessagesAsRead: jest.fn(),
      insertMessage: jest.fn(),
      getListingById: jest.fn(),
      findExistingConversation: jest.fn(),
      createConversation: jest.fn(),
      getUserConversations: jest.fn(),
      getConversationsByListingId: jest.fn(),
      getConversationMessages: jest.fn()
    };

    MessageDatabase.mockImplementation(() => mockDb);
    messageService = new MessageService(mockKnex);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUnreadCount', () => {
    test('should return unread message count', async() => {
      const userId = 1;
      const expectedCount = 5;
      mockDb.getUnreadMessageCount.mockResolvedValue(expectedCount);

      const result = await messageService.getUnreadCount(userId);

      expect(mockDb.getUnreadMessageCount).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        success: true,
        count: expectedCount
      });
    });

    test('should handle database errors', async() => {
      const userId = 1;
      mockDb.getUnreadMessageCount.mockRejectedValue(new Error('Database error'));

      await expect(messageService.getUnreadCount(userId)).rejects.toThrow('Failed to fetch unread messages');
    });
  });

  describe('markConversationAsRead', () => {
    test('should mark conversation as read for authorized user', async() => {
      const conversationId = 1;
      const userId = 1;
      mockDb.isUserParticipant.mockResolvedValue(true);
      mockDb.markMessagesAsRead.mockResolvedValue();

      const result = await messageService.markConversationAsRead(conversationId, userId);

      expect(mockDb.isUserParticipant).toHaveBeenCalledWith(conversationId, userId);
      expect(mockDb.markMessagesAsRead).toHaveBeenCalledWith(conversationId, userId);
      expect(result).toEqual({
        success: true,
        message: 'Messages marked as read'
      });
    });

    test('should throw error for unauthorized user', async() => {
      const conversationId = 1;
      const userId = 1;
      mockDb.isUserParticipant.mockResolvedValue(false);

      await expect(messageService.markConversationAsRead(conversationId, userId)).rejects.toThrow(
        'Unauthorized access'
      );
    });
  });

  describe('sendMessageToConversation', () => {
    test('should send message to authorized conversation', async() => {
      const messageData = {
        conversationId: 1,
        newMessage: 'Test message',
        userId: 1,
        created_at: new Date()
      };
      mockDb.isUserParticipant.mockResolvedValue(true);
      mockDb.insertMessage.mockResolvedValue();

      const result = await messageService.sendMessageToConversation(messageData);

      expect(mockDb.isUserParticipant).toHaveBeenCalledWith(1, 1);
      expect(mockDb.insertMessage).toHaveBeenCalledWith({
        conversationId: 1,
        senderId: 1,
        content: 'Test message',
        createdAt: messageData.created_at
      });
      expect(result).toEqual({
        success: true,
        message: 'Message sent successfully'
      });
    });

    test('should throw error for unauthorized conversation access', async() => {
      const messageData = {
        conversationId: 1,
        newMessage: 'Test message',
        userId: 1
      };
      mockDb.isUserParticipant.mockResolvedValue(false);

      await expect(messageService.sendMessageToConversation(messageData)).rejects.toThrow('Unauthorized access');
    });
  });

  describe('sendMessageToListing', () => {
    test('should send message to listing with existing conversation', async() => {
      const messageData = {
        listingId: 1,
        newMessage: 'Test message',
        userId: 2,
        created_at: new Date()
      };
      const listing = { seller_id: 1 };
      const existingConversation = { id: 5 };

      mockDb.getListingById.mockResolvedValue(listing);
      mockDb.findExistingConversation.mockResolvedValue(existingConversation);
      mockDb.insertMessage.mockResolvedValue();

      const result = await messageService.sendMessageToListing(messageData);

      expect(mockDb.getListingById).toHaveBeenCalledWith(1);
      expect(mockDb.findExistingConversation).toHaveBeenCalledWith(1, 1, 2);
      expect(mockDb.insertMessage).toHaveBeenCalledWith({
        conversationId: 5,
        senderId: 2,
        content: 'Test message',
        createdAt: messageData.created_at
      });
      expect(result).toEqual({
        success: true,
        conversationId: 5,
        message: 'Message sent successfully'
      });
    });

    test('should create new conversation if none exists', async() => {
      const messageData = {
        listingId: 1,
        newMessage: 'Test message',
        userId: 2,
        created_at: new Date()
      };
      const listing = { seller_id: 1 };

      mockDb.getListingById.mockResolvedValue(listing);
      mockDb.findExistingConversation.mockResolvedValue(null);
      mockDb.createConversation.mockResolvedValue(10);
      mockDb.insertMessage.mockResolvedValue();

      const result = await messageService.sendMessageToListing(messageData);

      expect(mockDb.createConversation).toHaveBeenCalledWith({
        listingId: 1,
        sellerId: 1,
        buyerId: 2,
        createdAt: messageData.created_at
      });
      expect(result.conversationId).toBe(10);
    });

    test('should throw error when listing not found', async() => {
      const messageData = {
        listingId: 1,
        newMessage: 'Test message',
        userId: 2
      };
      mockDb.getListingById.mockResolvedValue(null);

      await expect(messageService.sendMessageToListing(messageData)).rejects.toThrow('Listing not found');
    });

    test('should throw error when user tries to message themselves', async() => {
      const messageData = {
        listingId: 1,
        newMessage: 'Test message',
        userId: 1
      };
      const listing = { seller_id: 1 };
      mockDb.getListingById.mockResolvedValue(listing);

      await expect(messageService.sendMessageToListing(messageData)).rejects.toThrow('Cannot message yourself');
    });
  });
});
