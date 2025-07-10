import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Form,
  Input,
  Select,
  Button,
  Upload,
  Switch,
  message,
  Spin,
  Typography,
  Tag,
  InputNumber,
  Rate,
} from "antd";
import { SaveOutlined, UploadOutlined, PlusOutlined } from "@ant-design/icons";
import {
  BlogCategory,
  BlogTag,
  CreateBlogPostData,
} from "../../types/blogTypes";
import blogService from "../../services/blogService";

// Custom styles for upload component to prevent layout issues
const uploadStyles = `
  .upload-container .ant-upload.ant-upload-select {
    display: block !important;
    width: 100% !important;
    height: auto !important;
    margin: 0 !important;
  }
  
  .upload-container .ant-upload-list {
    display: none !important;
  }
  
  .upload-container .ant-upload-select-picture-card {
    width: 100% !important;
    height: auto !important;
    margin: 0 !important;
    border: none !important;
    background: transparent !important;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = uploadStyles;
  document.head.appendChild(styleElement);
}

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

// #TODO: Move to separate types file for better organization
interface BlogEditorProps {
  mode: "create" | "edit";
}

interface BlogFormData extends Omit<CreateBlogPostData, "tags"> {
  slug?: string;
  car_make?: string;
  car_model?: string;
  car_year?: number;
  rating?: number;
  reading_time?: number;
}

/**
 * Custom hooks for better separation of concerns
 */
const useBlogEditor = (mode: "create" | "edit", id?: string) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // Load categories and tags
      const [categoriesRes, tagsRes] = await Promise.all([
        blogService.getBlogCategories(),
        blogService.getBlogTags(),
      ]);

      if (categoriesRes) {
        setCategories(categoriesRes);
      }

      if (tagsRes) {
        setTags(tagsRes);
      }

      // Return existing post data if editing
      if (mode === "edit" && id) {
        const post = await blogService.getBlogPost(id);
        if (post) {
          setSelectedTags(post.tags?.map((tag: BlogTag) => tag.id) || []);
          return post;
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to load initial data:", error);
      message.error("Failed to load editor data");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mode, id]);

  return {
    loading,
    saving,
    setSaving,
    categories,
    tags,
    setTags,
    selectedTags,
    setSelectedTags,
    loadInitialData,
  };
};

/**
 * Utility functions for better code organization
 */
const BlogEditorUtils = {
  generateSlug: (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  },

  validateImageFile: (file: File): boolean => {
    const isValidType = file.type.startsWith("image/");
    const isValidSize = file.size / 1024 / 1024 < 5; // 5MB limit

    if (!isValidType) {
      message.error("Please upload an image file");
      return false;
    }
    if (!isValidSize) {
      message.error("Image must be smaller than 5MB");
      return false;
    }
    return true;
  },
};

/**
 * BlogEditor Component
 *
 * Comprehensive blog post editor supporting:
 * - Rich text editing
 * - Image upload with validation
 * - Category and tag management
 * - Car-specific fields
 * - SEO optimization
 * - Draft and publish functionality
 * - Error boundaries and proper error handling
 */
const BlogEditor: React.FC<BlogEditorProps> = ({ mode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [newTag, setNewTag] = useState("");

  const {
    loading,
    saving,
    setSaving,
    categories,
    tags,
    setTags,
    selectedTags,
    setSelectedTags,
    loadInitialData,
  } = useBlogEditor(mode, id);

  useEffect(() => {
    loadInitialData().then((post) => {
      // Populate form with existing data if editing
      if (post) {
        form.setFieldsValue({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          category_id: post.category_id,
          status: post.status,
          is_featured: post.is_featured,
          meta_title: post.meta_title,
          meta_description: post.meta_description,
          car_make: post.car_make,
          car_model: post.car_model,
          car_year: post.car_year,
          rating: post.rating,
          reading_time: post.reading_time,
        });
      }
    });
  }, [loadInitialData, form]);

  const handleSave = async (
    values: BlogFormData,
    status: "draft" | "published" = "draft"
  ) => {
    try {
      setSaving(true);

      // Generate slug if not provided
      const slug = values.slug || BlogEditorUtils.generateSlug(values.title);

      const postData: CreateBlogPostData = {
        title: values.title,
        content: values.content,
        excerpt: values.excerpt,
        featured_image: values.featured_image,
        category_id: values.category_id,
        status,
        is_featured: values.is_featured || false,
        meta_title: values.meta_title,
        meta_description: values.meta_description,
        tags: selectedTags.map(String), // Convert numbers to strings as expected by CreateBlogPostData
      };

      // #TODO: Include slug in the API call once backend supports it
      console.log("Generated slug:", slug); // Temporary logging for debugging

      let response;
      if (mode === "edit" && id) {
        response = await blogService.updateBlogPost({
          id: parseInt(id),
          ...postData,
        });
      } else {
        response = await blogService.createBlogPost(postData);
      }

      if (response) {
        message.success(
          `Blog post ${
            status === "published" ? "published" : "saved"
          } successfully`
        );
        navigate("/blog");
      } else {
        throw new Error("Failed to save blog post - no response received");
      }
    } catch (error) {
      console.error("Failed to save blog post:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save blog post";
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) {
      message.warning("Please enter a tag name");
      return;
    }

    // Check if tag already exists
    const existingTag = tags.find(
      (tag) => tag.name.toLowerCase() === newTag.trim().toLowerCase()
    );

    if (existingTag) {
      message.info("Tag already exists");
      if (!selectedTags.includes(existingTag.id)) {
        setSelectedTags([...selectedTags, existingTag.id]);
      }
      setNewTag("");
      return;
    }

    try {
      // Create new tag using backend service
      const newTagData = await blogService.createBlogTag({
        name: newTag.trim(),
        slug: BlogEditorUtils.generateSlug(newTag.trim()),
      });

      // Update local state with the new tag
      setTags([...tags, newTagData]);
      setSelectedTags([...selectedTags, newTagData.id]);
      message.success("Tag created and added successfully");
      setNewTag("");
    } catch (error) {
      console.error("Failed to create tag:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create tag";
      message.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96 p-8">
        <div className="rounded-lg shadow-sm border p-8 max-w-md mx-auto text-center">
          <div className="space-y-4">
            <Spin size="large" />
            <Title level={4} className="mt-4">
              Loading Editor...
            </Title>
            <p className="text-sm opacity-70">
              Please wait while we prepare the blog editor for you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-6">
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => handleSave(values, "draft")}
          className="w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content Area - Full width on mobile, 2/3 on desktop */}
            <div className="lg:col-span-2 space-y-6">
              {/* Content Section */}
              <div className="rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-6 border-b pb-3">
                  Content
                </h3>
                <div className="space-y-8">
                  <Form.Item
                    name="title"
                    label={<span className="text-sm font-medium">Title</span>}
                    rules={[
                      { required: true, message: "Please enter a title" },
                    ]}
                    className="mb-0"
                  >
                    <Input
                      placeholder="Enter blog post title..."
                      size="large"
                      className="w-full"
                      onChange={(e) => {
                        const slug = BlogEditorUtils.generateSlug(
                          e.target.value
                        );
                        form.setFieldsValue({ slug });
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="excerpt"
                    label={<span className="text-sm font-medium">Excerpt</span>}
                    rules={[
                      { required: true, message: "Please enter an excerpt" },
                    ]}
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
                    rules={[
                      { required: true, message: "Please enter content" },
                    ]}
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
                    label={
                      <span className="text-sm font-medium">
                        Featured Image
                      </span>
                    }
                    className="mb-0"
                  >
                    <div className="w-full">
                      <Upload
                        name="image"
                        listType="picture-card"
                        className="w-full upload-container"
                        showUploadList={false}
                        customRequest={({ file, onSuccess, onError }) => {
                          if (file instanceof File) {
                            blogService
                              .uploadBlogImage(file)
                              .then((result) => {
                                form.setFieldsValue({
                                  featured_image: result.url,
                                });
                                onSuccess?.(result);
                                message.success("Image uploaded successfully");
                              })
                              .catch((error) => {
                                console.error("Upload error:", error);
                                onError?.(error);
                                message.error("Failed to upload image");
                              });
                          }
                        }}
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
                          <div className="text-sm">
                            Click or drag image to upload
                          </div>
                          <div className="text-xs mt-1 opacity-60">
                            Max size: 5MB
                          </div>
                        </div>
                      </Upload>
                    </div>
                  </Form.Item>
                </div>
              </div>

              {/* Car Information Section */}
              <div className="rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-6 border-b pb-3">
                  Car Information (Optional)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Form.Item
                    name="car_make"
                    label={
                      <span className="text-sm font-medium">Car Make</span>
                    }
                    className="mb-0"
                  >
                    <Input placeholder="e.g., Toyota, BMW, Mercedes" />
                  </Form.Item>
                  <Form.Item
                    name="car_model"
                    label={
                      <span className="text-sm font-medium">Car Model</span>
                    }
                    className="mb-0"
                  >
                    <Input placeholder="e.g., Camry, X5, C-Class" />
                  </Form.Item>
                  <Form.Item
                    name="car_year"
                    label={<span className="text-sm font-medium">Year</span>}
                    className="mb-0"
                  >
                    <InputNumber
                      min={1900}
                      max={new Date().getFullYear() + 2}
                      placeholder="2023"
                      className="w-full"
                    />
                  </Form.Item>
                  <Form.Item
                    name="rating"
                    label={<span className="text-sm font-medium">Rating</span>}
                    className="mb-0"
                  >
                    <Rate allowHalf />
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* Sidebar - Full width on mobile, 1/3 on desktop */}
            <div className="lg:col-span-1 space-y-6">
              {/* Publishing Options */}
              <div className="rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-6 border-b pb-3">
                  Publish
                </h3>
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

                  <Form.Item
                    name="is_featured"
                    valuePropName="checked"
                    className="mb-0"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm font-medium">Featured Post</span>
                      <Switch
                        checkedChildren="Featured"
                        unCheckedChildren="Regular"
                      />
                    </div>
                  </Form.Item>

                  <Form.Item
                    name="reading_time"
                    label={
                      <span className="text-sm font-medium">
                        Reading Time (minutes)
                      </span>
                    }
                    className="mb-0"
                  >
                    <InputNumber min={1} placeholder="5" className="w-full" />
                  </Form.Item>

                  <div className="pt-4 border-t">
                    <div className="flex flex-col gap-3">
                      <Button
                        type="default"
                        onClick={() => form.submit()}
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
                          form.validateFields().then((values) => {
                            handleSave(values, "published");
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

              {/* Categories */}
              <div className="rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-6 border-b pb-3">
                  Category
                </h3>
                <Form.Item
                  name="category_id"
                  rules={[
                    { required: true, message: "Please select a category" },
                  ]}
                  className="mb-0"
                >
                  <Select
                    placeholder="Select category"
                    className="w-full"
                    size="large"
                  >
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
                <h3 className="text-lg font-semibold mb-6 border-b pb-3">
                  Tags
                </h3>
                <div className="space-y-4">
                  <Select
                    mode="multiple"
                    placeholder="Select tags"
                    value={selectedTags}
                    onChange={setSelectedTags}
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
                      onChange={(e) => setNewTag(e.target.value)}
                      onPressEnter={handleAddTag}
                      className="flex-1"
                      size="large"
                    />
                    <Button
                      type="default"
                      icon={<PlusOutlined />}
                      onClick={handleAddTag}
                      size="large"
                    />
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-6 border-b pb-3">
                  SEO
                </h3>
                <div className="space-y-6">
                  <Form.Item
                    name="meta_title"
                    label={
                      <span className="text-sm font-medium">Meta Title</span>
                    }
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
                    label={
                      <span className="text-sm font-medium">
                        Meta Description
                      </span>
                    }
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
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

// Error Boundary for handling React errors gracefully
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class BlogEditorErrorBoundary extends React.Component<
  React.PropsWithChildren<object>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<object>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("BlogEditor Error:", error, errorInfo);
    message.error("An unexpected error occurred in the blog editor");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex justify-center items-center min-h-96 p-8">
          <div className="rounded-lg shadow-sm border p-8 max-w-md mx-auto text-center">
            <div className="space-y-4">
              <Title level={3}>Something went wrong</Title>
              <p>
                There was an error loading the blog editor. Please refresh the
                page or try again later.
              </p>
              <Button type="primary" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapped BlogEditor component with error boundary
const BlogEditorWithErrorBoundary: React.FC<BlogEditorProps> = (props) => (
  <BlogEditorErrorBoundary>
    <BlogEditor {...props} />
  </BlogEditorErrorBoundary>
);

export default BlogEditorWithErrorBoundary;
export { BlogEditor, BlogEditorErrorBoundary };
