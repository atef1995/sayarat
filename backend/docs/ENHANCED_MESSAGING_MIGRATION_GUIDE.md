# Enhanced Messaging System - Knex Migration Guide

## Overview

This guide explains how to apply the Enhanced Messaging System database migrations using Knex. These migrations implement the solution to the critical messaging routing flaw when company members are removed but their listings remain active.

## Migration Files Created

The enhanced messaging system consists of 4 Knex migration files that must be applied in sequence:

### 1. `20250622120000_enhanced_member_management.js`

**Purpose**: Enhanced member management with status tracking and audit trail

**Changes**:

- Adds `member_status` column to `sellers` table
- Adds removal/reactivation tracking fields
- Creates `company_member_audit` table for audit trail
- Updates listing status constraints
- Creates helper views and functions

### 2. `20250622121000_messaging_ownership_tracking.js`

**Purpose**: Listing ownership tracking for message routing

**Changes**:

- Adds `current_owner_id`, `current_owner_type`, `original_seller_id` to `listed_cars`
- Migrates existing data to set current ownership
- Adds performance indexes

### 3. `20250622122000_messaging_conversation_tracking.js`

**Purpose**: Conversation ownership tracking and company message handlers

**Changes**:

- Creates `conversation_ownership_log` table
- Creates `company_message_handlers` table
- Creates database views for message routing
- Creates functions for smart message recipient lookup
- Sets up default message handlers for existing companies

### 4. `20250622123000_messaging_final_setup.js`

**Purpose**: Final setup, validation, and documentation

**Changes**:

- Adds database comments for documentation
- Creates performance indexes
- Validates migration completion
- Provides status reporting

## How to Run Migrations

### Option 1: Automatic Migration Runner (Recommended)

Use the provided migration runner script that handles everything automatically:

```bash
# Run the enhanced messaging migrations
npm run migrate:messaging
```

This script will:

- ✅ Check current migration status
- ✅ Apply all enhanced messaging migrations in correct order
- ✅ Verify all components are properly installed
- ✅ Provide detailed status reporting

### Option 2: Standard Knex Migrations

Run migrations using standard Knex commands:

```bash
# Run all pending migrations
npm run migrate

# Or use Knex directly
npx knex migrate:latest
```

### Option 3: Manual Step-by-Step

Apply migrations one by one for debugging:

```bash
# Apply each migration individually
npx knex migrate:up 20250622120000_enhanced_member_management.js
npx knex migrate:up 20250622121000_messaging_ownership_tracking.js
npx knex migrate:up 20250622122000_messaging_conversation_tracking.js
npx knex migrate:up 20250622123000_messaging_final_setup.js
```

## Pre-Migration Checklist

Before running the migrations, ensure:

- [ ] **Database Backup**: Create a backup of your database
- [ ] **Environment Variables**: Verify database connection settings
- [ ] **Dependencies**: Ensure all npm packages are installed
- [ ] **Database Connection**: Test database connectivity
- [ ] **Existing Schema**: Verify base tables exist (`sellers`, `companies`, `listed_cars`, `conversations`, etc.)

```bash
# Create database backup (PostgreSQL example)
pg_dump your_database_name > backup_before_messaging_migration.sql

# Test database connection
npx knex migrate:status
```

## Post-Migration Verification

After running migrations, verify the installation:

### 1. Check Tables Created

```sql
-- Verify new tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('company_member_audit', 'conversation_ownership_log', 'company_message_handlers');
```

### 2. Check Columns Added

```sql
-- Verify new columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'sellers' AND column_name = 'member_status';

SELECT column_name FROM information_schema.columns
WHERE table_name = 'listed_cars' AND column_name IN ('current_owner_id', 'current_owner_type', 'original_seller_id');
```

### 3. Check Functions Created

```sql
-- Verify functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
AND routine_name IN ('get_listing_message_recipient', 'update_conversation_ownership', 'get_member_statistics');
```

### 4. Check Views Created

```sql
-- Verify views exist
SELECT table_name FROM information_schema.views
WHERE table_name IN ('listing_message_routing', 'active_company_message_handlers', 'active_company_members');
```

### 5. Test Message Routing Function

```sql
-- Test the message routing function with a real listing ID
SELECT * FROM get_listing_message_recipient('your-listing-id-here');
```

## Application Integration

After successful migration, update your application:

### 1. Update Message Service

Replace the existing `MessageService` with `EnhancedMessageService`:

```javascript
// Old
const MessageService = require("./service/messageService");

// New
const EnhancedMessageService = require("./service/enhancedMessageService");
```

### 2. Update Company Controller

The `CompanyController` has been updated with new messaging integration. Ensure you're using the latest version with:

- `_handleMemberMessaging()`
- `_handleMemberReactivationMessaging()`
- Enhanced endpoints

### 3. Update API Routes

New endpoints are available:

- `GET /messages/listing/:listingId/recipient`
- `GET /messages/conversation/:conversationId/ownership-history`
- `GET /company/stats/enhanced`

## Rollback Instructions

If you need to rollback the migrations:

```bash
# Rollback the last 4 migrations
npx knex migrate:rollback --all

# Or rollback one by one (in reverse order)
npx knex migrate:down 20250622123000_messaging_final_setup.js
npx knex migrate:down 20250622122000_messaging_conversation_tracking.js
npx knex migrate:down 20250622121000_messaging_ownership_tracking.js
npx knex migrate:down 20250622120000_enhanced_member_management.js
```

**⚠️ Warning**: Rollback will remove all enhanced messaging functionality and data. Ensure you have backups!

## Troubleshooting

### Common Issues

1. **Migration Fails on Constraint Creation**

   ```
   Error: constraint already exists
   ```

   **Solution**: Check if you have existing constraints and drop them first:

   ```sql
   ALTER TABLE listed_cars DROP CONSTRAINT IF EXISTS listed_cars_status_check;
   ```

2. **Function Creation Fails**

   ```
   Error: function already exists
   ```

   **Solution**: Use `CREATE OR REPLACE FUNCTION` or drop existing function first.

3. **Data Migration Issues**
   ```
   Error: cannot update NULL values
   ```
   **Solution**: Ensure all listings have valid `seller_id` before migration.

### Debugging Commands

```bash
# Check migration status
npx knex migrate:status

# Check specific migration
npx knex migrate:list

# View migration details
npx knex migrate:currentVersion
```

### Database Inspection

```sql
-- Check table structure
\d+ sellers
\d+ listed_cars
\d+ company_member_audit
\d+ conversation_ownership_log
\d+ company_message_handlers

-- Check indexes
\di *messaging*
\di *member*

-- Check constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'listed_cars'::regclass;
```

## Performance Considerations

The migrations include performance optimizations:

- **Indexes**: Added on frequently queried columns
- **Views**: Pre-computed joins for common queries
- **Functions**: Optimized PostgreSQL functions for routing logic
- **Constraints**: Proper foreign key relationships

Monitor performance after migration and consider additional indexes based on your usage patterns.

## Support

If you encounter issues:

1. **Check Logs**: Review migration runner output for specific errors
2. **Database Logs**: Check PostgreSQL logs for constraint violations
3. **Backup & Retry**: Restore from backup and retry with fixes
4. **Manual Fixes**: Apply manual SQL fixes for specific issues

The migration runner provides detailed status reporting to help identify any issues during the process.
