import React, { useEffect } from "react";
import { Modal, Form, message } from "antd";
import { useBlogEditor } from "../../../hooks/useBlogEditor";
import { useBlogForm, BlogFormData } from "../../../hooks/useBlogForm";
import { BlogPost } from "../../../types/blogTypes";
import { BlogContentForm } from "../BlogContentForm";
import { BlogCarInfoForm } from "../BlogCarInfoForm";
import { BlogPublishSidebar } from "../BlogPublishSidebar";
import { BlogCategoryTagsSidebar } from "../BlogCategoryTagsSidebar";
import { BlogSEOSidebar } from "../BlogSEOSidebar";
import "./BlogEditorModal.css";

interface BlogEditorModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: () => void;
  post?: BlogPost | null;
}

/**
 * BlogEditorModal Component
 *
 * Modal wrapper for the BlogEditor component to provide modal functionality
 * for the blog management interface while reusing the existing BlogEditor
 */
const BlogEditorModal: React.FC<BlogEditorModalProps> = ({
  open,
  onCancel,
  onSave,
  post,
}) => {
  const [form] = Form.useForm();
  const mode = post ? "edit" : "create";
  const id = post?.id?.toString();

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
    handleAddTag,
    handleImageUpload,
    handleImageRemove,
  } = useBlogForm(mode, id, selectedTags, setSelectedTags, tags, setTags);

  // Custom save handler for modal context
  const handleModalSave = async (
    values: BlogFormData,
    status: "draft" | "published"
  ) => {
    try {
      // Save logic similar to useBlogForm but without navigation
      const response = await saveBlogPost(values, status);
      if (response) {
        message.success(
          `تم ${status === "published" ? "نشر" : "حفظ"} المنشور بنجاح`
        );
        onSave(); // Call the parent's onSave callback
        onCancel(); // Close the modal
      }
    } catch (error) {
      console.error("Failed to save blog post:", error);
      message.error("فشل في حفظ المنشور");
    }
  };

  // Simplified save function for modal context
  const saveBlogPost = async (
    values: BlogFormData,
    status: "draft" | "published"
  ) => {
    // This is a placeholder - in a real implementation, you would
    // integrate with your blog service here
    console.log("Saving post:", { values, status, mode, id });
    return Promise.resolve(true);
  };

  useEffect(() => {
    if (open) {
      loadInitialData().then((loadedPost) => {
        if (loadedPost) {
          form.setFieldsValue({
            title: loadedPost.title,
            content: loadedPost.content,
            excerpt: loadedPost.excerpt,
            category_id: loadedPost.category_id,
            status: loadedPost.status,
            is_featured: loadedPost.is_featured,
            meta_title: loadedPost.meta_title,
            meta_description: loadedPost.meta_description,
            car_make: loadedPost.car_make,
            car_model: loadedPost.car_model,
            car_year: loadedPost.car_year,
            rating: loadedPost.rating,
            reading_time: loadedPost.reading_time,
            featured_image: loadedPost.featured_image,
            slug: loadedPost.slug,
          });

          if (loadedPost.featured_image) {
            setImagePreview(loadedPost.featured_image);
          }
        } else {
          // Reset form for new post
          form.resetFields();
          setImagePreview(null);
        }
      });
    }
  }, [open, loadInitialData, form, setImagePreview]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setImagePreview(null);
      setSelectedTags([]);
    }
  }, [open, form, setImagePreview, setSelectedTags]);

  if (loading) {
    return (
      <Modal
        title="تحميل المحرر"
        open={open}
        onCancel={onCancel}
        footer={null}
        centered
      >
        <div className="flex justify-center items-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>جاري تحميل المحرر...</p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={post ? "تحرير المنشور" : "إنشاء منشور جديد"}
      open={open}
      onCancel={onCancel}
      width="95%"
      className="blog-editor-modal"
      footer={null}
      destroyOnClose
      centered
    >
      <div className="modal-content-container max-h-[80vh] overflow-y-auto">
        <div className="w-full bg-transparent">
          <div className="max-w-full px-2 py-4">
            <Form
              form={form}
              layout="vertical"
              onFinish={(values) => handleModalSave(values, "published")}
              className="w-full"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-4">
                  <BlogContentForm
                    imagePreview={imagePreview}
                    onImageUpload={(file, onSuccess, onError) =>
                      handleImageUpload(file, form, onSuccess, onError)
                    }
                    onImageRemove={() => handleImageRemove(form)}
                  />

                  <BlogCarInfoForm />
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                  <BlogPublishSidebar
                    saving={saving}
                    onSaveDraft={() => form.submit()}
                    onPublish={(values) => handleModalSave(values, "published")}
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
      </div>
    </Modal>
  );
};

export default BlogEditorModal;
