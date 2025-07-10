/**
 * Markdown Utilities Module
 * 
 * Provides utilities for converting markdown to HTML and sanitizing content.
 * Follows security best practices for content rendering.
 */

const { marked } = require('marked');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Create a DOMPurify instance for server-side use
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Configure marked with custom options
 */
marked.setOptions({
  breaks: true, // Support line breaks
  gfm: true, // GitHub Flavored Markdown
  headerIds: true, // Generate header IDs
  headerPrefix: 'heading-', // Prefix for header IDs
});

/**
 * DOMPurify configuration for blog content
 */
const purifyConfig = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'b', 'em', 'i', 'u',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span'
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'alt', 'src', 'class', 'id',
    'target', 'rel', 'loading',
    'start' // for ordered lists
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
};

/**
 * Convert markdown content to sanitized HTML
 * @param {string} markdownContent - The markdown content to convert
 * @param {Object} options - Optional configuration
 * @param {boolean} options.generateTOC - Generate table of contents
 * @param {boolean} options.addReadingTime - Calculate reading time
 * @returns {Object} Object containing HTML content and metadata
 */
const markdownToHtml = (markdownContent, options = {}) => {
  try {
    if (!markdownContent || typeof markdownContent !== 'string') {
      return {
        html: '',
        toc: [],
        readingTime: 0,
        wordCount: 0
      };
    }

    // Convert markdown to HTML
    let html = marked.parse(markdownContent);

    // Add CSS classes to elements for styling
    html = html
      .replace(/<h1([^>]*)>/g, '<h1$1 class="blog-heading blog-h1 blog-hidden-title">')
      .replace(/<h([2-6])([^>]*)>/g, '<h$1$2 class="blog-heading blog-h$1">')
      .replace(/<p>/g, '<p class="blog-paragraph">')
      .replace(/<ul>/g, '<ul class="blog-list">')
      .replace(/<ol>/g, '<ol class="blog-list">')
      .replace(/<li>/g, '<li class="blog-list-item">')
      .replace(/<blockquote>/g, '<blockquote class="blog-blockquote">')
      .replace(/<pre>/g, '<pre class="blog-code-block">')
      .replace(/<code>/g, '<code class="blog-inline-code">')
      .replace(/<strong>/g, '<strong class="blog-bold">')
      .replace(/<em>/g, '<em class="blog-italic">')
      .replace(/<a /g, '<a class="blog-link" ')
      .replace(/<img /g, '<img class="blog-image" loading="lazy" ');

    // Sanitize the HTML
    html = DOMPurify.sanitize(html, purifyConfig);

    // Calculate metadata
    const plainText = html.replace(/<[^>]*>/g, '');
    const wordCount = plainText.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute

    // Generate table of contents if requested
    let toc = [];
    if (options.generateTOC) {
      toc = generateTableOfContents(html);
    }

    return {
      html,
      toc,
      readingTime,
      wordCount,
      plainText: plainText.trim()
    };

  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    return {
      html: '',
      toc: [],
      readingTime: 0,
      wordCount: 0,
      error: error.message
    };
  }
};

/**
 * Generate table of contents from HTML content
 * @param {string} html - HTML content
 * @returns {Array} Array of TOC items
 */
const generateTableOfContents = (html) => {
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    const toc = [];
    headings.forEach((heading) => {
      toc.push({
        level: parseInt(heading.tagName.charAt(1)),
        title: heading.textContent.trim(),
        id: heading.id || heading.textContent.toLowerCase().replace(/[^\w]+/g, '-')
      });
    });

    return toc;
  } catch (error) {
    console.error('Error generating TOC:', error);
    return [];
  }
};

/**
 * Sanitize HTML content
 * @param {string} htmlContent - Raw HTML content
 * @returns {string} Sanitized HTML
 */
const sanitizeHtml = (htmlContent) => {
  try {
    return DOMPurify.sanitize(htmlContent, purifyConfig);
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    return '';
  }
};

/**
 * Extract excerpt from markdown content
 * @param {string} markdownContent - Markdown content
 * @param {number} maxLength - Maximum length of excerpt
 * @returns {string} Excerpt text
 */
const extractExcerpt = (markdownContent, maxLength = 160) => {
  try {
    if (!markdownContent) return '';

    // Convert to HTML and then to plain text
    const html = marked.parse(markdownContent);
    const plainText = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });

    // Clean up whitespace
    const cleanText = plainText.replace(/\s+/g, ' ').trim();

    if (cleanText.length <= maxLength) {
      return cleanText;
    }

    // Find the last complete word within the limit
    const truncated = cleanText.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }

    return truncated + '...';
  } catch (error) {
    console.error('Error extracting excerpt:', error);
    return '';
  }
};

/**
 * Calculate reading time for content
 * @param {string} content - Content to analyze (markdown or plain text)
 * @param {number} wordsPerMinute - Reading speed (default: 200)
 * @returns {number} Reading time in minutes
 */
const calculateReadingTime = (content, wordsPerMinute = 200) => {
  try {
    if (!content) return 0;

    // Remove markdown syntax and HTML tags
    const plainText = content
      .replace(/[#*_~`]/g, '') // Remove markdown syntax
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    const wordCount = plainText.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  } catch (error) {
    console.error('Error calculating reading time:', error);
    return 0;
  }
};

module.exports = {
  markdownToHtml,
  sanitizeHtml,
  extractExcerpt,
  calculateReadingTime,
  generateTableOfContents
};
