import React from "react";
import { Form, Select, Input, Button, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { BlogCategory, BlogTag } from "../../types/blogTypes";

const { Option } = Select;

interface BlogCategoryTagsSidebarProps {
  categories: BlogCategory[];
  tags: BlogTag[];
  selectedTags: number[];
  onSelectedTagsChange: (tags: number[]) => void;
  newTag: string;
  onNewTagChange: (value: string) => void;
  onAddTag: () => void;
}

/**
 * Blog category and tags sidebar component
 */
export const BlogCategoryTagsSidebar: React.FC<
  BlogCategoryTagsSidebarProps
> = ({
  categories,
  tags,
  selectedTags,
  onSelectedTagsChange,
  newTag,
  onNewTagChange,
  onAddTag,
}) => {
  return (
    <>
      {/* Categories */}
      <div className="rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-6 border-b pb-3">Category</h3>
        <Form.Item
          name="category_id"
          rules={[{ required: true, message: "Please select a category" }]}
          className="mb-0"
        >
          <Select placeholder="Select category" className="w-full" size="large">
            {categories.map((category) => (
              <Option key={category.id} value={category.id}>
                <Tag color={category.color}>{category.name}</Tag>
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      {/* Tags */}
      <div className="rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-6 border-b pb-3">Tags</h3>
        <div className="space-y-4">
          <Select
            mode="multiple"
            placeholder="Select tags"
            value={selectedTags}
            onChange={onSelectedTagsChange}
            className="w-full"
            size="large"
          >
            {tags.map((tag) => (
              <Option key={tag.id} value={tag.id}>
                {tag.name}
              </Option>
            ))}
          </Select>

          <div className="flex gap-2">
            <Input
              placeholder="Add new tag"
              value={newTag}
              onChange={(e) => onNewTagChange(e.target.value)}
              onPressEnter={onAddTag}
              className="flex-1"
              size="large"
            />
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={onAddTag}
              size="large"
            />
          </div>
        </div>
      </div>
    </>
  );
};
