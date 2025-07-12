/**
 * Blog Validation Middleware
 *
 * Comprehensive validation middleware for blog-related endpoints.
 * Uses Joi for schema validation with Arabic error messages.
 */

const Joi = require('joi');
const logger = require('../utils/logger');
const { convertToArray } = require('../utils/listingsDbHelper');

/**
 * Blog Post Validation Schema
 */
const blogPostSchema = Joi.object({
  slug: Joi.string().max(200).allow('').messages({
    'string.max': 'الرابط يجب أن لا يتجاوز 200 حرف',
    'string.empty': 'الرابط لا يمكن أن يكون فارغاً'
  }),
  title: Joi.string().min(5).max(255).required().messages({
    'string.empty': 'عنوان المقال مطلوب',
    'string.min': 'عنوان المقال يجب أن يكون 5 أحرف على الأقل',
    'string.max': 'عنوان المقال يجب أن لا يتجاوز 255 حرف'
  }),

  content: Joi.string().min(50).required().messages({
    'string.empty': 'محتوى المقال مطلوب',
    'string.min': 'محتوى المقال يجب أن يكون 50 حرف على الأقل'
  }),

  excerpt: Joi.string().max(500).allow('').messages({
    'string.max': 'مقتطف المقال يجب أن لا يتجاوز 500 حرف'
  }),

  category_id: Joi.number().integer().positive().required().messages({
    'number.base': 'معرف التصنيف يجب أن يكون رقماً',
    'number.positive': 'معرف التصنيف غير صحيح',
    'any.required': 'تصنيف المقال مطلوب'
  }),

  tags: Joi.array().items(Joi.string().max(50)).max(10).default([]).messages({
    'array.max': 'لا يمكن إضافة أكثر من 10 علامات',
    'string.max': 'علامة التصنيف يجب أن لا تتجاوز 50 حرف'
  }),

  status: Joi.string().valid('draft', 'published', 'scheduled', 'archived').default('draft').messages({
    'any.only': 'حالة المقال غير صحيحة'
  }),

  is_featured: Joi.boolean().default(false),
  featured_image: Joi.string().uri().allow('').messages({
    'string.uri': 'رابط الصورة المميزة غير صحيح'
  }),

  meta_title: Joi.string().max(255).allow('').messages({
    'string.max': 'عنوان SEO يجب أن لا يتجاوز 255 حرف'
  }),

  meta_description: Joi.string().max(500).allow('').messages({
    'string.max': 'وصف SEO يجب أن لا يتجاوز 500 حرف'
  }),

  scheduled_for: Joi.date()
    .iso()
    .min('now')
    .when('status', {
      is: 'scheduled',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'date.base': 'تاريخ الجدولة غير صحيح',
      'date.min': 'تاريخ الجدولة يجب أن يكون في المستقبل',
      'any.required': 'تاريخ الجدولة مطلوب عند اختيار الجدولة'
    }),

  // Car-specific fields
  car_make: Joi.string().max(50).allow('').messages({
    'string.max': 'ماركة السيارة يجب أن لا تتجاوز 50 حرف'
  }),

  car_model: Joi.string().max(50).allow('').messages({
    'string.max': 'موديل السيارة يجب أن لا يتجاوز 50 حرف'
  }),

  car_year: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 2)
    .allow(null)
    .messages({
      'number.base': 'سنة السيارة يجب أن تكون رقماً',
      'number.min': 'سنة السيارة غير صحيحة',
      'number.max': 'سنة السيارة غير صحيحة'
    }),

  price_range_min: Joi.number().positive().allow(null).messages({
    'number.base': 'الحد الأدنى للسعر يجب أن يكون رقماً',
    'number.positive': 'الحد الأدنى للسعر يجب أن يكون موجباً'
  }),

  price_range_max: Joi.number().positive().min(Joi.ref('price_range_min')).allow(null).messages({
    'number.base': 'الحد الأعلى للسعر يجب أن يكون رقماً',
    'number.positive': 'الحد الأعلى للسعر يجب أن يكون موجباً',
    'number.min': 'الحد الأعلى للسعر يجب أن يكون أكبر من الحد الأدنى'
  }),

  price_currency: Joi.string().valid('SYP', 'USD', 'EUR').default('SYP').messages({
    'any.only': 'عملة السعر غير مدعومة'
  }),

  market_trend: Joi.string().valid('rising', 'falling', 'stable').allow(null).messages({
    'any.only': 'اتجاه السوق غير صحيح'
  }),

  source: Joi.string().max(255).allow('').messages({
    'string.max': 'مصدر الخبر يجب أن لا يتجاوز 255 حرف'
  }),

  source_url: Joi.string().uri().allow('').messages({
    'string.uri': 'رابط المصدر غير صحيح'
  }),

  // Review fields
  rating: Joi.number().min(0).max(5).precision(1).allow(null).messages({
    'number.base': 'التقييم يجب أن يكون رقماً',
    'number.min': 'التقييم يجب أن يكون 0 على الأقل',
    'number.max': 'التقييم يجب أن لا يتجاوز 5'
  }),

  pros: Joi.array().items(Joi.string().max(200)).max(10).default([]).messages({
    'array.max': 'لا يمكن إضافة أكثر من 10 إيجابيات',
    'string.max': 'النقطة الإيجابية يجب أن لا تتجاوز 200 حرف'
  }),

  cons: Joi.array().items(Joi.string().max(200)).max(10).default([]).messages({
    'array.max': 'لا يمكن إضافة أكثر من 10 سلبيات',
    'string.max': 'النقطة السلبية يجب أن لا تتجاوز 200 حرف'
  }),

  price_when_reviewed: Joi.number().positive().allow(null).messages({
    'number.base': 'سعر المراجعة يجب أن يكون رقماً',
    'number.positive': 'سعر المراجعة يجب أن يكون موجباً'
  }),

  // Guide fields
  guide_type: Joi.string().valid('buying', 'selling', 'maintenance', 'insurance', 'financing').allow(null).messages({
    'any.only': 'نوع الدليل غير صحيح'
  }),

  difficulty_level: Joi.string().valid('beginner', 'intermediate', 'advanced').allow(null).messages({
    'any.only': 'مستوى الصعوبة غير صحيح'
  }),

  reading_time: Joi.string().max(50).allow('').messages({
    'string.max': 'الوقت المقدر يجب أن لا يتجاوز 50 حرف'
  }),

  required_tools: Joi.array().items(Joi.string().max(100)).max(20).default([]).messages({
    'array.max': 'لا يمكن إضافة أكثر من 20 أداة',
    'string.max': 'اسم الأداة يجب أن لا يتجاوز 100 حرف'
  })
});

