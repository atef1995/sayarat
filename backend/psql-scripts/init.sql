-- Database initialization script for Cars Bids
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create basic tables (you can add more as needed)
-- This is just to ensure the database is properly initialized

-- Users/Sellers table example (adjust based on your actual schema)
CREATE TABLE IF NOT EXISTS sellers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog categories table example
CREATE TABLE IF NOT EXISTS blog_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add more tables as needed based on your application requirements
-- This is just a starter template

-- Insert default data
INSERT INTO blog_categories (name, slug, description) VALUES 
('General', 'general', 'General blog posts about cars'),
('Reviews', 'reviews', 'Car reviews and ratings'),
('News', 'news', 'Latest automotive news')
ON CONFLICT (slug) DO NOTHING;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully for Cars Bids application';
END $$;
