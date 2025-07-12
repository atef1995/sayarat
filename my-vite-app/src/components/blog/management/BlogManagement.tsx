import React, { useState } from "react";
import {
  Card,
  Tabs,
  Row,
  Col,
  Statistic,
  Typography,
  Button,
  Space,
  Alert,
} from "antd";
import {
  FileTextOutlined,
  TagsOutlined,
  FolderOutlined,
  MessageOutlined,
  BarChartOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../hooks/useAuth";
import { useBlogStats } from "../../../hooks/useBlogQueries";
import BlogPostsManagement from "./BlogPostsManagement";
import BlogCategoriesManagement from "./BlogCategoriesManagement";
import BlogTagsManagement from "./BlogTagsManagement";
import BlogCommentsManagement from "./BlogCommentsManagement";
import BlogAnalytics from "./BlogAnalytics";

const { Title } = Typography;
const { TabPane } = Tabs;

/**
 * BlogManagement Component
 *
 * Main admin dashboard for managing blog content, categories, tags, and comments
 */
const BlogManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const { data: blogStats, isLoading: statsLoading } = useBlogStats();

  // Check if user has admin permissions
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Alert
          message="غير مصرح لك بالوصول"
          description="هذه الصفحة مخصصة للمدراء فقط"
          type="error"
          showIcon
          className="max-w-md"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Title level={2} className="!mb-0 text-gray-900 dark:text-white">
            إدارة المدونة
          </Title>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setActiveTab("posts")}
            >
              منشور جديد
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card className="shadow-sm rounded-lg">
              <Statistic
                title="إجمالي المنشورات"
                value={blogStats?.total_posts || 0}
                loading={statsLoading}
                prefix={<FileTextOutlined className="text-blue-500" />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card className="shadow-sm rounded-lg">
              <Statistic
                title="الفئات"
                value={blogStats?.total_categories || 0}
                loading={statsLoading}
                prefix={<FolderOutlined className="text-green-500" />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card className="shadow-sm rounded-lg">
              <Statistic
                title="العلامات"
                value={blogStats?.total_tags || 0}
                loading={statsLoading}
                prefix={<TagsOutlined className="text-purple-500" />}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card className="shadow-sm rounded-lg">
              <Statistic
                title="التعليقات"
                value={blogStats?.total_comments || 0}
                loading={statsLoading}
                prefix={<MessageOutlined className="text-orange-500" />}
                valueStyle={{ color: "#fa8c16" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Management Tabs */}
        <Card className="shadow-sm rounded-lg">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            className="blog-management-tabs"
          >
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <FileTextOutlined />
                  المنشورات
                </span>
              }
              key="posts"
            >
              <BlogPostsManagement />
            </TabPane>

            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <FolderOutlined />
                  الفئات
                </span>
              }
              key="categories"
            >
              <BlogCategoriesManagement />
            </TabPane>

            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <TagsOutlined />
                  العلامات
                </span>
              }
              key="tags"
            >
              <BlogTagsManagement />
            </TabPane>

            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <MessageOutlined />
                  التعليقات
                </span>
              }
              key="comments"
            >
              <BlogCommentsManagement />
            </TabPane>

            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <BarChartOutlined />
                  الإحصائيات
                </span>
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
