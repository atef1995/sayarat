/**
 * Slug Generation Utility for SEO-Friendly URLs
 * 
 * Optimized for Arabic content and multilingual support
 * Provides transliteration for Arabic text to create SEO-friendly URLs
 * 
 * @module SlugGenerator
 */

/**
 * Arabic to Latin transliteration map for better SEO
 */
const arabicToLatinMap = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
  'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
  'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
  'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
  'ة': 'h', 'ء': 'a'
};

/**
 * Generate SEO-friendly slug from text
 * @param {string} text - Text to convert to slug
 * @param {Object} options - Options for slug generation
 * @returns {string} SEO-friendly slug
 */
function generateSlug(text, options = {}) {
  const {
    maxLength = 100,
    transliterate = true,
    includeId = false,
    id = null
  } = options;

  if (!text || typeof text !== 'string') {
    return includeId && id ? `item-${id}` : 'item';
  }

  let slug = text.toLowerCase();

  // Transliterate Arabic characters if enabled
  if (transliterate) {
    slug = transliterateArabic(slug);
  }

  // Remove special characters and replace with hyphens
  slug = slug
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  // Truncate if too long
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength).replace(/-[^-]*$/, '');
  }

  // Ensure we have a valid slug
  if (!slug || slug.length < 3) {
    slug = includeId && id ? `item-${id}` : 'item';
  }

  // Add ID if requested
  if (includeId && id) {
    slug = `${slug}-${id}`;
  }

  return slug;
}

/**
 * Transliterate Arabic text to Latin characters
 * @param {string} text - Arabic text to transliterate
 * @returns {string} Transliterated text
 */
function transliterateArabic(text) {
  return text.split('').map(char => arabicToLatinMap[char] || char).join('');
}

/**
 * Generate car slug from car data
 * @param {Object} car - Car object with make, model, year, title
 * @returns {string} SEO-friendly car slug
 */
function generateCarSlug(car) {
  const { make, model, year, title, id } = car;

  // Prioritize make/model/year combination
  if (make && model) {
    const carInfo = `${make} ${model} ${year || ''}`.trim();
    return generateSlug(carInfo, { includeId: true, id });
  }

  // Fall back to title
  if (title) {
    return generateSlug(title, { includeId: true, id });
  }

  // Final fallback
  return generateSlug(`car-${id}`, { includeId: false });
}

/**
 * Generate company slug from company data
 * @param {Object} company - Company object with name, location
 * @returns {string} SEO-friendly company slug
 */
function generateCompanySlug(company) {
  const { name, location, id } = company;

  if (name) {
    // Include location for better local SEO
    const companyInfo = location ? `${name} ${location}` : name;
    return generateSlug(companyInfo, { includeId: true, id });
  }

  return generateSlug(`company-${id}`, { includeId: false });
}

/**
 * Generate blog post slug from post data
 * @param {Object} post - Blog post object with title
 * @returns {string} SEO-friendly post slug
 */
function generateBlogSlug(post) {
  const { title, id } = post;

  if (title) {
    return generateSlug(title, { maxLength: 80, includeId: true, id });
  }

  return generateSlug(`post-${id}`, { includeId: false });
}

/**
 * Validate and clean existing slug
 * @param {string} slug - Existing slug to validate
 * @param {string} fallbackText - Fallback text if slug is invalid
 * @param {number} id - ID to append if needed
 * @returns {string} Valid slug
 */
function validateSlug(slug, fallbackText, id) {
  if (slug && typeof slug === 'string' && slug.length >= 3) {
    return slug.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  }

  return generateSlug(fallbackText, { includeId: true, id });
}

module.exports = {
  generateSlug,
  generateCarSlug,
  generateCompanySlug,
  generateBlogSlug,
  validateSlug,
  transliterateArabic
};
