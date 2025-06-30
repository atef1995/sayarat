# Enhanced Company Signup Validation System

## Overview

The company signup validation system has been updated to use structured backend responses instead of string matching for error handling. This provides better type safety, maintainability, and user experience.

## Key Changes

### 1. Structured Backend Response Handling

#### Before (String Matching)

```typescript
// ❌ Old approach - brittle string matching
if (errorMessage.includes("اسم المستخدم")) {
  form.setFields([{ name: "username", errors: [errorMessage] }]);
  setCurrentStep(1);
} else if (errorMessage.includes("البريد الإلكتروني")) {
  form.setFields([{ name: "email", errors: [errorMessage] }]);
  setCurrentStep(1);
}
```

#### After (Structured Response)

```typescript
// ✅ New approach - using structured backend response
if (field && errorMessage) {
  form.setFields([
    {
      name: field as keyof CompanyFormValues,
      errors: [errorMessage],
    },
  ]);

  const targetStep = ValidationErrorHandler.getStepForField(field);
  setCurrentStep(targetStep);
}
```

### 2. Backend Response Format

The backend now returns structured validation responses:

```json
{
  "success": false,
  "error": "اسم الشركة مستخدم بالفعل",
  "field": "companyName",
  "code": "COMPANY_EXISTS"
}
```

#### Response Fields:

- **success**: Boolean indicating validation result
- **error**: User-friendly error message in Arabic
- **field**: Specific field that failed validation (optional)
- **code**: Error code for programmatic handling (optional)

### 3. Error Code Enumeration

```typescript
export enum ValidationErrorCode {
  COMPANY_EXISTS = "COMPANY_EXISTS",
  USER_EXISTS = "USER_EXISTS",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  SCHEMA_ERROR = "SCHEMA_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}
```

### 4. Field-to-Step Mapping

```typescript
const FIELD_TO_STEP_MAP: Record<string, number> = {
  // Company Information (Step 0)
  companyName: 0,
  companyDescription: 0,
  companyAddress: 0,
  companyCity: 0,
  taxId: 0,
  website: 0,

  // Admin Information (Step 1)
  email: 1,
  username: 1,
  firstName: 1,
  lastName: 1,
  phone: 1,
  password: 1,
  confirmPassword: 1,
};
```

## Validation Error Handler Utilities

### `ValidationErrorHandler.getStepForField(field: string): number`

Returns the appropriate form step for a given field.

### `ValidationErrorHandler.isFieldError(code?: string): boolean`

Checks if an error code represents a field-specific error.

### `ValidationErrorHandler.getErrorMessage(code?: string, defaultMessage?: string): string`

Returns user-friendly error messages based on error codes.

## Backend Integration

### Validation Endpoint: `/api/auth/validate-company-signup`

#### Request Format:

```json
{
  "companyName": "Test Company",
  "email": "test@example.com",
  "username": "testuser",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "01234567890",
  "companyDescription": "Company description",
  "companyAddress": "Company address",
  "companyCity": "Company city",
  "taxId": "123456789",
  "password": "password123",
  "confirmPassword": "password123",
  "accountType": "company"
}
```

#### Success Response:

```json
{
  "success": true,
  "message": "Company data validation successful",
  "metadata": {
    "validatedAt": "2025-06-25T10:30:00.000Z",
    "duration": 150
  }
}
```

#### Error Response Examples:

**Company Name Exists:**

```json
{
  "success": false,
  "error": "اسم الشركة مستخدم بالفعل",
  "field": "companyName",
  "code": "COMPANY_EXISTS"
}
```

**Email Exists:**

```json
{
  "success": false,
  "error": "البريد الإلكتروني مستخدم بالفعل",
  "field": "email",
  "code": "USER_EXISTS"
}
```

**Username Exists:**

```json
{
  "success": false,
  "error": "اسم المستخدم مستخدم بالفعل",
  "field": "username",
  "code": "USER_EXISTS"
}
```

## Frontend Implementation

### Hook Usage:

```typescript
const { validateWithBackend, validationLoading } = useCompanySignup({
  form,
  onFormChange: handleFormChange,
  autoSave: true,
});

// In form submission
const isValid = await validateWithBackend(formValues, form, setCurrentStep);
if (isValid) {
  // Proceed to next step
}
```

### Error Handling Flow:

1. **API Call** → Structured backend validation
2. **Response Processing** → Extract field, error message, and code
3. **Field Error Setting** → Set specific field errors in form
4. **Step Navigation** → Navigate to appropriate form step
5. **User Feedback** → Display user-friendly error messages

## Benefits

### 1. **Type Safety**

- Strong typing with TypeScript interfaces
- Enum-based error codes prevent typos
- Field validation with proper type checking

### 2. **Maintainability**

- Centralized error handling logic
- Easy to add new validation rules
- Consistent error message formatting

### 3. **User Experience**

- Precise field highlighting
- Automatic navigation to error fields
- Contextual error messages

### 4. **Internationalization Ready**

- Error codes support multiple languages
- Centralized message management
- Consistent error terminology

### 5. **Testing**

- Structured responses are easier to mock
- Predictable error handling paths
- Better unit test coverage

## Migration Guide

### For Frontend Developers:

1. **Remove string matching logic** from error handlers
2. **Use field-based error setting** from backend responses
3. **Implement ValidationErrorHandler utilities** for consistency
4. **Update test cases** to use structured responses

### For Backend Developers:

1. **Return structured validation responses** with field/code information
2. **Use consistent error codes** across all validation endpoints
3. **Include field information** for all validation errors
4. **Maintain backward compatibility** during transition period

## Future Enhancements

### 1. **Real-time Validation**

- Field-level validation on blur/change events
- Debounced API calls for better performance
- Progressive validation with user typing

### 2. **Enhanced Error Messages**

- Context-aware suggestions
- Field-specific help text
- Recovery action recommendations

### 3. **Analytics Integration**

- Track validation error patterns
- Monitor form completion rates
- A/B test error message effectiveness

### 4. **Accessibility Improvements**

- Screen reader announcements for errors
- Focus management for error fields
- High contrast error indicators

## Dependencies

- **Frontend**: React, TypeScript, Ant Design
- **Backend**: Node.js, Express, Company Registration Service
- **Database**: PostgreSQL with validation constraints
- **Testing**: Vitest, React Testing Library

## Performance Considerations

- **Retry Logic**: Exponential backoff for network resilience
- **Form Persistence**: localStorage for data recovery
- **Debounced Validation**: Prevents excessive API calls
- **Error Boundary**: Graceful error handling and recovery

## Security Notes

- **Input Sanitization**: All inputs validated on backend
- **Rate Limiting**: Validation endpoints protected against abuse
- **CSRF Protection**: Include CSRF tokens in validation requests
- **Error Information**: Avoid exposing sensitive system details
