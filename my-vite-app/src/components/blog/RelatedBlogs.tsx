import React, { useState, useEffect } from "react";
import { Card, List, Typography, Tag, Space } from "antd";
import { EyeOutlined, LikeOutlined, CalendarOutlined } from "@ant-design/icons";
import { BlogPost } from "../../types/blogTypes";
import blogService from "../../services/blogService";
import "./RelatedBlogs.css";

const { Text, Title } = Typography;

interface RelatedBlogsProps {
  currentBlogId: string;
  categoryId: number;
  limit?: number;
}

/**
 * RelatedBlogs Component
 *
 * Displays related blog posts based on category or tags.
 * Shows in sidebar or at the end of blog posts.
 */
const RelatedBlogs: React.FC<RelatedBlogsProps> = ({
  currentBlogId,
  categoryId,
  limit = 5,
}) => {
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRelatedPosts();
  }, [currentBlogId, categoryId]);

  const fetchRelatedPosts = async () => {
    try {
      setLoading(true);

      // Fetch posts from the same category, excluding current post
      const response = await blogService.getBlogPosts({
        category: categoryId.toString(),
        limit,
        page: 1,
      });

      if (response.data) {
        // Filter out the current post
        const filtered = response.data.filter(
          (post) => post.id.toString() !== currentBlogId
        );
        setRelatedPosts(filtered.slice(0, limit));
      }
    } catch (error) {
      console.error("Failed to fetch related posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const truncateTitle = (title: string, maxLength = 60) => {
    return title.length > maxLength
      ? `${title.substring(0, maxLength)}...`
      : title;
  };

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <Card title="Related Posts" size="small" className="related-blogs-card">
      <List
        loading={loading}
        dataSource={relatedPosts}
        renderItem={(post) => (
          <List.Item className="related-blog-item">
            <div className="related-blog-content">
              {post.featured_image && (
                <div className="related-blog-image">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="related-blog-info">
                <Title
                  level={5}
                  className="related-blog-title"
                  onClick={() => {
                    window.location.href = `/blog/${post.slug}`;
                  }}
                >
                  {truncateTitle(post.title)}
                </Title>

                <Space size="small" className="related-blog-meta">
                  <Text type="secondary">
                    <CalendarOutlined /> {formatDate(post.created_at)}
                  </Text>
                  <Text type="secondary">
                    <EyeOutlined /> {post.views_count}
                  </Text>
                  <Text type="secondary">
                    <LikeOutlined /> {post.likes_count}
                  </Text>
                </Space>

                {post.category_name && (
                  <Tag
                    color={post.category_color || "default"}
                    className="related-blog-category"
                  >
                    {post.category_name}
                  </Tag>
                )}
              </div>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default RelatedBlogs;
