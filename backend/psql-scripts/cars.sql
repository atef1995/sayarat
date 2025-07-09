--
-- File generated with SQLiteStudio v3.4.4 on Fri Jun 6 00:32:00 2025
--
-- Text encoding used: UTF-8
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: advertisements
CREATE TABLE IF NOT EXISTS advertisements (
    id            TEXT            PRIMARY KEY,
    advertiser_id TEXT            NOT NULL,
    title         TEXT            NOT NULL,
    description   TEXT,
    image_url     TEXT,
    target_url    TEXT            NOT NULL,
    placement     TEXT            NOT NULL
                                  CHECK (placement IN ('HOME', 'SEARCH', 'LISTING_PAGE', 'SIDEBAR') ),
    start_date    DATE            NOT NULL,
    end_date      DATE            NOT NULL,
    status        TEXT            DEFAULT 'PENDING'
                                  CHECK (status IN ('PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED') ),
    impressions   INTEGER         DEFAULT 0,
    clicks        INTEGER         DEFAULT 0,
    budget        DECIMAL (10, 2) NOT NULL,
    created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (
        advertiser_id
    )
    REFERENCES advertisers (id) 
);


-- Table: advertisers
CREATE TABLE IF NOT EXISTS advertisers (
    id            BLOB      PRIMARY KEY
                            DEFAULT (uuid() ),
    company_name  TEXT      NOT NULL,
    contact_name  TEXT      NOT NULL,
    email         TEXT      UNIQUE
                            NOT NULL,
    phone         TEXT      NOT NULL,
    website       TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status        TEXT      DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED') ),
    address       TEXT,
    business_type TEXT      NOT NULL
);


-- Table: car_images
CREATE TABLE IF NOT EXISTS car_images (
    id             BLOB PRIMARY KEY
                        DEFAULT (uuid() ) 
                        UNIQUE
                        NOT NULL,
    url            TEXT,
    car_listing_id      REFERENCES listed_cars (id) ON DELETE CASCADE,
    delete_url     TEXT,
    FOREIGN KEY (
        car_listing_id
    )
    REFERENCES listed_cars (id) ON DELETE CASCADE
);


-- Table: conversation_participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id,
    user_id,
    role            TEXT CHECK (role IN ('buyer', 'seller') ),
    PRIMARY KEY (
        conversation_id,
        user_id
    ),
    FOREIGN KEY (
        conversation_id
    )
    REFERENCES conversations (id),
    FOREIGN KEY (
        user_id
    )
    REFERENCES sellers (id) 
);


