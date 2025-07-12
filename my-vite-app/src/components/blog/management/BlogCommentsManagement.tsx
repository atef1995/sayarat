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
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  UserOutlined,
  MessageOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// Mock data structure for comments
interface BlogComment {
  id: number;
  content: string;
  author_name: string;
  author_email: string;
  post_title: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  is_reply: boolean;
  parent_id?: number;
}

/**
 * BlogCommentsManagement Component
 *
 * Management interface for moderating blog comments
 */
const BlogCommentsManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Mock data - replace with actual hook
  const comments: BlogComment[] = [];
  const isLoading = false;

  const filteredComments = comments.filter((comment) => {
    const matchesSearch =
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || comment.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApproveComment = async (commentId: number) => {
    try {
      // TODO: Implement approve comment mutation
      message.success("تم الموافقة على التعليق");
    } catch (error) {
      message.error("فشل في الموافقة على التعليق");
    }
  };

  const handleRejectComment = async (commentId: number) => {
    try {
      // TODO: Implement reject comment mutation
      message.success("تم رفض التعليق");
    } catch (error) {
      message.error("فشل في رفض التعليق");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      // TODO: Implement delete comment mutation
      message.success("تم حذف التعليق");
    } catch (error) {
      message.error("فشل في حذف التعليق");
    }
  };

  const columns = [
    {
      title: "التعليق",
      dataIndex: "content",
      key: "content",
      render: (content: string, record: BlogComment) => (
        <div className="max-w-md">
          <div className="flex items-start gap-3 mb-2">
            <Avatar icon={<UserOutlined />} size="small" />
            <div className="flex-1">
              <div className="font-medium text-sm">{record.author_name}</div>
              <div className="text-xs text-gray-500">{record.author_email}</div>
            </div>
          </div>
          <div className="text-sm text-gray-800 dark:text-gray-200">
            {content}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            على منشور: {record.post_title}
          </div>
        </div>
      ),
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusConfig = {
          pending: { color: "orange", text: "في الانتظار" },
          approved: { color: "green", text: "موافق عليه" },
          rejected: { color: "red", text: "مرفوض" },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "التاريخ",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString("ar-SA"),
    },
    {
      title: "النوع",
      dataIndex: "is_reply",
      key: "is_reply",
      render: (isReply: boolean) => (
        <Tag color={isReply ? "purple" : "blue"}>
          {isReply ? "رد" : "تعليق"}
        </Tag>
      ),
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_: any, record: BlogComment) => (
        <Space size="small">
          {record.status === "pending" && (
            <>
              <Tooltip title="موافقة">
                <Button
                  icon={<CheckOutlined />}
                  size="small"
                  type="primary"
                  onClick={() => handleApproveComment(record.id)}
                />
              </Tooltip>

              <Tooltip title="رفض">
                <Button
                  icon={<CloseOutlined />}
                  size="small"
                  danger
                  onClick={() => handleRejectComment(record.id)}
                />
              </Tooltip>
            </>
          )}

          <Popconfirm
            title="هل أنت متأكد من حذف هذا التعليق؟"
            onConfirm={() => handleDeleteComment(record.id)}
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
          إدارة التعليقات
        </Title>

        <div className="flex items-center gap-2">
          <MessageOutlined className="text-blue-500" />
          <span className="text-sm text-gray-600">
            {filteredComments.length} تعليق
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Search
            placeholder="البحث في التعليقات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />

          <Select
            placeholder="حالة التعليق"
            value={selectedStatus}
            onChange={setSelectedStatus}
            className="w-full"
          >
            <Option value="all">جميع الحالات</Option>
            <Option value="pending">في الانتظار</Option>
            <Option value="approved">موافق عليه</Option>
            <Option value="rejected">مرفوض</Option>
          </Select>
        </div>
      </Card>

      {/* Comments Table */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredComments}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredComments.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} من ${total} تعليق`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
          className="overflow-x-auto"
        />
      </Card>
    </div>
  );
};

export default BlogCommentsManagement;
