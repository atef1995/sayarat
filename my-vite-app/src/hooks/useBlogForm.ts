import { useState } from "react";
import { useNavigate } from "react-router";
import { message, FormInstance } from "antd";
import { BlogTag, CreateBlogPostData } from "../types/blogTypes";
import blogService from "../services/blogService";

export interface BlogFormData extends Omit<CreateBlogPostData, "tags"> {
  slug: string;
  car_make?: string;
  car_model?: string;
  car_year?: number;
  rating?: number;
  reading_time?: number;
}

/**
 * Custom hook for blog form operations
 */
export const useBlogForm = (
  mode: "create" | "edit",
  id?: string,
  selectedTags: number[] = [],
  setSelectedTags: (tags: number[]) => void = () => {},
  tags: BlogTag[] = [],
  setTags: (tags: BlogTag[]) => void = () => {}
) => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSave = async (
    values: BlogFormData,
    status: "draft" | "published"
  ) => {
    try {
      setSaving(true);

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
        tags: selectedTags.map(String), // Convert numbers to strings as expected by CreateBlogPostData,
        slug: values.slug,
      };

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

  const handleImageUpload = async (
    file: File,
    form: FormInstance,
    onSuccess?: (result: { url: string }) => void,
    onError?: (error: Error) => void
  ) => {
    try {
      const result = await blogService.uploadBlogImage(file);

      form.setFieldsValue({
        featured_image: result.url,
      });

      setImagePreview(result.url);
      message.success("Image uploaded successfully");
      onSuccess?.(result);
    } catch (error) {
      console.error("Upload error:", error);
      message.error("Failed to upload image");
      onError?.(error instanceof Error ? error : new Error("Upload failed"));
    }
  };

  const handleImageRemove = (form: FormInstance) => {
    setImagePreview(null);
    form.setFieldsValue({
      featured_image: undefined,
    });
  };

  return {
    saving,
    newTag,
    setNewTag,
    imagePreview,
    setImagePreview,
    handleSave,
    handleAddTag,
    handleImageUpload,
    handleImageRemove,
  };
};
