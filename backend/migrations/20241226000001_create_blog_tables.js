/**
 * Blog Schema Migration
 * Creates all necessary tables for the blog system
 */

exports.up = function (knex) {
  return knex.schema
    .createTable('blog_categories', table => {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.string('slug', 150).notNullable().unique();
      table.text('description');
      table.string('color', 7).defaultTo('#1890ff');
      table.string('icon', 50).defaultTo('FileTextOutlined');
      table.boolean('is_active').defaultTo(true);
      table.integer('posts_count').defaultTo(0);
      table.timestamps(true, true);

      table.index('slug');
      table.index('is_active');
    })
    .createTable('blog_tags', table => {
      table.increments('id').primary();
      table.string('name', 50).notNullable();
      table.string('slug', 75).notNullable().unique();
      table.text('description');
      table.integer('posts_count').defaultTo(0);
      table.timestamps(true, true);

      table.index('slug');
    })
    .createTable('blog_posts', table => {
      table.increments('id').primary();
      table.string('title', 200).notNullable();
      table.string('slug', 250).notNullable().unique();
      table.text('content').notNullable();
      table.text('excerpt');
      table.string('featured_image', 500);
      table.uuid('author_id').notNullable();
      table.integer('category_id').unsigned().notNullable();
      table.enum('status', ['draft', 'published', 'scheduled', 'archived']).defaultTo('draft');
      table.boolean('is_featured').defaultTo(false);
      table.string('meta_title', 200);
      table.text('meta_description');
      table.integer('reading_time');
      table.integer('views_count').defaultTo(0);
      table.integer('likes_count').defaultTo(0);
      table.integer('comments_count').defaultTo(0);
      table.timestamps(true, true);
      table.timestamp('published_at');
      table.timestamp('scheduled_at'); // Fixed column name

      // Car-specific fields
      table.string('car_make', 100);
      table.string('car_model', 100);
      table.integer('car_year');
      table.decimal('price_range_min', 12, 2);
      table.decimal('price_range_max', 12, 2);
      table.string('price_currency', 3).defaultTo('USD');
      table.enum('market_trend', ['rising', 'falling', 'stable']);
      table.string('source', 200);
      table.string('source_url', 500);
      table.decimal('rating', 3, 2);
      table.json('pros');
      table.json('cons');
      table.json('specifications');
      table.decimal('price_when_reviewed', 12, 2);
      table.json('steps'); // For guides

      // Indexes
      table.index('slug');
      table.index('status');
      table.index('author_id');
      table.index('category_id');
      table.index(['published_at', 'status']);
      table.index('is_featured');
      table.index(['car_make', 'car_model']);
      table.index('scheduled_at');

      // Foreign keys
      table.foreign('author_id').references('id').inTable('sellers').onDelete('CASCADE');
      table.foreign('category_id').references('id').inTable('blog_categories').onDelete('RESTRICT');
    })
    .createTable('blog_post_tags', table => {
      table.increments('id').primary();
      table.integer('post_id').unsigned().notNullable();
      table.integer('tag_id').unsigned().notNullable();
      table.timestamps(true, true);

      table.unique(['post_id', 'tag_id']);
      table.index('post_id');
      table.index('tag_id');

      table.foreign('post_id').references('id').inTable('blog_posts').onDelete('CASCADE');
      table.foreign('tag_id').references('id').inTable('blog_tags').onDelete('CASCADE');
    })

    .createTable('blog_comments', table => {
      table.increments('id').primary();
      table.integer('post_id').unsigned().notNullable();
      table.uuid('author_id').notNullable();
      table.integer('parent_id').unsigned();
      table.text('content').notNullable();
      table.enum('status', ['approved', 'pending', 'spam']).defaultTo('pending');
      table.integer('likes_count').defaultTo(0);
      table.integer('replies_count').defaultTo(0);
      table.timestamps(true, true);

      table.index('post_id');
      table.index('author_id');
      table.index('parent_id');
      table.index('status');
      table.index(['post_id', 'status']);

      table.foreign('post_id').references('id').inTable('blog_posts').onDelete('CASCADE');
      table.foreign('author_id').references('id').inTable('sellers').onDelete('CASCADE');
      table.foreign('parent_id').references('id').inTable('blog_comments').onDelete('CASCADE');
    })

    .createTable('blog_likes', table => {
      table.increments('id').primary();
      table.integer('post_id').unsigned().notNullable();
      table.uuid('user_id').notNullable();
      table.timestamps(true, true);

      table.unique(['post_id', 'user_id']);
      table.index('post_id');
      table.index('user_id');

      table.foreign('post_id').references('id').inTable('blog_posts').onDelete('CASCADE');
      table.foreign('user_id').references('id').inTable('sellers').onDelete('CASCADE');
    })

    .createTable('blog_views', table => {
      table.increments('id').primary();
      table.integer('post_id').unsigned().notNullable();
      table.uuid('user_id');
      table.string('ip_address', 45);
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index('post_id');
      table.index('user_id');
      table.index('created_at');
      table.index(['post_id', 'created_at']);

      table.foreign('post_id').references('id').inTable('blog_posts').onDelete('CASCADE');
      // table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    })

    .createTable('blog_admins', table => {
      table.increments('id').primary();
      table.string('username', 50).notNullable().unique();
      table.string('email', 100).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.string('full_name', 100).notNullable();
      table.string('avatar', 500);
      table.enum('role', ['super_admin', 'admin', 'editor', 'moderator']).defaultTo('moderator');
      table.json('permissions').defaultTo('[]');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('last_login');
      table.string('reset_token', 100);
      table.timestamp('reset_token_expires');
      table.timestamps(true, true);

      table.index('username');
      table.index('email');
      table.index('role');
      table.index('is_active');
    })

    .createTable('blog_admin_sessions', table => {
      table.increments('id').primary();
      table.integer('admin_id').unsigned().notNullable();
      table.string('token', 255).notNullable().unique();
      table.string('ip_address', 45);
      table.string('user_agent', 500);
      table.timestamp('expires_at').notNullable();
      table.timestamps(true, true);

      table.index('admin_id');
      table.index('token');
      table.index('expires_at');

      table.foreign('admin_id').references('id').inTable('blog_admins').onDelete('CASCADE');
    })

    .createTable('blog_admin_activities', table => {
      table.increments('id').primary();
      table.integer('admin_id').unsigned().notNullable();
      table.string('action', 100).notNullable(); // 'create', 'update', 'delete', 'publish', 'unpublish'
      table.string('resource_type', 50).notNullable(); // 'post', 'category', 'tag', 'comment', 'user'
      table.integer('resource_id').unsigned();
      table.json('details'); // Store additional details about the action
      table.string('ip_address', 45);
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index('admin_id');
      table.index('action');
      table.index('resource_type');
      table.index('created_at');
      table.index(['admin_id', 'created_at']);

      table.foreign('admin_id').references('id').inTable('blog_admins').onDelete('CASCADE');
    })

    .createTable('blog_content_moderation', table => {
      table.increments('id').primary();
      table.integer('content_id').unsigned().notNullable();
      table.enum('content_type', ['post', 'comment']).notNullable();
      table.integer('moderator_id').unsigned();
      table.enum('status', ['pending', 'approved', 'rejected', 'flagged']).defaultTo('pending');
      table.text('reason'); // Reason for rejection or flagging
      table.json('flags'); // Automated flags (spam, inappropriate, etc.)
      table.integer('priority').defaultTo(0); // Higher priority = needs immediate attention
      table.timestamps(true, true);

      table.index('content_type');
      table.index('status');
      table.index('moderator_id');
      table.index('priority');
      table.index(['content_type', 'content_id']);

      table.foreign('moderator_id').references('id').inTable('blog_admins').onDelete('SET NULL');
    })

    .then(() => {
      // Insert default categories
      return knex('blog_categories').insert([
        {
          name: 'أخبار السوق',
          slug: 'market-news',
          description: 'آخر أخبار وتطورات سوق السيارات في سوريا',
          color: '#ff4d4f',
          icon: 'NewspaperOutlined'
        },
        {
          name: 'مراجعات السيارات',
          slug: 'car-reviews',
          description: 'مراجعات شاملة للسيارات المختلفة',
          color: '#52c41a',
          icon: 'StarOutlined'
        },
        {
          name: 'دليل الشراء',
          slug: 'buying-guide',
          description: 'نصائح وإرشادات لشراء السيارات',
          color: '#1890ff',
          icon: 'ShoppingCartOutlined'
        },
        {
          name: 'صيانة وإصلاح',
          slug: 'maintenance',
          description: 'نصائح الصيانة والإصلاح',
          color: '#faad14',
          icon: 'ToolOutlined'
        },
        {
          name: 'قطع الغيار',
          slug: 'spare-parts',
          description: 'معلومات عن قطع الغيار والإكسسوارات',
          color: '#722ed1',
          icon: 'SettingOutlined'
        },
        {
          name: 'تقارير السوق',
          slug: 'market-reports',
          description: 'تقارير وإحصائيات السوق',
          color: '#13c2c2',
          icon: 'BarChartOutlined'
        }
      ]);
    })

    .then(() => {
      // Insert default tags
      return knex('blog_tags').insert([
        { name: 'سيارات مستعملة', slug: 'used-cars' },
        { name: 'سيارات جديدة', slug: 'new-cars' },
        { name: 'أسعار', slug: 'prices' },
        { name: 'مقارنات', slug: 'comparisons' },
        { name: 'تقييمات', slug: 'reviews' },
        { name: 'نصائح', slug: 'tips' },
        { name: 'صيانة', slug: 'maintenance' },
        { name: 'تأمين', slug: 'insurance' },
        { name: 'ترخيص', slug: 'licensing' },
        { name: 'استيراد', slug: 'import' },
        { name: 'تصدير', slug: 'export' },
        { name: 'فحص فني', slug: 'technical-inspection' },
        { name: 'قطع غيار', slug: 'spare-parts' },
        { name: 'إكسسوارات', slug: 'accessories' },
        { name: 'سوق دمشق', slug: 'damascus-market' },
        { name: 'سوق حلب', slug: 'aleppo-market' }
      ]);
    })

    .then(() => {
      // Create default admin user (password: admin123)
      const bcrypt = require('bcryptjs');
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync('admin123', salt);

      return knex('blog_admins').insert([
        {
          username: 'admin',
          email: 'admin@carsbids.com',
          password_hash: hashedPassword,
          full_name: 'System Administrator',
          role: 'super_admin',
          permissions: JSON.stringify([
            'create_posts',
            'edit_posts',
            'delete_posts',
            'publish_posts',
            'manage_categories',
            'manage_tags',
            'manage_comments',
            'manage_users',
            'manage_admins',
            'view_analytics',
            'content_moderation',
            'system_settings'
          ]),
          is_active: true
        },
        {
          username: 'editor',
          email: 'editor@carsbids.com',
          password_hash: hashedPassword,
          full_name: 'Content Editor',
          role: 'editor',
          permissions: JSON.stringify([
            'create_posts',
            'edit_posts',
            'publish_posts',
            'manage_categories',
            'manage_tags',
            'manage_comments',
            'view_analytics'
          ]),
          is_active: true
        },
        {
          username: 'moderator',
          email: 'moderator@carsbids.com',
          password_hash: hashedPassword,
          full_name: 'Content Moderator',
          role: 'moderator',
          permissions: JSON.stringify(['manage_comments', 'content_moderation', 'view_analytics']),
          is_active: true
        }
      ]);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('blog_content_moderation')
    .dropTableIfExists('blog_admin_activities')
    .dropTableIfExists('blog_admin_sessions')
    .dropTableIfExists('blog_admins')
    .dropTableIfExists('blog_views')
    .dropTableIfExists('blog_likes')
    .dropTableIfExists('blog_comments')
    .dropTableIfExists('blog_post_tags')
    .dropTableIfExists('blog_posts')
    .dropTableIfExists('blog_tags')
    .dropTableIfExists('blog_categories');
};
