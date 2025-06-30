import React, { useState, useEffect, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Upload,
  Switch,
  Row,
  Col,
  message,
  Spin,
  Space,
  Typography,
  Tag,
  Divider,
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
import { AuthContext } from "../../context/AuthContext";
import "./BlogEditor.css";

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

  // Get user context for author information
  const authContext = useContext(AuthContext);
  const user = authContext?.user; // #TODO: Use for auto-setting author info
  const isAuthenticated = authContext?.isAuthenticated || false;

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

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      message.error("You must be logged in to create or edit blog posts");
      navigate("/login");
      return;
    }

    // #TODO: Use user data for pre-filling author information
    console.log("Current user:", user);
  }, [isAuthenticated, navigate, user]);

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
        navigate("/admin/blog");
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
      <div className="blog-editor-loading">
        <Card>
          <div className="loading-content">
            <Spin size="large" />
            <Title level={4} className="loading-title">
              Loading Editor...
            </Title>
            <p className="loading-description">
              Please wait while we prepare the blog editor for you.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="blog-editor">
      <div className="blog-editor-header">
        <Title level={2}>
          {mode === "edit" ? "Edit Blog Post" : "Create New Blog Post"}
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => handleSave(values, "draft")}
        className="blog-editor-form"
      >
        <Row gutter={24}>
          {/* Main Content */}
          <Col xs={24} lg={16}>
            <Card title="Content" className="editor-card">
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Please enter a title" }]}
              >
                <Input
                  placeholder="Enter blog post title..."
                  size="large"
                  onChange={(e) => {
                    const slug = BlogEditorUtils.generateSlug(e.target.value);
                    form.setFieldsValue({ slug });
                  }}
                />
              </Form.Item>

              <Form.Item
                name="excerpt"
                label="Excerpt"
                rules={[{ required: true, message: "Please enter an excerpt" }]}
              >
                <TextArea
                  rows={3}
                  placeholder="Brief description of the blog post..."
                  showCount
                  maxLength={300}
                />
              </Form.Item>

              <Form.Item
                name="content"
                label="Content"
                rules={[{ required: true, message: "Please enter content" }]}
              >
                <TextArea
                  rows={20}
                  placeholder="Write your blog post content here..."
                  className="content-editor"
                />
              </Form.Item>

              <Form.Item name="featured_image" label="Featured Image">
                <Upload
                  name="image"
                  listType="picture-card"
                  className="image-uploader"
                  showUploadList={false}
                  customRequest={({ file, onSuccess, onError }) => {
                    // Handle custom upload
                    if (file instanceof File) {
                      blogService
                        .uploadBlogImage(file)
                        .then((result) => {
                          form.setFieldsValue({ featured_image: result.url });
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
                  beforeUpload={(file) => {
                    return BlogEditorUtils.validateImageFile(file);
                  }}
                >
                  <div>
                    <UploadOutlined />
                    <div className="upload-text">Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Card>

            {/* Car-Specific Fields */}
            <Card title="Car Information (Optional)" className="editor-card">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="car_make" label="Car Make">
                    <Input placeholder="e.g., Toyota, BMW, Mercedes" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="car_model" label="Car Model">
                    <Input placeholder="e.g., Camry, X5, C-Class" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="car_year" label="Year">
                    <InputNumber
                      min={1900}
                      max={new Date().getFullYear() + 2}
                      placeholder="2023"
                      className="full-width-input"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="rating" label="Rating">
                    <Rate allowHalf />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={8}>
            {/* Publishing Options */}
            <Card title="Publish" className="editor-card sidebar-card">
              <Form.Item name="status" label="Status" initialValue="draft">
                <Select>
                  <Option value="draft">Draft</Option>
                  <Option value="published">Published</Option>
                </Select>
              </Form.Item>

              <Form.Item name="is_featured" valuePropName="checked">
                <Switch
                  checkedChildren="Featured"
                  unCheckedChildren="Regular"
                />
              </Form.Item>

              <Form.Item name="reading_time" label="Reading Time (minutes)">
                <InputNumber
                  min={1}
                  placeholder="5"
                  className="full-width-input"
                />
              </Form.Item>

              <Divider />

              <Space className="publish-actions">
                <Button
                  type="default"
                  onClick={() => form.submit()}
                  loading={saving}
                  icon={<SaveOutlined />}
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
                >
                  Publish
                </Button>
              </Space>
            </Card>

            {/* Categories */}
            <Card title="Category" className="editor-card sidebar-card">
              <Form.Item
                name="category_id"
                rules={[
                  { required: true, message: "Please select a category" },
                ]}
              >
                <Select placeholder="Select category">
                  {categories.map((category) => (
                    <Option key={category.id} value={category.id}>
                      <Tag color={category.color}>{category.name}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>

            {/* Tags */}
            <Card title="Tags" className="editor-card sidebar-card">
              <div className="tags-section">
                <Select
                  mode="multiple"
                  placeholder="Select tags"
                  value={selectedTags}
                  onChange={setSelectedTags}
                  className="tags-select"
                >
                  {tags.map((tag) => (
                    <Option key={tag.id} value={tag.id}>
                      {tag.name}
                    </Option>
                  ))}
                </Select>

                <div className="add-tag">
                  <Input
                    placeholder="Add new tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onPressEnter={handleAddTag}
                    suffix={
                      <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={handleAddTag}
                        size="small"
                      />
                    }
                  />
                </div>
              </div>
            </Card>

            {/* SEO */}
            <Card title="SEO" className="editor-card sidebar-card">
              <Form.Item name="meta_title" label="Meta Title">
                <Input placeholder="SEO title" showCount maxLength={60} />
              </Form.Item>

              <Form.Item name="meta_description" label="Meta Description">
                <TextArea
                  rows={3}
                  placeholder="SEO description"
                  showCount
                  maxLength={160}
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
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
        <div className="blog-editor-error">
          <Card>
            <div className="error-content">
              <Title level={3}>Something went wrong</Title>
              <p>
                There was an error loading the blog editor. Please refresh the
                page or try again later.
              </p>
              <Button type="primary" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </Card>
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
