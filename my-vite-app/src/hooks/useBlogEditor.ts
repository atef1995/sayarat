import { useState, useCallback } from "react";
import { message } from "antd";
import { BlogCategory, BlogTag } from "../types/blogTypes";
import blogService from "../services/blogService";

/**
 * Custom hook for blog editor data management
 */
export const useBlogEditor = (mode: "create" | "edit", id?: string) => {
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

      if (categoriesRes?.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
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
