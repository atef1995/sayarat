// Account Types
export type AccountType = "individual" | "company";

/**
 * Valid subscription types according to database constraint
 */
export enum SubscriptionType {
  MONTHLY = "monthly",
  YEARLY = "yearly",
  PENDING = "pending",
}

/**
 * Subscription status values
 */
export enum SubscriptionStatus {
  ACTIVE = "active",
  PENDING = "pending",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

// Company Information
export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  taxId?: string;
  logoUrl?: string;
  description?: string;
  employeeCount?: number;
  isVerified: boolean;
  subscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionPlanId?: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  stripePriceId: string;
  isActive: boolean;
  order: number;
  targetAudience: AccountType[]; // New: Which account types can use this plan
  companyFeatures?: string[]; // New: Additional features for company accounts
}

export interface UserSubscription {
  id: string;
  userId?: string;
  planId: string;
  planName: string;
  planDisplayName: string;
  stripeSubscriptionId: string;
  price: number;
  currency: string;
  status:
    | "active"
    | "canceled"
    | "past_due"
    | "unpaid"
    | "incomplete"
    | "trialing";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  cancelAtPeriodEnd?: boolean;
  cancellationReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
  features?: string[];
  // Legacy support for nested plan structure
  plan?: SubscriptionPlan;
  // New: Account type support
  accountType: AccountType;
  companyId?: string;
  company?: Company;
}

export interface SubscriptionFeatures {
  aiCarAnalysis: boolean;
  listingHighlights: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  unlimitedListings: boolean;
  customBranding?: boolean;
  teamMembers?: number;
}

export interface SubscriptionCheckResponse {
  hasActiveSubscription: boolean;
  subscription?: UserSubscription;
  features: SubscriptionFeatures;
  isCompany: boolean;
  // New: Enhanced account type information
  accountType: AccountType;
  company?: Company;
  canSwitchAccountType: boolean;
}

export interface SubscriptionCreateRequest {
  planId: string;
  paymentMethodId?: string; // Optional for Stripe Checkout flow
  // New: Account type specification
  accountType?: AccountType;
  companyId?: string; // For company subscriptions
}

export interface SubscriptionCreateResponse {
  success: boolean;
  sessionId?: string; // Stripe Checkout session ID
  url?: string; // Stripe Checkout URL
  clientSecret?: string; // For direct payment integration (future use)
  subscription?: {
    planId: string;
    planName: string;
    price: number;
    currency: string;
    interval: string;
  };
  error?: string;
}

export interface SubscriptionPlansResponse {
  success: boolean;
  plans: SubscriptionPlan[];
  error?: string;
}

export interface SubscriptionReactivateRequest {
  subscriptionId?: string; // Optional - backend can find from user
}

export interface SubscriptionReactivateResponse {
  success: boolean;
  subscription?: UserSubscription;
  message?: string;
  error?: string;
}

export interface SubscriptionCancelRequest {
  immediate?: boolean;
  reason?: string;
}

export interface SubscriptionCancelResponse {
  success: boolean;
  subscription?: UserSubscription;
  message?: string;
  error?: string;
}

// New: Account Type Management Interfaces
export interface AccountTypeResponse {
  success: boolean;
  accountType: AccountType;
  company?: Company;
  canSwitchAccountType: boolean;
  error?: string;
}

export interface AccountTypeSwitchRequest {
  targetAccountType: AccountType;
  companyId?: string; // Required when switching to company
  confirmationPassword?: string; // Required for security confirmation
}

export interface AccountTypeSwitchResponse {
  success: boolean;
  newAccountType: AccountType;
  message?: string;
  error?: string;
}

export interface CompanyCreateRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  taxId?: string;
  description?: string;
  employeeCount?: number;
}

export interface CompanyCreateResponse {
  success: boolean;
  company?: Company;
  message?: string;
  error?: string;
}

export interface CompanyAssociationRequest {
  companyId: string;
}

export interface CompanyAssociationResponse {
  success: boolean;
  company?: Company;
  message?: string;
  error?: string;
}

// Enhanced plan filtering
export interface SubscriptionPlansRequest {
  accountType?: AccountType;
  companyId?: string;
}
