import React, { useEffect } from "react";
import { useParams } from "react-router";
import { Form, Spin, Typography } from "antd";
import { useBlogEditor } from "../../hooks/useBlogEditor";
import { useBlogForm } from "../../hooks/useBlogForm";
import { BlogContentForm } from "./BlogContentForm";
import { BlogCarInfoForm } from "./BlogCarInfoForm";
import { BlogPublishSidebar } from "./BlogPublishSidebar";
import { BlogCategoryTagsSidebar } from "./BlogCategoryTagsSidebar";
import { BlogSEOSidebar } from "./BlogSEOSidebar";
import "./BlogEditor.css";

const { Title } = Typography;

// #TODO: Move to separate types file for better organization
interface BlogEditorProps {
  mode: "create" | "edit";
}

/**
 * Custom hooks for better separation of concerns
 */
const useBlogEditorComponent = (mode: "create" | "edit", id?: string) => {
  const {
    loading,
    categories,
    tags,
    setTags,
    selectedTags,
    setSelectedTags,
    loadInitialData,
  } = useBlogEditor(mode, id);

  const {
    saving,
    newTag,
    setNewTag,
    imagePreview,
    setImagePreview,
    handleSave,
    handleAddTag,
    handleImageUpload,
    handleImageRemove,
  } = useBlogForm(mode, id, selectedTags, setSelectedTags, tags, setTags);

  return {
    loading,
    saving,
    categories,
    tags,
    selectedTags,
    setSelectedTags,
    newTag,
    setNewTag,
    imagePreview,
    setImagePreview,
    loadInitialData,
    handleSave,
    handleAddTag,
    handleImageUpload,
    handleImageRemove,
  };
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
  const [form] = Form.useForm();

  const {
    loading,
    saving,
    categories,
    tags,
    selectedTags,
    setSelectedTags,
    newTag,
    setNewTag,
    imagePreview,
    setImagePreview,
    loadInitialData,
    handleSave,
    handleAddTag,
    handleImageUpload,
    handleImageRemove,
  } = useBlogEditorComponent(mode, id);

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
          featured_image: post.featured_image,
          slug: post.slug, // Ensure slug is set if available
          tags: post.tags?.map((tag: { id: number }) => tag.id) || [],
        });

        // Set image preview if there's a featured image
        if (post.featured_image) {
          setImagePreview(post.featured_image);
        }
      }
    });
  }, [loadInitialData, form, setImagePreview]);

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
          onFinish={(values) => handleSave(values, "published")}
          className="w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content Area - Full width on mobile, 2/3 on desktop */}
            <div className="lg:col-span-2 space-y-6">
              <BlogContentForm
                imagePreview={imagePreview}
                onImageUpload={(file, onSuccess, onError) =>
                  handleImageUpload(file, form, onSuccess, onError)
                }
                onImageRemove={() => handleImageRemove(form)}
              />

              <BlogCarInfoForm />
            </div>

            {/* Sidebar - Full width on mobile, 1/3 on desktop */}
            <div className="lg:col-span-1 space-y-6">
              <BlogPublishSidebar
                saving={saving}
                onSaveDraft={() => form.submit()}
                onPublish={(values) => handleSave(values, "published")}
                form={form}
              />

              <BlogCategoryTagsSidebar
                categories={categories}
                tags={tags}
                selectedTags={selectedTags}
                onSelectedTagsChange={setSelectedTags}
                newTag={newTag}
                onNewTagChange={setNewTag}
                onAddTag={handleAddTag}
              />

              <BlogSEOSidebar />
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
