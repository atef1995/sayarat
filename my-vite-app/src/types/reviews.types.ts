export interface ReviewStatistics {
  total_reviews: number;
  average_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  responded_reviews: number;
  response_rate: number;
}

export interface Review {
  id: string;
  listing_id: string;
  rating: number; // This matches backend 'rating' field
  reviewer_text: string; // This matches backend field name
  response_text?: string;
  created_at: string;
  response_date?: string;
  reviewer_first_name: string;
  reviewer_last_name: string;
  reviewer_username: string;
  reviewer_picture?: string;
  car_title?: string;
  car_make?: string;
  car_model?: string;
  car_year?: number;
}

export interface UserReviewResponse {
  success: boolean;
  data: {
    statistics: ReviewStatistics;
    reviews: Review[];
  };
  error?: string;
}

export interface UserReviewsProps {
  username: string;
}
