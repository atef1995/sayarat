import { message } from "antd";

/**
 * Utility functions for blog editor operations
 */
export const BlogEditorUtils = {
  /**
   * Generate a URL-friendly slug from a title
   */
  generateSlug: (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  },

  /**
   * Validate uploaded image file
   */
  validateImageFile: (file: File): boolean => {
    if (!file) {
      message.error("الرجاء تحميل صورة");
      return false;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      message.error("خطأ: نوع الملف غير مدعوم. يرجى تحميل صورة JPEG أو PNG.");
      return false;
    }

    const isValidSize = file.size / 1024 / 1024 < 5; // 5MB limit
    if (!isValidSize) {
      message.error("خطأ: حجم الملف أكبر من 5 ميجابايت.");
      return false;
    }

    return true;
  },

  /**
   * Calculate estimated reading time based on content length
   */
  calculateReadingTime: (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  },

  /**
   * Generate meta description from content if not provided
   */
  generateMetaDescription: (
    content: string,
    maxLength: number = 160
  ): string => {
    return content
      .replace(/[#*_~`]/g, "") // Remove markdown symbols
      .trim()
      .substring(0, maxLength)
      .trim();
  },
};
