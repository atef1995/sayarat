import React from "react";
import { Form, Select, Switch, Button, InputNumber, FormInstance } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { BlogFormData } from "../../hooks/useBlogForm";

const { Option } = Select;

interface BlogPublishSidebarProps {
  saving: boolean;
  onSaveDraft: () => void;
  onPublish: (values: BlogFormData) => void;
  form: FormInstance;
}

/**
 * Blog publish sidebar component
 */
export const BlogPublishSidebar: React.FC<BlogPublishSidebarProps> = ({
  saving,
  onSaveDraft,
  onPublish,
  form,
}) => {
  return (
    <div className="rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-6 border-b pb-3">Publish</h3>
      <div className="space-y-6">
        <Form.Item
          name="status"
          label={<span className="text-sm font-medium">Status</span>}
          initialValue="draft"
          className="mb-0"
        >
          <Select className="w-full">
            <Option value="draft">Draft</Option>
            <Option value="published">Published</Option>
          </Select>
        </Form.Item>

        <Form.Item name="is_featured" valuePropName="checked" className="mb-0">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <span className="text-sm font-medium">Featured Post</span>
            <Switch checkedChildren="Featured" unCheckedChildren="Regular" />
          </div>
        </Form.Item>

        <Form.Item
          name="reading_time"
          label={
            <span className="text-sm font-medium">Reading Time (minutes)</span>
          }
          className="mb-0"
        >
          <InputNumber min={1} placeholder="5" className="w-full" />
        </Form.Item>

        <div className="pt-4 border-t">
          <div className="flex flex-col gap-3">
            <Button
              type="default"
              onClick={onSaveDraft}
              loading={saving}
              icon={<SaveOutlined />}
              className="w-full"
              size="large"
            >
              Save Draft
            </Button>
            <Button
              type="primary"
              onClick={() => {
                form.validateFields().then((values: BlogFormData) => {
                  onPublish(values);
                });
              }}
              loading={saving}
              className="w-full"
              size="large"
            >
              Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
