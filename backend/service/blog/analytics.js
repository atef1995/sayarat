/**
 * Analytics Service
 * 
 * Provides comprehensive analytics and statistics for the blog system.
 * Implements analytics calculations, performance metrics, and reporting features
 * following SOLID principles with separation of concerns.
 */

const knex = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Helper function to parse timeframe into SQL date condition
 */
const parseTimeframe = (timeframe) => {
  const now = new Date();
  let startDate;

  switch (timeframe) {
    case '1d':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return startDate;
};

/**
 * Basic analytics for general use
 */
const getAnalytics = async (timeframe = '30d') => {
  try {
    const startDate = parseTimeframe(timeframe);

    // Get basic statistics
    const [
      totalPosts,
      publishedPosts,
      totalCategories,
      totalTags,
      totalComments,
      approvedComments,
      totalViews,
      totalLikes
    ] = await Promise.all([
      knex('blog_posts').count('id as count').first(),
      knex('blog_posts').where('status', 'published').count('id as count').first(),
      knex('blog_categories').count('id as count').first(),
      knex('blog_tags').count('id as count').first(),
      knex('blog_comments').count('id as count').first(),
      knex('blog_comments').where('status', 'approved').count('id as count').first(),
      knex('blog_views').count('id as count').first(),
      knex('blog_likes').count('id as count').first()
    ]);

    // Get timeframe-specific statistics
    const [
      recentPosts,
      recentComments,
      recentViews,
      recentLikes
    ] = await Promise.all([
      knex('blog_posts')
        .where('created_at', '>=', startDate)
        .count('id as count')
        .first(),
      knex('blog_comments')
        .where('created_at', '>=', startDate)
        .count('id as count')
        .first(),
      knex('blog_views')
        .where('created_at', '>=', startDate)
        .count('id as count')
        .first(),
      knex('blog_likes')
        .where('created_at', '>=', startDate)
        .count('id as count')
        .first()
    ]);

    return {
      success: true,
      data: {
        total_posts: parseInt(totalPosts.count),
        published_posts: parseInt(publishedPosts.count),
        total_categories: parseInt(totalCategories.count),
        total_tags: parseInt(totalTags.count),
        total_comments: parseInt(totalComments.count),
        approved_comments: parseInt(approvedComments.count),
        total_views: parseInt(totalViews.count),
        total_likes: parseInt(totalLikes.count),
        timeframe_stats: {
          period: timeframe,
          recent_posts: parseInt(recentPosts.count),
          recent_comments: parseInt(recentComments.count),
          recent_views: parseInt(recentViews.count),
          recent_likes: parseInt(recentLikes.count)
        }
      }
    };
  } catch (error) {
    logger.error('Error in getAnalytics:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء جلب الإحصائيات'
    };
  }
};

/**
 * Comprehensive blog analytics for admin dashboard
 */
const getBlogAnalytics = async (timeframe = '30d', includeDetails = false) => {
  try {
    const startDate = parseTimeframe(timeframe);

    // Get basic analytics
    const basicStats = await getAnalytics(timeframe);
    if (!basicStats.success) {
      return basicStats;
    }

    // Get top performing posts
    const topPosts = await knex('blog_posts')
      .select('id', 'title', 'slug', 'views_count', 'likes_count', 'comments_count')
      .where('status', 'published')
      .orderBy('views_count', 'desc')
      .limit(5);

    // Get most active categories
    const topCategories = await knex('blog_categories')
      .select('id', 'name', 'posts_count')
      .where('is_active', true)
      .orderBy('posts_count', 'desc')
      .limit(5);

    // Get engagement metrics
    const engagementMetrics = await knex.raw(`
      SELECT 
        AVG(views_count) as avg_views,
        AVG(likes_count) as avg_likes,
        AVG(comments_count) as avg_comments,
        MAX(views_count) as max_views,
        MAX(likes_count) as max_likes,
        MAX(comments_count) as max_comments
      FROM blog_posts 
      WHERE status = 'published' AND created_at >= ?
    `, [startDate]);

    const engagement = engagementMetrics[0];

    let dailyStats = [];
    if (includeDetails) {
      // Get daily statistics for the timeframe
      dailyStats = await knex.raw(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as posts_count,
          SUM(views_count) as total_views,
          SUM(likes_count) as total_likes,
          SUM(comments_count) as total_comments
        FROM blog_posts 
        WHERE created_at >= ? AND status = 'published'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [startDate]);
    }

    return {
      success: true,
      data: {
        ...basicStats.data,
        top_posts: topPosts,
        top_categories: topCategories,
        engagement_metrics: {
          avg_views_per_post: Math.round(parseFloat(engagement.avg_views) || 0),
          avg_likes_per_post: Math.round(parseFloat(engagement.avg_likes) || 0),
          avg_comments_per_post: Math.round(parseFloat(engagement.avg_comments) || 0),
          max_views: parseInt(engagement.max_views) || 0,
          max_likes: parseInt(engagement.max_likes) || 0,
          max_comments: parseInt(engagement.max_comments) || 0
        },
        daily_stats: includeDetails ? dailyStats : undefined
      }
    };
  } catch (error) {
    logger.error('Error in getBlogAnalytics:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء جلب تحليلات المدونة'
    };
  }
};

/**
 * Get analytics for a specific post
 */
const getPostAnalytics = async (postId, timeframe = '30d') => {
  try {
    const startDate = parseTimeframe(timeframe);

    // Check if post exists
    const post = await knex('blog_posts')
      .select('id', 'title', 'slug', 'views_count', 'likes_count', 'comments_count', 'created_at')
      .where('id', postId)
      .first();

    if (!post) {
      return {
        success: false,
        message: 'المقال غير موجود'
      };
    }

    // Get detailed view statistics
    const viewStats = await knex('blog_views')
      .where('post_id', postId)
      .where('created_at', '>=', startDate)
      .count('id as count')
      .first();

    // Get like statistics
    const likeStats = await knex('blog_likes')
      .where('post_id', postId)
      .where('created_at', '>=', startDate)
      .count('id as count')
      .first();

    // Get comment statistics
    const commentStats = await knex('blog_comments')
      .where('post_id', postId)
      .where('created_at', '>=', startDate)
      .count('id as count')
      .first();

    // Get daily view trends
    const dailyViews = await knex.raw(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as views
      FROM blog_views 
      WHERE post_id = ? AND created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [postId, startDate]);

    return {
      success: true,
      data: {
        post: post,
        timeframe_stats: {
          period: timeframe,
          views: parseInt(viewStats.count),
          likes: parseInt(likeStats.count),
          comments: parseInt(commentStats.count)
        },
        daily_views: dailyViews,
        total_stats: {
          total_views: post.views_count,
          total_likes: post.likes_count,
          total_comments: post.comments_count
        }
      }
    };
  } catch (error) {
    logger.error('Error in getPostAnalytics:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء جلب تحليلات المقال'
    };
  }
};

/**
 * Get top performing posts by metric
 */
const getTopPosts = async (limit = 10, timeframe = '30d', metric = 'views') => {
  try {
    const startDate = parseTimeframe(timeframe);

    let orderColumn;
    switch (metric) {
      case 'likes':
        orderColumn = 'likes_count';
        break;
      case 'comments':
        orderColumn = 'comments_count';
        break;
      case 'engagement':
        // Calculate engagement score as views + likes*2 + comments*3
        orderColumn = knex.raw('(views_count + likes_count*2 + comments_count*3)');
        break;
      case 'views':
      default:
        orderColumn = 'views_count';
    }

    const posts = await knex('blog_posts')
      .select(
        'id', 'title', 'slug', 'views_count', 'likes_count',
        'comments_count', 'created_at', 'published_at'
      )
      .leftJoin('blog_categories', 'blog_posts.category_id', 'blog_categories.id')
      .select('blog_categories.name as category_name')
      .where('blog_posts.status', 'published')
      .where('blog_posts.created_at', '>=', startDate)
      .orderBy(orderColumn, 'desc')
      .limit(limit);

    return {
      success: true,
      data: {
        metric: metric,
        timeframe: timeframe,
        posts: posts
      }
    };
  } catch (error) {
    logger.error('Error in getTopPosts:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء جلب أفضل المقالات'
    };
  }
};

/**
 * Get category analytics
 */
const getCategoryAnalytics = async (timeframe = '30d') => {
  try {
    const startDate = parseTimeframe(timeframe);

    const categoryStats = await knex('blog_categories')
      .select(
        'blog_categories.id',
        'blog_categories.name',
        'blog_categories.posts_count',
        'blog_categories.is_active'
      )
      .select(knex.raw(`
        COALESCE(SUM(blog_posts.views_count), 0) as total_views,
        COALESCE(SUM(blog_posts.likes_count), 0) as total_likes,
        COALESCE(SUM(blog_posts.comments_count), 0) as total_comments,
        COUNT(blog_posts.id) as recent_posts
      `))
      .leftJoin('blog_posts', function () {
        this.on('blog_categories.id', 'blog_posts.category_id')
          .andOn('blog_posts.created_at', '>=', knex.raw('?', [startDate]))
          .andOn('blog_posts.status', '=', knex.raw('?', ['published']));
      })
      .groupBy('blog_categories.id', 'blog_categories.name', 'blog_categories.posts_count', 'blog_categories.is_active')
      .orderBy('total_views', 'desc');

    return {
      success: true,
      data: {
        timeframe: timeframe,
        categories: categoryStats
      }
    };
  } catch (error) {
    logger.error('Error in getCategoryAnalytics:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء جلب تحليلات التصنيفات'
    };
  }
};

/**
 * Get tag analytics
 */
const getTagAnalytics = async (timeframe = '30d', limit = 20) => {
  try {
    const startDate = parseTimeframe(timeframe);

    const tagStats = await knex('blog_tags')
      .select(
        'blog_tags.id',
        'blog_tags.name',
        'blog_tags.posts_count'
      )
      .select(knex.raw(`
        COALESCE(SUM(blog_posts.views_count), 0) as total_views,
        COALESCE(SUM(blog_posts.likes_count), 0) as total_likes,
        COALESCE(COUNT(blog_posts.id), 0) as recent_posts
      `))
      .leftJoin('blog_post_tags', 'blog_tags.id', 'blog_post_tags.tag_id')
      .leftJoin('blog_posts', function () {
        this.on('blog_post_tags.post_id', 'blog_posts.id')
          .andOn('blog_posts.created_at', '>=', knex.raw('?', [startDate]))
          .andOn('blog_posts.status', '=', knex.raw('?', ['published']));
      })
      .groupBy('blog_tags.id', 'blog_tags.name', 'blog_tags.posts_count')
      .orderBy('total_views', 'desc')
      .limit(limit);

    return {
      success: true,
      data: {
        timeframe: timeframe,
        tags: tagStats
      }
    };
  } catch (error) {
    logger.error('Error in getTagAnalytics:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء جلب تحليلات العلامات'
    };
  }
};

/**
 * Get real-time statistics
 */
const getRealTimeStats = async () => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      recentViews,
      recentLikes,
      recentComments,
      recentPosts,
      onlineUsers
    ] = await Promise.all([
      knex('blog_views').where('created_at', '>=', last24Hours).count('id as count').first(),
      knex('blog_likes').where('created_at', '>=', last24Hours).count('id as count').first(),
      knex('blog_comments').where('created_at', '>=', last24Hours).count('id as count').first(),
      knex('blog_posts').where('created_at', '>=', last24Hours).count('id as count').first(),
      // Approximate online users (views in last hour)
      knex('blog_views')
        .where('created_at', '>=', new Date(now.getTime() - 60 * 60 * 1000))
        .countDistinct('user_id as count')
        .first()
    ]);

    return {
      success: true,
      data: {
        last_24_hours: {
          views: parseInt(recentViews.count),
          likes: parseInt(recentLikes.count),
          comments: parseInt(recentComments.count),
          posts: parseInt(recentPosts.count)
        },
        estimated_online_users: parseInt(onlineUsers.count)
      }
    };
  } catch (error) {
    logger.error('Error in getRealTimeStats:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء جلب الإحصائيات المباشرة'
    };
  }
};

