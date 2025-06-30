import React from "react";
import { Row, Col, Card, Typography, Space, Tag, Avatar } from "antd";
import {
  EyeOutlined,
  MessageOutlined,
  LikeOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { BlogPost } from "../../types/blogTypes";
import "./FeaturedBlogs.css";

const { Title, Text, Paragraph } = Typography;

interface FeaturedBlogsProps {
  posts: BlogPost[];
  onPostClick?: (post: BlogPost) => void;
}

/**
 * FeaturedBlogs Component
 *
 * Displays featured blog posts in an attractive hero section layout.
 * Features main featured post and smaller featured posts grid.
 *
 * Features:
 * - Large hero post display
 * - Grid of smaller featured posts
 * - Post metadata (views, comments, likes)
 * - Category tags
 * - Responsive design
 * - Click handlers for navigation
 */
const FeaturedBlogs: React.FC<FeaturedBlogsProps> = ({
  posts,
  onPostClick,
}) => {
  if (!posts || posts.length === 0) {
    return null;
  }

  const [mainPost, ...otherPosts] = posts;

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /**
   * Format reading time
   */
  const formatReadingTime = (minutes?: number) => {
    if (!minutes) return "دقيقة واحدة";
    return `${minutes} دقيقة`;
  };

  /**
   * Render post stats
   */
  const renderPostStats = (
    post: BlogPost,
    size: "small" | "default" = "default"
  ) => (
    <Space size="middle" className={`post-stats post-stats-${size}`}>
      <Space size="small">
        <EyeOutlined />
        <Text type="secondary">{post.views_count.toLocaleString()}</Text>
      </Space>
      <Space size="small">
        <MessageOutlined />
        <Text type="secondary">{post.comments_count}</Text>
      </Space>
      <Space size="small">
        <LikeOutlined />
        <Text type="secondary">{post.likes_count}</Text>
      </Space>
      {post.reading_time && (
        <Space size="small">
          <ClockCircleOutlined />
          <Text type="secondary">{formatReadingTime(post.reading_time)}</Text>
        </Space>
      )}
    </Space>
  );

  /**
   * Render main featured post
   */
  const renderMainPost = () => (
    <Card
      className="featured-main-post"
      cover={
        <div
          className="featured-main-cover"
          onClick={() => onPostClick?.(mainPost)}
        >
          <img
            src={mainPost.featured_image}
            alt={mainPost.title}
            className="featured-main-image"
          />
          <div className="featured-main-overlay">
            <div className="featured-main-content">
              <div className="featured-main-category">
                <Tag
                  color={mainPost.category_color}
                  className="featured-category-tag"
                >
                  {mainPost.category_name}
                </Tag>
              </div>
              <Title level={2} className="featured-main-title">
                {mainPost.title}
              </Title>
              <Paragraph className="featured-main-excerpt">
                {mainPost.excerpt}
              </Paragraph>
              <div className="featured-main-meta">
                <Space direction="vertical" size="small">
                  <Space size="middle">
                    <Avatar src={mainPost.author_avatar} size="small" />
                    <Text className="featured-author">
                      {mainPost.author_name}
                    </Text>
                    <Space size="small">
                      <CalendarOutlined />
                      <Text type="secondary">
                        {formatDate(mainPost.created_at)}
                      </Text>
                    </Space>
                  </Space>
                  {renderPostStats(mainPost)}
                </Space>
              </div>
            </div>
          </div>
        </div>
      }
      bodyStyle={{ padding: 0 }}
    />
  );

  /**
   * Render secondary featured posts
   */
  const renderSecondaryPosts = () => (
    <Row gutter={[16, 16]}>
      {otherPosts.slice(0, 4).map((post) => (
        <Col key={post.id} xs={24} sm={12} className="featured-secondary-col">
          <Card
            className="featured-secondary-post"
            cover={
              <div
                className="featured-secondary-cover"
                onClick={() => onPostClick?.(post)}
              >
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="featured-secondary-image"
                />
                <div className="featured-secondary-overlay">
                  <Tag
                    color={post.category_color}
                    className="featured-category-tag"
                  >
                    {post.category_name}
                  </Tag>
                </div>
              </div>
            }
            bodyStyle={{ padding: "16px" }}
          >
            <div className="featured-secondary-content">
              <Title
                level={4}
                className="featured-secondary-title"
                onClick={() => onPostClick?.(post)}
              >
                {post.title}
              </Title>
              <Text className="featured-secondary-excerpt" type="secondary">
                {post.excerpt.substring(0, 80)}...
              </Text>
              <div className="featured-secondary-meta">
                <Space direction="vertical" size="small">
                  <Space size="small">
                    <Avatar src={post.author_avatar} size="small" />
                    <Text className="featured-author">{post.author_name}</Text>
                  </Space>
                  <Space size="small">
                    <CalendarOutlined />
                    <Text type="secondary">{formatDate(post.created_at)}</Text>
                  </Space>
                  {renderPostStats(post, "small")}
                </Space>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <div className="featured-blogs">
      <div className="featured-blogs-header">
        <Title level={2} className="featured-blogs-title">
          المقالات المميزة
        </Title>
        <Text type="secondary" className="featured-blogs-subtitle">
          أهم وأحدث المقالات في عالم السيارات
        </Text>
      </div>

      <Row gutter={[24, 24]} className="featured-blogs-content">
        <Col xs={24} lg={12}>
          {renderMainPost()}
        </Col>
        <Col xs={24} lg={12}>
          {renderSecondaryPosts()}
        </Col>
      </Row>
    </div>
  );
};

export default FeaturedBlogs;
