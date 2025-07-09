# Blog Views Service Documentation

## Overview

The Blog Views Service handles all view-related operations for blog posts, including view tracking, analytics, and reporting. It follows the Single Responsibility Principle and provides a clean API for view management.

## Recent Fixes and Updates

### PostgreSQL Compatibility

- **Fixed**: PostgreSQL interval syntax errors in analytics queries
- **Changed**: Migrated from MySQL-style `INTERVAL 7 DAY` to PostgreSQL-style `INTERVAL '7 days'`
- **Added**: Utility functions in `queryUtils.js` for safe interval and date formatting
- **Security**: Added SQL injection protection for column names and intervals

### UUID Validation

- **Fixed**: Invalid UUID format errors in `getViewsByUser` function
- **Added**: `isValidUUID()` helper function with proper UUID format validation
- **Enhanced**: Parameter validation in `validateViewParams` to check UUID format before database queries
- **Testing**: Added comprehensive UUID validation tests

### Database Schema Updates

- **Fixed**: Column name mismatch in `postQueries.js` - changed `bp.currency` to `bp.price_currency`
- **Current**: Service works with existing `blog_views` table structure
- **Future**: Migration file created for additional columns (`user_agent`, `referrer`)

## Database Schema

The service works with the `blog_views` table with the following current structure:

```sql
CREATE TABLE blog_views (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES sellers(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Planned Schema Enhancement

Migration `20250709000001_add_blog_views_columns.js` will add:

- `user_agent` TEXT
- `referrer` VARCHAR(500)

## API Functions

### Core Functions

#### `trackPostView(postId, userId, ipAddress, userAgent, referrer)`

Tracks a view for a blog post and increments the view count.

**Parameters:**

- `postId` (number): The blog post ID
- `userId` (number, optional): The user ID who viewed the post
- `ipAddress` (string, optional): The IP address of the viewer
- `userAgent` (string, optional): Browser user agent
- `referrer` (string, optional): The referrer URL

**Returns:** Promise<void>

**Example:**

```javascript
await trackPostView(123, 456, '192.168.1.1', 'Mozilla/5.0...', 'https://example.com');
```

#### `getViewCount(postId)`

Gets the total view count for a specific post.

**Parameters:**

- `postId` (number): The blog post ID

**Returns:** Promise<number>

#### `getViewsByPost(postId, limit, offset)`

Gets detailed view records for a specific post.

**Parameters:**

- `postId` (number): The blog post ID
- `limit` (number): Maximum views to return (default: 100)
- `offset` (number): Number of views to skip (default: 0)

**Returns:** Promise<Array> - Array of view records with user details

#### `getViewsByUser(userId, limit, offset)`

Gets all posts viewed by a specific user.

**Parameters:**

- `userId` (string): The user ID (must be a valid UUID format)
- `limit` (number): Maximum views to return (default: 100)
- `offset` (number): Number of views to skip (default: 0)

**Returns:** Promise<Array> - Array of view records with post details

#### `getMostViewedPosts(limit, days)`

Gets the most viewed posts.

**Parameters:**

- `limit` (number): Number of posts to return (default: 10)
- `days` (number): Days to consider (0 for all time, default: 0)

**Returns:** Promise<Array> - Array of posts ordered by view count

### Utility Functions

#### `validateViewParams(postId, userId)`

Validates parameters before tracking a view.

**Parameters:**

- `postId` (number): The blog post ID
- `userId` (number, optional): The user ID

**Returns:** Promise<boolean> - True if valid, throws error if invalid

#### `getViewAnalytics(postId)`

Gets comprehensive analytics for a post.

**Parameters:**

- `postId` (number): The blog post ID

**Returns:** Promise<Object> - Analytics data including:

- `total_views`: Total view count
- `unique_viewers`: Number of unique users who viewed
- `views_by_day`: Daily view counts for last 7 days

## Error Handling

All functions implement proper error handling:

- Database errors are caught and logged
- Invalid parameters throw descriptive errors
- Post existence is validated before tracking views
- User existence is validated if userId is provided

## Usage Examples

### Basic View Tracking

```javascript
const { trackPostView } = require('./service/blog/views');

// Track anonymous view
await trackPostView(123, null, '192.168.1.1');

// Track authenticated user view
await trackPostView(123, 456, '192.168.1.1', 'Mozilla/5.0...', 'https://example.com');
```

### Getting Analytics

```javascript
const { getViewAnalytics, getMostViewedPosts, isValidUUID } = require('./service/blog/views');

// Get detailed analytics for a post
const analytics = await getViewAnalytics(123);
console.log(`Total views: ${analytics.total_views}`);
console.log(`Unique viewers: ${analytics.unique_viewers}`);

// Get most viewed posts this week
const trending = await getMostViewedPosts(10, 7);

// Validate UUID before using
const userId = '550e8400-e29b-41d4-a716-446655440000';
if (isValidUUID(userId)) {
  const userViews = await getViewsByUser(userId, 10);
  console.log(`User has viewed ${userViews.length} posts`);
}
```

## Utility Functions

### `isValidUUID(uuid)`

Validates if a string is a properly formatted UUID.

**Parameters:**

- `uuid` (string): The UUID string to validate

**Returns:** boolean - True if valid UUID format, false otherwise

**Example:**

```javascript
const { isValidUUID } = require('./service/blog/views');

console.log(isValidUUID('550e8400-e29b-41d4-a716-446655440000')); // true
console.log(isValidUUID('invalid-uuid')); // false
```

## Migration Instructions

To enable full functionality with user_agent and referrer tracking:

1. Run the migration:

```bash
npx knex migrate:latest
```

2. The service automatically detects available columns and uses them

## Testing

Run the test suite:

```bash
node backend/test/blog/test-views.js
```

## Performance Considerations

- Views are tracked asynchronously to avoid blocking user requests
- Database indexes are optimized for common queries
- View counts are cached in the `blog_posts` table for faster retrieval
- Consider implementing view throttling for high-traffic scenarios

## Security Notes

- IP addresses are stored for analytics but should be handled per privacy regulations
- User agents and referrers contain potentially sensitive information
- Consider data retention policies for view records
- Implement rate limiting to prevent view count manipulation

## Future Enhancements

- [ ] Add view throttling to prevent spam
- [ ] Implement view session tracking
- [ ] Add geographic analytics
- [ ] Add device/browser analytics
- [ ] Implement view caching for high-traffic posts
- [ ] Add view export functionality
- [ ] Add real-time view tracking
- [ ] Implement view-based recommendations
