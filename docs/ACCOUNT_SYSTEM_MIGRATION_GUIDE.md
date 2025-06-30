# Migration Guide: Legacy to Unified Account System

## Overview

This guide explains how to migrate from the legacy individual/company detection system to the new unified account management system across your React components.

## Key Changes Summary

### 🔄 **API Changes**

- **OLD**: `isCompanyUser(userDetails)` utility function
- **NEW**: `subscriptionData.accountType === 'company'` from unified API

### 🔄 **Data Sources**

- **OLD**: Static user properties and utility functions
- **NEW**: Dynamic account type detection via `SubscriptionService.checkSubscription()` and `SubscriptionService.getAccountType()`

### 🔄 **Component Integration**

- **OLD**: Manual company/individual conditional rendering
- **NEW**: `UnifiedAccountManager` component with built-in account switching

## Migration Steps

### 1. Update Component Imports

**Before:**

```tsx
import { isCompanyUser } from "../utils/userUtils";
import { SubscriptionCheckResponse } from "../types/subscription.types";
```

**After:**

```tsx
import {
  SubscriptionCheckResponse,
  AccountType,
  AccountTypeResponse,
} from "../types/subscription.types";
import UnifiedAccountManager from "./UnifiedAccountManager";
```

### 2. Replace Account Type Detection

**Before:**

```tsx
const isCompany = isCompanyUser(userDetails);

// Usage
{
  isCompany && <CompanyDashboard />;
}
```

**After:**

```tsx
const [subscriptionData, setSubscriptionData] =
  useState<SubscriptionCheckResponse | null>(null);
const [accountTypeData, setAccountTypeData] =
  useState<AccountTypeResponse | null>(null);

// Load account data
const loadAccountData = useCallback(async () => {
  const subscriptionResponse = await SubscriptionService.checkSubscription();
  const accountTypeResponse = await SubscriptionService.getAccountType();
  setSubscriptionData(subscriptionResponse);
  setAccountTypeData(accountTypeResponse);
}, []);

// Usage
const isCompanyAccount = subscriptionData?.accountType === "company";
{
  isCompanyAccount && <CompanyDashboard />;
}
```

### 3. Add Account Management Tab

**Before:**

```tsx
const tabs = [
  { key: "overview", label: "Overview", children: <AccountOverview /> },
  { key: "profile", label: "Profile", children: <ProfileForm /> },
  {
    key: "subscription",
    label: "Subscription",
    children: <SubscriptionManagement />,
  },
];
```

**After:**

```tsx
const tabs = [
  { key: "overview", label: "Overview", children: <AccountOverview /> },
  { key: "profile", label: "Profile", children: <ProfileForm /> },
  {
    key: "account-management",
    label: "Account Management",
    children: (
      <UnifiedAccountManager
        onAccountTypeChange={handleAccountTypeChange}
        onSubscriptionUpdate={() => loadAccountData()}
      />
    ),
  },
  {
    key: "subscription",
    label: "Subscription",
    children: <SubscriptionManagement />,
  },
];
```

### 4. Handle Account Type Changes

**New Feature:**

```tsx
const handleAccountTypeChange = async (newAccountType: AccountType) => {
  // Reload data when account type changes
  await loadAccountData();
  message.success(`Switched to ${newAccountType} account`);
};
```

### 5. Update Conditional Rendering

**Before:**

```tsx
...(isCompanyUser(userDetails) ? [companyTabs] : [])
```

**After:**

```tsx
...(isCompanyAccount ? [companyTabs] : [])
```

## Component-Specific Migration Examples

### UserProfile Component (✅ Completed)

The `UserProfile.tsx` has been successfully migrated with:

1. **Enhanced Account Detection:**

   ```tsx
   const isCompanyAccount =
     subscriptionData?.accountType === "company" ||
     accountTypeData?.accountType === "company";
   ```

2. **Unified Account Management Tab:**

   ```tsx
   {
     key: "account-management",
     label: "Account Management",
     children: <UnifiedAccountManager />
   }
   ```

3. **Dynamic Account Type Badge:**
   ```tsx
   {
     subscriptionData?.accountType && (
       <Badge
         count={
           subscriptionData.accountType === "company" ? "Company" : "Individual"
         }
         color={subscriptionData.accountType === "company" ? "blue" : "green"}
       />
     );
   }
   ```

### Other Components to Migrate

#### 1. **SubscriptionManagement Component**

```tsx
// Update to use account-type-aware plan filtering
const loadPlans = async () => {
  const accountType = await SubscriptionService.getAccountType();
  const plans = await SubscriptionService.getPlans({
    accountType: accountType.accountType,
  });
  setAvailablePlans(plans.plans);
};
```

#### 2. **CompanyDashboard Component**

```tsx
// Add account type validation
useEffect(() => {
  const validateCompanyAccess = async () => {
    const accountInfo = await SubscriptionService.getAccountType();
    if (accountInfo.accountType !== "company") {
      // Redirect or show error
    }
  };
  validateCompanyAccess();
}, []);
```

