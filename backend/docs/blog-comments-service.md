# Blog Comments Service Documentation

## Overview

The Blog Comments Service handles all comment-related operations for blog posts, including CRUD operations, comment moderation, threading, and administrative functions. It follows the Single Responsibility Principle and provides comprehensive comment management capabilities.

## Database Schema

The service works with the `blog_comments` table:

```sql
CREATE TABLE blog_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES blog_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Reference

### Public Comment Operations

#### `getPostComments(postId, page, limit)`

Gets comments for a specific blog post with pagination and threading support.

**Parameters:**

- `postId` (number): The blog post ID
- `page` (number): Page number (default: 1)
- `limit` (number): Comments per page (default: 20)

**Returns:** Promise<Object> - Comments with pagination and replies

**Example:**

```javascript
const result = await getPostComments(123, 1, 20);
// Returns: { data: [...], pagination: { page, limit, total, pages } }
```

### User Comment Operations (Authenticated)

#### `addPostComment(commentData)`

Adds a new comment to a blog post.

**Parameters:**

- `commentData` (object):
  - `post_id` (number): Post ID
  - `author_id` (string): Author UUID
  - `content` (string): Comment content
  - `parent_comment_id` (number, optional): Parent comment ID for replies

**Returns:** Promise<Object> - Created comment with author info

**Example:**

```javascript
const comment = await addPostComment({
  post_id: 123,
  author_id: '550e8400-e29b-41d4-a716-446655440000',
  content: 'Great article!',
  parent_comment_id: null
});
```

#### `replyToComment(replyData)`

Replies to an existing comment.

**Parameters:**

- `replyData` (object):
  - `content` (string): Reply content
  - `author_id` (string): Author UUID
  - `parent_comment_id` (number): Parent comment ID

**Returns:** Promise<Object> - Created reply

#### `updateComment(commentId, updateData)`

Updates an existing comment (user can only update their own comments).

**Parameters:**

- `commentId` (number): Comment ID
- `updateData` (object): Fields to update (e.g., { content: 'Updated content' })

**Returns:** Promise<Object> - Updated comment

#### `deleteComment(commentId)`

Deletes a comment and updates related counts.

**Parameters:**

- `commentId` (number): Comment ID

**Returns:** Promise<void>

#### `getCommentById(commentId)`

Gets a specific comment by ID.

**Parameters:**

- `commentId` (number): Comment ID

**Returns:** Promise<Object> - Comment object with author info

### Admin Comment Operations

#### `getAllComments(searchParams)`

Gets all comments for admin panel with filtering and pagination.

**Parameters:**

- `searchParams` (object):
  - `page` (number): Page number
  - `limit` (number): Comments per page
  - `search` (string): Search term for content
  - `status` (string): Filter by status ('pending', 'approved', 'rejected')
  - `postId` (string): Filter by post ID
  - `authorId` (string): Filter by author ID
  - `sort` (string): Sort order ('latest', 'oldest', 'most_liked')

**Returns:** Promise<Object> - Comments with pagination and success status

#### `approveComment(commentId)`

Approves a pending comment.

**Parameters:**

- `commentId` (number): Comment ID

**Returns:** Promise<Object> - Result object with success status

#### `disapproveComment(commentId)`

Disapproves/rejects a comment.

**Parameters:**

- `commentId` (number): Comment ID

**Returns:** Promise<Object> - Result object with success status

#### `adminDeleteComment(commentId)`

Admin delete comment (bypasses ownership checks).

**Parameters:**

- `commentId` (number): Comment ID

**Returns:** Promise<Object> - Result object with success status

#### `bulkModerateComments(commentIds, action, adminId)`

Bulk moderate multiple comments.

**Parameters:**

- `commentIds` (Array<number>): Array of comment IDs
- `action` (string): Action to perform ('approve', 'disapprove', 'delete')
- `adminId` (string): Admin user ID (for logging)

**Returns:** Promise<Object> - Result with processed count

## Usage Examples

### Basic Comment Operations

```javascript
const { getPostComments, addPostComment } = require('./service/blog/comments');

// Get comments for a post
const comments = await getPostComments(123, 1, 20);

// Add a comment
const newComment = await addPostComment({
  post_id: 123,
  author_id: 'user-uuid',
  content: 'This is a great article!',
  parent_comment_id: null
});
```

### Comment Threading

```javascript
const { replyToComment } = require('./service/blog/comments');

// Reply to a comment
const reply = await replyToComment({
  content: 'Thanks for your comment!',
  author_id: 'user-uuid',
  parent_comment_id: 456
});
```

### Admin Operations

```javascript
const { getAllComments, bulkModerateComments } = require('./service/blog/comments');

// Get all pending comments
const pendingComments = await getAllComments({
  status: 'pending',
  page: 1,
  limit: 50
});

// Bulk approve comments
const result = await bulkModerateComments([1, 2, 3], 'approve', 'admin-uuid');
```

## Features

### Comment Threading

- Supports nested comments (replies to comments)
- Maintains reply counts automatically
- Proper hierarchy display in API responses

### Comment Moderation

- Comments default to 'pending' status
- Admin approval/disapproval workflow
- Bulk moderation operations
- Status tracking ('pending', 'approved', 'rejected')

### Security & Validation

- UUID validation for author IDs
- Foreign key constraints ensure data integrity
- Input sanitization and validation
- Proper error handling and logging

### Performance Optimizations

- Efficient pagination with offset/limit
- Optimized queries with proper joins
- Automatic count management (likes, replies)
- Indexed columns for fast lookups

## Error Handling

The service provides comprehensive error handling:

```javascript
try {
  const comment = await addPostComment(commentData);
} catch (error) {
  if (error.message.includes('Invalid author ID format')) {
    // Handle UUID validation error
  } else if (error.message.includes('Post not found')) {
    // Handle missing post error
  } else {
    // Handle other errors
  }
}
```

## Testing

Run the comment service tests:

```bash
cd backend
node test/blog/test-comments.js
```

The test suite covers:

- All CRUD operations
- Comment threading
- Admin moderation functions
- Error handling scenarios
- UUID validation
- Database constraints

## Future Enhancements

The following features are planned (marked with #TODO in code):

- Comment likes functionality
- Comment reporting system
- Comment analytics and metrics
- Spam detection and filtering
- Comment editing history
- Real-time comment notifications
- Comment threading depth limits
- Rich text comment support

## Integration

The comments service integrates with:

- **Blog Posts**: Comments are linked to specific posts
- **Users**: Comments require authenticated users (sellers table)
- **Views Service**: Uses UUID validation utilities
- **Logger**: Comprehensive logging for all operations

## Database Relationships

```
blog_posts (1) ←→ (many) blog_comments
sellers (1) ←→ (many) blog_comments
blog_comments (1) ←→ (many) blog_comments (self-referential for replies)
```

## Security Considerations

- All comment operations validate user permissions
- UUID format validation prevents injection attacks
- Foreign key constraints ensure data integrity
- Comments require approval before being visible
- Admin operations are logged for audit trails

## Performance Metrics

- Comment retrieval: O(1) for individual comments, O(n) for pagination
- Comment creation: O(1) with automatic count updates
- Bulk operations: O(n) where n is the number of comments
- Search operations: O(log n) with proper indexing

This service provides a robust, secure, and scalable comment system for the blog platform.
