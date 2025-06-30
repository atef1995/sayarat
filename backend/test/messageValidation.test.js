const { MessageValidation } = require('../middleware/messageValidation');

/**
 * Unit tests for MessageValidation middleware
 */
describe('MessageValidation', () => {
  describe('validateCreateMessage', () => {
    test('should validate message creation with conversation ID', () => {
      const messageData = {
        conversationId: 1,
        newMessage: 'Hello, this is a test message'
      };

      expect(() => {
        MessageValidation.validateCreateMessage(messageData);
      }).not.toThrow();
    });

    test('should validate message creation with listing ID', () => {
      const messageData = {
        listingId: 1,
        newMessage: 'Hello, this is a test message'
      };

      expect(() => {
        MessageValidation.validateCreateMessage(messageData);
      }).not.toThrow();
    });

    test('should throw error for missing message content', () => {
      const messageData = {
        conversationId: 1
      };

      expect(() => {
        MessageValidation.validateCreateMessage(messageData);
      }).toThrow('Message content is required');
    });

    test('should throw error for empty message content', () => {
      const messageData = {
        conversationId: 1,
        newMessage: '   '
      };

      expect(() => {
        MessageValidation.validateCreateMessage(messageData);
      }).toThrow('Message content cannot be empty');
    });

    test('should throw error for message content too long', () => {
      const messageData = {
        conversationId: 1,
        newMessage: 'a'.repeat(1001)
      };

      expect(() => {
        MessageValidation.validateCreateMessage(messageData);
      }).toThrow('Message content is too long');
    });

    test('should throw error for non-string message content', () => {
      const messageData = {
        conversationId: 1,
        newMessage: 123
      };

      expect(() => {
        MessageValidation.validateCreateMessage(messageData);
      }).toThrow('Message content must be a string');
    });
  });

  describe('validateConversationId', () => {
    test('should validate valid conversation ID', () => {
      expect(() => {
        MessageValidation.validateConversationId('123');
      }).not.toThrow();
    });

    test('should throw error for missing conversation ID', () => {
      expect(() => {
        MessageValidation.validateConversationId(null);
      }).toThrow('Conversation ID is required');
    });

    test('should throw error for invalid conversation ID format', () => {
      expect(() => {
        MessageValidation.validateConversationId('abc');
      }).toThrow('Invalid conversation ID format');
    });
  });

  describe('validateListingId', () => {
    test('should validate valid listing ID', () => {
      expect(() => {
        MessageValidation.validateListingId('456');
      }).not.toThrow();
    });

    test('should throw error for missing listing ID', () => {
      expect(() => {
        MessageValidation.validateListingId(null);
      }).toThrow('Listing ID is required');
    });

    test('should throw error for invalid listing ID format', () => {
      expect(() => {
        MessageValidation.validateListingId('xyz');
      }).toThrow('Invalid listing ID format');
    });
  });

  describe('validatePagination', () => {
    test('should validate default pagination', () => {
      expect(() => {
        MessageValidation.validatePagination({});
      }).not.toThrow();
    });

    test('should validate custom pagination', () => {
      const paginationData = { page: 2, limit: 30 };

      expect(() => {
        MessageValidation.validatePagination(paginationData);
      }).not.toThrow();
    });

    test('should throw error for invalid page number', () => {
      const paginationData = { page: 0, limit: 20 };

      expect(() => {
        MessageValidation.validatePagination(paginationData);
      }).toThrow('Invalid page number');
    });

    test('should throw error for invalid limit', () => {
      const paginationData = { page: 1, limit: 100 };

      expect(() => {
        MessageValidation.validatePagination(paginationData);
      }).toThrow('Invalid limit (must be between 1 and 50)');
    });
  });
});
