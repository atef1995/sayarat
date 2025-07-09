# Messaging System Architecture

## Overview

The messaging system has been refactored into a modular, maintainable architecture following best practices for separation of concerns, testability, and security.

## Architecture Components

### 1. Router Layer (`routes/messages.js`)

- **Purpose**: HTTP request routing and basic validation
- **Responsibilities**:
  - Route definition and parameter extraction
  - Request validation using express-validator
  - Authentication middleware integration
  - Delegation to controller methods
  - Error response handling

### 2. Controller Layer (`controllers/messageController.js`)

- **Purpose**: Request/response orchestration and HTTP-specific logic
- **Responsibilities**:
  - Request parameter extraction and parsing
  - Service method invocation
  - HTTP response formatting
  - Error status code mapping
  - Request-specific validation coordination

### 3. Service Layer (`service/messageService.js`)

- **Purpose**: Business logic and workflow orchestration
- **Responsibilities**:
  - Business rule enforcement
  - Workflow coordination between database operations
  - Data transformation and validation
  - Transaction management
  - Cross-cutting concern handling

### 4. Database Layer (`service/messageDatabase.js`)

- **Purpose**: Data access and database operations
- **Responsibilities**:
  - SQL query construction and execution
  - Database transaction management
  - Data mapping and transformation
  - Database-specific optimizations
  - Connection management

### 5. Validation Middleware (`middleware/messageValidation.js`)

- **Purpose**: Input validation and data integrity
- **Responsibilities**:
  - Request data validation
  - Business rule validation
  - Data format and type checking
  - Security validation (authorization checks)

## API Endpoints

### GET `/unread`

**Purpose**: Get unread message count for authenticated user

- **Authentication**: Required
- **Response**: `{ success: boolean, count: number }`

### PUT `/:conversationId/read`

**Purpose**: Mark messages in conversation as read

- **Authentication**: Required
- **Validation**: User must be conversation participant
- **Response**: `{ success: boolean, message: string }`

### POST `/messages`

**Purpose**: Send message to existing conversation

- **Authentication**: Required
- **Validation**: User must be conversation participant
- **Body**: `{ conversationId, newMessage, created_at? }`
- **Response**: `{ success: boolean, message: string }`

### POST `/`

**Purpose**: Send message to a listing (creates conversation if needed)

- **Authentication**: Required
- **Validation**: Listing must exist, user cannot message themselves
- **Body**: `{ listingId, newMessage, created_at? }`
- **Response**: `{ success: boolean, conversationId: number, message: string }`

### POST `/user`

**Purpose**: Get user conversations with metadata

- **Authentication**: Required
- **Response**: `{ success: boolean, data: Array<Conversation> }`

### GET `/:carListingId`

**Purpose**: Get conversations by car listing ID

- **Authentication**: Required
- **Validation**: User must be conversation participant
- **Response**: `Array<{ id: number, created_at: string }>`

### GET `/:conversationId/messages`

**Purpose**: Get conversation messages with pagination

- **Authentication**: Required
- **Validation**: User must be conversation participant
- **Query Parameters**: `page?: number, limit?: number`
- **Response**: `Array<Message>`

## Data Models

### Conversation

```javascript
{
  id: number,
  car_listing_id: number,
  created_at: Date,
  updated_at: Date
}
```

### Message

```javascript
{
  id: number,
  conversation_id: number,
  sender_id: number,
  content: string,
  is_read: boolean,
  created_at: Date
}
```

### ConversationParticipant

```javascript
{
  conversation_id: number,
  user_id: number,
  role: 'buyer' | 'seller'
}
```

## Security Features

### Authentication

- All endpoints require user authentication
- JWT token validation through `ensureAuthenticated` middleware

### Authorization

- Users can only access conversations they participate in
- Database-level participant validation on all operations
- Prevents unauthorized message access or modification

### Input Validation

- Comprehensive input validation for all request parameters
- SQL injection prevention through parameterized queries
- XSS prevention through content sanitization
- Message length limits (1000 characters max)

### Data Integrity

- Transaction-based conversation creation
- Atomic message operations
- Foreign key constraints enforcement

## Performance Optimizations

### Database

- Indexed conversation participants for fast lookups
- Pagination support for message retrieval
- Optimized subqueries for conversation metadata
- Connection pooling through Knex

### Caching

- Ready for Redis integration for conversation metadata
- Message count caching opportunities
- User conversation list caching

## Error Handling

### Validation Errors (400)

- Missing required fields
- Invalid data formats
- Business rule violations

### Authentication Errors (401)

- Missing or invalid JWT tokens

### Authorization Errors (403)

- Unauthorized conversation access
- Self-messaging attempts

### Not Found Errors (404)

- Non-existent listings
- Non-existent conversations

### Server Errors (500)

- Database connection issues
- Transaction failures
- Unexpected system errors

## Testing Strategy

### Unit Tests

- Service layer business logic testing
- Database layer query testing
- Validation middleware testing
- Controller error handling testing

### Integration Tests

- End-to-end API endpoint testing
- Database transaction testing
- Authentication flow testing

### Mock Strategy

- Database layer mocking for service tests
- Service layer mocking for controller tests
- External dependency mocking

## Deployment Considerations

### Environment Variables

- Database connection strings
- JWT secret keys
- Redis connection (if implemented)

### Monitoring

- Message send/receive metrics
- Error rate monitoring
- Performance benchmarking
- User activity tracking

### Scaling

- Horizontal database scaling support
- Read replica configuration for conversation retrieval
- Message archival strategies for large datasets

## Migration Notes

### Breaking Changes

- None - API endpoints remain identical
- Database schema unchanged
- Response formats maintained

### Backward Compatibility

- Full backward compatibility maintained
- Original functionality preserved
- Error handling improved

### Rollback Strategy

- Original code backed up as `messages_backup.js`
- Database schema unchanged
- Quick rollback capability maintained

## Future Enhancements

### Real-time Features

- WebSocket integration for live messaging
- Push notification support
- Online status indicators

### Advanced Features

- Message reactions and replies
- File and image attachments
- Message search functionality
- Conversation archival

### Performance

- Redis caching layer
- Message pagination improvements
- Database query optimization
- CDN integration for attachments