-- Table: conversations
CREATE TABLE IF NOT EXISTS conversations (
    id             BLOB      UNIQUE
                             NOT NULL
                             DEFAULT (uuid() ),
    car_listing_id           REFERENCES listed_cars (id) ON DELETE CASCADE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Table: favorites
CREATE TABLE IF NOT EXISTS favorites (
    id             BLOB     UNIQUE
                            NOT NULL
                            DEFAULT (uuid() ),
    seller_id      INTEGER  NOT NULL,
    car_listing_id INTEGER  NOT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (
        seller_id
    )
    REFERENCES sellers (id) ON DELETE CASCADE,
    FOREIGN KEY (
        car_listing_id
    )
    REFERENCES listed_cars (id) ON DELETE CASCADE,
    UNIQUE (
        seller_id,
        car_listing_id
    )
);


-- Table: listed_cars
CREATE TABLE IF NOT EXISTS listed_cars (
    id               BLOB                    UNIQUE
                                             NOT NULL
                                             DEFAULT (uuid() ),
    price            NUMERIC                 NOT NULL,
    seller_id                                REFERENCES sellers (id) ON DELETE CASCADE,
    mileage          INTEGER,
    location         TEXT,
    status           TEXT                    DEFAULT active,
    created_at       DATETIME                DEFAULT CURRENT_TIMESTAMP,
    car_type         TEXT,
    color            TEXT,
    description      TEXT,
    make             TEXT,
    transmission     TEXT,
    year             TEXT,
    model            TEXT,
    fuel             REAL,
    currency         TEXT,
    updated_at       TIMESTAMP               DEFAULT (CURRENT_TIMESTAMP),
    hp               INTEGER (1, 3000),
    engine_cylinders NUMERIC (1, 16),
    engine_liters    REAL,
    title            TEXT,
    views            NUMERIC                 DEFAULT (0) 
                                             NOT NULL,
    removal_reason   TEXT,
    new_price        NUMERIC (1, 1000000000),
    highlight        INTEGER (0, 1)          DEFAULT (0),
    auto_relist      INTEGER (0, 1)          DEFAULT (0),
    FOREIGN KEY (
        seller_id
    )
    REFERENCES sellers (id) ON DELETE CASCADE
);


-- Table: listing_reports
CREATE TABLE IF NOT EXISTS listing_reports (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    listing_id  BLOB,
    reporter_id INTEGER      NOT NULL,
    report_type TEXT         NOT NULL,
    reason      TEXT         NOT NULL,
    details     TEXT         NOT NULL,
    status      TEXT         NOT NULL
                             DEFAULT 'PENDING',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    admin_notes TEXT,
    to_report   TEXT (1, 12),
    userid      BLOB         REFERENCES sellers (id) ON DELETE CASCADE,
    FOREIGN KEY (
        listing_id
    )
    REFERENCES listed_cars (id),
    FOREIGN KEY (
        reporter_id
    )
    REFERENCES sellers (id) 
);


-- Table: messages
CREATE TABLE IF NOT EXISTS messages (
    id              BLOB      UNIQUE
                              NOT NULL
                              DEFAULT (uuid() ),
    conversation_id           NOT NULL,
    sender_id                 NOT NULL,
    content         TEXT      NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read         BOOLEAN   DEFAULT FALSE,
    FOREIGN KEY (
        conversation_id
    )
    REFERENCES conversations (id),
    FOREIGN KEY (
        sender_id
    )
    REFERENCES sellers (id) 
);


-- Table: reviews
CREATE TABLE IF NOT EXISTS reviews (
    id              BLOB           NOT NULL
                                   PRIMARY KEY,
    seller_id       BLOB           REFERENCES sellers (id) 
                                   UNIQUE,
    reviewer_id     BLOB           REFERENCES sellers (id) 
                                   UNIQUE,
    listing_id      BLOB           REFERENCES listed_cars (id),
    reviewer_text   TEXT,
    stars           INTEGER (0, 5),
    response_text   TEXT,
    seller_username TEXT           REFERENCES sellers (username) 
                                   NOT NULL
);


-- Table: sellers
CREATE TABLE IF NOT EXISTS sellers (
    id                       BLOB           PRIMARY KEY
                                            UNIQUE
                                            DEFAULT (uuid() ),
    email                    TEXT,
    location                 TEXT,
    first_name               TEXT           NOT NULL,
    picture                  TEXT           DEFAULT [https://media.istockphoto.com/vectors/default-profile-picture-avatar-photo-placeholder-vector-illustration-vector-id1223671392?k=6&m=1223671392&s=612x612&w=0&h=NGxdexflb9EyQchqjQP0m6wYucJBYLfu46KCLNMHZYM=],
    created_at               DATETIME       DEFAULT (CURRENT_TIMESTAMP),
    last_login               DATETIME,
    access_token             TEXT,
    username                 TEXT           UNIQUE,
    hashed_password          BLOB           NOT NULL,
    salt                     BLOB           NOT NULL,
    last_name                TEXT           NOT NULL,
    phone                    TEXT           NOT NULL,
    date_of_birth            TEXT           NOT NULL,
    reset_token              TEXT,
    reset_token_expiry       DATETIME,
    email_token_expiry       TIMESTAMP,
    user_ip                  TEXT,
    email_verification_token TEXT,
    email_verified           INTEGER (0, 1) DEFAULT (0) 
);


-- Table: specs
CREATE TABLE IF NOT EXISTS specs (
    car_listing_id BLOB REFERENCES listed_cars (id) ON DELETE CASCADE,
    spec_name      TEXT
);


-- Index: idx_conversation_participants
CREATE INDEX IF NOT EXISTS idx_conversation_participants ON conversation_participants (
    conversation_id,
    user_id
);


-- Index: idx_messages_conversation_created
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages (
    conversation_id,
    created_at DESC
);


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
