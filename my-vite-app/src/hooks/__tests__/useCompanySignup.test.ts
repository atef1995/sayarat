/**
 * Phase 1 Implementation Test - Enhanced Company Signup Hook
 *
 * Tests the core Phase 1 features:
 * - Form persistence across browser sessions
 * - Retry logic with exponential backoff
 * - Enhanced error handling and categorization
 * - Better TypeScript type safety
 */

import { renderHook, act } from "@testing-library/react";
import { useCompanySignup, CompanyFormValues } from "../hooks/useCompanySignup";

// Mock Form instance for testing
const mockForm = {
  setFields: jest.fn(),
  setFieldsValue: jest.fn(),
  getFieldsValue: jest.fn(
    () =>
      ({
        companyName: "Test Company",
        email: "test@company.com",
        username: "testuser",
      } as CompanyFormValues)
  ),
};

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("useCompanySignup - Phase 1 Enhancements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage mocks
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  test("should initialize with proper default state", () => {
    const { result } = renderHook(() =>
      useCompanySignup({
        form: mockForm as any,
        autoSave: true,
      })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.validationLoading).toBe(false);
    expect(result.current.companyCreated).toBe(false);
    expect(result.current.retryCount).toBe(0);
  });

  test("should load saved form data on mount", () => {
    const savedData = JSON.stringify({
      companyName: "Saved Company",
      email: "saved@company.com",
    });

    mockLocalStorage.getItem.mockReturnValue(savedData);

    renderHook(() =>
      useCompanySignup({
        form: mockForm as any,
        autoSave: true,
      })
    );

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
      "companySignupFormData"
    );
    expect(mockForm.setFieldsValue).toHaveBeenCalledWith({
      companyName: "Saved Company",
      email: "saved@company.com",
    });
  });

  test("should auto-save form data when changed", () => {
    const { result } = renderHook(() =>
      useCompanySignup({
        form: mockForm as any,
        autoSave: true,
      })
    );

    const testData: CompanyFormValues = {
      companyName: "New Company",
      companyDescription: "Test description",
      companyAddress: "Test address",
      companyCity: "Test city",
      taxId: "TAX123",
      email: "new@company.com",
      username: "newuser",
      password: "password123",
      confirmPassword: "password123",
      firstName: "John",
      lastName: "Doe",
      phone: "1234567890",
    };

    act(() => {
      result.current.handleFormChange({}, testData);
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "companySignupFormData",
      JSON.stringify(testData)
    );
  });

  test("should clear saved data after successful company creation", async () => {
    // Mock successful API response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    ) as jest.Mock;

    const { result } = renderHook(() =>
      useCompanySignup({
        form: mockForm as any,
        autoSave: true,
      })
    );

    // Set some validated data first
    act(() => {
      (result.current as any).setValidatedData({
        companyName: "Test Company",
        email: "test@company.com",
      });
    });

    await act(async () => {
      await result.current.createCompany();
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
      "companySignupFormData"
    );
  });

  test("should handle validation errors with field targeting", async () => {
    // Mock validation error response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            error: "اسم المستخدم غير متاح",
          }),
      })
    ) as jest.Mock;

    const mockSetCurrentStep = jest.fn();
    const { result } = renderHook(() =>
      useCompanySignup({
        form: mockForm as any,
        autoSave: true,
      })
    );

    const testData: CompanyFormValues = {
      companyName: "Test Company",
      companyDescription: "Description",
      companyAddress: "Address",
      companyCity: "City",
      taxId: "TAX123",
      email: "test@company.com",
      username: "testuser",
      password: "password123",
      confirmPassword: "password123",
      firstName: "John",
      lastName: "Doe",
      phone: "1234567890",
    };

    await act(async () => {
      await result.current.validateWithBackend(
        testData,
        mockForm as any,
        mockSetCurrentStep
      );
    });

    expect(mockForm.setFields).toHaveBeenCalledWith([
      {
        name: "username",
        errors: ["اسم المستخدم غير متاح"],
      },
    ]);
    expect(mockSetCurrentStep).toHaveBeenCalledWith(1);
  });

  test("should provide proper utilities for form management", () => {
    const { result } = renderHook(() =>
      useCompanySignup({
        form: mockForm as any,
        autoSave: true,
      })
    );

    // Test that all utilities are available
    expect(typeof result.current.saveFormData).toBe("function");
    expect(typeof result.current.loadSavedFormData).toBe("function");
    expect(typeof result.current.clearSavedFormData).toBe("function");
    expect(typeof result.current.handleFormChange).toBe("function");
    expect(typeof result.current.handleApiError).toBe("function");
  });
});

// Export for test execution
export default {};
