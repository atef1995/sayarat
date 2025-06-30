# Email Service Test Suite Documentation

This document describes the comprehensive email testing suite for the Cars Bids backend application.

## Overview

The email test suite consists of three main test files that cover different aspects of email functionality:

1. **Unit Tests** (`email-service.test.js`) - Tests core email service functionality with mocked dependencies
2. **Integration Tests** (`email-integration.test.js`) - Tests real API integration with Brevo (skipped without API key)
3. **Delivery Tests** (`email-delivery.test.js`) - Tests email delivery scenarios, webhooks, and failure handling

## Test Structure

### 1. Unit Tests (`email-service.test.js`)

**Purpose**: Test the BrevoEmailService class with mocked dependencies to ensure core functionality works correctly.

**Test Coverage**:

- Constructor initialization and validation
- Template loading and caching mechanisms
- Template parameter processing and substitution
- Email sending with proper API calls
- Error handling for various failure scenarios
- Specific email types (payment success, verification, company welcome, test emails)

**Key Features**:

- Mocks axios for API calls
- Mocks file system operations
- Tests Arabic content handling
- Validates email payload structure
- Tests conditional template blocks

### 2. Integration Tests (`email-integration.test.js`)

**Purpose**: Test real email delivery using the actual Brevo API (when API key is available).

**Test Coverage**:

- Real email sending to test addresses
- API response validation
- Template processing with real data
- Error handling with actual API responses
- Rate limiting behavior
- Template validation and loading

**Configuration**:

- Automatically skipped when `BREVO_API_KEY` is not set
- Uses real email templates
- Configurable test email address via `TEST_EMAIL` environment variable
- Extended timeout for network operations (30 seconds)

### 3. Delivery Tests (`email-delivery.test.js`)

**Purpose**: Test email delivery workflows, failure scenarios, and operational aspects.

**Test Coverage**:

- **Queue Management**: Bulk email sending, retry mechanisms
- **Webhook Processing**: Delivery, bounce, spam, and blocked event handling
- **Email Validation**: Address validation, disposable email filtering, blocked domains
- **Analytics**: Delivery metrics, campaign reporting, performance tracking
- **Error Recovery**: API unavailability, rate limiting with exponential backoff

## Running Tests

### All Email Tests

```bash
npm run test:email
```

### Individual Test Types

```bash
# Unit tests only
npm run test:email:unit

# Integration tests only (requires BREVO_API_KEY)
npm run test:email:integration

# Delivery tests only
npm run test:email:delivery

# Watch mode for development
npm run test:email:watch
```

### Test Configuration

#### Environment Variables

```bash
# Required for integration tests
BREVO_API_KEY=your_brevo_api_key

# Optional test configuration
TEST_EMAIL=your_test_email@domain.com
CLIENT_URL=https://test.carsbids.com
SUPPORT_URL=https://support.carsbids.com
DEBUG=1  # Enable debug output
```

#### Jest Configuration (`jest.config.js`)

- Node.js test environment
- 30-second timeout for integration tests
- Coverage thresholds (80% overall, 90% for email service)
- Setup files for environment and global utilities

## Test Scenarios

### Unit Test Scenarios

1. **Constructor Tests**

   - Validates API key requirement
   - Initializes service correctly
   - Sets up template cache

2. **Template Processing**

   - Simple parameter replacement (`{{name}}`)
   - Brevo-style parameters (`{{params.name}}`)
   - Conditional blocks (`{{#if condition}}...{{/if}}`)
   - Arabic text handling

3. **Email Sending**

   - Correct API payload structure
   - Headers and authentication
   - Template compilation
   - Error response handling

4. **Specific Email Types**
   - Payment success emails with Stripe data
   - Email verification with tokens
   - Company welcome emails
   - Test emails for configuration validation

### Integration Test Scenarios

1. **Real Email Delivery**

   - Test email sending
   - Verification emails with tokens
   - Payment success notifications
   - Company welcome messages

2. **Error Handling**

   - Invalid email addresses
   - API rate limiting
   - Network timeouts

3. **Template Validation**
   - All template files exist and are valid HTML
   - Parameter substitution works correctly
   - Template cache functionality

### Delivery Test Scenarios

1. **Queue Management**

   - Multiple recipient handling
   - Retry mechanism for failed sends
   - Bulk email processing

2. **Webhook Event Processing**

   - Delivery confirmations
   - Hard/soft bounce handling
   - Spam complaints
   - Blocked IP notifications

3. **Email Validation**

   - Email format validation
   - Disposable email detection
   - Blocked domain filtering
   - Bulk email list filtering

4. **Analytics and Metrics**

   - Delivery rate calculation
   - Bounce rate tracking
   - Campaign performance reporting
   - Email engagement metrics

5. **Error Recovery**
   - API service unavailability
   - Rate limiting with exponential backoff
   - Network connection issues
   - Graceful degradation

## Test Data and Mocking

### Mock Data Structure

```javascript
// Payment Intent Mock
{
  id: 'pi_test_123',
  amount: 15000, // $150.00 in cents
  currency: 'usd',
  metadata: {
    name: 'Ahmed Test',
    email: 'test@example.com',
    listingType: 'إعلان مميز'
  }
}

// Admin Data Mock
{
  email: 'admin@test.com',
  firstName: 'أحمد',
  lastName: 'محمد'
}

// Company Data Mock
{
  name: 'شركة الاختبار',
  city: 'دمشق',
  address: 'شارع الاختبار، مبنى رقم 123'
}
```

### Webhook Payload Examples

```javascript
// Delivery Confirmation
{
  event: 'delivered',
  email: 'test@example.com',
  id: 123456,
  'message-id': '<test@carsbids.com>',
  tag: 'payment-success'
}

// Bounce Notification
{
  event: 'hard_bounce',
  email: 'bounce@example.com',
  reason: 'User unknown'
}
```

## Coverage and Quality

### Test Coverage Goals

- **Overall**: 80% minimum coverage
- **Email Service**: 90% minimum coverage
- **Branches**: 80% minimum coverage
- **Functions**: 80% minimum coverage

### Code Quality

- All tests follow JavaScript instructions and best practices
- Proper error handling and edge case coverage
- Arabic content support and validation
- Comprehensive mocking for external dependencies

## Maintenance and Updates

### Adding New Email Types

1. Add method to `BrevoEmailService`
2. Create corresponding unit test in `email-service.test.js`
3. Add integration test scenario if needed
4. Update delivery tests for any new failure scenarios

### Template Updates

1. Update template files in `email-templates/` directory
2. Update integration tests to validate new templates
3. Add parameter validation tests if new parameters are added

### Webhook Handling

1. Add new webhook event types to delivery tests
2. Update webhook processing logic tests
3. Add analytics tracking for new events

## Future Enhancements

### Planned Improvements (TODOs)

- Email analytics integration testing
- Spam detection testing
- Email scheduling functionality tests
- Webhook delivery validation
- Performance testing for bulk operations
- A/B testing framework integration

### Performance Testing

- Load testing with Artillery or k6
- Bulk email sending performance
- Template rendering performance
- Database integration performance

This test suite provides comprehensive coverage of email functionality and ensures reliability of the email delivery system in the Cars Bids application.
