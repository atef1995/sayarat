# Unified Account System Implementation Guide

## Overview

The unified account system supports both **individual** and **company** accounts with distinct subscription management, plan filtering, and feature sets. The implementation follows SOLID principles, DRY methodology, and modular architecture patterns.

## Architecture Components

### 1. Backend Services Layer

#### AccountTypeService.js

```javascript
// Handles account type detection and business logic
class AccountTypeService {
  static ACCOUNT_TYPES = {
    INDIVIDUAL: "individual",
    COMPANY: "company",
  };

  // Core methods:
  // - getUserAccountType(userId): Determines user's account type
  // - switchAccountType(userId, targetType, companyId): Switches account types
  // - validateCompanyAssociation(userId, companyId): Validates company permissions
}
```

#### UnifiedSubscriptionService.js

```javascript
// Strategy pattern implementation for account-type-aware subscriptions
class UnifiedSubscriptionService {
  // Strategy pattern with:
  // - IndividualSubscriptionStrategy: Individual account logic
  // - CompanySubscriptionStrategy: Company account logic
  // Core methods:
  // - getStrategy(accountType): Returns appropriate strategy
  // - getSubscriptions(userId): Gets account-type-aware subscriptions
  // - getAvailablePlans(userId): Filters plans by account type
  // - createSubscription(userId, planId, stripeData): Creates subscriptions
}
```

### 2. Database Schema

#### Enhanced Tables

```sql
-- user_subscriptions: Added account type support
ALTER TABLE user_subscriptions ADD COLUMN account_type VARCHAR(20) DEFAULT 'individual';
ALTER TABLE user_subscriptions ADD COLUMN company_id UUID;

-- subscription_plans: Added target audience support
ALTER TABLE subscription_plans ADD COLUMN target_audience JSONB DEFAULT '["individual", "company"]';

-- sellers: Added company association
ALTER TABLE sellers ADD COLUMN company_id UUID;
ALTER TABLE sellers ADD COLUMN account_type VARCHAR(20) DEFAULT 'individual';
ALTER TABLE sellers ADD COLUMN is_company BOOLEAN DEFAULT false;

-- companies: Company management
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  subscription_plan_id VARCHAR(100),
  -- ... additional fields
);
```

### 3. Frontend Type System

#### Enhanced TypeScript Interfaces

```typescript
// Account types and company data
export type AccountType = "individual" | "company";

export interface Company {
  id: string;
  name: string;
  subscriptionStatus?: string;
  // ... additional fields
}

// Enhanced subscription interfaces
export interface UserSubscription {
  // ... existing fields
  accountType: AccountType;
  companyId?: string;
  company?: Company;
}

export interface SubscriptionPlan {
  // ... existing fields
  targetAudience: AccountType[];
  companyFeatures?: string[];
}
```

### 4. API Endpoints

#### Enhanced Subscription Controller

```javascript
// Account-type-aware endpoints:
GET    /api/subscription/status              // Enhanced with account type info
GET    /api/subscription/plans?accountType   // Filtered plans by account type
POST   /api/subscription/switch-account-type // Account type switching
GET    /api/subscription/account-type        // Get current account type
POST   /api/subscription/companies           // Create company
POST   /api/subscription/associate-company   // Associate with company
```

## Implementation Flow

### 1. Account Type Detection

```javascript
// Backend: Automatic account type detection
const accountType = await AccountTypeService.getUserAccountType(userId);

// Frontend: Account type-aware UI
const { accountType, company, canSwitchAccountType } =
  await SubscriptionService.checkSubscription();
```

### 2. Plan Filtering

```javascript
// Backend: Filter plans by account type
const strategy = UnifiedSubscriptionService.getStrategy(accountType);
const availablePlans = await strategy.getAvailablePlans(userId);

// Frontend: Account-type-aware plan display
const plans = await SubscriptionService.getPlans({ accountType: "company" });
const filteredPlans = SubscriptionService.filterPlansByAccountType(
  plans,
  "individual"
);
```

### 3. Account Type Switching

```javascript
// Frontend: Switch from individual to company
const result = await SubscriptionService.switchAccountType({
  targetAccountType: "company",
  companyId: "company-uuid",
});

// Backend: Validates permissions and updates relationships
await AccountTypeService.switchAccountType(userId, "company", companyId);
```

