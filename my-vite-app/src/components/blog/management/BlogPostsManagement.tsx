import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Input,
  Select,
  Card,
  Typography,
  Tooltip,
  Avatar,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  useBlogPosts,
  useDeletePost,
  useToggleFeaturedPost,
  usePublishPost,
  useUnpublishPost,
} from "../../../hooks/useBlogQueries";
import { BlogPost } from "../../../types/blogTypes";
import { formatToSyrianDate } from "../../../helper/timeFormat";
import BlogEditorModal from "./BlogEditorModal";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

/**
 * BlogPostsManagement Component
 *
 * Comprehensive management interface for blog posts
 */
const BlogPostsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Data fetching
  const {
    data: postsData,
    isLoading,
    refetch,
  } = useBlogPosts({
    search: searchTerm,
    status: statusFilter === "all" ? undefined : statusFilter,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    page: 1,
    limit: 20,
  });

  // Mutations
  const deleteMutation = useDeletePost();
  const toggleFeaturedMutation = useToggleFeaturedPost();
  const publishMutation = usePublishPost();
  const unpublishMutation = useUnpublishPost();

  // Handle delete post
  const handleDeletePost = async (postId: number) => {
    try {
      await deleteMutation.mutateAsync(postId);
      message.success("تم حذف المنشور بنجاح");
      refetch();
    } catch {
      message.error("فشل في حذف المنشور");
    }
  };

  // Handle toggle featured
  const handleToggleFeatured = async (postId: number) => {
    try {
      await toggleFeaturedMutation.mutateAsync(postId);
      message.success("تم تحديث حالة المنشور المميز");
      refetch();
    } catch {
      message.error("فشل في تحديث حالة المنشور");
    }
  };

  // Handle publish/unpublish
  const handlePublishToggle = async (post: BlogPost) => {
    try {
      if (post.status === "published") {
        await unpublishMutation.mutateAsync(post.id);
        message.success("تم إلغاء نشر المنشور");
      } else {
        await publishMutation.mutateAsync(post.id);
        message.success("تم نشر المنشور");
      }
      refetch();
    } catch {
      message.error("فشل في تحديث حالة النشر");
    }
  };

  // Handle save post
  const handleSavePost = async () => {
    message.success("تم حفظ المنشور بنجاح");
    setShowEditor(false);
    setEditingPost(null);
    refetch();
  };

  const posts = postsData?.data || [];

  const columns = [
    {
      title: "العنوان",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: BlogPost) => (
        <div className="flex items-center gap-3">
          {record.featured_image && (
            <Avatar src={record.featured_image} size={40} shape="square" />
          )}
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {title}
            </div>
            <div className="text-sm text-gray-500">{record.slug}</div>
          </div>
        </div>
      ),
    },
    {
      title: "الكاتب",
      dataIndex: "author_name",
      key: "author_name",
    },
    {
      title: "الفئة",
      dataIndex: "category_name",
      key: "category_name",
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colorMap = {
          published: "green",
          draft: "orange",
          archived: "red",
          scheduled: "purple",
        };
        return (
          <Tag color={colorMap[status as keyof typeof colorMap] || "default"}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "مميز",
      dataIndex: "is_featured",
      key: "is_featured",
      render: (featured: boolean) => (
        <Tag color={featured ? "gold" : "default"}>
          {featured ? "مميز" : "عادي"}
        </Tag>
      ),
    },
    {
      title: "تاريخ الإنشاء",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => formatToSyrianDate(date),
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: unknown, record: BlogPost) => (
        <Space>
          <Tooltip title="معاينة">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => window.open(`/blog/${record.slug}`, "_blank")}
            />
          </Tooltip>

          <Tooltip title="تحرير">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setEditingPost(record);
                setShowEditor(true);
              }}
            />
          </Tooltip>

          <Tooltip title={record.is_featured ? "إلغاء التمييز" : "جعل مميز"}>
            <Button
              type="text"
              size="small"
              onClick={() => handleToggleFeatured(record.id)}
              className={record.is_featured ? "text-gold-500" : "text-gray-500"}
            >
              ⭐
            </Button>
          </Tooltip>

          <Tooltip
            title={record.status === "published" ? "إلغاء النشر" : "نشر"}
          >
            <Button
              type="text"
              size="small"
              onClick={() => handlePublishToggle(record)}
              className={
                record.status === "published"
                  ? "text-green-500"
                  : "text-orange-500"
              }
            >
              {record.status === "published" ? "📤" : "📝"}
            </Button>
          </Tooltip>

          <Popconfirm
            title="هل أنت متأكد من حذف هذا المنشور؟"
            onConfirm={() => handleDeletePost(record.id)}
            okText="نعم"
            cancelText="إلغاء"
          >
            <Tooltip title="حذف">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={4} className="!mb-0">
          إدارة المنشورات
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingPost(null);
            setShowEditor(true);
          }}
        >
          منشور جديد
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Search
            placeholder="البحث في المنشورات..."
            allowClear
            onSearch={setSearchTerm}
            className="w-full"
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full"
            placeholder="تصفية حسب الحالة"
          >
            <Option value="all">جميع الحالات</Option>
            <Option value="published">منشور</Option>
            <Option value="draft">مسودة</Option>
            <Option value="archived">مؤرشف</Option>
            <Option value="scheduled">مجدول</Option>
          </Select>

          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            className="w-full"
            placeholder="تصفية حسب الفئة"
          >
            <Option value="all">جميع الفئات</Option>
          </Select>
        </div>
      </Card>

      {/* Posts Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={posts}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1000 }}
          pagination={{
            total: postsData?.pagination?.totalItems || 0,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} من ${total} منشور`,
          }}
        />
      </Card>

      {/* Post Editor Modal */}
      <BlogEditorModal
        open={showEditor}
        post={editingPost}
        onSave={handleSavePost}
        onCancel={() => {
          setShowEditor(false);
          setEditingPost(null);
        }}
      />
    </div>
  );
};

export default BlogPostsManagement;
