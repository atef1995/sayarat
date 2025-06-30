-- PostgreSQL-compatible schema and data for your car listing app
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

-- Table: sellers (add this if not present in your schema)
CREATE TABLE IF NOT EXISTS sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE
);

-- Table: favorites
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    car_listing_id UUID NOT NULL REFERENCES listed_cars(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (seller_id, car_listing_id)
);

-- Table: conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_listing_id UUID REFERENCES listed_cars(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: conversation_participants
CREATE TABLE conversation_participants (
    conversation_id UUID REFERENCES conversations(id),
    user_id UUID REFERENCES sellers(id),
    role TEXT CHECK (role IN ('buyer', 'seller')),
    PRIMARY KEY (conversation_id, user_id)
);

-- Add other tables as needed, following the same pattern.

-- You can now import your data using CSV or adapted INSERT statements.
-- For UUIDs, ensure your data uses valid UUID strings.
