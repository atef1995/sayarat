import React from "react";
import { useParams } from "react-router";
import { Typography, Breadcrumb } from "antd";
import {
  FileTextOutlined,
  HomeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import BlogEditor from "../components/blog/BlogEditor";
import ErrorBoundary from "../components/common/ErrorBoundary";

const { Title } = Typography;

/**
 * BlogEditorPage Component
 *
 * Dedicated page for creating and editing blog posts.
 * Provides a clean, focused interface for content creation.
 *
 * Features:
 * - Create new blog posts
 * - Edit existing blog posts
 * - Breadcrumb navigation
 * - Error boundary protection
 * - Responsive design
 * - Full-width layout with Tailwind CSS
 * - No background constraints for better content focus
 */
const BlogEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 py-8">
          <div className="max-w-full px-6">
            <Breadcrumb className="mb-4">
              <Breadcrumb.Item href="/">
                <HomeOutlined />
                <span className="opacity-80 hover:opacity-100 transition-opacity text-white">
                  الرئيسية
                </span>
              </Breadcrumb.Item>
              <Breadcrumb.Item href="/blog">
                <FileTextOutlined />
                <span className="opacity-80 hover:opacity-100 transition-opacity text-white">
                  المدونة
                </span>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <EditOutlined />
                <span className="text-white">
                  {isEditMode ? "تحرير المقال" : "إنشاء مقال جديد"}
                </span>
              </Breadcrumb.Item>
            </Breadcrumb>

            <Title
              level={1}
              className="!text-white !mb-0 flex items-center gap-3 text-2xl sm:text-3xl lg:text-4xl font-bold"
            >
              <EditOutlined className="text-2xl sm:text-3xl lg:text-4xl text-white" />
              {isEditMode ? "تحرير المقال" : "إنشاء مقال جديد"}
            </Title>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full">
          <div className="max-w-full">
            <BlogEditor mode={isEditMode ? "edit" : "create"} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BlogEditorPage;
