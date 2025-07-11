import React from "react";
import { Form, Input, Button, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { BlogEditorUtils } from "../../utils/blogEditorUtils";

const { TextArea } = Input;

interface BlogContentFormProps {
  imagePreview: string | null;
  onImageUpload: (
    file: File,
    onSuccess?: (result: { url: string }) => void,
    onError?: (error: Error) => void
  ) => void;
  onImageRemove: () => void;
}

/**
 * Blog content form section component
 */
export const BlogContentForm: React.FC<BlogContentFormProps> = ({
  imagePreview,
  onImageUpload,
  onImageRemove,
}) => {
  return (
    <div className="rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-6 border-b pb-3">Content</h3>
      <div className="space-y-8">
        <Form.Item
          name="slug"
          label={<span className="text-sm font-medium">slug</span>}
          rules={[{ required: true, message: "Please enter a slug" }]}
          className="mb-0"
        >
          <Input
            placeholder="Enter blog post slug..."
            size="large"
            className="w-full"
          />
        </Form.Item>
        <Form.Item
          name="title"
          label={<span className="text-sm font-medium">Title</span>}
          rules={[{ required: true, message: "Please enter a title" }]}
          className="mb-0"
        >
          <Input
            placeholder="Enter blog post title..."
            size="large"
            className="w-full"
          />
        </Form.Item>

        <Form.Item
          name="excerpt"
          label={<span className="text-sm font-medium">Excerpt</span>}
          rules={[{ required: true, message: "Please enter an excerpt" }]}
          className="mb-0"
        >
          <TextArea
            rows={3}
            placeholder="Brief description of the blog post..."
            showCount
            maxLength={300}
            className="w-full"
          />
        </Form.Item>

        <Form.Item
          name="content"
          label={<span className="text-sm font-medium">Content</span>}
          rules={[{ required: true, message: "Please enter content" }]}
          className="mb-0"
        >
          <TextArea
            rows={20}
            placeholder="Write your blog post content here..."
            className="w-full min-h-96"
          />
        </Form.Item>

        <Form.Item
          name="featured_image"
          label={<span className="text-sm font-medium">Featured Image</span>}
          className="mb-0"
        >
          <div className="w-full">
            {imagePreview ? (
              <div className="relative w-full">
                <img
                  src={imagePreview}
                  alt="Featured image preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  type="text"
                  danger
                  className="absolute top-2 right-2 bg-white shadow-md"
                  onClick={onImageRemove}
                >
                  ✕
                </Button>
                <Button
                  type="default"
                  className="absolute bottom-2 right-2 shadow-md"
                  onClick={onImageRemove}
                >
                  Change Image
                </Button>
              </div>
            ) : (
              <Upload
                name="image"
                listType="picture-card"
                className="w-full upload-container"
                showUploadList={false}
                type="drag"
                customRequest={({ file, onSuccess, onError }) => {
                  if (file instanceof File) {
                    onImageUpload(file, onSuccess, onError);
                  }
                }}
                accept="image/*"
                beforeUpload={BlogEditorUtils.validateImageFile}
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  minHeight: "120px",
                }}
              >
                <div className="w-full p-6 text-center border-2 border-dashed rounded-lg hover:border-blue-400 transition-colors hover:bg-opacity-50">
                  <UploadOutlined className="text-2xl mb-2 opacity-60" />
                  <div className="text-sm">Click or drag image to upload</div>
                  <div className="text-xs mt-1 opacity-60">Max size: 5MB</div>
                </div>
              </Upload>
            )}
          </div>
        </Form.Item>
      </div>
    </div>
  );
};
