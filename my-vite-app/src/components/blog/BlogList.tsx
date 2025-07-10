import React from "react";
import { Row, Col, Pagination, Spin, Empty, Typography } from "antd";
import { BlogListProps, BlogPost } from "../../types/blogTypes";
import BlogCard from "./BlogCard";
import "./BlogList.css";

/**
 * BlogList Component
 *
 * A comprehensive blog listing component that displays blog posts
 * in grid or list format with pagination support. Optimized for
 * car-related content with responsive design.
 *
 * Features:
 * - Grid and list view modes
 * - Pagination support
 * - Loading states
 * - Empty state handling
 * - Responsive design
 * - Click event handling
 */
const BlogList: React.FC<BlogListProps> = ({
  posts,
  loading = false,
  variant = "grid",
  showPagination = true,
  pagination,
  onPageChange,
  onPostClick,
  className = "",
}) => {
  console.log({ posts });

  /**
   * Handle pagination change
   */
  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  /**
   * Handle post click
   */
  const handlePostClick = (post: BlogPost) => {
    if (onPostClick) {
      onPostClick(post);
    }
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center m-5">
        <Spin size="large" />
        <div className="mt-4 text-center">
          <Typography.Text>جاري تحميل المقالات...</Typography.Text>
        </div>
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (!posts || posts.length === 0) {
    return (
      <div className="blog-list-empty">
        <Empty
          description="لا توجد مقالات"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  /**
   * Render grid layout
   */
  const renderGridLayout = () => {
    return (
      <Row gutter={[24, 24]} className="blog-list-grid">
        {posts.map((post) => (
          <Col
            key={post.id}
            xs={24}
            sm={12}
            lg={12}
            xl={12}
            className="blog-list-grid-item"
          >
            <BlogCard
              post={post}
              variant="default"
              onClick={handlePostClick}
              className="h-full"
            />
          </Col>
        ))}
      </Row>
    );
  };

  /**
   * Render list layout
   */
  const renderListLayout = () => {
    return (
      <div className="blog-list-vertical">
        {posts.map((post) => (
          <div key={post.id} className="blog-list-item">
            <BlogCard post={post} variant="list" onClick={handlePostClick} />
          </div>
        ))}
      </div>
    );
  };

  /**
   * Render pagination component
   */
  const renderPagination = () => {
    if (!showPagination || !pagination || pagination.totalPages <= 1) {
      return null;
    }

    return (
      <div className="blog-list-pagination">
        <Pagination
          current={pagination.currentPage}
          total={pagination.totalItems}
          pageSize={pagination.itemsPerPage}
          showSizeChanger={false}
          showQuickJumper
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} من ${total} مقال`
          }
          onChange={handlePageChange}
          className="text-center"
        />
      </div>
    );
  };

  return (
    <div className={`blog-list ${className}`}>
      <div className="blog-list-content">
        {variant === "grid" ? renderGridLayout() : renderListLayout()}
      </div>
      {renderPagination()}
    </div>
  );
};

export default BlogList;
