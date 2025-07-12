import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Input,
  Card,
  Modal,
  Form,
  Typography,
  Tooltip,
  Switch,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import { useCategories } from "../../../hooks/useBlogQueries";
import { BlogCategory } from "../../../types/blogTypes";

const { Title } = Typography;
const { Search } = Input;

/**
 * BlogCategoriesManagement Component
 *
 * Management interface for blog categories including:
 * - List all categories
 * - Create, edit, delete categories
 * - Toggle active status
 * - Search and filter
 */
const BlogCategoriesManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(
    null
  );
  const [form] = Form.useForm();

  // React Query hooks
  const { data: categories, isLoading, refetch } = useCategories();

  // Filter categories based on search
  const filteredCategories =
    categories?.filter(
      (category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const handleCreateCategory = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditCategory = (category: BlogCategory) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      slug: category.slug,
    });
    setIsModalVisible(true);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      // TODO: Implement delete category mutation
      message.success("تم حذف الفئة بنجاح");
      refetch();
    } catch (error) {
      message.error("فشل في حذف الفئة");
    }
  };

  const handleToggleActive = async (categoryId: number, isActive: boolean) => {
    try {
      // TODO: Implement toggle active mutation
      message.success(isActive ? "تم تفعيل الفئة" : "تم إلغاء تفعيل الفئة");
      refetch();
    } catch (error) {
      message.error("فشل في تغيير حالة الفئة");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCategory) {
        // TODO: Implement update category mutation
        message.success("تم تحديث الفئة بنجاح");
      } else {
        // TODO: Implement create category mutation
        message.success("تم إنشاء الفئة بنجاح");
      }
      setIsModalVisible(false);
      refetch();
    } catch (error) {
      console.error("Error saving category:", error);
      message.error("فشل في حفظ الفئة");
    }
  };

  // Table columns
  const columns = [
    {
      title: "الاسم",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: BlogCategory) => (
        <div className="flex items-center gap-3">
          <FolderOutlined className="text-blue-500" />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {record.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "الوصف",
      dataIndex: "description",
      key: "description",
      render: (description: string) => (
        <div className="max-w-xs">{description || "-"}</div>
      ),
    },
    {
      title: "عدد المنشورات",
      dataIndex: "posts_count",
      key: "posts_count",
      render: (count: number) => <Tag color="blue">{count || 0} منشور</Tag>,
    },
    {
      title: "الحالة",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean, record: BlogCategory) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleActive(record.id, checked)}
          checkedChildren="مفعل"
          unCheckedChildren="معطل"
        />
      ),
    },
    {
      title: "تاريخ الإنشاء",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString("ar-SA"),
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: any, record: BlogCategory) => (
        <Space size="small">
          <Tooltip title="تحرير">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditCategory(record)}
            />
          </Tooltip>

          <Popconfirm
            title="هل أنت متأكد من حذف هذه الفئة؟"
            description="سيتم نقل جميع المنشورات إلى فئة افتراضية"
            onConfirm={() => handleDeleteCategory(record.id)}
            okText="حذف"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="حذف">
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Title level={3} className="!mb-0">
          إدارة الفئات
        </Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateCategory}
          className="rounded-lg"
        >
          إنشاء فئة جديدة
        </Button>
      </div>

      {/* Search */}
      <Card className="shadow-sm">
        <Search
          placeholder="البحث في الفئات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
          allowClear
        />
      </Card>

      {/* Categories Table */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredCategories}
          loading={isLoading}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} من ${total} فئة`,
          }}
          className="overflow-x-auto"
        />
      </Card>

      {/* Category Editor Modal */}
      <Modal
        title={editingCategory ? "تحرير الفئة" : "إنشاء فئة جديدة"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-4"
        >
          <Form.Item
            label="اسم الفئة"
            name="name"
            rules={[{ required: true, message: "يرجى إدخال اسم الفئة" }]}
          >
            <Input placeholder="أدخل اسم الفئة" />
          </Form.Item>

          <Form.Item
            label="العنوان المختصر (Slug)"
            name="slug"
            rules={[{ required: true, message: "يرجى إدخال العنوان المختصر" }]}
          >
            <Input placeholder="category-slug" />
          </Form.Item>

          <Form.Item label="الوصف" name="description">
            <Input.TextArea placeholder="وصف الفئة (اختياري)" rows={4} />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={() => setIsModalVisible(false)}>إلغاء</Button>
            <Button type="primary" htmlType="submit">
              {editingCategory ? "تحديث" : "إنشاء"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default BlogCategoriesManagement;
