import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Card,
  Typography,
  Space,
  Tag,
  Avatar,
  Button,
  Divider,
  Image,
  Row,
  Col,
  Spin,
  message,
  BackTop,
  Affix,
} from "antd";
import {
  EyeOutlined,
  LikeOutlined,
  ShareAltOutlined,
  CalendarOutlined,
  UserOutlined,
  TagOutlined,
  ArrowLeftOutlined,
  HeartOutlined,
  HeartFilled,
} from "@ant-design/icons";
import { BlogPost } from "../../types/blogTypes";
import blogService from "../../services/blogService";
import BlogComments from "./BlogComments";
import RelatedBlogs from "./RelatedBlogs";
import "./BlogDetail.css";

const { Title, Paragraph, Text } = Typography;

const BlogDetail: React.FC = () => {
  const { id, slug } = useParams<{ id: string; slug: BlogPost["slug"] }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(false);

  const fetchBlogPost = useCallback(
    async (identifier: string) => {
      try {
        setLoading(true);
        let post: BlogPost;

        // Use getBlogPost for slug-based retrieval, fallback to getPost for ID
        if (slug) {
          post = await blogService.getBlogPost(identifier);
        } else {
          const response = await blogService.getPost(identifier);
          if (response.success && response.data) {
            post = response.data;
          } else {
            throw new Error("Failed to load blog post");
          }
        }

        setBlog(post);
        setLiked(post.is_liked || false);
      } catch (error) {
        console.error("Error fetching blog post:", error);
        message.error("Failed to load blog post");
        navigate("/blog");
      } finally {
        setLoading(false);
      }
    },
    [navigate, slug]
  );

  useEffect(() => {
    if (id && slug) {
      fetchBlogPost(slug);
      // Track view
      blogService.trackView(id).catch(console.error);
    }
  }, [id, slug, fetchBlogPost]);

  const handleLike = async () => {
    if (!blog) return;

    try {
      setLiking(true);
      const response = await blogService.toggleLike(blog.id.toString());
      if (response.success) {
        setLiked(!liked);
        setBlog({
          ...blog,
          likes_count: liked ? blog.likes_count - 1 : blog.likes_count + 1,
        });
        message.success(liked ? "Like removed" : "Post liked!");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      message.error("Failed to update like");
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    if (!blog) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        message.success("Link copied to clipboard!");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        message.error("Failed to copy link");
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "car-news": "blue",
      "car-reviews": "green",
      "buying-guides": "orange",
      "maintenance-tips": "purple",
      "market-analysis": "red",
      default: "default",
    };
    return colors[category] || colors.default;
  };

  if (loading) {
    return (
      <div className="blog-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="blog-detail-error">
        <Title level={3}>Blog post not found</Title>
        <Button onClick={() => navigate("/blog")}>Back to Blog</Button>
      </div>
    );
  }

  return (
    <div className="blog-detail">
      <div className="blog-detail-container">
        {/* Header */}
        <div className="blog-detail-header">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/blog")}
            className="back-button"
          >
            Back to Blog
          </Button>
        </div>

        <Row gutter={[24, 24]}>
          {/* Main Content */}
          <Col xs={24} lg={16}>
            <Card className="blog-detail-card">
              {/* Featured Image */}
              {blog.featured_image && (
                <div className="blog-detail-image">
                  <Image
                    src={blog.featured_image}
                    alt={blog.title}
                    width="100%"
                    height={400}
                    style={{ objectFit: "cover" }}
                    preview={{
                      mask: <EyeOutlined />,
                    }}
                  />
                </div>
              )}

              {/* Meta Information */}
              <div className="blog-detail-meta">
                <Space size="large" wrap>
                  <Space>
                    <Avatar
                      icon={<UserOutlined />}
                      src={blog.author_avatar}
                      size="small"
                    />
                    <Text strong>{blog.author_name}</Text>
                  </Space>
                  <Space>
                    <CalendarOutlined />
                    <Text>{formatDate(blog.created_at)}</Text>
                  </Space>
                  <Space>
                    <EyeOutlined />
                    <Text>{blog.views_count} views</Text>
                  </Space>
                </Space>
              </div>

              {/* Title */}
              <Title level={1} className="blog-detail-title">
                {blog.title}
              </Title>

              {/* Category and Tags */}
              <div className="blog-detail-tags">
                <Space wrap>
                  <Tag
                    color={getCategoryColor(blog.category_slug)}
                    icon={<TagOutlined />}
                  >
                    {blog.category_name}
                  </Tag>
                  {blog.tags?.map((tag) => (
                    <Tag key={tag.id} color="default">
                      {tag.name}
                    </Tag>
                  ))}
                </Space>
              </div>

              {/* Excerpt */}
              {blog.excerpt && (
                <Paragraph className="blog-detail-excerpt" strong>
                  {blog.excerpt}
                </Paragraph>
              )}

              <Divider />

              {/* Content */}
              <div
                className="blog-detail-content"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

              <Divider />

              {/* Actions */}
              <div className="blog-detail-actions">
                <Space size="large">
                  <Button
                    type={liked ? "primary" : "default"}
                    icon={liked ? <HeartFilled /> : <HeartOutlined />}
                    loading={liking}
                    onClick={handleLike}
                  >
                    {blog.likes_count} Likes
                  </Button>
                  <Button icon={<ShareAltOutlined />} onClick={handleShare}>
                    Share
                  </Button>
                </Space>
              </div>
            </Card>

            {/* Comments Section */}
            <BlogComments blogId={blog.id} />
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={8}>
            <Affix offsetTop={20}>
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                {/* Related Posts */}
                <RelatedBlogs
                  currentBlogId={blog.id.toString()}
                  categoryId={blog.category_id}
                />

                {/* Blog Stats */}
                <Card title="Post Statistics" size="small">
                  <div className="blog-stats">
                    <div className="stat-item">
                      <EyeOutlined />
                      <span>{blog.views_count} Views</span>
                    </div>
                    <div className="stat-item">
                      <LikeOutlined />
                      <span>{blog.likes_count} Likes</span>
                    </div>
                    <div className="stat-item">
                      <CalendarOutlined />
                      <span>Published {formatDate(blog.created_at)}</span>
                    </div>
                  </div>
                </Card>
              </Space>
            </Affix>
          </Col>
        </Row>
      </div>

      <BackTop />
    </div>
  );
};

export default BlogDetail;
