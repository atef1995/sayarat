# Company Registration Service - Step-Based Validation Guide

## Overview

The Company Registration Service now supports **step-based validation** for multi-step forms, allowing you to validate only the fields required for each specific step without requiring all fields at once.

## Problem Solved

Previously, the validation method required all fields (companyName, email, username) to be present, which caused issues in multi-step forms where different steps collect different information.

## New Validation Methods

### 1. Step-Specific Validation

#### `validateCompanyStepData(data)`

Validates company information (Step 1):

```javascript
const result = await service.validateCompanyStepData({
  companyName: "My Company",
  // email and username are NOT required
});
```

#### `validateAdminStepData(data)`

Validates admin user information (Step 2):

```javascript
const result = await service.validateAdminStepData({
  email: "admin@company.com",
  username: "admin",
  // companyName is NOT required
});
```

### 2. Individual Field Validation

#### `validateFieldData(fieldName, fieldValue, checkExistence)`

Validates a single field with optional database existence check:

```javascript
// Validate email format only
const emailValidation = await service.validateFieldData(
  "email",
  "test@example.com",
  false
);

// Validate email format AND check if it exists in database
const emailExistenceValidation = await service.validateFieldData(
  "email",
  "test@example.com",
  true
);
```

### 3. Flexible Validation

#### `validateCompanySignupData(data, options)`

Enhanced main validation method with flexible options:

```javascript
// Validate specific fields for a specific step
const result = await service.validateCompanySignupData(
  {
    email: "admin@company.com",
    username: "admin",
  },
  {
    step: 2,
    requiredFields: ["email", "username"],
  }
);

// Validate only email field
const emailOnly = await service.validateCompanySignupData(
  {
    email: "admin@company.com",
  },
  {
    requiredFields: ["email"],
  }
);
```

## Implementation Examples

### Multi-Step Form Implementation

```javascript
// Step 1: Company Information
const handleStep1Validation = async (formData) => {
  const result = await registrationService.validateCompanyStepData({
    companyName: formData.companyName,
  });

  if (!result.success) {
    setErrors({ companyName: result.error });
    return false;
  }

  return true;
};

// Step 2: Admin User Information
const handleStep2Validation = async (formData) => {
  const result = await registrationService.validateAdminStepData({
    email: formData.email,
    username: formData.username,
  });

  if (!result.success) {
    setErrors({ [result.field]: result.error });
    return false;
  }

  return true;
};
```

### Real-Time Field Validation

```javascript
// Validate individual fields on blur
const handleFieldBlur = async (fieldName, fieldValue) => {
  const result = await registrationService.validateFieldData(
    fieldName,
    fieldValue,
    true // Check database existence
  );

  if (!result.success) {
    setFieldError(fieldName, result.error);
  } else {
    clearFieldError(fieldName);
  }
};
```

### Frontend Integration (React/TypeScript)

```tsx
// Custom hook for step-based validation
const useStepValidation = (currentStep: number) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = async (data: any) => {
    let result;

    switch (currentStep) {
      case 1:
        result = await registrationService.validateCompanyStepData(data);
        break;
      case 2:
        result = await registrationService.validateAdminStepData(data);
        break;
      default:
        result = await registrationService.validateCompanySignupData(data);
    }

    if (!result.success) {
      setErrors({ [result.field || "general"]: result.error });
      return false;
    }

    setErrors({});
    return true;
  };

  return { validateStep, errors };
};
```

## Response Format

All validation methods return a consistent response format:

### Success Response

```javascript
{
  success: true,
  sanitizedValue: "cleaned_value", // For individual field validation
  metadata: {
    validatedAt: "2025-06-24T21:15:00.000Z",
    duration: 150
  }
}
```

### Error Response

```javascript
{
  success: false,
  error: "البريد الإلكتروني مستخدم بالفعل", // Localized error message
  field: "email", // Field that caused the error
  code: "USER_EXISTS" // Error code for programmatic handling
}
```

## Error Codes

- `VALIDATION_ERROR`: Field format validation failed
- `COMPANY_EXISTS`: Company name already exists
- `USER_EXISTS`: Email or username already exists
- `MISSING_REQUIRED_FIELD`: Required field is missing
- `SCHEMA_ERROR`: Database schema issue
- `INTERNAL_ERROR`: Unexpected server error

## Benefits

1. **Improved UX**: Users only see relevant validation errors for their current step
2. **Performance**: Only validates necessary fields, reducing database queries
3. **Flexibility**: Supports various form layouts and validation strategies
4. **Maintainability**: Clear separation of validation logic by step
5. **Extensibility**: Easy to add new validation steps or modify existing ones

## Migration Guide

### Before (Old Method)

```javascript
// Required ALL fields even for partial validation
const result = await service.validateCompanySignupData({
  companyName: "Test",
  email: "", // Required but empty
  username: "", // Required but empty
});
// This would fail because email and username are missing
```

### After (New Method)

```javascript
// Validate only company name for step 1
const result = await service.validateCompanyStepData({
  companyName: "Test",
  // email and username not required
});
// This succeeds if company name is valid
```

## Best Practices

1. **Use step-specific methods** for multi-step forms
2. **Use individual field validation** for real-time feedback
3. **Use the main method with options** for complex scenarios
4. **Always handle error codes** programmatically
5. **Provide user-friendly error messages** in the UI
6. **Cache validation results** to avoid redundant checks

## TODO: Future Enhancements

- [ ] Add validation caching for improved performance
- [ ] Implement async validation for external service checks
- [ ] Add validation rule composer for complex scenarios
- [ ] Support for conditional validation based on other fields
- [ ] Add validation analytics and monitoring
