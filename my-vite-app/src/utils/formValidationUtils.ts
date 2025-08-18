/**
 * Form Validation Utilities
 * Provides utility functions for form validation and processing
 * Following Single Responsibility Principle and DRY principles
 */

import { CreateListing } from "../types";
import type { RcFile } from "antd/es/upload";
import type { UploadFile, FormInstance } from "antd";
import { message } from "antd";

/**
 * Validates form fields and shows appropriate error messages
 */
export const validateFormFields = async (
  form: FormInstance,
  values?: CreateListing
): Promise<CreateListing | null> => {
  try {
    if (values) {
      console.log("Using provided form values:", values);
      console.log("Provided values keys:", Object.keys(values));
      return values;
    }

    const formValues = await form.validateFields();
    console.log("Retrieved form values from form:", formValues);
    console.log("Form values keys:", Object.keys(formValues || {}));

    // Debug: Check specifically for missing fields
    const missingFields = [];
    if (!formValues.title) missingFields.push("title");
    if (!formValues.make) missingFields.push("make");
    if (!formValues.model) missingFields.push("model");
    if (!formValues.year) missingFields.push("year");
    if (!formValues.price) missingFields.push("price");
    if (!formValues.mileage) missingFields.push("mileage");
    if (!formValues.description) missingFields.push("description");
    if (!formValues.location) missingFields.push("location");
    if (!formValues.car_type) missingFields.push("car_type");
    if (!formValues.transmission) missingFields.push("transmission");
    if (!formValues.fuel) missingFields.push("fuel");
    if (!formValues.engine_cylinders) missingFields.push("engine_cylinders");
    if (!formValues.hp) missingFields.push("hp");

    if (missingFields.length > 0) {
      console.warn("Missing fields from form:", missingFields);
    }

    return formValues;
  } catch (validationError) {
    console.error("Form validation error:", validationError);
    message.error("يرجى ملء جميع الحقول المطلوبة بشكل صحيح");
    return null;
  }
};

/**
 * Converts image list from Ant Design Upload to File array
 * Handles RcFile to File conversion safely
 */
export const convertImageListToFiles = (imageList: UploadFile[]): File[] => {
  return imageList
    .map((item) => item.originFileObj)
    .filter((file): file is RcFile => file != null)
    .map((rcFile) => rcFile as File); // Safe cast since RcFile extends File
};

/**
 * Creates a payment handler wrapper for the listing creation flow
 */
export const createPaymentWrapper = (
  hasSelectedProducts: boolean,
  handlePayment: () => Promise<string | null | void>
) => {
  return async (): Promise<boolean> => {
    try {
      if (!hasSelectedProducts) return true;
      const clientSecret = await handlePayment();
      return !!clientSecret; // Convert to boolean
    } catch (error) {
      console.error("Payment error:", error);
      return false;
    }
  };
};

/**
 * Extracts changed field values from Ant Design form change event
 */
export const extractFieldChanges = (
  changedFields: Array<{ name: string | string[]; value?: unknown }>
): Record<string, unknown> => {
  const changedValues: Record<string, unknown> = {};

  changedFields.forEach((field) => {
    if (field.name && field.value !== undefined) {
      const fieldName = Array.isArray(field.name) ? field.name[0] : field.name;
      changedValues[fieldName] = field.value;
    }
  });

  return changedValues;
};

/**
 * Validates if the form submission should proceed
 */
export const canProceedWithSubmission = (
  isAuthenticated: boolean,
  needsSubscription: boolean,
  isLoading: boolean
): boolean => {
  return isAuthenticated && !needsSubscription && !isLoading;
};

/**
 * Type guard to check if a value is a valid CreateListing object
 */
export const isValidCreateListing = (
  value: unknown
): value is CreateListing => {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    "price" in value &&
    "make" in value &&
    "model" in value
  );
};

/**
 * Error handling utility for form submission
 */
export class FormSubmissionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isRetryable: boolean = true
  ) {
    super(message);
    this.name = "FormSubmissionError";
  }
}

/**
 * Factory for creating form submission errors
 */
export const createFormError = {
  validation: (details?: string) =>
    new FormSubmissionError(
      `Form validation failed: ${details || "Invalid form data"}`,
      "VALIDATION_ERROR",
      false
    ),

  submission: (details?: string) =>
    new FormSubmissionError(
      `Form submission failed: ${details || "Unknown error"}`,
      "SUBMISSION_ERROR",
      true
    ),

  payment: (details?: string) =>
    new FormSubmissionError(
      `Payment processing failed: ${details || "Payment error"}`,
      "PAYMENT_ERROR",
      true
    ),
};

/**
 * Validates if all required fields for listing creation are present
 * Following the backend validation schema requirements
 */
