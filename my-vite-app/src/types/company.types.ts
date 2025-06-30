export interface Company {
  id: number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  taxId?: string;
  website?: string;
  logo?: string;
  headerImage?: string;
  // Note: Subscription properties removed as they're handled separately in account settings
  createdAt: string;
  updatedAt: string;
}

export interface CompanyMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  isActive?: boolean;
  lastLogin?: string;
  status?: string;
  emailVerified?: boolean;
}

export interface CompanyStats {
  totalListings: number;
  activeListings: number;
  soldListings?: number;
  totalViews: number;
  totalInquiries?: number;
  totalMessages?: number;
  totalFavorites?: number;
  monthlyViews?: number;
  conversionRate?: number;
  monthlyStats?: {
    month: string;
    listings: number;
    views: number;
    inquiries: number;
  }[];
}

export interface CompanyAnalytics {
  overview: {
    totalMembers: number;
    avgResponseTimeHours: number;
  };
  trends: {
    monthlyListings: {
      month: string;
      listings: number;
      views: number;
      avgPrice: number;
    }[];
  };
  topPerforming: {
    id: string;
    title: string;
    price: number;
    views: number;
    favorites: number;
    createdAt: string;
  }[];
}

export interface CompanyUpdateRequest {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  taxId?: string;
  website?: string;
}

export interface CompanyImageUploadRequest {
  type: "logo" | "header";
  file: File;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AddCompanyMemberRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "admin" | "member";
  birthdate?: string;
}
