import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Card,
  List,
  Avatar,
  Button,
  Form,
  Input,
  message,
  Space,
  Typography,
} from "antd";
import { UserOutlined, MessageOutlined, LikeOutlined } from "@ant-design/icons";
import { BlogComment, BlogCommentForm } from "../../types/blogTypes";
import { AuthContext } from "../../context/AuthContext";
import blogService from "../../services/blogService";
import "./BlogComments.css";

const { TextArea } = Input;
const { Text } = Typography;

interface BlogCommentsProps {
  blogId: number; // Changed from string to number
}

/**
 * Custom hook for managing blog comments
 * Implements separation of concerns by keeping data logic separate from UI
 */
const useBlogComments = (blogId: number) => {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await blogService.getBlogComments(blogId);
      setComments(response.data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      message.error("Failed to load comments");
      throw error; // Re-throw for error boundary
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  const addComment = async (
    commentData: BlogCommentForm
  ): Promise<BlogComment> => {
    try {
      setSubmitting(true);
      const response = await blogService.addBlogComment(commentData);
      await fetchComments(); // Refresh comments
      return response;
    } catch (error) {
      console.error("Failed to add comment:", error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const addReply = async (
    commentId: number,
    content: string
  ): Promise<BlogComment> => {
    try {
      setSubmitting(true);
      const response = await blogService.replyToBlogComment(commentId, content);
      await fetchComments(); // Refresh comments
      return response;
    } catch (error) {
      console.error("Failed to add reply:", error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    comments,
    loading,
    submitting,
    fetchComments,
    addComment,
    addReply,
  };
};

/**
 * Utility functions for comment formatting and validation
 */
const CommentUtils = {
  /**
   * Format date string for display
   */
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  /**
   * Validate comment content
   */
  validateComment: (content: string): boolean => {
    const trimmed = content.trim();
    return trimmed.length >= 3 && trimmed.length <= 1000;
  },

  /**
   * Sanitize comment content (basic sanitization)
   */
  sanitizeContent: (content: string): string => {
    return content
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
      .replace(/<[^>]*>/g, ""); // Remove HTML tags for now
  },
};

/**
 * Error Boundary for Blog Comments
 */
interface CommentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class CommentErrorBoundary extends React.Component<
  React.PropsWithChildren<object>,
  CommentErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<object>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): CommentErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Comment Error:", error, errorInfo);
    message.error("An error occurred while loading comments");
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card title="Comments">
          <div className="comment-error-state">
            <Text type="secondary">
              Unable to load comments. Please refresh the page or try again
              later.
            </Text>
            <br />
            <Button
              type="link"
              onClick={() => window.location.reload()}
              style={{ padding: 0, marginTop: 8 }}
            >
              Refresh Page
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * BlogComments Component
 *
 * Displays and manages comments for a blog post.
 * Features:
 * - Load and display comments
 * - Add new comments
 * - Reply to comments (nested structure)
 * - Like comments
 */
const BlogComments: React.FC<BlogCommentsProps> = ({ blogId }) => {
  const [replyingTo, setReplyingTo] = useState<number | null>(null); // Changed to number
  const [form] = Form.useForm();

  // Get user context for authentication
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated || false;

  const { comments, loading, submitting, fetchComments, addComment, addReply } =
    useBlogComments(blogId);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (values: BlogCommentForm) => {
    if (!isAuthenticated) {
      message.error("Please log in to comment");
      return;
    }

    // Validate and sanitize content
    const sanitizedContent = CommentUtils.sanitizeContent(values.content);
    if (!CommentUtils.validateComment(sanitizedContent)) {
      message.error("Comment must be between 3 and 1000 characters");
      return;
    }

    try {
      if (replyingTo) {
        await addReply(replyingTo, sanitizedContent);
        message.success("Reply added successfully");
      } else {
        const commentData: BlogCommentForm = {
          content: sanitizedContent,
          post_id: blogId,
        };
        await addComment(commentData);
        message.success("Comment added successfully");
      }

      form.resetFields();
      setReplyingTo(null);
    } catch (error) {
      console.error("Error adding comment:", error);
      message.error("Failed to add comment. Please try again.");
    }
  };

  const renderComment = (comment: BlogComment, level = 0) => (
    <div key={comment.id} className={`comment-container level-${level}`}>
      <List.Item
        actions={[
          <Button
            type="text"
            icon={<LikeOutlined />}
            size="small"
            onClick={() => {
              // #TODO: Implement comment liking
              message.info("Comment liking feature coming soon");
            }}
          >
            {/* Using replies_count as likes_count doesn't exist in BlogComment */}
            {comment.replies_count || 0}
          </Button>,
          <Button
            type="text"
            icon={<MessageOutlined />}
            size="small"
            onClick={() => setReplyingTo(comment.id)}
          >
            Reply
          </Button>,
        ]}
      >
        <List.Item.Meta
          avatar={
            <Avatar
              src={comment.user_avatar}
              icon={<UserOutlined />}
              size="small"
            />
          }
          title={
            <Space>
              <Text strong>{comment.user_name}</Text>
              <Text type="secondary" className="comment-date">
                {CommentUtils.formatDate(comment.created_at)}
              </Text>
            </Space>
          }
          description={comment.content}
        />
      </List.Item>

      {/* Reply form for this comment */}
      {replyingTo === comment.id && (
        <div className="reply-form-container">
          <Form form={form} onFinish={handleSubmitComment}>
            <Form.Item
              name="content"
              rules={[{ required: true, message: "Please enter your reply" }]}
            >
              <TextArea
                rows={3}
                placeholder={`Reply to ${comment.user_name}...`}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="small"
                >
                  Reply
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setReplyingTo(null);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      )}

      {/* Nested replies */}
      {comment.replies &&
        comment.replies.map((reply) => renderComment(reply, level + 1))}
    </div>
  );

  return (
    <CommentErrorBoundary>
      <Card title={`Comments (${comments.length})`} style={{ marginTop: 24 }}>
        {/* Add Comment Form */}
        {!replyingTo && (
          <div className="comment-form-container">
            <Form form={form} onFinish={handleSubmitComment}>
              <Form.Item
                name="content"
                rules={[
                  { required: true, message: "Please enter your comment" },
                ]}
              >
                <TextArea rows={4} placeholder="Write your comment..." />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  Add Comment
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}

        {/* Comments List */}
        <List
          loading={loading}
          dataSource={comments}
          renderItem={(comment) => renderComment(comment)}
          locale={{ emptyText: "No comments yet. Be the first to comment!" }}
        />
      </Card>
    </CommentErrorBoundary>
  );
};

export default BlogComments;
