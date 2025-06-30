# Database Timestamp Error Fix

## Problem Description

The webhook was failing with this database error:

```
invalid input syntax for type timestamp: "0NaN-NaN-NaNTNaN:NaN:NaN.NaN+NaN:NaN"
```

This error occurred when Stripe sent webhook events with `null` or `undefined` values for timestamp fields like `current_period_start` and `current_period_end`, which were then converted to `NaN` dates and passed to the database.

## Root Cause

1. **Stripe webhook data**: Sometimes contains `null` or `undefined` for timestamp fields
2. **Unsafe conversion**: `new Date(null * 1000)` or `new Date(undefined * 1000)` results in `NaN`
3. **Database insertion**: PostgreSQL rejects `NaN` dates with the above error

## Solution Implemented

### 1. Safe Timestamp Conversion (`StripeWebhookService`)

Added utility functions to safely convert Unix timestamps:

```javascript
_safeTimestampToDate(unixTimestamp, fieldName = 'timestamp') {
  // Handle null, undefined, or non-numeric values
  if (unixTimestamp === null || unixTimestamp === undefined || typeof unixTimestamp !== 'number') {
    return null;
  }

  // Handle zero or negative timestamps
  if (unixTimestamp <= 0) {
    return null;
  }

  // Convert and validate
  const date = new Date(unixTimestamp * 1000);
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}
```

### 2. Enhanced Data Validation (`SubscriptionDatabase`)

Updated subscription data handling to filter out invalid dates:

```javascript
// Only add dates if they are valid Date objects
if (
  current_period_start instanceof Date &&
  !isNaN(current_period_start.getTime())
) {
  subscriptionRecord.current_period_start = current_period_start;
}
if (
  current_period_end instanceof Date &&
  !isNaN(current_period_end.getTime())
) {
  subscriptionRecord.current_period_end = current_period_end;
}
```

### 3. Improved Error Handling (`webhook.js`)

Added specific error detection and guidance for timestamp-related issues:

```javascript
// For timestamp errors, provide specific guidance
if (error.message.includes("invalid input syntax for type timestamp")) {
  logger.error("🕒 TIMESTAMP CONVERSION ERROR DETECTED", {
    requestId,
    suggestion: "Check Stripe webhook data for invalid timestamp values",
    commonCause:
      "Unix timestamp conversion failure - check for null/undefined values",
  });
}
```

### 4. Debug Logging

Added comprehensive debug logging to help identify timestamp issues:

```javascript
_debugLogSubscriptionData(subscription, requestId, eventType) {
  const debugData = {
    current_period_start: {
      value: subscription.current_period_start,
      type: typeof subscription.current_period_start,
      isNumber: typeof subscription.current_period_start === 'number',
      converted: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null
    }
    // ... similar for current_period_end
  };
  logger.info('🔍 DEBUG: Stripe subscription timestamp data', debugData);
}
```

## User ID Constraint Error Fix

### Additional Problem

After fixing the timestamp issue, a new database constraint error appeared:

```
null value in column "user_id" of relation "user_subscriptions" violates not-null constraint
```

This occurred because the `user_subscriptions` table requires a `user_id`, but the webhook processing wasn't linking Stripe customers to users in the database.

### Additional Solution

1. **User Lookup by Customer ID** (`StripeWebhookService`):

   - Added `_findUserByCustomerId()` to lookup users by Stripe customer ID
   - Added `_extractUserIdFromSession()` to get user ID from session metadata or customer lookup
   - Added company subscription detection and handling

2. **Enhanced Validation** (`SubscriptionDatabase`):

   - Added explicit `user_id` requirement validation
   - Provides clear error messages when user ID is missing
   - Prevents database constraint violations

3. **Improved Error Handling** (`webhook.js`):
   - Added specific detection for NOT NULL constraint violations
   - Provides guidance for missing required fields
   - Suggests possible solutions for constraint violations

### Files Updated for User ID Fix

- **`backend/service/stripeWebhookService.js`**: Added user lookup and validation logic
- **`backend/service/subscriptionDatabase.js`**: Enhanced validation for required user_id
- **`backend/routes/webhook.js`**: Added constraint violation error detection

### How the User ID Fix Works

```javascript
// 1. Extract user ID from session
const userId = await this._extractUserIdFromSession(session, requestId);

// 2. Handle different scenarios
if (userId === "COMPANY_SUBSCRIPTION") {
  // Skip user subscription for companies
  return;
} else if (!userId) {
  // Defer to subscription.created event
  logger.warn("Deferring subscription creation...");
  return;
}

// 3. Create subscription with valid user_id
const subscriptionData = {
  stripe_subscription_id: session.subscription,
  user_id: userId, // Now properly populated
  // ... other fields
};
```

## Files Modified

1. **`backend/service/stripeWebhookService.js`**

   - Added `_safeTimestampToDate()` utility function
   - Added `_extractSafePeriodDates()` helper
   - Added `_debugLogSubscriptionData()` for debugging
   - Updated subscription handlers to use safe conversion
   - Added user lookup and validation logic

2. **`backend/service/subscriptionDatabase.js`**

   - Enhanced date validation in `createOrUpdateSubscription()`
   - Updated `updateSubscriptionStatus()` with date filtering
   - Added validation warnings for invalid dates
   - Enhanced validation for required user_id

3. **`backend/routes/webhook.js`**

   - Enhanced error logging with timestamp-specific guidance
   - Added error categorization for better debugging
   - Added constraint violation error detection

4. **`backend/test/timestamp-validation.test.js`** (NEW)
   - Comprehensive test suite for timestamp conversion logic
   - Validates all edge cases that could cause the error

## Testing

Run the validation test:

```bash
node backend/test/timestamp-validation.test.js
```

This will verify that:

- Valid timestamps convert correctly
- Invalid inputs return `null` instead of `NaN`
- No invalid dates make it to the database

## Benefits

1. **Robust Error Handling**: Webhook won't crash on invalid timestamps
2. **Data Integrity**: Database only receives valid dates or null values
3. **Better Debugging**: Comprehensive logging for timestamp issues
4. **Graceful Degradation**: Missing dates don't prevent subscription processing
5. **Future-Proof**: Handles various edge cases and Stripe API changes

## Prevention

This fix prevents:

- Database errors from invalid timestamps
- Webhook failures due to malformed date data
- Data corruption from NaN values
- Service interruptions from timestamp edge cases

The webhook now gracefully handles all timestamp scenarios while maintaining data integrity and providing clear debugging information.
