# Email Routes Tests

## Overview

This test suite provides comprehensive testing for the email routes in the `routes/email.js` file using Jest and Supertest.

## Test Coverage

### Routes Tested

- `POST /api/reset-password-request` - Password reset request
- `POST /api/reset-password` - Password reset execution
- `POST /api/verify-email` - Email verification

### Test Categories

#### 1. **Password Reset Request Tests**

- ✅ Successful password reset email sending
- ✅ Missing email validation
- ✅ Non-existent email handling
- ✅ User not found scenarios
- ✅ Email service failure handling
- ✅ Database error handling

#### 2. **Password Reset Tests**

- ✅ Successful password reset
- ✅ Missing token/password validation
- ✅ Invalid token length validation
- ✅ Password validation failure
- ✅ Invalid/expired token handling
- ✅ Token expiration scenarios

#### 3. **Email Verification Tests**

- ✅ Successful email verification with notification
- ✅ Missing token validation
- ✅ Failed email verification handling
- ✅ Notification email failure resilience
- ✅ Exception handling in notification sending

#### 4. **Security Tests**

- ✅ Sensitive information exposure prevention
- ✅ Token format validation
- ✅ Timing attack resistance

#### 5. **Error Handling Tests**

- ✅ Malformed JSON handling
- ✅ Missing Content-Type header
- ✅ Long input handling
- ✅ Special character handling

## Running the Tests

### Individual Test File

```bash
npx jest test/routes/email.test.js --verbose --config jest.config.js
```

### All Route Tests

```bash
npx jest test/routes/ --verbose --config jest.config.js
```

### With Coverage

```bash
npx jest test/routes/email.test.js --coverage --config jest.config.js
```

## Test Structure

### Mock Setup

- **Database (Knex)**: Mocked with chainable query methods
- **Email Service**: Mocked Brevo email service responses
- **Dependencies**: All external dependencies mocked
- **Crypto**: Mocked for consistent password hashing

### Test Data

- Valid email addresses using `@sayarat.autos` domain
- Arabic text for user names and error messages
- Realistic payment and user scenarios
- Edge cases and error conditions

## Expected Test Results

When running successfully, you should see:

```
 PASS  test/routes/email.test.js
  Email Routes
    POST /api/reset-password-request
      ✓ should successfully send password reset email
      ✓ should return 400 when email is missing
      ✓ should return 400 when email does not exist
      ✓ should return 400 when user is not found
      ✓ should return 500 when email service fails
      ✓ should handle database errors gracefully
    POST /api/reset-password
      ✓ should successfully reset password
      ✓ should return 400 when token is missing
      ✓ should return 400 when password is missing
      ✓ should return 400 when token length is invalid
      ✓ should return 400 when password validation fails
      ✓ should return 400 when token is invalid or expired
      ✓ should return 400 when token has expired
    POST /api/verify-email
      ✓ should successfully verify email and send notification
      ✓ should return 400 when token is missing
      ✓ should return 400 when email verification fails
      ✓ should succeed even when notification email fails
      ✓ should succeed even when notification email throws exception
      ✓ should handle empty token gracefully
      ✓ should handle null token gracefully
    Error Handling and Edge Cases
      ✓ should handle malformed JSON gracefully
      ✓ should handle missing Content-Type header
      ✓ should handle very long email addresses
      ✓ should handle special characters in token
    Security Tests
      ✓ should not expose sensitive information in password reset errors
      ✓ should not expose user existence through timing attacks
      ✓ should validate token format for reset password
    Request ID Generation and Logging
      ✓ should generate unique request IDs for each request
```

## Debugging Failed Tests

### Common Issues

1. **Hanging Tests**: Usually caused by unresolved promises or missing mocks
2. **Mock Not Working**: Ensure all dependencies are properly mocked
3. **Database Errors**: Check that Knex mock is properly chained
4. **Email Service Errors**: Verify Brevo service mock setup

### Debug Commands

```bash
# Run with debug output
DEBUG=* npx jest test/routes/email.test.js --verbose

# Run specific test
npx jest test/routes/email.test.js -t "should successfully send password reset email"

# Run without coverage to speed up
npx jest test/routes/email.test.js --no-coverage
```

## Mock Verification

The tests verify that:

- Database queries are called with correct parameters
- Email service methods receive proper arguments
- Error handling flows work as expected
- Request IDs are generated and used consistently
- Arabic error messages are returned appropriately

## Integration with CI/CD

These tests are designed to run in CI/CD environments and include:

- No external dependencies (all mocked)
- Deterministic results
- Fast execution
- Clear error reporting
- Coverage reporting

---

**Test Status**: ✅ Comprehensive coverage for all email route endpoints  
**Last Updated**: July 15, 2025  
**Test Count**: 25+ test cases  
**Coverage Target**: >90% for email routes
