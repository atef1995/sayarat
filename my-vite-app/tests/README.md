# Subscription System Test Suite

## Overview

This comprehensive test suite covers the subscription system integration with authentication requirements. The tests are organized to avoid redundancy and ensure proper authentication flows.

## Test Structure

### 1. Authentication Test Utils (`tests/utils/authTestUtils.ts`)

- **Purpose**: Centralized authentication utilities for test setup
- **Features**:
  - Test user management (regular, premium, company)
  - Login/logout functionality
  - Session management
  - Mock subscription status
  - Protected route navigation

### 2. Basic Authentication Flow (`tests/basic-auth-flow.spec.ts`)

- **Purpose**: Core authentication and access control tests
- **Tests**:
  - ✅ Redirect to login when accessing create listing without auth
  - ✅ Show AI features with premium requirements
  - ✅ Display subscription modal when available
  - ✅ Handle subscription test page

### 3. Subscription Modal Tests (`tests/subscription-modal.spec.ts`)

- **Purpose**: Modal component functionality
- **Tests**: Modal display, interaction, and closing behavior

### 4. Subscription Pages Tests (`tests/subscription-pages.spec.ts`)

- **Purpose**: Success/cancel page functionality
- **Tests**: Page content, navigation, and responsiveness

## Test Configuration

### Subscription Config (`subscription.config.ts`)

- **Target Tests**:
  - `basic-auth-flow.spec.ts`
  - `subscription-modal.spec.ts`
  - `subscription-pages.spec.ts`
- **Features**:
  - Extended timeouts for subscription flows
  - Video/trace recording on failures
  - Multiple browser configurations
  - Sequential test execution

### Test Scripts (`package.json`)

```bash
npm run test:subscription          # Run all subscription tests
npm run test:subscription:headed   # Run with visible browser
npm run test:subscription:debug    # Run with debug mode
```

## Key Findings

### ✅ Working Authentication Flow

1. **Access Control**: `/create-listing` properly redirects to login when not authenticated
2. **UI Elements**: Login page displays correctly with Arabic text
3. **Navigation**: URL redirection works as expected

### 🔧 Areas for Improvement

1. **Test User Setup**: Need actual user accounts for full flow testing
2. **Premium Feature Testing**: Requires authenticated users with subscription status
3. **AI Integration**: Need to verify AI features are properly gated

## Running Tests

### Quick Test Run

```bash
npm run test:subscription
```

### Debug Failing Tests

```bash
npm run test:subscription:headed
npx playwright show-trace test-results/[trace-file]
```

### Individual Test Files

```bash
npx playwright test tests/basic-auth-flow.spec.ts
npx playwright test tests/subscription-modal.spec.ts
npx playwright test tests/subscription-pages.spec.ts
```

## Test User Accounts

The system defines test users but requires actual account creation:

```typescript
// Test user definitions
regular: { email: 'test.regular@example.com', type: 'regular' }
premium: { email: 'test.premium@example.com', type: 'premium' }
company: { email: 'test.company@example.com', type: 'company' }
```

## Next Steps

1. **Create Test Users**: Set up actual test accounts in the system
2. **Implement Premium Mocking**: Add subscription status mocking for testing
3. **Expand AI Testing**: Test AI feature gating with authenticated users
4. **Add E2E Flows**: Full subscription purchase and activation flows
5. **Performance Testing**: Test subscription system under load

## Troubleshooting

### Common Issues

- **localStorage errors**: Fixed with proper page navigation in auth utils
- **Strict mode violations**: Use specific selectors instead of broad text matching
- **Timeout issues**: Increased timeouts for subscription-related operations

### Debug Tips

- Use `--headed` flag to see browser behavior
- Check trace files for detailed step-by-step execution
- Verify dev server is running for tests that require it
- Clear browser state between tests for consistent results
