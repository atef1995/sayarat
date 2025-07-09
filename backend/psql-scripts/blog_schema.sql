-- Blog System Database Schema
-- Creates tables for a comprehensive blog system with car market focus

-- Blog Categories Table
CREATE TABLE IF NOT EXISTS blog_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#1890ff', -- Hex color for category
    icon VARCHAR(50), -- Icon name for category
    posts_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog Tags Table
CREATE TABLE IF NOT EXISTS blog_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    posts_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image VARCHAR(500),
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES blog_categories(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    meta_title VARCHAR(255),
    meta_description TEXT,
    reading_time INTEGER, -- Estimated reading time in minutes
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    scheduled_for TIMESTAMP,
    
    -- Car-specific fields for market news and reviews
    car_make VARCHAR(50),
    car_model VARCHAR(50),
    car_year INTEGER,
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    price_currency VARCHAR(3) DEFAULT 'SYP',
    market_trend VARCHAR(20) CHECK (market_trend IN ('rising', 'falling', 'stable')),
    source VARCHAR(255),
    source_url VARCHAR(500),
    
    -- Review specific fields
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    pros TEXT[], -- Array of pros
    cons TEXT[], -- Array of cons
    specifications JSONB, -- Car specifications as JSON
    price_when_reviewed DECIMAL(10,2),
    
    -- Guide specific fields
    guide_type VARCHAR(20) CHECK (guide_type IN ('buying', 'selling', 'maintenance', 'insurance', 'financing')),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_time VARCHAR(50),
    required_tools TEXT[],
    steps JSONB -- Guide steps as JSON array
);

-- Blog Post Tags Junction Table
CREATE TABLE IF NOT EXISTS blog_post_tags (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, tag_id)
);

-- Blog Comments Table
CREATE TABLE IF NOT EXISTS blog_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES blog_comments(id) ON DELETE CASCADE,
    replies_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog Likes Table