/**
 * Blog Category Validation Schema
 */
const blogCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'اسم التصنيف مطلوب',
    'string.min': 'اسم التصنيف يجب أن يكون حرفين على الأقل',
    'string.max': 'اسم التصنيف يجب أن لا يتجاوز 100 حرف'
  }),

  description: Joi.string().max(500).allow('').messages({
    'string.max': 'وصف التصنيف يجب أن لا يتجاوز 500 حرف'
  }),

  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .default('#1890ff')
    .messages({
      'string.pattern.base': 'لون التصنيف يجب أن يكون بصيغة hex صحيحة'
    }),

  icon: Joi.string().max(50).allow('').messages({
    'string.max': 'اسم الأيقونة يجب أن لا يتجاوز 50 حرف'
  }),

  is_active: Joi.boolean().default(true)
});

/**
 * Blog Comment Validation Schema
 */
const blogCommentSchema = Joi.object({
  content: Joi.string().min(3).max(1000).required().messages({
    'string.empty': 'محتوى التعليق مطلوب',
    'string.min': 'التعليق يجب أن يكون 3 أحرف على الأقل',
    'string.max': 'التعليق يجب أن لا يتجاوز 1000 حرف'
  }),

  post_id: Joi.number()
    .integer()
    .positive()
    .when('$isReply', {
      is: false,
      then: Joi.required()
    })
    .messages({
      'number.base': 'معرف المقال يجب أن يكون رقماً',
      'number.positive': 'معرف المقال غير صحيح',
      'any.required': 'معرف المقال مطلوب'
    }),

  parent_id: Joi.number().integer().positive().allow(null).messages({
    'number.base': 'معرف التعليق الأصلي يجب أن يكون رقماً',
    'number.positive': 'معرف التعليق الأصلي غير صحيح'
  })
});

