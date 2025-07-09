/**
 * Analytics Controller
 *
 * Handles all blog analytics and statistics operations including
 * blog stats, performance metrics, and analytics dashboards.
 * Implements SOLID principles with single responsibility for analytics.
 */

const blogService = require('../../service/blog/index');
const logger = require('../../utils/logger');

/**
 * General Analytics Controllers
 */

/**
 * Get blog statistics and analytics
 */
const getBlogStats = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30d';
    const result = await blogService.getAnalytics(timeframe);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Error in getBlogStats controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blog statistics'
    });
  }
};

/**
 * Get blog analytics dashboard data (Admin only)
 */
const getBlogAnalytics = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30d';
    const includeDetails = req.query.details === 'true';

    const result = await blogService.getBlogAnalytics(timeframe, includeDetails);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Get blog analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب تحليلات المدونة'
    });
  }
};

/**
 * Post Analytics Controllers
 */

/**
 * Get post performance metrics (Admin only)
 */
const getPostAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const timeframe = req.query.timeframe || '30d';

    const result = await blogService.getPostAnalytics(id, timeframe);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('Get post analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب تحليلات المقال'
    });
  }
};

/**
 * Get top performing posts (Admin only)
 */
const getTopPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const timeframe = req.query.timeframe || '30d';
    const metric = req.query.metric || 'views'; // views, likes, comments, engagement

    const result = await blogService.getTopPosts(limit, timeframe, metric);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Get top posts error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب أفضل المقالات'
    });
  }
};

/**
 * Search Analytics Controllers
 */

/**
 * Get popular search terms (Admin only)
 */
const getSearchAnalytics = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const timeframe = req.query.timeframe || '30d';

    const result = await blogService.getSearchAnalytics(limit, timeframe);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Get search analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب تحليلات البحث'
    });
  }
};

/**
 * User Analytics Controllers
 */

/**
 * Get user engagement analytics (Admin only)
 */
const getUserEngagementAnalytics = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30d';
    const limit = parseInt(req.query.limit) || 50;

    const result = await blogService.getUserEngagementAnalytics(timeframe, limit);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Get user engagement analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب تحليلات تفاعل المستخدمين'
    });
  }
};

/**
 * Category/Tag Analytics Controllers
 */

/**
 * Get category performance analytics (Admin only)
 */
const getCategoryAnalytics = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30d';

    const result = await blogService.getCategoryAnalytics(timeframe);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Get category analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب تحليلات التصنيفات'
    });
  }
};

/**
 * Get tag performance analytics (Admin only)
 */
const getTagAnalytics = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30d';
    const limit = parseInt(req.query.limit) || 20;

    const result = await blogService.getTagAnalytics(timeframe, limit);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Get tag analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب تحليلات العلامات'
    });
  }
};

/**
 * Real-time Analytics Controllers
 */

/**
 * Get real-time blog statistics (Admin only)
 */
const getRealTimeStats = async (req, res) => {
  try {
    const result = await blogService.getRealTimeStats();

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Get real-time stats error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب الإحصائيات المباشرة'
    });
  }
};

/**
 * Export analytics data (Admin only)
 */
const exportAnalytics = async (req, res) => {
  try {
    const { type, timeframe, format } = req.query;
    // type: 'posts', 'users', 'comments', 'categories', 'tags', 'all'
    // format: 'csv', 'json', 'xlsx'

    const result = await blogService.exportAnalytics(type, timeframe, format);

    if (result.success) {
      const filename = `blog-analytics-${type}-${timeframe}-${Date.now()}.${format}`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', result.contentType);

      logger.info('Analytics exported:', {
        type: type,
        timeframe: timeframe,
        format: format,
        exportedBy: req.user.id
      });

      res.send(result.data);
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في تصدير التحليلات'
    });
  }
};

// #TODO: Add advanced analytics features
// #TODO: Add predictive analytics methods
// #TODO: Add performance benchmarking methods

module.exports = {
  // General analytics
  getBlogStats,
  getBlogAnalytics,
  getRealTimeStats,

  // Post analytics
  getPostAnalytics,
  getTopPosts,

  // Search analytics
  getSearchAnalytics,

  // User analytics
  getUserEngagementAnalytics,

  // Category/Tag analytics
  getCategoryAnalytics,
  getTagAnalytics,

  // Export functionality
  exportAnalytics
};
