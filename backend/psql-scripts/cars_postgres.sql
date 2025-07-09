-- PostgreSQL-compatible schema for your car listing app
-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: advertisers
CREATE TABLE advertisers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    website TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED')),
    address TEXT,
    business_type TEXT NOT NULL
);

-- Table: advertisements
CREATE TABLE advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id UUID NOT NULL REFERENCES advertisers(id),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    target_url TEXT NOT NULL,
    placement TEXT NOT NULL CHECK (placement IN ('HOME', 'SEARCH', 'LISTING_PAGE', 'SIDEBAR')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED')),
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    budget NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: sellers
CREATE TABLE sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    location TEXT,
    first_name TEXT NOT NULL,
    picture TEXT DEFAULT 'https://media.istockphoto.com/vectors/default-profile-picture-avatar-photo-placeholder-vector-illustration-vector-id1223671392?k=6&m=1223671392&s=612x612&w=0&h=NGxdexflb9EyQchqjQP0m6wYucJBYLfu46KCLNMHZYM=',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    access_token TEXT,
    username TEXT UNIQUE,
    hashed_password BYTEA NOT NULL,
    salt BYTEA NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    reset_token TEXT,
    reset_token_expiry TIMESTAMP,
    email_token_expiry TIMESTAMP,
    user_ip TEXT,
    email_verification_token TEXT,
    email_verified BOOLEAN DEFAULT FALSE
);

-- Table: listed_cars
CREATE TABLE listed_cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price NUMERIC NOT NULL,
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
    mileage INTEGER,
    location TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    car_type TEXT,
    color TEXT,
    description TEXT,
    make TEXT,
    transmission TEXT,
    year TEXT,
    model TEXT,
    fuel TEXT,
    currency TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hp INTEGER,
    engine_cylinders INTEGER,
    engine_liters REAL,
    title TEXT,
    views INTEGER DEFAULT 0 NOT NULL,
    removal_reason TEXT,
    new_price NUMERIC,
    highlight BOOLEAN DEFAULT FALSE,
    auto_relist BOOLEAN DEFAULT FALSE
);

-- Table: car_images
CREATE TABLE car_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT,
    car_listing_id UUID REFERENCES listed_cars(id) ON DELETE CASCADE,
    delete_url TEXT
);

-- Table: conversation_participants
CREATE TABLE conversation_participants (
    conversation_id UUID REFERENCES conversations(id),
    user_id UUID REFERENCES sellers(id),
    role TEXT CHECK (role IN ('buyer', 'seller')),
    PRIMARY KEY (conversation_id, user_id)
);

-- Table: conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_listing_id UUID REFERENCES listed_cars(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: favorites
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    car_listing_id UUID NOT NULL REFERENCES listed_cars(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (seller_id, car_listing_id)
);

-- Table: listing_reports
CREATE TABLE listing_reports (
    id SERIAL PRIMARY KEY,
    listing_id UUID REFERENCES listed_cars(id),
    reporter_id UUID NOT NULL REFERENCES sellers(id),
    report_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    admin_notes TEXT,
    to_report TEXT,
    userid UUID REFERENCES sellers(id)
);

-- Table: messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender_id UUID NOT NULL REFERENCES sellers(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

-- Table: reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID UNIQUE REFERENCES sellers(id),
    reviewer_id UUID UNIQUE REFERENCES sellers(id),
    listing_id UUID REFERENCES listed_cars(id),
    reviewer_text TEXT,
    stars INTEGER CHECK (stars >= 0 AND stars <= 5),
    response_text TEXT,
    seller_username TEXT NOT NULL
);

-- Table: specs
CREATE TABLE specs (
    car_listing_id UUID REFERENCES listed_cars(id) ON DELETE CASCADE,
    spec_name TEXT
);

-- Indexes
CREATE INDEX idx_conversation_participants ON conversation_participants (conversation_id, user_id);
CREATE INDEX idx_messages_conversation_created ON messages (conversation_id, created_at DESC);
