# Backend Subscription System Migration Plan

## Overview

This document outlines the backend changes needed to unify individual and company subscription management into a single, cohesive system following SOLID principles and DRY methodology.

## Completed Changes

### 1. Enhanced Subscription Controller (`backend/controllers/subscriptionController.js`)

#### Account Type Detection

- ✅ Added account type detection in `createSubscription` function
- ✅ Support for explicit `accountType` parameter or auto-detection from user data
- ✅ Company-specific validation for `companyId` requirement
- ✅ Enhanced plan validation to check target audience compatibility

#### Metadata Enhancement

- ✅ Added comprehensive metadata to Stripe checkout sessions including:
  - `accountType`: 'individual' or 'company'
  - `companyId`: For company subscriptions
  - `isCompanySubscription`: Boolean flag
- ✅ Dynamic success/cancel URLs based on account type
- ✅ Enhanced subscription data metadata in Stripe

#### Plans API Enhancement

- ✅ Added account type filtering to `/api/subscription/plans` endpoint
- ✅ Support for `?accountType=company` or `?accountType=individual` query parameters
- ✅ Enhanced response with filtering metadata

#### Status API Enhancement

- ✅ Enhanced `/api/subscription/status` response to include:
  - `accountType`: Detected account type
  - `canManageSubscription`: Permission flag
  - `billingCycle`: Current billing interval
  - `nextBillingDate`: Next billing date

### 2. Enhanced Webhook Service (`backend/service/stripeWebhookService.js`)

#### Unified Processing

- ✅ Updated `_processSubscriptionFromSession` to handle account type detection
- ✅ Added `_processCompanySubscriptionFromSession` method for company-specific logic
- ✅ Enhanced metadata handling for both account types

#### Company Subscription Support

- ✅ Added dedicated company subscription processing logic
- ✅ Proper metadata tracking for company subscriptions
- ✅ Enhanced logging for company subscription flows

### 3. Unified Subscription Routes (`backend/routes/subscription.js`)

#### Route Consolidation

- ✅ Added legacy company subscription endpoint (`/create-company`) that uses unified logic
- ✅ Enhanced main creation endpoint to support both account types
- ✅ Maintained backward compatibility

### 4. Payment Routes Deprecation (`backend/routes/payment.js`)

#### Deprecation Notices

- ✅ Added deprecation warning documentation
- ✅ Added runtime deprecation logging for company subscription endpoint
- ✅ Maintained functional compatibility during transition period

## Pending Implementation

### 1. Database Schema Updates

#### Company Subscription Tables

```sql
-- #TODO: Create or update companies table with subscription fields
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_plan_id VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;

-- #TODO: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_subscription ON companies(subscription_status, subscription_plan_id);
```

#### User Subscriptions Table Enhancement

```sql
-- #TODO: Add account type tracking
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'individual';
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);

-- #TODO: Add indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_account_type ON user_subscriptions(account_type);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_company ON user_subscriptions(company_id);
```

### 2. Company Management Integration

#### Company Subscription Service

```javascript
// #TODO: Create backend/service/companySubscriptionService.js
class CompanySubscriptionService {
  async activateCompanySubscription(companyId, subscriptionId, planId) {
    // Update company subscription status
    // Grant permissions to company members
    // Send activation notifications
  }

  async deactivateCompanySubscription(companyId, reason) {
    // Update company subscription status
    // Revoke company member permissions
    // Send deactivation notifications
  }

  async getCompanySubscriptionMembers(companyId) {
    // Return list of users under company subscription
  }
}
```

### 3. Enhanced Webhook Processing

#### Company Webhook Events

```javascript
// #TODO: Enhance webhook processing for company-specific events
async _handleCompanySubscriptionCreated(subscription, requestId) {
  // Company-specific subscription creation logic
  // Member permission updates
  // Admin notifications
}

async _handleCompanySubscriptionCancelled(subscription, requestId) {
  // Company-specific cancellation logic
  // Member permission revocation
  // Admin notifications
}
```

### 4. Email Service Integration

#### Company-Specific Email Templates

