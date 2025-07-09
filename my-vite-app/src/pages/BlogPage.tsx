import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Breadcrumb,
  Card,
  Tag,
  Affix,
  BackTop,
  message,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  HomeOutlined,
  BookOutlined,
} from "@ant-design/icons";
import {
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogSearchParams,
  BlogPaginationResponse,
} from "../types/blogTypes";
import { AuthContext } from "../context/AuthContext";
import blogService from "../services/blogService";
import { BlogList, BlogSidebar, FeaturedBlogs } from "../components/blog";
import ErrorBoundary from "../components/common/ErrorBoundary";
import "./BlogPage.css";
import { useNavigate } from "react-router";

const { Title, Text } = Typography;
const { Search } = Input;

/**
 * Custom hook for managing blog page state and logic
 * Implements separation of concerns by keeping data logic separate from UI
 */
const useBlogPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<
    BlogPaginationResponse<BlogPost>["pagination"] | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  /**
   * Fetch blog posts with current filters
   */
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params: BlogSearchParams = {
        page: currentPage,
        limit: 12,
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        tag: selectedTag || undefined,
        sort: sortBy as "latest" | "oldest" | "popular" | "trending",
        status: "published",
      };

      const response = await blogService.getBlogPosts(params);
      console.log("Fetched posts:", response);

      setPosts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      message.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedCategory, selectedTag, sortBy]);

  /**
   * Fetch sidebar data
   */
  const fetchSidebarData = useCallback(async () => {
    try {
      const [categoriesRes, tagsRes, recentRes, popularRes] = await Promise.all(
        [
          blogService.getBlogCategories(),
          blogService.getBlogTags(),
          blogService.getBlogPosts({
            limit: 5,
            sort: "latest",
            status: "published",
          }),
          blogService.getBlogPosts({
            limit: 5,
            sort: "popular",
            status: "published",
          }),
        ]
      );

      setCategories(categoriesRes);
      setTags(tagsRes);
      setRecentPosts(recentRes.data);
      setPopularPosts(popularRes.data);
    } catch (error) {
      console.error("Failed to fetch sidebar data:", error);
    }
  }, []);

  /**
   * Fetch featured posts
   */
  const fetchFeaturedPosts = useCallback(async () => {
    try {
      const response = await blogService.getBlogPosts({
        limit: 6,
        featured: true,
        status: "published",
      });
      setFeaturedPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch featured posts:", error);
    }
  }, []);

  return {
    posts,
    categories,
    tags,
    featuredPosts,
    recentPosts,
    popularPosts,
    loading,
    pagination,
    currentPage,
    searchQuery,
    selectedCategory,
    selectedTag,
    sortBy,
    fetchPosts,
    fetchSidebarData,
    fetchFeaturedPosts,
    setCurrentPage,
    setSearchQuery,
    setSelectedCategory,
    setSelectedTag,
    setSortBy,
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const navigate = useNavigate();
  const {
    posts,
    categories,
    tags,
    featuredPosts,
    recentPosts,
    popularPosts,
    loading,
    pagination,
    searchQuery,
    selectedCategory,
    selectedTag,
    sortBy,
    fetchPosts,
    fetchSidebarData,
    fetchFeaturedPosts,
    setCurrentPage,
    setSearchQuery,
    setSelectedCategory,
    setSelectedTag,
    setSortBy,
  } = useBlogPage();

  // Fetch data on component mount
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchSidebarData();
    fetchFeaturedPosts();
  }, [fetchSidebarData, fetchFeaturedPosts]);

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
    // #TODO: Navigate to blog post detail page
    console.log("Navigate to post:", post.slug);
    navigate(`/blog/${post.slug}/${post.id}`);
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

      <div className="container">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} className="blog-page-title">
              <BookOutlined /> مدونة السيارات
            </Title>
            <Text type="secondary">
              أحدث الأخبار والمقالات عن عالم السيارات
            </Text>
          </Col>
          {user && (
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  // #TODO: Navigate to blog creation page
                  console.log("Navigate to blog creation");
                }}
              >
                إنشاء مقال جديد
              </Button>
            </Col>
          )}
        </Row>
      </div>

      {/* Breadcrumb */}
      <div className="blog-page-breadcrumb">
        <div className="container">
          <Breadcrumb>
            <Breadcrumb.Item>
              <HomeOutlined />
              <span>الرئيسية</span>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <BookOutlined />
              <span>المدونة</span>
            </Breadcrumb.Item>
            {selectedCategory && (
              <Breadcrumb.Item>
                {categories.find((cat) => cat.slug === selectedCategory)?.name}
              </Breadcrumb.Item>
            )}
          </Breadcrumb>
        </div>
      </div>

      {/* Featured Posts Section */}
      {featuredPosts?.length > 0 && !hasActiveFilters && (
        <div className="blog-page-featured">
          <div className="container">
            <FeaturedBlogs
              posts={featuredPosts}
              onPostClick={handlePostClick}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container">
        {/* Search and Filters */}
        <Card className="blog-page-filters">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="البحث في المقالات..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                defaultValue={searchQuery}
                onSearch={handleSearch}
              />
            </Col>
            <Col xs={12} sm={6} md={4}>
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
            <Col xs={12} sm={6} md={4}>
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
            <Col xs={24} sm={12} md={4}>
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
            <Col xs={24} sm={12} md={4}>
              {hasActiveFilters && (
                <Button icon={<FilterOutlined />} onClick={clearFilters} block>
                  إلغاء الفلاتر
                </Button>
              )}
            </Col>
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
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={6}>
            <Affix offsetTop={80}>
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
            </Affix>
          </Col>
        </Row>
      </div>

      {/* Back to Top */}
      <BackTop />
    </ErrorBoundary>
  );
};

export default BlogPage;
