import React from "react";
import { Form, Input } from "antd";

const { TextArea } = Input;

/**
 * Blog SEO form sidebar component
 */
export const BlogSEOSidebar: React.FC = () => {
  return (
    <div className="rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-6 border-b pb-3">SEO</h3>
      <div className="space-y-6">
        <Form.Item
          name="meta_title"
          label={<span className="text-sm font-medium">Meta Title</span>}
          className="mb-0"
        >
          <Input
            placeholder="SEO title"
            showCount
            maxLength={60}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="meta_description"
          label={<span className="text-sm font-medium">Meta Description</span>}
          className="mb-0"
        >
          <TextArea
            rows={3}
            placeholder="SEO description"
            showCount
            maxLength={160}
            size="large"
          />
        </Form.Item>
      </div>
    </div>
  );
};