```javascript
// #TODO: Create company subscription email templates
const companySubscriptionEmails = {
  welcome: "company-subscription-welcome",
  renewal: "company-subscription-renewal",
  cancellation: "company-subscription-cancelled",
  memberAdded: "company-member-added-to-subscription",
};
```

### 5. Plan Management Enhancement

#### Dynamic Plan Features

```javascript
// #TODO: Enhance plan database structure
const companyPlanFeatures = {
  unlimitedListings: true,
  teamMembers: 50,
  customBranding: true,
  advancedAnalytics: true,
  prioritySupport: true,
  apiAccess: true,
};
```

## Migration Strategy

### Phase 1: Backend Unification (Current)

- ✅ Unified subscription creation endpoint
- ✅ Account type detection and validation
- ✅ Enhanced webhook processing
- ✅ Deprecation notices for legacy endpoints

### Phase 2: Database Migration

- [ ] Create migration scripts for schema updates
- [ ] Migrate existing company subscriptions to unified table structure
- [ ] Add necessary indexes and constraints
- [ ] Update database query layer

### Phase 3: Company Integration

- [ ] Implement company subscription service
- [ ] Add company member management
- [ ] Create company-specific email workflows
- [ ] Add company analytics and reporting

### Phase 4: Legacy Cleanup

- [ ] Remove deprecated payment endpoints
- [ ] Clean up legacy webhook handlers
- [ ] Update documentation
- [ ] Remove unused code

## Testing Requirements

### Unit Tests

- [ ] Subscription controller account type detection
- [ ] Plan filtering by account type
- [ ] Webhook processing for both account types
- [ ] Company subscription activation/deactivation

### Integration Tests

- [ ] End-to-end subscription creation flow
- [ ] Webhook event processing
- [ ] Email delivery for company subscriptions
- [ ] Member permission management

### Migration Tests

- [ ] Data migration scripts
- [ ] Backward compatibility
- [ ] Legacy endpoint functionality
- [ ] Performance impact assessment

## Security Considerations

### Access Control

- [ ] Validate company subscription permissions
- [ ] Ensure proper user authorization for company actions
- [ ] Audit logging for company subscription changes
- [ ] Rate limiting for subscription endpoints

### Data Protection

- [ ] Encrypt sensitive subscription data
- [ ] PCI compliance for payment processing
- [ ] GDPR compliance for user data
- [ ] Secure webhook signature validation

## Monitoring and Alerting

### Metrics

- [ ] Subscription creation success rates by account type
- [ ] Company subscription activation rates
- [ ] Webhook processing performance
- [ ] Email delivery success rates

### Alerts

- [ ] Failed subscription creations
- [ ] Webhook processing failures
- [ ] Payment processing errors
- [ ] Unusual subscription activity

## Documentation Updates

### API Documentation

- [ ] Update OpenAPI/Swagger specifications
- [ ] Add account type examples
- [ ] Document migration endpoints
- [ ] Update webhook event documentation

### Developer Guide

- [ ] Company subscription integration guide
- [ ] Migration checklist
- [ ] Troubleshooting guide
- [ ] Best practices documentation

## Performance Considerations

### Database Optimization

- [ ] Index optimization for subscription queries
- [ ] Query performance analysis
- [ ] Connection pooling optimization
- [ ] Caching strategy for plan data

### API Performance

- [ ] Response time optimization
- [ ] Pagination for large company member lists
- [ ] Async processing for heavy operations
- [ ] CDN integration for static resources

## Rollback Plan

### Emergency Procedures

- [ ] Quick rollback to legacy endpoints
- [ ] Data restoration procedures
- [ ] Service recovery protocols
- [ ] Communication templates

### Gradual Migration

- [ ] Feature flags for new functionality
- [ ] A/B testing for subscription flows
- [ ] Gradual traffic migration
- [ ] Monitoring and feedback collection

---

## Current Status: Phase 1 - Backend Unification (90% Complete)

### Ready for Testing

- Unified subscription creation with account type support
- Enhanced webhook processing
- Plan filtering by account type
- Deprecation warnings for legacy endpoints

### Next Steps

1. Complete database schema updates
2. Implement company subscription service
3. Add comprehensive unit tests
4. Plan Phase 2 migration rollout
