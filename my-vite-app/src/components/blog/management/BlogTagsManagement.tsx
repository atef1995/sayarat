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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { useTags } from "../../../hooks/useBlogQueries";
import { BlogTag } from "../../../types/blogTypes";

const { Title } = Typography;

interface TagFormValues {
  name: string;
  color?: string;
}
const { Search } = Input;

/**
 * BlogTagsManagement Component
 *
 * Management interface for blog tags
 */
const BlogTagsManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null);
  const [form] = Form.useForm();

  const { data: tags, isLoading, refetch } = useTags();

  const filteredTags =
    tags?.filter((tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const handleCreateTag = () => {
    setEditingTag(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditTag = (tag: BlogTag) => {
    setEditingTag(tag);
    form.setFieldsValue(tag);
    setIsModalVisible(true);
  };

  const handleDeleteTag = async (tagId: number) => {
    try {
      // TODO: Implement delete tag mutation
      console.log("Deleting tag:", tagId);
      message.success("تم حذف العلامة بنجاح");
      refetch();
    } catch (error) {
      console.error("Delete tag error:", error);
      message.error("فشل في حذف العلامة");
    }
  };

  const handleSubmit = async (values: TagFormValues) => {
    try {
      if (editingTag) {
        // TODO: Implement update tag mutation
        console.log("Updating tag:", editingTag.id, "with values:", values);
        message.success("تم تحديث العلامة بنجاح");
      } else {
        // TODO: Implement create tag mutation
        console.log("Creating tag with values:", values);
        message.success("تم إنشاء العلامة بنجاح");
      }
      setIsModalVisible(false);
      refetch();
    } catch (error) {
      console.error("Submit tag error:", error);
      message.error("فشل في حفظ العلامة");
    }
  };

  const columns = [
    {
      title: "الاسم",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: BlogTag) => (
        <div className="flex items-center gap-3">
          <TagOutlined className="text-blue-500" />
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-gray-500">{record.slug}</div>
          </div>
        </div>
      ),
    },
    {
      title: "عدد المنشورات",
      dataIndex: "posts_count",
      key: "posts_count",
      render: (count: number) => <Tag color="blue">{count || 0} منشور</Tag>,
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: unknown, record: BlogTag) => (
        <Space size="small">
          <Tooltip title="تحرير">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditTag(record)}
            />
          </Tooltip>

          <Popconfirm
            title="هل أنت متأكد من حذف هذه العلامة؟"
            onConfirm={() => handleDeleteTag(record.id)}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Title level={3} className="!mb-0">
          إدارة العلامات
        </Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateTag}
          className="rounded-lg"
        >
          إنشاء علامة جديدة
        </Button>
      </div>

      <Card className="shadow-sm">
        <Search
          placeholder="البحث في العلامات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
          allowClear
        />
      </Card>

      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredTags}
          loading={isLoading}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} من ${total} علامة`,
          }}
        />
      </Card>

      <Modal
        title={editingTag ? "تحرير العلامة" : "إنشاء علامة جديدة"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="اسم العلامة"
            name="name"
            rules={[{ required: true, message: "يرجى إدخال اسم العلامة" }]}
          >
            <Input placeholder="أدخل اسم العلامة" />
          </Form.Item>

          <Form.Item
            label="العنوان المختصر (Slug)"
            name="slug"
            rules={[{ required: true, message: "يرجى إدخال العنوان المختصر" }]}
          >
            <Input placeholder="tag-slug" />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={() => setIsModalVisible(false)}>إلغاء</Button>
            <Button type="primary" htmlType="submit">
              {editingTag ? "تحديث" : "إنشاء"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default BlogTagsManagement;
