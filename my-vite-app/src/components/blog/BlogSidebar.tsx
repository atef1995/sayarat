import React from "react";
import { Card, List, Tag, Space, Typography, Avatar } from "antd";
import {
  FolderOutlined,
  TagOutlined,
  ClockCircleOutlined,
  FireOutlined,
  EyeOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { BlogSidebarProps, BlogPost } from "../../types/blogTypes";
import "./BlogSidebar.css";

const { Text } = Typography;

/**
 * BlogSidebar Component
 *
 * A comprehensive sidebar component for the blog page that displays
 * categories, tags, recent posts, and popular posts. Implements
 * modular architecture with clean separation of concerns.
 *
 * Features:
 * - Categories with post counts
 * - Tags cloud
 * - Recent posts list
 * - Popular posts list
 * - Click handlers for navigation
 * - Responsive design
 */
const BlogSidebar: React.FC<
  BlogSidebarProps & {
    onCategoryClick?: (categorySlug: string) => void;
    onTagClick?: (tagSlug: string) => void;
    onPostClick?: (post: BlogPost) => void;
  }
> = ({
  categories,
  tags,
  recentPosts,
  popularPosts,
  onCategoryClick,
  onTagClick,
  onPostClick,
  className = "",
}) => {
  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Render categories section
   */
  const renderCategories = () => (
    <Card
      title={
        <Space>
          <FolderOutlined />
          <span>الفئات</span>
        </Space>
      }
      size="small"
      className="sidebar-card"
    >
      <div className="sidebar-categories">
        {categories.map((category) => (
          <div
            key={category.id}
            className="sidebar-category-item"
            onClick={() => onCategoryClick?.(category.slug)}
          >
            <Space>
              <Tag color={category.color}>{category.name}</Tag>
              <Text type="secondary">({category.posts_count})</Text>
            </Space>
          </div>
        ))}
      </div>
    </Card>
  );

  /**
   * Render tags section
   */
  const renderTags = () => (
    <Card
      title={
        <Space>
          <TagOutlined />
          <span>العلامات</span>
        </Space>
      }
      size="small"
      className="sidebar-card"
    >
      <div className="sidebar-tags">
        <Space wrap>
          {tags.map((tag) => (
            <Tag
              key={tag.id}
              className="sidebar-tag"
              onClick={() => onTagClick?.(tag.slug)}
            >
              {tag.name} ({tag.posts_count})
            </Tag>
          ))}
        </Space>
      </div>
    </Card>
  );

  /**
   * Render recent posts section
   */
  const renderRecentPosts = () => (
    <Card
      title={
        <Space>
          <ClockCircleOutlined />
          <span>أحدث المقالات</span>
        </Space>
      }
      size="small"
      className="sidebar-card"
    >
      <List
        dataSource={recentPosts}
        renderItem={(post) => (
          <List.Item
            className="sidebar-post-item"
            onClick={() => onPostClick?.(post)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  shape="square"
                  size={60}
                  src={post.featured_image}
                  alt={post.title}
                />
              }
              title={<Text className="sidebar-post-title">{post.title}</Text>}
              description={
                <Space direction="vertical" size="small">
                  <Text type="secondary" className="sidebar-post-date">
                    {formatDate(post.created_at)}
                  </Text>
                  <Space size="small">
                    <Space size="small">
                      <EyeOutlined />
                      <Text type="secondary">{post.views_count}</Text>
                    </Space>
                    <Space size="small">
                      <MessageOutlined />
                      <Text type="secondary">{post.comments_count}</Text>
                    </Space>
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  /**
   * Render popular posts section
   */
  const renderPopularPosts = () => (
    <Card
      title={
        <Space>
          <FireOutlined />
          <span>المقالات الأكثر شعبية</span>
        </Space>
      }
      size="small"
      className="sidebar-card"
    >
      <List
        dataSource={popularPosts}
        renderItem={(post, index) => (
          <List.Item
            className="sidebar-post-item popular-post-item"
            onClick={() => onPostClick?.(post)}
          >
            <div className="popular-post-rank">{index + 1}</div>
            <List.Item.Meta
              title={<Text className="sidebar-post-title">{post.title}</Text>}
              description={
                <Space size="small">
                  <Space size="small">
                    <EyeOutlined />
                    <Text type="secondary">{post.views_count}</Text>
                  </Space>
                  <Space size="small">
                    <MessageOutlined />
                    <Text type="secondary">{post.comments_count}</Text>
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  return (
    <div className={`blog-sidebar ${className}`}>
      <Space direction="vertical" size="large">
        {categories?.length > 0 && renderCategories()}
        {tags?.length > 0 && renderTags()}
        {recentPosts?.length > 0 && renderRecentPosts()}
        {popularPosts?.length > 0 && renderPopularPosts()}
      </Space>
    </div>
  );
};

export default BlogSidebar;
