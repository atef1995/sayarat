import React from "react";
import { Typography } from "antd";
import "./FormattedText.css";

const { Text } = Typography;

/**
 * Interface for FormattedText component props
 */
interface FormattedTextProps {
  /** Text content to format */
  content: string;
  /** Additional CSS classes */
  className?: string;
  /** Typography size */
  size?: "small" | "medium" | "large";
  /** Enable markdown-like formatting */
  enableMarkdown?: boolean;
  /** Maximum lines to display before truncation */
  maxLines?: number;
}

/**
 * Utility functions for text formatting
 */
class TextFormatter {
  /**
   * Converts line breaks to proper JSX elements
   * @param text - Text with potential line breaks
   * @returns Array of text segments and line breaks
   */
  static formatLineBreaks(text: string): (string | JSX.Element)[] {
    if (!text || typeof text !== "string") {
      return [""];
    }

    return text
      .split("\n")
      .reduce((acc: (string | JSX.Element)[], line, index) => {
        if (index > 0) {
          acc.push(<br key={`br-${index}`} />);
        }
        if (line.trim()) {
          acc.push(line);
        }
        return acc;
      }, []);
  }

  /**
   * Applies basic markdown-like formatting
   * @param text - Text with markdown syntax
   * @returns Formatted text with HTML tags
   */
  static formatMarkdown(text: string): string {
    if (!text || typeof text !== "string") {
      return "";
    }

    let formatted = text;

    // Bold text: **text** or __text__
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/__(.*?)__/g, "<strong>$1</strong>");

    // Italic text: *text* or _text_
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
    formatted = formatted.replace(/(?<!_)_([^_]+)_(?!_)/g, "<em>$1</em>");

    // Code text: `text`
    formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Simple bullet points: - item or * item
    formatted = formatted.replace(/^[\s]*[-*]\s+(.+)$/gm, "• $1");

    return formatted;
  }

  /**
   * Sanitizes HTML to prevent XSS attacks
   * @param html - HTML string to sanitize
   * @returns Sanitized HTML string
   */
  static sanitizeHtml(html: string): string {
    if (!html || typeof html !== "string") {
      return "";
    }

    // Allow only safe HTML tags
    const allowedTags = ["strong", "em", "code", "br"];
    const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

    return html.replace(tagPattern, (match, tagName) => {
      return allowedTags.includes(tagName.toLowerCase()) ? match : "";
    });
  }
}

/**
 * FormattedText Component
 *
 * A reusable component for displaying text with proper formatting support.
 * Handles line breaks, basic markdown syntax, and provides safe HTML rendering.
 *
 * Features:
 * - Line break preservation
 * - Basic markdown support (bold, italic, code, bullets)
 * - XSS protection through HTML sanitization
 * - Responsive text sizing
 * - Truncation support
 *
 * @example
 * ```tsx
 * <FormattedText
 *   content="السيارة في حالة **ممتازة**\nتم الصيانة مؤخراً\n• فحص شامل\n• إطارات جديدة"
 *   enableMarkdown={true}
 *   size="medium"
 * />
 * ```
 */
const FormattedText: React.FC<FormattedTextProps> = ({
  content,
  className = "",
  size = "medium",
  enableMarkdown = true,
  maxLines,
}) => {
  if (!content || typeof content !== "string") {
    return <Text className={className}>لا يوجد وصف متاح</Text>;
  }

  // Size mapping for consistent typography
  const sizeClasses = {
    small: "text-xs sm:text-sm",
    medium: "text-sm sm:text-base",
    large: "text-base sm:text-lg",
  };

  const baseClasses = `${sizeClasses[size]} text-balance text-start leading-relaxed`;
  const finalClasses = `${baseClasses} ${className}`.trim();

  // Apply line truncation classes if specified
  const truncationClasses = maxLines
    ? `line-clamp-${maxLines} overflow-hidden`
    : "";

  if (enableMarkdown) {
    // Process markdown formatting
    const markdownText = TextFormatter.formatMarkdown(content);
    const sanitizedHtml = TextFormatter.sanitizeHtml(markdownText);

    // Convert line breaks for HTML rendering
    const htmlWithBreaks = sanitizedHtml.replace(/\n/g, "<br>");

    return (
      <Text className={`${finalClasses} ${truncationClasses}`.trim()}>
        <div
          dangerouslySetInnerHTML={{ __html: htmlWithBreaks }}
          className="rtl-text formatted-text-content"
        />
      </Text>
    );
  } else {
    // Simple line break formatting without markdown
    const formattedContent = TextFormatter.formatLineBreaks(content);

    return (
      <Text className={`${finalClasses} ${truncationClasses}`.trim()}>
        <div className="rtl-text formatted-text-content">
          {formattedContent}
        </div>
      </Text>
    );
  }
};

export default FormattedText;
export { TextFormatter };
export type { FormattedTextProps };
