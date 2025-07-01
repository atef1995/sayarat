import {
  Avatar,
  List,
  Rate,
  Card,
  Typography,
  Spin,
  Alert,
  Statistic,
  Row,
  Col,
} from "antd";
import { useEffect, useState, useCallback } from "react";
import React from "react";
import {
  Review,
  ReviewStatistics,
  UserReviewResponse,
  UserReviewsProps,
} from "../types/reviews.types";
import { loadApiConfig } from "../config/apiConfig";

const { Text, Paragraph } = Typography;
const { apiUrl } = loadApiConfig();
/**
 * UserReviews Component
 * Displays user reviews with statistics and enhanced error handling
 * Integrates with the enhanced backend reviews system
 */
const UserReviews: React.FC<UserReviewsProps> = React.memo(({ username }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);

  /**
   * Fetch reviews from the enhanced backend API
   * Uses proper error handling and loading states
   */
  const fetchReviews = useCallback(async () => {
    if (!username || username.trim().length === 0) {
      setError("Valid username is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${apiUrl}/reviews/seller-reviews/${encodeURIComponent(username)}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: UserReviewResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch reviews");
      }

      // Set data with proper validation
      setReviews(result.data?.reviews || []);
      setStatistics(result.data?.statistics || null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      console.error("Error fetching reviews:", errorMessage);
      setError(errorMessage);
      setReviews([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /**
   * Format reviewer full name
   */
  const getReviewerName = useCallback((review: Review): string => {
    const firstName = review.reviewer_first_name || "";
    const lastName = review.reviewer_last_name || "";
    return (
      `${firstName} ${lastName}`.trim() ||
      review.reviewer_username ||
      "Anonymous"
    );
  }, []);

  /**
   * Format car information
   */
  const getCarInfo = useCallback((review: Review): string => {
    if (!review.car_title && !review.car_make) return "";

    if (review.car_title) return review.car_title;

    const parts = [review.car_year, review.car_make, review.car_model].filter(
      Boolean
    );
    return parts.join(" ");
  }, []);

  /**
   * Format date for display
   */
  const formatDate = useCallback((dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spin size="large" tip="Loading reviews..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        message="Error Loading Reviews"
        description={error}
        type="error"
        showIcon
        action={
          <button
            onClick={fetchReviews}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        }
      />
    );
  }

  // Empty state
  if (!reviews || reviews.length === 0) {
    return (
      <Card className="max-w-6xl w-full">
        <div className="text-center py-8">
          <Text type="secondary" className="text-lg">
            No reviews found for {username}
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl w-full space-y-6">
      {/* Statistics Section */}
      {statistics && (
        <Card title="Review Statistics" className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Total Reviews"
                value={statistics.total_reviews}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Average Rating"
                value={statistics.average_rating}
                precision={1}
                suffix={
                  <Rate
                    disabled
                    value={statistics.average_rating}
                    allowHalf
                    style={{ fontSize: "14px" }}
                  />
                }
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Response Rate"
                value={statistics.response_rate}
                suffix="%"
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="5-Star Reviews"
                value={statistics.five_star_count}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Reviews List */}
      <Card title={`Reviews (${reviews.length})`}>
        <List
          itemLayout="vertical"
          dataSource={reviews}
          renderItem={(review: Review) => (
            <List.Item
              key={review.id}
              className="border-b border-gray-100 last:border-b-0 pb-4 mb-4 last:mb-0"
            >
              <div className="space-y-3">
                {/* Reviewer Info and Rating */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={review.reviewer_picture}
                      size={40}
                      className="flex-shrink-0"
                    >
                      {getReviewerName(review).charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Text strong className="block">
                        {getReviewerName(review)}
                      </Text>
                      <Text type="secondary" className="text-sm">
                        @{review.reviewer_username}
                      </Text>
                    </div>
                  </div>
                  <div className="text-right">
                    <Rate disabled value={review.rating} className="text-sm" />
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(review.created_at)}
                    </div>
                  </div>
                </div>

                {/* Car Information */}
                {getCarInfo(review) && (
                  <div className="bg-gray-50 rounded-md p-3">
                    <Text type="secondary" className="text-sm">
                      Review for: <Text strong>{getCarInfo(review)}</Text>
                    </Text>
                  </div>
                )}

                {/* Review Text */}
                <Paragraph className="mb-2">{review.reviewer_text}</Paragraph>

                {/* Seller Response */}
                {review.response_text && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 ml-4">
                    <Text strong className="block mb-1 text-blue-700">
                      Seller Response:
                    </Text>
                    <Paragraph className="mb-1 text-blue-900">
                      {review.response_text}
                    </Paragraph>
                    {review.response_date && (
                      <Text type="secondary" className="text-xs">
                        Responded on {formatDate(review.response_date)}
                      </Text>
                    )}
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      </Card>

      {/* #TODO: Add pagination for large numbers of reviews */}
      {/* #TODO: Add filtering options (rating, date range) */}
      {/* #TODO: Add ability to report inappropriate reviews */}
    </div>
  );
});

UserReviews.displayName = "UserReviews";

export default UserReviews;