export const validateRequiredFields = (
  formData: CreateListing
): { isValid: boolean; missingFields: string[] } => {
  // Based on backend/service/inputValidation.js - only these fields are required
  const requiredFields: Array<keyof CreateListing> = [
    "title",
    "make",
    "model",
    "year",
    "price",
    "mileage",
    "description",
    "location",
    "car_type",
    "transmission",
    "fuel",
    "currency", // Required: Joi.string().valid("usd", "syp").required()
    "engine_cylinders", // Required: Joi.string().max(3).required()
    // Note: hp is optional in backend (no .required())
    // Note: engine_liters is optional in backend (no .required())
  ];

  const missingFields: string[] = [];

  requiredFields.forEach((field) => {
    const value = formData[field];
    if (value === null || value === undefined || value === "") {
      missingFields.push(field);
    }
  });

  // Special validation for numeric fields
  if (
    formData.year !== undefined &&
    (isNaN(Number(formData.year)) || Number(formData.year) < 1886)
  ) {
    missingFields.push("year (invalid)");
  }

  if (
    formData.price !== undefined &&
    (isNaN(Number(formData.price)) || Number(formData.price) <= 0)
  ) {
    missingFields.push("price (invalid)");
  }

  if (
    formData.mileage !== undefined &&
    (isNaN(Number(formData.mileage)) || Number(formData.mileage) < 0)
  ) {
    missingFields.push("mileage (invalid)");
  }

  // Validate currency values
  if (formData.currency && !["usd", "syp"].includes(formData.currency)) {
    missingFields.push("currency (must be usd or syp)");
  }

  // Validate transmission values
  if (
    formData.transmission &&
    !["يدوي", "اوتوماتيك"].includes(formData.transmission)
  ) {
    missingFields.push("transmission (invalid value)");
  }

  // Validate fuel values
  if (
    formData.fuel &&
    !["بنزين", "ديزل", "كهرباء", "هايبرد"].includes(formData.fuel)
  ) {
    missingFields.push("fuel (invalid value)");
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

/**
 * Ensures all required fields are present and properly formatted for backend submission
 * This function fills in missing required fields with default values where possible
 */
export const ensureRequiredFields = (
  formData: Partial<CreateListing>,
  currency: string
): CreateListing => {
  // Create a base object with all required fields
  const completeFormData: CreateListing = {
    // Required fields from form
    title: formData.title || "",
    make: formData.make || "",
    model: formData.model || "",
    year: formData.year || new Date().getFullYear(),
    price: formData.price || 0,
    mileage: formData.mileage || 0,
    description: formData.description || "",
    location: formData.location || "",
    car_type: formData.car_type || "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transmission: (formData.transmission || "اوتوماتيك") as any, // #TODO: Fix type mismatch between frontend (Arabic) and types (English)
    fuel: formData.fuel || "",

    // Required field from state
    currency: currency || "usd",

    // Required field that might be missing from form (backend expects string, CarInfo has number)
    engine_cylinders: Number(formData.engine_cylinders) || 4,

    // Required fields with proper defaults
    color: formData.color || "",
    hp: formData.hp || 0,
    engine_liters: formData.engine_liters || 0,
    specs: formData.specs || [],
    highlight: formData.highlight || false,
    image_urls: formData.image_urls || [],

    // Required system fields with defaults
    id: formData.id || "",
    listing_status: formData.listing_status || "active",
    created_at: formData.created_at || new Date().toISOString(),
    seller_id: formData.seller_id || "",
    status: formData.status || "active",
    favorites_count: formData.favorites_count || 0,
    is_favorited: formData.is_favorited || false,
    views: formData.views || 0,

    // Optional fields - only include if present
    ...(formData.products && { products: formData.products }),
    ...(formData._placement && { _placement: formData._placement }),
  };

  console.log("Ensured required fields for submission:", {
    original: Object.keys(formData),
    complete: Object.keys(completeFormData),
    currency: completeFormData.currency,
    engine_cylinders: completeFormData.engine_cylinders,
  });

  return completeFormData;
};

/**
 * Debug utility to log all field states for troubleshooting
 */
export const debugFormFields = (
  formData: Partial<CreateListing>,
  currency: string,
  label: string = "Form Debug"
): void => {
  console.group(`🔍 ${label}`);
  console.log("📝 Form Data Keys:", Object.keys(formData));
  console.log("💰 Currency State:", currency);
  console.log("📋 Required Fields Check:");

  const requiredFields = [
    "title",
    "make",
    "model",
    "year",
    "price",
    "mileage",
    "description",
    "location",
    "car_type",
    "transmission",
    "fuel",
    "engine_cylinders",
  ];

  requiredFields.forEach((field) => {
    const value = formData[field as keyof CreateListing];
    const status = value ? "✅" : "❌";
    console.log(`  ${status} ${field}:`, value);
  });

  console.log("💰 Currency (from state):", currency);
  console.groupEnd();
};

/**
 * Enhanced debugging utility to trace field values through the submission pipeline
 */
export const traceFieldValues = (
  data: Partial<CreateListing>,
  stage: string,
  additionalInfo?: Record<string, unknown>
): void => {
  console.group(`🔍 Field Trace - ${stage}`);

  // Required fields that must be present
  const requiredFields = [
    "title",
    "make",
    "model",
    "year",
    "price",
    "mileage",
    "description",
    "location",
    "car_type",
    "transmission",
    "fuel",
    "currency",
    "engine_cylinders",
  ];

  console.log("📊 All fields present:", Object.keys(data));
  console.log("📋 Required fields status:");

  const missingRequired: string[] = [];
  const presentRequired: string[] = [];

  requiredFields.forEach((field) => {
    const value = data[field as keyof CreateListing];
    if (value === undefined || value === null || value === "") {
      missingRequired.push(field);
      console.log(`  ❌ ${field}: ${value} (${typeof value})`);
    } else {
      presentRequired.push(field);
      console.log(`  ✅ ${field}: ${value} (${typeof value})`);
    }
  });

  console.log(`✅ Present (${presentRequired.length}):`, presentRequired);
  console.log(`❌ Missing (${missingRequired.length}):`, missingRequired);

  if (additionalInfo) {
    console.log("ℹ️ Additional Info:", additionalInfo);
  }

  console.groupEnd();
};

/**
 * Validates and ensures all backend-required fields are present with correct types
 * Uses strict validation according to the backend Joi schema
 */
export const validateAndEnsureBackendFields = (
  formData: Partial<CreateListing>,
  currency: string
): { isValid: boolean; data: Partial<CreateListing>; errors: string[] } => {
  console.log("🔧 Starting backend field validation and completion...");

  const errors: string[] = [];

  // Create base complete data with proper type handling
  const completeData: Partial<CreateListing> = {
    // Core required fields
    title: formData.title?.toString() || "",
    make: formData.make?.toString() || "",
    model: formData.model?.toString() || "",
    year: Number(formData.year) || new Date().getFullYear(),
    price: Number(formData.price) || 0,
    mileage: Number(formData.mileage) || 0,
    description: formData.description?.toString() || "",
    location: formData.location?.toString() || "",
    car_type: formData.car_type?.toString() || "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transmission: (formData.transmission || "اوتوماتيك") as any, // #TODO: Fix type mismatch between frontend (Arabic) and types (English)
    fuel: formData.fuel?.toString() || "",

    // Currency from state (critical field)
    currency: currency || "usd",

    // Engine cylinders with proper type (backend expects string but CarInfo has number)
    engine_cylinders: Number(formData.engine_cylinders) || 4,

    // Required fields with defaults
    color: formData.color?.toString() || "",
    hp: Number(formData.hp) || 0,
    engine_liters: Number(formData.engine_liters) || 0,
    specs: formData.specs || [],
    highlight: formData.highlight || false,
    image_urls: formData.image_urls || [],

    // Optional system fields - only include if present
    ...(formData.products && { products: formData.products }),
    ...(formData.id && { id: formData.id }),
    ...(formData.listing_status && { listing_status: formData.listing_status }),
    ...(formData.created_at && { created_at: formData.created_at }),
    ...(formData.seller_id && { seller_id: formData.seller_id }),
    ...(formData.status && { status: formData.status }),
    ...(formData.favorites_count !== undefined && {
      favorites_count: formData.favorites_count,
    }),
    ...(formData.is_favorited !== undefined && {
      is_favorited: formData.is_favorited,
    }),
    ...(formData.views !== undefined && { views: formData.views }),
    ...(formData._placement && { _placement: formData._placement }),
  };

  // Validate required fields
  if (!completeData.title?.trim()) errors.push("title is required");
  if (!completeData.make?.trim()) errors.push("make is required");
  if (!completeData.model?.trim()) errors.push("model is required");
  if (!completeData.year || completeData.year < 1886)
    errors.push("valid year is required");
  if (!completeData.price || completeData.price <= 0)
    errors.push("valid price is required");
  if (completeData.mileage === undefined || completeData.mileage < 0)
    errors.push("valid mileage is required");
  if (!completeData.description?.trim()) errors.push("description is required");
  if (!completeData.location?.trim()) errors.push("location is required");
  if (!completeData.car_type?.trim()) errors.push("car_type is required");
  if (!completeData.transmission) errors.push("transmission is required");
  if (!completeData.fuel?.trim()) errors.push("fuel is required");
  if (!completeData.currency?.trim()) errors.push("currency is required");
  if (!completeData.engine_cylinders)
    errors.push("engine_cylinders is required");

  // Validate enum values
  if (
    completeData.currency &&
    !["usd", "syp"].includes(completeData.currency)
  ) {
    errors.push("currency must be 'usd' or 'syp'");
  }

  if (
    completeData.transmission &&
    !["يدوي", "اوتوماتيك"].includes(completeData.transmission as string)
  ) {
    errors.push("transmission must be 'يدوي' or 'اوتوماتيك'");
  }

  if (
    completeData.fuel &&
    !["بنزين", "ديزل", "كهرباء", "هايبرد"].includes(completeData.fuel)
  ) {
    errors.push("fuel must be one of: 'بنزين', 'ديزل', 'كهرباء', 'هايبرد'");
  }

  traceFieldValues(completeData, "Backend Validation Complete", {
    errorsCount: errors.length,
    errors: errors,
    currency: completeData.currency,
    engine_cylinders: completeData.engine_cylinders,
  });

  return {
    isValid: errors.length === 0,
    data: completeData,
    errors,
  };
};
