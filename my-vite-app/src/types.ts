import { Product } from "./types/payment";

/** Rental details interface */
export interface RentalDetails {
  monthlyPrice: number;
  minimumRentalPeriod: number;
  securityDeposit?: number;
  rentalTerms?: string;
  includesInsurance: boolean;
  includesFuel: boolean;
  includesMaintenance: boolean;
  includesDriver: boolean;
}

/** Represents core car listing information without seller data */
export interface CarInfo {
  readonly id: string;
  title: string;
  price: number;
  make: string;
  model: string;
  year: number;
  mileage: number;
  location: string;
  listing_status: "active" | "sold" | "pending";
  created_at: string;
  car_type: string;
  color: string;
  description: string;
  transmission: "automatic" | "manual";
  fuel: string;
  currency?: string;
  status: string;
  seller_id: string;
  image_urls: string[];
  favorites_count?: number;
  is_favorited?: boolean;
  hp: number;
  specs: string[];
  engine_cylinders: number;
  engine_liters: number;
  views: number;
  products?: Product["name"]; // Array of product names
  highlight?: boolean; // Whether this listing is highlighted
  _placement?: string; // Internal field for placement strategy info
  // Rental-specific fields
  listingType?: "sale" | "rental";
  isRental?: boolean;
  rentalDetails?: RentalDetails;
}

/** Extended CarInfo with seller data for backward compatibility */
export interface CarInfoWithSeller extends CarInfo {
  first_name: string;
  username: string;
}

/** Represents a car image */
export interface CarImage {
  readonly id: string;
  url: string;
  car_listing_id: string;
}

/** Represents full listing information with separated car and seller data */
export interface ListingInfo {
  readonly id: string;
  car: CarInfo;
  seller: Seller;
}

/** Represents detailed listing response from API */
export interface ListingDetailResponse {
  readonly id: string;
  title: string;
  price: number;
  make: string;
  model: string;
  year: number;
  mileage: number;
  location: string;
  listing_status: "active" | "sold" | "pending";
  created_at: string;
  car_type: string;
  color: string;
  description: string;
  transmission: "automatic" | "manual";
  fuel: string;
  currency?: string;
  status: string;
  seller_id: string;
  image_urls: string[];
  favorites_count?: number;
  is_favorited?: boolean;
  hp: number;
  specs: string[];
  engine_cylinders: number;
  engine_liters: number;
  views: number;
  products?: Product["name"];
  highlight?: boolean;
  _placement?: string;
  // Seller information
  first_name: string;
  username: string;
  phone?: string;
  is_company?: boolean;
  is_verified?: boolean;
}

export interface CarCardProps extends Omit<CarInfo, "products"> {
  products?: Product["name"]; // Array of product names
  // Seller information for company display
  seller_name?: string;
  seller_username?: string;
  is_company?: boolean;
  company_name?: string;
  company_logo?: string;
  // Subscription status for premium/company badges
  subscription_status?: "active" | "inactive" | "pending" | "expired";
  subscription_plan?: string;
  is_verified?: boolean;
}

/** Represents a new car listing creation
 *  This interface is used when creating a new car listing
 *   It extends CarInfo but omits certain fields that are not needed
 *   and includes image_urls as an array of UploadFile objects
 *   The created_at field is optional and will be set to the
 *    current time
 * */
export interface CreateListing
  extends Omit<CarInfo, "image_urls" | "created_at" | "products"> {
  image_urls: string[];
  products?: Product[];
  created_at?: string;
  // Rental-specific fields (optional for backward compatibility)
  minimumRentalPeriod?: number;
  securityDeposit?: number;
  rentalTerms?: string;
  includesInsurance?: boolean;
  includesFuel?: boolean;
  includesMaintenance?: boolean;
  includesDriver?: boolean;
}

/** Represents collection of cars with company information */
export interface AllCars {
  rows: (CarInfo & {
    // Additional fields from API that may include company info
    seller_name?: string;
    seller_username?: string;
    is_company?: boolean;
    company_name?: string;
    company_logo?: string;
    // Subscription status for premium/company badges
    subscription_status?: "active" | "inactive" | "pending" | "expired";
    subscription_plan?: string;
    is_verified?: boolean;
  })[];
  total: number;
  strategy?: string;
  smart?: boolean;
  highlightedCount?: number;
  requestId?: string;
}

/** Represents table data structure */
export interface TableDataType {
  readonly key: string;
  image_urls: CarInfo["image_urls"];
  make: CarInfo["make"];
  price: CarInfo["price"];
  views: number;
  status: CarInfo["status"];
  created_at: CarInfo["created_at"];
  readonly id: CarInfo["id"];
}

/** Represents seller information */
export interface Seller {
  readonly id: string;
  auth_id: string;
  name: string;
  first_name: string;
  username: string;
  phone_num?: string;
  phone?: string;
  location: string;
  picture?: string;
  // Company information (when seller is a company)
  company_id?: number;
  is_company?: boolean;
}

/** Represents company information for listings */
export interface SellerCompanyInfo {
  readonly id: number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  website?: string;
  logo?: string;
  phone?: string;
  email?: string;
  totalListings?: number;
  memberSince?: string;
  verificationStatus?: "verified" | "pending" | "unverified";
  username?: string; // Seller username for company
  // Subscription information
  subscription_status?: "active" | "inactive" | "pending" | "expired";
  subscription_plan?: string;
  subscription_plan_id?: string;
  is_verified?: boolean;
}

/**
 * Enum for subscription status types
 * Provides type safety and code readability
 */
export enum SubscriptionStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  EXPIRED = "expired",
}

/**
 * Enum for subscription plan types
 * #TODO: Update with actual plan names from database
 */
export enum SubscriptionPlan {
  FREE = "free",
  BASIC = "basic",
  PREMIUM = "premium",
  ENTERPRISE = "enterprise",
}