### 4. Company Management

```javascript
// Create new company
const company = await SubscriptionService.createCompany({
  name: "My Company Ltd",
  email: "contact@company.com",
  // ... additional fields
});

// Associate with existing company
await SubscriptionService.associateWithCompany({
  companyId: "existing-company-id",
});
```

## Database Migration Strategy

### Migration Phases

1. **Schema Updates**: Add account type columns and indexes
2. **Data Migration**: Set default account types for existing users
3. **Plan Updates**: Add target audience to existing plans
4. **Index Creation**: Performance optimization indexes
5. **Constraint Addition**: Foreign key relationships

### Migration Execution

```bash
# Run the unified migration
cd backend
npm run migrate:development

# Verify migration
npm run test:db
```

## Frontend Integration

### 1. Enhanced Subscription Service

```typescript
// Use enhanced service methods
const subscription = await SubscriptionService.checkSubscription();
const plans = await SubscriptionService.getPlans({
  accountType: subscription.accountType,
});

// Account type management
const accountInfo = await SubscriptionService.getAccountType();
await SubscriptionService.switchAccountType({ targetAccountType: "company" });
```

### 2. Account Type-Aware Components

```typescript
// Conditional rendering based on account type
{
  subscription.accountType === "company" && (
    <CompanyDashboard company={subscription.company} />
  );
}

// Plan filtering
const filteredPlans = useMemo(
  () => SubscriptionService.filterPlansByAccountType(plans, accountType),
  [plans, accountType]
);
```

## Security Considerations

### 1. Company Association Validation

- Users can only associate with companies they have permission to join
- Company subscription changes require appropriate roles
- Audit logging for all account type changes

### 2. Plan Access Control

- Plans are filtered by target audience on both frontend and backend
- Company-specific features only accessible to company accounts
- Subscription transfers require validation

## Performance Optimizations

### 1. Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_user_subscriptions_account_type ON user_subscriptions(account_type);
CREATE INDEX idx_user_subscriptions_combined ON user_subscriptions(account_type, company_id, status);
CREATE INDEX idx_subscription_plans_target_audience ON subscription_plans USING GIN (target_audience);
```

### 2. Caching Strategy

- Cache account type detection results
- Cache company information for associated users
- Cache filtered plan lists by account type

## Testing Strategy

### 1. Unit Tests

- Account type detection logic
- Plan filtering algorithms
- Subscription strategy selection

### 2. Integration Tests

- Account type switching flows
- Company association workflows
- Subscription creation for different account types

### 3. E2E Tests

- Complete user journey from individual to company
- Subscription management across account types
- Plan filtering and selection

## Future Enhancements

### 1. Advanced Company Features

- Multi-user company management
- Role-based permissions within companies
- Company subscription analytics
- Bulk operations for company admins

### 2. Enhanced Plan Management

- Dynamic plan recommendations based on usage
- Automatic upgrades for growing companies
- Custom enterprise plans
- Usage-based billing options

### 3. Analytics and Reporting

- Account type conversion tracking
- Company subscription metrics
- Revenue analytics by account type
- User behavior analysis

## Deployment Checklist

### Backend

- [ ] Run database migration
- [ ] Verify all indexes created
- [ ] Test account type detection
- [ ] Validate plan filtering
- [ ] Check audit logging

### Frontend

- [ ] Update TypeScript interfaces
- [ ] Test account type switching UI
- [ ] Verify plan filtering display
- [ ] Test company management flows
- [ ] Validate responsive design

### Production

- [ ] Database backup before migration
- [ ] Gradual rollout with feature flags
- [ ] Monitor performance metrics
- [ ] Track error rates
- [ ] Validate subscription flows

## Troubleshooting

### Common Issues

1. **Migration Failures**: Check SSL configuration and database permissions
2. **Plan Filtering**: Verify target_audience column format
3. **Account Switching**: Validate company association permissions
4. **Performance**: Monitor index usage and query performance

### Debug Commands

```bash
# Check migration status
npm run migrate:status

# Test database connectivity
npm run test:db

# Verify subscription data
npm run test:subscription-data
```

This implementation provides a robust, scalable foundation for unified account management while maintaining backward compatibility and following best practices for enterprise-grade applications.
