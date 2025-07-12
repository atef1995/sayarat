import React, { useState } from "react";
import {
  Card,
  Tabs,
  Typography,
  Space,
  Button,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  FileTextOutlined,
  FolderOutlined,
  TagOutlined,
  MessageOutlined,
  PlusOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";
import { useBlogStats } from "../hooks/useBlogQueries";
import BlogPostsManagement from "../components/blog/management/BlogPostsManagement";
import BlogCategoriesManagement from "../components/blog/management/BlogCategoriesManagement";
import BlogTagsManagement from "../components/blog/management/BlogTagsManagement";
import BlogCommentsManagement from "../components/blog/management/BlogCommentsManagement";
import BlogAnalytics from "../components/blog/management/BlogAnalytics";
import { Navigate } from "react-router";

const { Title } = Typography;
const { TabPane } = Tabs;

/**
 * BlogManagement Component
 *
 * Comprehensive admin dashboard for managing blog content including:
 * - Blog posts (CRUD operations)
 * - Categories management
 * - Tags management
 * - Comments moderation
 * - Analytics and statistics
 */
const BlogManagement: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");

  // Fetch blog statistics
  const { data: blogStats } = useBlogStats();
  // const { data: allPosts } = useBlogPosts({
  //   status: "all",
  //   limit: 1,
  // });

  // Use total count from posts pagination for statistics (for future use)
  // const totalPosts = allPosts?.pagination?.totalItems || 0;

  // Check if user is admin
  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Title
                level={2}
                className="!mb-2 !text-gray-900 dark:!text-white"
              >
                إدارة المدونة
              </Title>
              <p className="text-gray-600 dark:text-gray-400">
                إدارة شاملة لمحتوى المدونة والتعليقات والإحصائيات
              </p>
            </div>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              className="rounded-lg"
              onClick={() => setActiveTab("posts")}
            >
              إنشاء منشور جديد
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8">
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card className="text-center shadow-sm rounded-lg">
                <Statistic
                  title="إجمالي المنشورات"
                  value={blogStats?.total_posts || 0}
                  prefix={<FileTextOutlined className="text-blue-500" />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={6}>
              <Card className="text-center shadow-sm rounded-lg">
                <Statistic
                  title="الفئات"
                  value={blogStats?.total_categories || 0}
                  prefix={<FolderOutlined className="text-green-500" />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={6}>
              <Card className="text-center shadow-sm rounded-lg">
                <Statistic
                  title="العلامات"
                  value={blogStats?.total_tags || 0}
                  prefix={<TagOutlined className="text-orange-500" />}
                  valueStyle={{ color: "#fa8c16" }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={6}>
              <Card className="text-center shadow-sm rounded-lg">
                <Statistic
                  title="التعليقات"
                  value={blogStats?.total_comments || 0}
                  prefix={<MessageOutlined className="text-purple-500" />}
                  valueStyle={{ color: "#722ed1" }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* Management Tabs */}
        <Card className="shadow-lg rounded-xl">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            className="blog-management-tabs"
          >
            <TabPane
              tab={
                <Space>
                  <FileTextOutlined />
                  <span className="hidden sm:inline">المنشورات</span>
                </Space>
              }
              key="posts"
            >
              <BlogPostsManagement />
            </TabPane>

            <TabPane
              tab={
                <Space>
                  <FolderOutlined />
                  <span className="hidden sm:inline">الفئات</span>
                </Space>
              }
              key="categories"
            >
              <BlogCategoriesManagement />
            </TabPane>

            <TabPane
              tab={
                <Space>
                  <TagOutlined />
                  <span className="hidden sm:inline">العلامات</span>
                </Space>
              }
              key="tags"
            >
              <BlogTagsManagement />
            </TabPane>

            <TabPane
              tab={
                <Space>
                  <MessageOutlined />
                  <span className="hidden sm:inline">التعليقات</span>
                </Space>
              }
              key="comments"
            >
              <BlogCommentsManagement />
            </TabPane>

            <TabPane
              tab={
                <Space>
                  <BarChartOutlined />
                  <span className="hidden sm:inline">الإحصائيات</span>
                </Space>
              }
              key="analytics"
            >
              <BlogAnalytics />
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default BlogManagement;
