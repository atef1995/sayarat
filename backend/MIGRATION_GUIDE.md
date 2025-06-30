# Migration Guide for Unified Subscription System

This guide explains how to run the unified subscription system migration using dotenvx for environment management.

## Prerequisites

- Node.js installed
- Database accessible
- Environment files configured (.env.development, .env.production, etc.)
- dotenvx installed (`npm install @dotenvx/dotenvx`)

## Environment Variables Required

Ensure your environment files contain the following variables:

```bash
# Database Configuration
DB_CLIENT=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=cars_bids

# Optional: Database Pool Configuration
DB_POOL_MIN=2
DB_POOL_MAX=10

# Environment
NODE_ENV=development
```

## Quick Start

### 1. Run Migration (Recommended)

```bash
# Development environment
npm run migrate:unified

# Production environment (use with caution)
npm run migrate:prod

# Force migration (if already applied)
npm run migrate:unified:force
```

### 2. Check Migration Status

```bash
npm run migrate:unified:status
```

### 3. Verify Migration

```bash
npm run migrate:unified:verify
```

### 4. Rollback (if needed)

```bash
npm run migrate:unified:rollback
```

## Advanced Usage

### Using the Environment-Aware Script

```bash
# Run migration on specific environment
node scripts/migrate.js development migrate
node scripts/migrate.js production verify
node scripts/migrate.js staging status

# Force migration
node scripts/migrate.js development migrate --force

# Show help
node scripts/migrate.js --help
```

### Direct Script Usage

```bash
# Run migration with dotenvx
npx dotenvx run -f .env.development -- node scripts/run-migration.js migrate

# Check status
npx dotenvx run -f .env.development -- node scripts/run-migration.js status

# Verify migration
npx dotenvx run -f .env.development -- node scripts/run-migration.js verify

# Rollback
npx dotenvx run -f .env.development -- node scripts/run-migration.js rollback
```

### Production Environment

```bash
# Production migration
npx dotenvx run -f .env.production -- node scripts/run-migration.js migrate

# Or use the npm script
npm run migrate:prod
```

## What the Migration Does

### Database Schema Changes

1. **Enhances `user_subscriptions` table:**

   - Adds `account_type` column ('individual' or 'company')
   - Adds `company_id` column for company associations
   - Adds performance indexes

2. **Enhances `subscription_plans` table:**

   - Adds `target_audience` JSON column for plan filtering
   - Updates existing plans to support both account types

3. **Creates `companies` table** (if not exists):

   - Company information and metadata
   - Subscription tracking fields
   - Audit and management fields

4. **Enhances `sellers` table:**

   - Adds `company_id` for company association
   - Adds `is_company` flag for backward compatibility
   - Adds `account_type` for explicit type tracking

5. **Creates `subscription_audit_log` table:**

   - Tracks all subscription changes
   - Audit trail for compliance and debugging

6. **Data Migration:**
   - Updates existing subscriptions with account types
   - Links existing company subscriptions

### Performance Optimizations

- Adds database indexes for faster queries
- Optimizes subscription lookups by account type
- Improves company-related query performance

## Verification Steps

After running the migration, verify the changes:

```bash
# Check migration status
npm run migrate:unified:status

# Verify all changes applied correctly
npm run migrate:unified:verify
```

The verification script checks:

- ✅ All new columns exist
- ✅ All new tables are created
- ✅ Indexes are properly created
- ✅ Data migration completed
- ✅ Foreign key constraints applied

## Troubleshooting

### Common Issues

1. **Environment variables not loaded:**

   ```bash
   # Check if dotenvx is properly loading variables
   npx dotenvx run -f .env.development -- printenv | grep DB_
   ```

2. **Database connection failed:**

   - Verify database is running
   - Check connection details in environment file
   - Ensure database exists
   - Verify user permissions

3. **Migration already applied:**

   ```bash
   # Force rerun if needed (use with caution)
   npm run migrate:unified:force
   ```

4. **Permission errors:**
   - Ensure database user has CREATE, ALTER, DROP permissions
   - Check table ownership

### Debugging

Enable detailed logging:

```bash
# Run with debug output
DEBUG=knex:* npx dotenvx run -f .env.development -- node scripts/run-migration.js migrate
```

### Rollback Strategy

If something goes wrong:

```bash
# Rollback the migration
npm run migrate:unified:rollback

# Verify rollback completed
npm run migrate:unified:status
```

**Note:** Rollback will remove new columns and tables but won't delete the `companies` table to preserve data.

## Production Deployment

### Pre-deployment Checklist

- [ ] Test migration on staging environment
- [ ] Backup production database
- [ ] Verify environment variables are correct
- [ ] Ensure maintenance window is scheduled
- [ ] Test rollback procedure on staging

### Production Migration Steps

1. **Backup database:**

   ```bash
   pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Run migration:**

   ```bash
   npm run migrate:prod
   ```

3. **Verify migration:**

   ```bash
   npx dotenvx run -f .env.production -- node scripts/run-migration.js verify
   ```

4. **Test application functionality**

### Post-migration Tasks

1. Update application servers with new code
2. Test subscription flows
3. Monitor application logs
4. Update API documentation
5. Notify team of completion

## Support

If you encounter issues:

1. Check the migration logs
2. Verify environment configuration
3. Test database connectivity
4. Review the troubleshooting section
5. Contact the development team

## Files Created/Modified

- `backend/migrations/20250623000001_unified_subscription_system.js` - Main migration
- `backend/scripts/run-migration.js` - Migration runner
- `backend/scripts/migrate.js` - Environment-aware wrapper
- `backend/package.json` - Updated with new scripts
- `backend/MIGRATION_GUIDE.md` - This documentation
