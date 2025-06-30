/**
 * Test file for useCompanySignup hook validation logic
 * Tests the structured backend response handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { Form } from "antd";
import { useCompanySignup } from "../hooks/useCompanySignup";

// Mock fetch globally
global.fetch = vi.fn();

// Mock antd message
vi.mock("antd", async () => {
  const actual = await vi.importActual("antd");
  return {
    ...actual,
    message: {
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

describe("useCompanySignup - Validation Error Handling", () => {
  let mockForm: any;
  let mockSetCurrentStep: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock form instance
    mockForm = {
      setFields: vi.fn(),
    };

    mockSetCurrentStep = vi.fn();

    // Mock environment variable
    vi.stubEnv("VITE_API_ENDPOINT", "http://localhost:3000");
  });

  it("should handle structured field validation errors correctly", async () => {
    // Mock backend response for field-specific error
    const mockResponse = {
      success: false,
      error: "اسم الشركة مستخدم بالفعل",
      field: "companyName",
      code: "COMPANY_EXISTS",
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useCompanySignup({ form: mockForm }));

    const testFormValues = {
      companyName: "Test Company",
      email: "test@example.com",
      username: "testuser",
      companyDescription: "Test description",
      companyAddress: "Test address",
      companyCity: "Test city",
      taxId: "123456789",
      password: "password123",
      confirmPassword: "password123",
      firstName: "John",
      lastName: "Doe",
      phone: "01234567890",
    };

    await act(async () => {
      const success = await result.current.validateWithBackend(
        testFormValues,
        mockForm,
        mockSetCurrentStep
      );
      expect(success).toBe(false);
    });

    // Verify field error was set correctly
    expect(mockForm.setFields).toHaveBeenCalledWith([
      {
        name: "companyName",
        errors: ["اسم الشركة مستخدم بالفعل"],
      },
    ]);

    // Verify navigation to correct step
    expect(mockSetCurrentStep).toHaveBeenCalledWith(0);
  });

  it("should handle email field validation errors correctly", async () => {
    const mockResponse = {
      success: false,
      error: "البريد الإلكتروني مستخدم بالفعل",
      field: "email",
      code: "USER_EXISTS",
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useCompanySignup({ form: mockForm }));

    const testFormValues = {
      companyName: "Test Company",
      email: "existing@example.com",
      username: "testuser",
      companyDescription: "Test description",
      companyAddress: "Test address",
      companyCity: "Test city",
      taxId: "123456789",
      password: "password123",
      confirmPassword: "password123",
      firstName: "John",
      lastName: "Doe",
      phone: "01234567890",
    };

    await act(async () => {
      const success = await result.current.validateWithBackend(
        testFormValues,
        mockForm,
        mockSetCurrentStep
      );
      expect(success).toBe(false);
    });

    // Verify field error was set correctly
    expect(mockForm.setFields).toHaveBeenCalledWith([
      {
        name: "email",
        errors: ["البريد الإلكتروني مستخدم بالفعل"],
      },
    ]);

    // Verify navigation to admin info step
    expect(mockSetCurrentStep).toHaveBeenCalledWith(1);
  });

  it("should handle successful validation correctly", async () => {
    const mockResponse = {
      success: true,
      metadata: {
        validatedAt: new Date().toISOString(),
        duration: 150,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useCompanySignup({ form: mockForm }));

    const testFormValues = {
      companyName: "Valid Company",
      email: "valid@example.com",
      username: "validuser",
      companyDescription: "Valid description",
      companyAddress: "Valid address",
      companyCity: "Valid city",
      taxId: "123456789",
      password: "password123",
      confirmPassword: "password123",
      firstName: "John",
      lastName: "Doe",
      phone: "01234567890",
    };

    await act(async () => {
      const success = await result.current.validateWithBackend(
        testFormValues,
        mockForm,
        mockSetCurrentStep
      );
      expect(success).toBe(true);
    });

    // Form fields should not be set for successful validation
    expect(mockForm.setFields).not.toHaveBeenCalled();
    expect(mockSetCurrentStep).not.toHaveBeenCalled();
  });

  it("should handle network errors gracefully", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useCompanySignup({ form: mockForm }));

    const testFormValues = {
      companyName: "Test Company",
      email: "test@example.com",
      username: "testuser",
      companyDescription: "Test description",
      companyAddress: "Test address",
      companyCity: "Test city",
      taxId: "123456789",
      password: "password123",
      confirmPassword: "password123",
      firstName: "John",
      lastName: "Doe",
      phone: "01234567890",
    };

    await act(async () => {
      const success = await result.current.validateWithBackend(
        testFormValues,
        mockForm,
        mockSetCurrentStep
      );
      expect(success).toBe(false);
    });

    // Should not set field-specific errors for network issues
    expect(mockForm.setFields).not.toHaveBeenCalled();
  });
});
