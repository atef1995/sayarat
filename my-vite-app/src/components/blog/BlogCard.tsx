import React from "react";
import { Card, Typography, Tag, Avatar, Tooltip } from "antd";
import {
  EyeOutlined,
  LikeOutlined,
  CommentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ReadOutlined,
  TagOutlined,
  CarOutlined,
  StarFilled,
} from "@ant-design/icons";
import { BlogCardProps } from "../../types/blogTypes";
import { formatMessageTime } from "../../helper/time";
import "./BlogCard.css";

const { Title, Text, Paragraph } = Typography;

/**
 * BlogCard Component
 *
 * A reusable card component for displaying blog post information.
 * Supports multiple variants and customizable display options.
 * Optimized for car-related content with Arabic RTL support.
 *
 * Features:
 * - Multiple display variants (default, featured, compact, list)
 * - Car-specific content indicators
 * - Responsive design with Tailwind CSS
 * - Accessibility support
 * - Interactive elements with hover effects
 */
const BlogCard: React.FC<BlogCardProps> = ({
  post,
  variant = "default",
  showAuthor = true,
  showCategory = true,
  showExcerpt = true,
  showStats = true,
  className = "",
  onClick,
}) => {
  /**
   * Handle card click event
   */
  const handleClick = () => {
    if (onClick) {
      onClick(post);
    }
  };

  /**
   * Get card size based on variant
   */
  const getCardClass = () => {
    const baseClass =
      "blog-card cursor-pointer transition-all duration-300 hover:shadow-lg";

    switch (variant) {
      case "featured":
        return `${baseClass} blog-card-featured border-l-4 border-blue-500`;
      case "compact":
        return `${baseClass} blog-card-compact`;
      case "list":
        return `${baseClass} blog-card-list`;
      default:
        return `${baseClass} blog-card-default`;
    }
  };

  /**
   * Render category tag
   */
  const renderCategory = () => {
    if (!showCategory || !post.category_name) return null;

    return (
      <Tag
        color={post.category_color || "#1890ff"}
        className="mb-2 text-xs"
        icon={<TagOutlined />}
      >
        {post.category_name}
      </Tag>
    );
  };

  /**
   * Render car information badge
   */
  const renderCarInfo = () => {
    if (!post.car_make && !post.car_model) return null;

    return (
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
        <CarOutlined />
        <Text className="text-xs">
          {post.car_make} {post.car_model} {post.car_year}
        </Text>
      </div>
    );
  };

  /**
   * Render rating for car reviews
   */
  const renderRating = () => {
    if (!post.rating) return null;

    return (
      <div className="flex items-center gap-1 mb-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarFilled
              key={star}
              className={`text-sm ${
                post.rating && star <= post.rating && post.rating
                  ? "text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <Text className="text-sm text-gray-600">({post.rating}/5)</Text>
      </div>
    );
  };

  /**
   * Render post title
   */
  const renderTitle = () => {
    const titleLevel =
      variant === "featured" ? 2 : variant === "compact" ? 4 : 3;

    return (
      <Title
        level={titleLevel}
        className={`mb-2 line-clamp-2 hover:text-blue-600 transition-colors ${
          variant === "featured" ? "text-lg" : "text-base"
        }`}
      >
        {post.title}
      </Title>
    );
  };

  /**
   * Render post excerpt
   */
  const renderExcerpt = () => {
    if (!showExcerpt || !post.excerpt || variant === "compact") return null;

    return (
      <Paragraph
        className="text-gray-600 text-sm mb-3 line-clamp-3"
        ellipsis={{ rows: 3 }}
      >
        {post.excerpt}
      </Paragraph>
    );
  };

  /**
   * Render author information
   */
  const renderAuthor = () => {
    if (!showAuthor) return null;

    return (
      <div className="flex items-center gap-2">
        <Avatar size="small" src={post.author_avatar} icon={<UserOutlined />} />
        <Text className="text-sm text-gray-600">{post.author_name}</Text>
      </div>
    );
  };

  /**
   * Render post metadata (date, reading time)
   */
  const renderMetadata = () => {
    return (
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <ClockCircleOutlined />
          <span>{formatMessageTime(post.created_at)}</span>
        </div>
        {post.reading_time && (
          <div className="flex items-center gap-1">
            <ReadOutlined />
            <span>{post.reading_time} دقيقة قراءة</span>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render post statistics
   */
  const renderStats = () => {
    if (!showStats) return null;

    return (
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <Tooltip title="المشاهدات">
          <div className="flex items-center gap-1">
            <EyeOutlined />
            <span>{post.views_count || 0}</span>
          </div>
        </Tooltip>
        <Tooltip title="الإعجابات">
          <div className="flex items-center gap-1">
            <LikeOutlined />
            <span>{post.likes_count || 0}</span>
          </div>
        </Tooltip>
        <Tooltip title="التعليقات">
          <div className="flex items-center gap-1">
            <CommentOutlined />
            <span>{post.comments_count || 0}</span>
          </div>
        </Tooltip>
      </div>
    );
  };

  /**
   * Render tags
   */
  const renderTags = () => {
    if (!post.tags || post.tags.length === 0 || variant === "compact")
      return null;

    const displayTags = variant === "list" ? post.tags.slice(0, 3) : post.tags;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {displayTags.map((tag, index) => (
          <Tag key={index} className="text-xs">
            {tag.name}
          </Tag>
        ))}
        {variant === "list" && post.tags.length > 3 && (
          <Text className="text-xs text-gray-500">+{post.tags.length - 3}</Text>
        )}
      </div>
    );
  };

  /**
   * Render featured image
   */
  const renderImage = () => {
    if (!post.featured_image || variant === "compact") return null;

    return (
      <div
        className={`${
          variant === "list" ? "w-32 h-24" : "w-full h-48"
        } overflow-hidden rounded-lg mb-4`}
      >
        <img
          src={post.featured_image}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
    );
  };

  /**
   * Render card content based on variant
   */
  const renderContent = () => {
    if (variant === "list") {
      return (
        <div className="flex gap-4">
          <div className="flex-1">
            {renderCategory()}
            {renderCarInfo()}
            {renderRating()}
            {renderTitle()}
            {renderExcerpt()}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                {renderAuthor()}
                {renderMetadata()}
              </div>
              {renderStats()}
            </div>
            {renderTags()}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="p-4">
          {renderCategory()}
          {renderCarInfo()}
          {renderRating()}
          {renderTitle()}
          {renderExcerpt()}
          <div className="grid grid-rows-2 grid-cols-1 sm:grid-cols-1 m-3 gap-2">
            <div className="flex items-center gap-3">{renderMetadata()}</div>
            {renderStats()}
          </div>
          {renderTags()}
        </div>
      </>
    );
  };

  return (
    <Card
      className={`${getCardClass()} ${className}`}
      hoverable
      onClick={handleClick}
      style={{ width: variant === "list" ? "100%" : "300px" }}
      cover={variant !== "compact" ? renderImage() : null}
    >
      {renderContent()}
    </Card>
  );
};

export default BlogCard;
