import { Conversation } from "./conversation.types";

export interface User {
  id: Blob;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: Date;
  createdAt: Date;
  lastLogin: Date;
  picture: string;
  email_verified: boolean;
  isAdmin: boolean;
  // Add company-related fields
  accountType?: "personal" | "company";
  companyId?: string;
  isCompany?: boolean;
  companyName?: string;
  companyLogo?: string;
  companyDescription?: string;
  companyAddress?: string;
  companyCity?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
  field?: string; // Field that caused validation error
  code?: string; // Error code for programmatic handling
  validationErrors?: ValidationError[];
  user?: User;
}

export interface SignupResponse extends ApiResponse {
  message?: string;
  field?: string;
}

export interface LoginResponse extends ApiResponse {
  token?: string;
}

export interface AuthCheckResponse extends ApiResponse {
  isAuthenticated: boolean;
}

export interface ConversationResponse extends ApiResponse {
  data: Conversation[];
}

export interface ErrorResponse {
  success: false;
  error: string;
  field?: string;
  validationErrors?: ValidationError[];
}

export interface ClientSecretResponse {
  clientSecret: string;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  taxId: string;
  website?: string;
  logo?: string;
  subscriptionType: "monthly" | "yearly";
  subscriptionStatus: "active" | "inactive" | "pending" | "cancelled";
  subscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyUser extends Omit<User, "dateOfBirth"> {
  accountType: "company";
  companyId: string;
  company?: Company;
  role: "owner" | "admin" | "member";
}
