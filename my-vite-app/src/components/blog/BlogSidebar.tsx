import React from "react";
import { Card, List, Tag, Space, Typography, Avatar } from "antd";
import {
  FolderOutlined,
  TagOutlined,
  ClockCircleOutlined,
  FireOutlined,
  EyeOutlined,
  MessageOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { BlogSidebarProps, BlogPost } from "../../types/blogTypes";
import ScrollableContainer from "../common/ScrollableContainer";
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
      <ScrollableContainer
        maxHeight="200px"
        showScrollButtons={true}
        showScrollShadows={true}
        scrollButtonPosition="inside"
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
      </ScrollableContainer>
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
      <ScrollableContainer
        maxHeight="150px"
        showScrollButtons={true}
        showScrollShadows={true}
        scrollButtonPosition="inside"
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
      </ScrollableContainer>
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
      <ScrollableContainer
        maxHeight="300px"
        showScrollButtons={true}
        showScrollShadows={true}
        scrollButtonPosition="inside"
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
      </ScrollableContainer>
    </Card>
  );

  /**
   * Render popular posts section
   * Note: Popular posts are already sorted by the backend using weighted popularity score
   */
  const renderPopularPosts = () => {
    return (
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
        <ScrollableContainer
          maxHeight="300px"
          showScrollButtons={true}
          showScrollShadows={true}
          scrollButtonPosition="inside"
        >
          <List
            dataSource={popularPosts || []}
            renderItem={(post, index) => (
              <List.Item
                className="sidebar-post-item popular-post-item"
                onClick={() => onPostClick?.(post)}
              >
                <div className="popular-post-rank">{index + 1}</div>
                <List.Item.Meta
                  title={
                    <Text className="sidebar-post-title">{post.title}</Text>
                  }
                  description={
                    <Space size="small">
                      <Space size="small">
                        <EyeOutlined />
                        <Text type="secondary">{post.views_count || 0}</Text>
                      </Space>
                      <Space size="small">
                        <HeartOutlined />
                        <Text type="secondary">{post.likes_count || 0}</Text>
                      </Space>
                      <Space size="small">
                        <MessageOutlined />
                        <Text type="secondary">{post.comments_count || 0}</Text>
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </ScrollableContainer>
      </Card>
    );
  };

  return (
    <div className={`blog-sidebar ${className}`}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {categories?.length > 0 && renderCategories()}
        {tags?.length > 0 && renderTags()}
        {recentPosts?.length > 0 && renderRecentPosts()}
        {popularPosts?.length > 0 && renderPopularPosts()}
      </Space>
    </div>
  );
};

export default BlogSidebar;