CREATE TABLE IF NOT EXISTS blog_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Blog Views Table (for analytics)
CREATE TABLE IF NOT EXISTS blog_views (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_car_make_model ON blog_posts(car_make, car_model);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_user ON blog_likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_post ON blog_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag ON blog_post_tags(tag_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON blog_posts USING GIN(to_tsvector('arabic', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_blog_categories_search ON blog_categories USING GIN(to_tsvector('arabic', name || ' ' || COALESCE(description, '')));

-- Triggers to update counts and timestamps
CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_blog_posts_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update category posts count
        UPDATE blog_categories 
        SET posts_count = posts_count + 1 
        WHERE id = NEW.category_id;
        
        -- Update tags posts count
        UPDATE blog_tags 
        SET posts_count = posts_count + 1 
        WHERE id IN (
            SELECT tag_id FROM blog_post_tags WHERE post_id = NEW.post_id
        );
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update category posts count
        UPDATE blog_categories 
        SET posts_count = posts_count - 1 
        WHERE id = OLD.category_id;
        
        -- Update tags posts count
        UPDATE blog_tags 
        SET posts_count = posts_count - 1 
        WHERE id IN (
            SELECT tag_id FROM blog_post_tags WHERE post_id = OLD.post_id
        );
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_blog_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_posts 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.post_id;
        
        -- Update parent comment replies count
        IF NEW.parent_id IS NOT NULL THEN
            UPDATE blog_comments 
            SET replies_count = replies_count + 1 
            WHERE id = NEW.parent_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_posts 
        SET comments_count = comments_count - 1 
        WHERE id = OLD.post_id;
        
        -- Update parent comment replies count
        IF OLD.parent_id IS NOT NULL THEN
            UPDATE blog_comments 
            SET replies_count = replies_count - 1 
            WHERE id = OLD.parent_id;
        END IF;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_blog_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_posts 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_posts 
        SET likes_count = likes_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_blog_updated_at();

DROP TRIGGER IF EXISTS blog_categories_updated_at ON blog_categories;
CREATE TRIGGER blog_categories_updated_at 
    BEFORE UPDATE ON blog_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_blog_updated_at();

DROP TRIGGER IF EXISTS blog_comments_updated_at ON blog_comments;
CREATE TRIGGER blog_comments_updated_at 
    BEFORE UPDATE ON blog_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_blog_updated_at();

DROP TRIGGER IF EXISTS blog_post_tags_count ON blog_post_tags;
CREATE TRIGGER blog_post_tags_count 
    AFTER INSERT OR DELETE ON blog_post_tags 
    FOR EACH ROW 
    EXECUTE FUNCTION update_blog_posts_count();

DROP TRIGGER IF EXISTS blog_comments_count ON blog_comments;
CREATE TRIGGER blog_comments_count 
    AFTER INSERT OR DELETE ON blog_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_blog_comments_count();

DROP TRIGGER IF EXISTS blog_likes_count ON blog_likes;
CREATE TRIGGER blog_likes_count 
    AFTER INSERT OR DELETE ON blog_likes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_blog_likes_count();

-- Insert default categories
INSERT INTO blog_categories (name, slug, description, color, icon) VALUES
('أخبار السوق', 'market-news', 'آخر أخبار وتطورات سوق السيارات في سوريا', '#ff4d4f', 'NewspaperOutlined'),
('مراجعات السيارات', 'car-reviews', 'مراجعات شاملة للسيارات المختلفة', '#52c41a', 'StarOutlined'),
('دليل الشراء', 'buying-guide', 'نصائح وإرشادات لشراء السيارات', '#1890ff', 'ShoppingCartOutlined'),
('دليل البيع', 'selling-guide', 'كيفية بيع سيارتك بأفضل سعر', '#faad14', 'DollarOutlined'),
('صيانة السيارات', 'maintenance', 'نصائح الصيانة والعناية بالسيارات', '#722ed1', 'ToolOutlined'),
('التأمين والتمويل', 'insurance-finance', 'معلومات حول تأمين وتمويل السيارات', '#eb2f96', 'SafetyOutlined'),
('أخبار عامة', 'general-news', 'أخبار عامة متعلقة بقطاع السيارات', '#13c2c2', 'GlobalOutlined')
ON CONFLICT (slug) DO NOTHING;

-- Insert default tags
INSERT INTO blog_tags (name, slug) VALUES
('سيارات جديدة', 'new-cars'),
('سيارات مستعملة', 'used-cars'),
('نصائح', 'tips'),
('مراجعات', 'reviews'),
('أسعار', 'prices'),
('صيانة', 'maintenance'),
('تأمين', 'insurance'),
('تمويل', 'financing'),
('هيونداي', 'hyundai'),
('كيا', 'kia'),
('تويوتا', 'toyota'),
('نيسان', 'nissan'),
('شيفروليه', 'chevrolet'),
('فورد', 'ford'),
('بي إم دبليو', 'bmw'),
('مرسيدس', 'mercedes'),
('أودي', 'audi'),
('السوق السوري', 'syrian-market')
ON CONFLICT (slug) DO NOTHING;

-- Create function to generate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time(content_text TEXT)
RETURNS INTEGER AS $$
DECLARE
    word_count INTEGER;
    reading_time INTEGER;
BEGIN
    -- Count words (approximate for Arabic text)
    word_count := array_length(string_to_array(regexp_replace(content_text, '[^\w\s]', ' ', 'g'), ' '), 1);
    
    -- Calculate reading time (assuming 200 words per minute for Arabic)
    reading_time := GREATEST(1, CEIL(word_count::FLOAT / 200));
    
    RETURN reading_time;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate reading time
CREATE OR REPLACE FUNCTION update_reading_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reading_time := calculate_reading_time(NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_posts_reading_time ON blog_posts;
CREATE TRIGGER blog_posts_reading_time 
    BEFORE INSERT OR UPDATE ON blog_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_reading_time();