/**
 * Blog Search Parameters Schema
 */
const blogSearchSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'رقم الصفحة يجب أن يكون رقماً',
    'number.min': 'رقم الصفحة يجب أن يكون 1 على الأقل'
  }),

  limit: Joi.number().integer().min(1).max(50).default(10).messages({
    'number.base': 'عدد النتائج يجب أن يكون رقماً',
    'number.min': 'عدد النتائج يجب أن يكون 1 على الأقل',
    'number.max': 'عدد النتائج يجب أن لا يتجاوز 50'
  }),

  search: Joi.string().max(255).allow('').messages({
    'string.max': 'نص البحث يجب أن لا يتجاوز 255 حرف'
  }),

  category: Joi.string().max(100).allow('').messages({
    'string.max': 'اسم التصنيف يجب أن لا يتجاوز 100 حرف'
  }),

  tag: Joi.string().max(50).allow('').messages({
    'string.max': 'علامة التصنيف يجب أن لا تتجاوز 50 حرف'
  }),

  author: Joi.string().max(100).allow('').messages({
    'string.max': 'اسم المؤلف يجب أن لا يتجاوز 100 حرف'
  }),

  status: Joi.string().valid('draft', 'published', 'scheduled', 'archived').allow('').messages({
    'any.only': 'حالة المقال غير صحيحة'
  }),

  featured: Joi.boolean().allow(''),

  sort: Joi.string().valid('latest', 'oldest', 'popular', 'trending').default('latest').messages({
    'any.only': 'طريقة الترتيب غير صحيحة'
  }),

  car_make: Joi.string().max(50).allow('').messages({
    'string.max': 'ماركة السيارة يجب أن لا تتجاوز 50 حرف'
  }),

  car_model: Joi.string().max(50).allow('').messages({
    'string.max': 'موديل السيارة يجب أن لا تتجاوز 50 حرف'
  })
});

/**
 * Admin validation schemas
 */
const adminLoginSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.alphanum': 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط',
      'string.min': 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل',
      'string.max': 'اسم المستخدم يجب أن يكون 50 حرف كحد أقصى',
      'any.required': 'اسم المستخدم مطلوب'
    })
    .concat(
      Joi.string().email().required().messages({
        'string.email': 'البريد الإلكتروني غير صالح',
        'any.required': 'البريد الإلكتروني مطلوب'
      })
    ),

  password: Joi.string().min(6).required().messages({
    'string.min': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    'any.required': 'كلمة المرور مطلوبة'
  })
});

const adminSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required().messages({
    'string.alphanum': 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط',
    'string.min': 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل',
    'string.max': 'اسم المستخدم يجب أن يكون 50 حرف كحد أقصى',
    'any.required': 'اسم المستخدم مطلوب'
  }),

  email: Joi.string().email().required().messages({
    'string.email': 'البريد الإلكتروني غير صالح',
    'any.required': 'البريد الإلكتروني مطلوب'
  }),

  password: Joi.string()
    .min(6)
    .when('$isUpdate', {
      is: true,
      then: Joi.optional(),
      otherwise: Joi.required()
    })
    .messages({
      'string.min': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      'any.required': 'كلمة المرور مطلوبة'
    }),

  full_name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'الاسم الكامل يجب أن يكون حرفين على الأقل',
    'string.max': 'الاسم الكامل يجب أن يكون 100 حرف كحد أقصى',
    'any.required': 'الاسم الكامل مطلوب'
  }),

  role: Joi.string().valid('super_admin', 'admin', 'editor', 'moderator').default('moderator').messages({
    'any.only': 'الدور يجب أن يكون واحد من: super_admin, admin, editor, moderator'
  }),

  permissions: Joi.array().items(Joi.string()).default([]).messages({
    'array.base': 'الصلاحيات يجب أن تكون مصفوفة من النصوص'
  }),

  avatar: Joi.string().uri().optional().messages({
    'string.uri': 'رابط الصورة الشخصية غير صالح'
  }),

  is_active: Joi.boolean().default(true)
});

