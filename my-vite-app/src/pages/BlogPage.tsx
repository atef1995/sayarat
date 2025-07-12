import React, { useState, useContext } from "react";
import {
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Card,
  Tag,
  BackTop,
  message,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { BlogSearchParams, BlogPost } from "../types/blogTypes";
import { AuthContext } from "../context/AuthContext";
import {
  useBlogPosts,
  useCategories,
  useTags,
  useFeaturedPosts,
  useRecentPosts,
  usePopularPosts,
} from "../hooks/useBlogQueries";
import { BlogList, BlogSidebar } from "../components/blog";
import ErrorBoundary from "../components/common/ErrorBoundary";
import ScrollableContainer from "../components/common/ScrollableContainer";
import { useResponsive } from "../hooks/useResponsive";
import "./BlogPage.css";
import { useNavigate } from "react-router";

const { Text } = Typography;
const { Search } = Input;

/**
 * Modern hook for managing blog page state using React Query
 * Implements caching, background updates, and optimistic UI patterns
 */
const useBlogPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  // Build search parameters
  const searchParams: BlogSearchParams = {
    page: currentPage,
    limit: 12,
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
    tag: selectedTag || undefined,
    sort: sortBy as "latest" | "oldest" | "popular" | "trending",
    status: "published",
  };

  // React Query hooks for data fetching
  const {
    data: postsResponse,
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = useBlogPosts(searchParams);

  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const { data: tags, isLoading: tagsLoading } = useTags();

  const { data: featuredPosts, isLoading: featuredLoading } =
    useFeaturedPosts(6);

  const { data: recentPosts, isLoading: recentLoading } = useRecentPosts(5);

  const { data: popularPosts, isLoading: popularLoading } = usePopularPosts(5);

  // Derived data
  const posts = postsResponse?.data || [];
  const pagination = postsResponse?.pagination || null;
  const loading = postsLoading || categoriesLoading || tagsLoading;

  // Error handling
  React.useEffect(() => {
    if (postsError) {
      message.error("فشل في تحميل المنشورات");
    }
  }, [postsError]);

  return {
    posts,
    categories: categories || [],
    tags: tags || [],
    featuredPosts: featuredPosts || [],
    recentPosts: recentPosts || [],
    popularPosts: popularPosts || [],
    loading,
    pagination,
    currentPage,
    searchQuery,
    selectedCategory,
    selectedTag,
    sortBy,
    setCurrentPage,
    setSearchQuery,
    setSelectedCategory,
    setSelectedTag,
    setSortBy,
    refetchPosts,
    // Loading states for individual sections
    featuredLoading,
    recentLoading,
    popularLoading,
  };
};

/**
 * BlogPage Component
 *
 * A comprehensive blog page that displays all blog posts with filtering,
 * searching, categorization, and sidebar features. Implements modular
 * architecture and follows DRY principles.
 *
 * Features:
 * - Blog post listing with pagination
 * - Search and filtering functionality
 * - Category and tag filtering
 * - Featured posts section
 * - Sidebar with recent/popular posts
 * - Responsive design
 * - Grid/List view toggle
 * - Breadcrumb navigation
 */
const BlogPage: React.FC = () => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const isAuthenticated = authContext?.isAuthenticated || false;
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const navigate = useNavigate();
  const { isMobile, isDesktop } = useResponsive();
  const {
    posts,
    categories,
    tags,
    // featuredPosts,
    recentPosts,
    popularPosts,
    loading,
    pagination,
    searchQuery,
    selectedCategory,
    selectedTag,
    sortBy,
    setCurrentPage,
    setSearchQuery,
    setSelectedCategory,
    setSelectedTag,
    setSortBy,
  } = useBlogPage();

  /**
   * Handle search
   */
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  /**
   * Handle category filter
   */
  const handleCategoryFilter = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setCurrentPage(1);
  };

  /**
   * Handle tag filter
   */
  const handleTagFilter = (tagSlug: string) => {
    setSelectedTag(tagSlug);
    setCurrentPage(1);
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * Handle post click
   */
  const handlePostClick = (post: BlogPost) => {
    navigate(`/blog/${post.slug}/${post.id}`);
  };

  /**
   * Handle create blog post navigation
   */
  const handleCreatePost = () => {
    if (!isAuthenticated) {
      message.warning("يجب تسجيل الدخول أولاً لإنشاء مقال");
      navigate("/login");
      return;
    }
    navigate("/blog/create");
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedTag("");
    setSortBy("latest");
    setCurrentPage(1);
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters =
    searchQuery || selectedCategory || selectedTag || sortBy !== "latest";

  return (
    <ErrorBoundary>
      {/* Header Section */}

      {/* Main Content */}
      <div className="container">
        {/* Search and Filters */}
        <Card className="blog-page-filters">
          <Row gutter={[16, 16]} align="middle">
            {/* Create Blog Button - First on mobile, last on desktop */}
            <Col
              xs={{ span: 24, order: 1 }}
              sm={{ span: 6, order: 5 }}
              md={{ span: 4, order: 5 }}
            >
              {user?.isAdmin && (
                <>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    block
                    onClick={handleCreatePost}
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                    }}
                  >
                    {"إنشاء مقال"}
                  </Button>
                  <Button
                    type="primary"
                    icon={<ToolOutlined />}
                    size="large"
                    block
                    onClick={() => navigate("/blog/management")}
                  >
                    {"إدارة المدونة"}
                  </Button>
                </>
              )}
            </Col>
            <Col
              xs={{ span: 24, order: 2 }}
              sm={{ span: 12, order: 1 }}
              md={{ span: 8, order: 1 }}
            >
              <Search
                placeholder="البحث في المقالات..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                defaultValue={searchQuery}
                onSearch={handleSearch}
              />
            </Col>
            <Col
              xs={{ span: 12, order: 3 }}
              sm={{ span: 6, order: 2 }}
              md={{ span: 4, order: 2 }}
            >
              <Select
                placeholder="الفئة"
                allowClear
                size="large"
                style={{ width: "100%" }}
                value={selectedCategory || undefined}
                onChange={handleCategoryFilter}
              >
                {categories.map((category) => (
                  <Select.Option key={category.id} value={category.slug}>
                    <Tag color={category.color}>{category.name}</Tag>
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col
              xs={{ span: 12, order: 4 }}
              sm={{ span: 6, order: 3 }}
              md={{ span: 4, order: 3 }}
            >
              <Select
                placeholder="الترتيب"
                size="large"
                style={{ width: "100%" }}
                value={sortBy}
                onChange={handleSortChange}
              >
                <Select.Option value="latest">الأحدث</Select.Option>
                <Select.Option value="popular">الأكثر شعبية</Select.Option>
                <Select.Option value="trending">الأكثر تداولاً</Select.Option>
                <Select.Option value="oldest">الأقدم</Select.Option>
              </Select>
            </Col>
            <Col
              xs={{ span: 24, order: 5 }}
              sm={{ span: 12, order: 4 }}
              md={{ span: 4, order: 4 }}
            >
              <Space size="small">
                <Button.Group>
                  <Button
                    icon={<AppstoreOutlined />}
                    type={viewMode === "grid" ? "primary" : "default"}
                    onClick={() => setViewMode("grid")}
                  />
                  <Button
                    icon={<UnorderedListOutlined />}
                    type={viewMode === "list" ? "primary" : "default"}
                    onClick={() => setViewMode("list")}
                  />
                </Button.Group>
              </Space>
            </Col>
            {/* Clear Filters Button - Only show when filters are active */}
            {hasActiveFilters && (
              <Col
                xs={{ span: 24, order: 6 }}
                sm={{ span: 12, order: 6 }}
                md={{ span: 4, order: 6 }}
              >
                <Button icon={<FilterOutlined />} onClick={clearFilters} block>
                  إلغاء الفلاتر
                </Button>
              </Col>
            )}
          </Row>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="blog-page-active-filters">
              <Space wrap>
                <Text strong>الفلاتر النشطة:</Text>
                {searchQuery && (
                  <Tag closable onClose={() => handleSearch("")}>
                    البحث: {searchQuery}
                  </Tag>
                )}
                {selectedCategory && (
                  <Tag
                    closable
                    onClose={() => handleCategoryFilter("")}
                    color={
                      categories.find((cat) => cat.slug === selectedCategory)
                        ?.color
                    }
                  >
                    {
                      categories.find((cat) => cat.slug === selectedCategory)
                        ?.name
                    }
                  </Tag>
                )}
                {selectedTag && (
                  <Tag closable onClose={() => handleTagFilter("")}>
                    العلامة:{" "}
                    {tags.find((tag) => tag.slug === selectedTag)?.name}
                  </Tag>
                )}
                {sortBy !== "latest" && (
                  <Tag closable onClose={() => handleSortChange("latest")}>
                    الترتيب:{" "}
                    {sortBy === "popular"
                      ? "الأكثر شعبية"
                      : sortBy === "trending"
                      ? "الأكثر تداولاً"
                      : "الأقدم"}
                  </Tag>
                )}
              </Space>
            </div>
          )}
        </Card>

        {/* Blog Posts List */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={18}>
            <ScrollableContainer
              maxHeight={isDesktop ? "calc(100vh - 140px)" : "auto"}
              showScrollButtons={isDesktop}
              showScrollShadows={isDesktop}
              scrollButtonPosition="outside"
              className="blog-page-list-scroll"
            >
              <BlogList
                posts={posts}
                loading={loading}
                variant={viewMode}
                showPagination={true}
                pagination={pagination || undefined}
                onPageChange={handlePageChange}
                onPostClick={handlePostClick}
                className="blog-page-list"
              />
            </ScrollableContainer>
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={6}>
            <div className="blog-page-sidebar-wrapper">
              {/* Conditional Affix based on screen size */}
              {isDesktop ? (
                <ScrollableContainer
                  maxHeight="calc(100vh - 180px)"
                  showScrollButtons={true}
                  showScrollShadows={true}
                  scrollButtonPosition="inside"
                  className="blog-page-sidebar-scroll"
                >
                  <BlogSidebar
                    categories={categories}
                    tags={tags}
                    recentPosts={recentPosts}
                    popularPosts={popularPosts}
                    onCategoryClick={handleCategoryFilter}
                    onTagClick={handleTagFilter}
                    onPostClick={handlePostClick}
                    className="blog-page-sidebar"
                  />
                </ScrollableContainer>
              ) : (
                <BlogSidebar
                  categories={categories}
                  tags={tags}
                  recentPosts={isMobile ? recentPosts.slice(0, 3) : recentPosts}
                  popularPosts={
                    isMobile ? popularPosts.slice(0, 3) : popularPosts
                  }
                  onCategoryClick={handleCategoryFilter}
                  onTagClick={handleTagFilter}
                  onPostClick={handlePostClick}
                  className="blog-page-sidebar"
                />
              )}
            </div>
          </Col>
        </Row>
      </div>

      {/* Back to Top */}
      <BackTop />
    </ErrorBoundary>
  );
};

export default BlogPage;