#### 3. **ProfileForm Component**

```tsx
// Update isCompany prop usage
interface ProfileFormProps {
  userDetails: any;
  isCompany: boolean; // This can stay the same
  onProfileUpdate: () => void;
}

// Parent component passes the new account type check
<ProfileForm
  userDetails={userDetails}
  isCompany={subscriptionData?.accountType === "company"}
  onProfileUpdate={handleProfileUpdate}
/>;
```

## Legacy Code Cleanup

### 1. Remove Deprecated Utilities

After migration, you can safely remove:

```tsx
// Remove from utils/userUtils.ts
export const isCompanyUser = (user: any) => {
  // Legacy function - no longer needed
};
```

### 2. Update Type Definitions

Enhance existing types:

```tsx
// OLD: Basic subscription response
interface SubscriptionCheckResponse {
  hasActiveSubscription: boolean;
  features: SubscriptionFeatures;
  isCompany: boolean; // Legacy field
}

// NEW: Enhanced with account type
interface SubscriptionCheckResponse {
  hasActiveSubscription: boolean;
  features: SubscriptionFeatures;
  isCompany: boolean; // Keep for backward compatibility
  accountType: AccountType; // New unified field
  company?: Company;
  canSwitchAccountType: boolean;
}
```

## Testing Migration

### 1. Unit Tests

```tsx
// Update tests to use new account type detection
describe("UserProfile with Unified Account System", () => {
  it("should display company tab for company accounts", async () => {
    // Mock the new API responses
    jest.spyOn(SubscriptionService, "checkSubscription").mockResolvedValue({
      accountType: "company",
      hasActiveSubscription: true,
      // ... other fields
    });

    render(<UserProfile />);

    await waitFor(() => {
      expect(screen.getByText("Company Dashboard")).toBeInTheDocument();
    });
  });
});
```

### 2. Integration Tests

```tsx
// Test account type switching
it("should handle account type changes", async () => {
  // Test switching from individual to company
  // Verify UI updates correctly
  // Ensure data reloads
});
```

## Rollback Strategy

If issues arise, you can temporarily restore the old system:

1. **Keep Legacy Utils**: Don't delete `userUtils.ts` immediately
2. **Feature Flag**: Use environment variable to toggle between systems
3. **Gradual Migration**: Migrate components one by one

```tsx
// Temporary backward compatibility
const useAccountType = () => {
  const useUnifiedSystem =
    process.env.REACT_APP_USE_UNIFIED_ACCOUNTS === "true";

  if (useUnifiedSystem) {
    return useUnifiedAccountType();
  } else {
    return useLegacyAccountType();
  }
};
```

## Performance Considerations

### 1. Caching

```tsx
// Cache account type to avoid repeated API calls
const [accountTypeCache, setAccountTypeCache] = useState(null);
const [cacheTimestamp, setCacheTimestamp] = useState(0);

const getCachedAccountType = async () => {
  const now = Date.now();
  if (accountTypeCache && now - cacheTimestamp < 300000) {
    // 5 minutes
    return accountTypeCache;
  }

  const fresh = await SubscriptionService.getAccountType();
  setAccountTypeCache(fresh);
  setCacheTimestamp(now);
  return fresh;
};
```

### 2. Optimistic Updates

```tsx
// Show immediate UI changes when switching account types
const handleAccountSwitch = async (targetType: AccountType) => {
  // Optimistic update
  setSubscriptionData((prev) => ({ ...prev, accountType: targetType }));

  try {
    await SubscriptionService.switchAccountType({
      targetAccountType: targetType,
    });
    // Confirm with fresh data
    await loadAccountData();
  } catch (error) {
    // Revert optimistic update
    await loadAccountData();
    throw error;
  }
};
```

## Migration Checklist

### ✅ Completed

- [x] `UserProfile.tsx` - Updated with unified account management
- [x] Enhanced TypeScript types with account type support
- [x] Added `UnifiedAccountManager` component integration
- [x] Account type switching functionality

### 🔄 In Progress

- [ ] `SubscriptionManagement.tsx` - Update plan filtering
- [ ] `CompanyDashboard.tsx` - Add account type validation
- [ ] Other profile-related components

### 📋 TODO

- [ ] Update all remaining components using `isCompanyUser`
- [ ] Remove legacy utility functions
- [ ] Update unit tests
- [ ] Performance optimization with caching
- [ ] Documentation updates

## Benefits of Migration

1. **Real-time Account Type Detection**: No more static user properties
2. **Account Type Switching**: Users can change between individual/company
3. **Enhanced Plan Management**: Plans filtered by account type
4. **Better UX**: Unified account management interface
5. **Scalability**: Easy to add new account types in the future
6. **Type Safety**: Comprehensive TypeScript support

The migration provides a more flexible, scalable, and user-friendly account management system while maintaining backward compatibility during the transition period.