/**
 * Get search analytics (placeholder implementation)
 */
const getSearchAnalytics = async (_limit = 20, timeframe = '30d') => {
  try {
    // #TODO: Implement search analytics when search logging is available
    return {
      success: true,
      data: {
        timeframe: timeframe,
        search_terms: [],
        message: 'Search analytics not yet implemented'
      }
    };
  } catch (error) {
    logger.error('Error in getSearchAnalytics:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء جلب تحليلات البحث'
    };
  }
};

/**
 * Get user engagement analytics
 */
const getUserEngagementAnalytics = async (timeframe = '30d', limit = 50) => {
  try {
    const startDate = parseTimeframe(timeframe);

    // Get most active users (by likes and comments)
    const activeUsers = await knex.raw(`
      SELECT 
        u.user_id,
        COUNT(DISTINCT u.comment_id) as comments_count,
        COUNT(DISTINCT u.like_id) as likes_count,
        (COUNT(DISTINCT u.comment_id) + COUNT(DISTINCT u.like_id)) as total_engagement
      FROM (
        SELECT author_id as user_id, id as comment_id, NULL as like_id
        FROM blog_comments 
        WHERE created_at >= ? AND status = 'approved'
        UNION ALL
        SELECT user_id, NULL as comment_id, id as like_id
        FROM blog_likes 
        WHERE created_at >= ?
      ) u
      GROUP BY u.user_id
      ORDER BY total_engagement DESC
      LIMIT ?
    `, [startDate, startDate, limit]);

    return {
      success: true,
      data: {
        timeframe: timeframe,
        active_users: activeUsers,
        total_users_engaged: activeUsers.length
      }
    };
  } catch (error) {
    logger.error('Error in getUserEngagementAnalytics:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء جلب تحليلات تفاعل المستخدمين'
    };
  }
};

/**
 * Export analytics data (placeholder implementation)
 */
const exportAnalytics = async (_type = 'all', timeframe = '30d', format = 'json') => {
  try {
    // #TODO: Implement full export functionality with CSV and XLSX support
    const analyticsData = await getBlogAnalytics(timeframe, true);

    if (!analyticsData.success) {
      return analyticsData;
    }

    let contentType;
    let exportedData;

    switch (format) {
      case 'csv':
        contentType = 'text/csv';
        exportedData = 'CSV export not yet implemented';
        break;
      case 'xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        exportedData = 'XLSX export not yet implemented';
        break;
      case 'json':
      default:
        contentType = 'application/json';
        exportedData = JSON.stringify(analyticsData.data, null, 2);
    }

    return {
      success: true,
      data: exportedData,
      contentType: contentType
    };
  } catch (error) {
    logger.error('Error in exportAnalytics:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء تصدير التحليلات'
    };
  }
};

module.exports = {
  getAnalytics,
  getBlogAnalytics,
  getPostAnalytics,
  getTopPosts,
  getCategoryAnalytics,
  getTagAnalytics,
  getRealTimeStats,
  getSearchAnalytics,
  getUserEngagementAnalytics,
  exportAnalytics
};