/**
 * Blog tag validation schema
 */
const tagSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'اسم التصنيف مطلوب',
    'string.min': 'اسم التصنيف يجب أن يكون على الأقل 2 أحرف',
    'string.max': 'اسم التصنيف يجب أن لا يتجاوز 50 حرف',
    'any.required': 'اسم التصنيف مطلوب'
  }),

  description: Joi.string().max(500).allow('').messages({
    'string.max': 'وصف التصنيف يجب أن لا يتجاوز 500 حرف'
  })
});

/**
 * Validation Middleware Functions
 */

const validateBlogPost = (req, res, next) => {
  try {
    const tags = convertToArray(req.body.tags);
    req.body.tags = tags;
    const { error, value } = blogPostSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.reduce((acc, detail) => {
        acc[detail.path.join('.')] = detail.message;
        return acc;
      }, {});

      logger.warn('Blog post validation failed:', { errors, body: req.body });

      return res.status(400).json({
        success: false,
        error: 'بيانات المقال غير صحيحة',
        errors: errors
      });
    }

    req.body = value;
    next();
  } catch (err) {
    logger.error('Blog post validation error:', err);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في التحقق من صحة البيانات'
    });
  }
};

const validateBlogCategory = (req, res, next) => {
  try {
    const { error, value } = blogCategorySchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.reduce((acc, detail) => {
        acc[detail.path.join('.')] = detail.message;
        return acc;
      }, {});

      logger.warn('Blog category validation failed:', { errors, body: req.body });

      return res.status(400).json({
        success: false,
        error: 'بيانات التصنيف غير صحيحة',
        errors: errors
      });
    }

    req.body = value;
    next();
  } catch (err) {
    logger.error('Blog category validation error:', err);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في التحقق من صحة البيانات'
    });
  }
};

const validateBlogComment = (req, res, next) => {
  try {
    const isReply = !!req.params.id; // If there's a comment ID in params, it's a reply

    const { error, value } = blogCommentSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      context: { isReply }
    });

    if (error) {
      const errors = error.details.reduce((acc, detail) => {
        acc[detail.path.join('.')] = detail.message;
        return acc;
      }, {});

      logger.warn('Blog comment validation failed:', { errors, body: req.body });

      return res.status(400).json({
        success: false,
        error: 'بيانات التعليق غير صحيحة',
        errors: errors
      });
    }

    req.body = value;
    next();
  } catch (err) {
    logger.error('Blog comment validation error:', err);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في التحقق من صحة البيانات'
    });
  }
};

const validateSearchParams = (req, res, next) => {
  try {
    const { error, value } = blogSearchSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.reduce((acc, detail) => {
        acc[detail.path.join('.')] = detail.message;
        return acc;
      }, {});

      logger.warn('Blog search validation failed:', { errors, query: req.query });

      return res.status(400).json({
        success: false,
        error: 'معاملات البحث غير صحيحة',
        errors: errors
      });
    }

    req.query = value;
    next();
  } catch (err) {
    logger.error('Blog search validation error:', err);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في التحقق من صحة البيانات'
    });
  }
};

const validateAdminLogin = (req, res, next) => {
  const { error } = adminLoginSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'بيانات تسجيل الدخول غير صالحة',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  next();
};

const validateBlogAdmin = (req, res, next) => {
  const isUpdate = req.method === 'PUT' || req.method === 'PATCH';
  const { error } = adminSchema.validate(req.body, { context: { isUpdate } });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'بيانات المدير غير صالحة',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  next();
};

const validateBlogTag = (req, res, next) => {
  const { error } = tagSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);

    logger.warn('Tag validation failed:', {
      errors: errorMessages,
      body: req.body,
      endpoint: req.originalUrl
    });

    return res.status(400).json({
      success: false,
      error: errorMessages[0],
      details: errorMessages
    });
  }

  next();
};

/**
 * Utility function to generate slug from title
 */
const generateSlug = title => {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .substring(0, 200) // Limit to 200 characters
  );
};

module.exports = {
  validateBlogPost,
  validateBlogCategory,
  validateBlogComment,
  validateSearchParams,
  validateAdminLogin,
  validateBlogAdmin,
  validateBlogTag,
  generateSlug
};
