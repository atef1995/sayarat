--
-- File generated with SQLiteStudio v3.4.4 on Fri Jun 6 00:21:44 2025
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

INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('9e0167e3-7893-4d33-a169-50f9d9e77fb0', 'https://i.ibb.co/Xr29RHN8/4cafa55d637b.jpg', 'undefined', 'https://ibb.co/rR7gr9Ts/81b5af2d87fd18b88b7bdde2e0070b39');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('04425584-46fb-4239-b929-88b8fe9a8427', 'https://i.ibb.co/Xr29RHN8/4cafa55d637b.jpg', 'd8263be8-563a-4df2-ae4f-4d7992c2086d', 'https://ibb.co/rR7gr9Ts/81b5af2d87fd18b88b7bdde2e0070b39');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('5054d0e0-3b93-4ec1-a4d8-1dc119ccb496', 'https://i.ibb.co/3yRw2DPq/2d0cdb37a265.jpg', 'd8263be8-563a-4df2-ae4f-4d7992c2086d', 'https://ibb.co/GvHXyKrL/a8ac0946fd22984ab125a9fad4c25d10');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('33b67990-70d1-4ac0-9038-b1805b79572e', 'https://i.ibb.co/dsrr6XZy/81834a198a25.jpg', '376137c4-157a-4d53-8dff-1b45f093345f', 'https://ibb.co/NgsspfRz/6f5f16860b45bb0a892c3f208132a4ff');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('4b902aab-3a71-4790-9f37-81d1a725fd56', 'https://i.ibb.co/BHKn8YP9/f907f115a807.jpg', '376137c4-157a-4d53-8dff-1b45f093345f', 'https://ibb.co/xK8FVrsN/7d852e5873b79d58a6ec38186c6909c7');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('840b3988-41b2-4e39-aa05-43863b063f69', 'https://i.ibb.co/d4gvVm4f/eaafcd017a49.jpg', 'd867939c-f22f-4fb7-bc51-f109e7e9cc20', 'https://ibb.co/Mk6HtBkg/23e8ed7eaf71a08e59ee64a59374fbb9');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('670eee88-1822-4fa5-9a43-3307cdbab04d', 'https://i.ibb.co/PGzdH08d/a0fad37a2bd6.jpg', 'd867939c-f22f-4fb7-bc51-f109e7e9cc20', 'https://ibb.co/0yVxbv3x/9fb9357d5a0f29806e65c3dacf4ff91d');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('2870c5b8-c64f-4f22-9f21-7606631d5b72', 'https://i.ibb.co/Xk3zGRJn/e7ec679d4e45.jpg', 'd867939c-f22f-4fb7-bc51-f109e7e9cc20', 'https://ibb.co/5xn5JHcQ/94d3ca393a7b95a9642754acd6e38b1f');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('fd1de13b-ffb2-44a7-aa51-2716be85cc69', 'https://i.ibb.co/Jj84SRdc/3e51886c34a8.jpg', '03b5e35c-d82e-4f79-80f3-aba7a2f88e94', 'https://ibb.co/ZzvPb6Jf/12eaf2e96375228e48974f20a53d0472');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('3f1a1d39-e7a9-4ca0-9b32-ef5dfa2a90df', 'https://i.ibb.co/7JxrcbxY/0cfdefad0f02.jpg', '3ec68987-f058-4d41-87f0-bd12bf938908', 'https://ibb.co/jv93KH96/efd0de82203859a04f4e79d012734851');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('9463a2b1-a814-46b5-b807-529dbd74d0dd', 'https://i.ibb.co/3ZFjkQ9/a4891c99cef6.jpg', '3ec68987-f058-4d41-87f0-bd12bf938908', 'https://ibb.co/QwHTXt3/7582ac1704b97cc8f81da6ed1cca376a');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('4c7d28da-ebb1-4b54-bfc5-c42faa3cd974', 'https://i.ibb.co/nqPf2jZ7/6807d8463f5b.jpg', 'ca0297b0-66cc-4549-86b5-bd4a3c25515d', 'https://ibb.co/9mZ2XWzb/1828291bf616fc55fb8a8bcd314ba770');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('3a52db23-5c94-43b4-93f5-fa7028e16a04', 'https://i.ibb.co/cKLNS3Nh/3e7228cc8b26.jpg', 'ca0297b0-66cc-4549-86b5-bd4a3c25515d', 'https://ibb.co/My6RxSRk/9f8e78aa4c5a359c40a89890c3c56b1f');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('8a170126-0d53-4544-8043-6c98821e2e6e', 'https://i.ibb.co/TxhBX1v3/8994f2e3e8cc.jpg', 'ca0297b0-66cc-4549-86b5-bd4a3c25515d', 'https://ibb.co/kscgnJHC/4c06d102c6c42087ea00511569159608');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('cfdf05f3-6e98-4315-9ee3-6fd697d22d9d', 'https://i.ibb.co/BVhxYZZv/4bf62589768b.jpg', '95a417e8-c6fc-4f88-97b0-4130ee5f13f8', 'https://ibb.co/LzTWsttB/b0c02b9e2ff67fbb2953162a895cc1a8');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('36006477-37a3-47f3-bfad-24d970ec018e', 'https://i.ibb.co/5Xt6tQjb/a36334b0c75d.jpg', '95a417e8-c6fc-4f88-97b0-4130ee5f13f8', 'https://ibb.co/ZRtVtQgq/de19a2f60f1aa2208c467b1c65e02b0f');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('9acdc7f7-9200-4324-a590-cba32b9f1551', 'https://i.ibb.co/6RbX6xmK/0497f959d5d7.jpg', 'e6723ffc-097f-42a9-8e64-ec8110072bda', 'https://ibb.co/PZ4DBnN2/b3799fae2eb4e4dac32932dd9a3088dd');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('feb4855e-e1d9-4834-b096-76ca9e274dfb', 'https://i.ibb.co/Fk7ksBm8/d17fca00344e.jpg', 'e6723ffc-097f-42a9-8e64-ec8110072bda', 'https://ibb.co/ymsmh8dg/131b577b235f011940dcc18f28cef520');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('e9522e96-be55-4cad-b0cb-8b6dadfbb69e', 'https://i.ibb.co/mFVgrKfT/a3ca43fd0364.jpg', 'e6723ffc-097f-42a9-8e64-ec8110072bda', 'https://ibb.co/YTFw4SHQ/93d6949c8e8644fee374d5cbc8a9979b');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('452219be-295f-4c55-a2e5-ec59ddcbcaef', 'https://i.ibb.co/VYcd2RJz/2ba017e8bc97.jpg', '9cf185fe-b26a-41d3-9198-a6b85876bbb3', 'https://ibb.co/6072gzrT/6957f3ca12b358ee24e57641f6eb59c2');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('73a1e388-33ff-4d87-8a02-e2597bcc2501', 'https://i.ibb.co/Fqz01Lbn/37be837df70e.jpg', '9cf185fe-b26a-41d3-9198-a6b85876bbb3', 'https://ibb.co/93WV0k9G/81f9a7d753bc77033f4187f152d4378c');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('f084aa9e-2a10-4ddb-9c50-0c526be336d2', 'https://i.ibb.co/spbMsfFK/4b2230c4149d.jpg', '0be52f78-6988-4ff8-bc32-05e0be030564', 'https://ibb.co/nq65QGD7/d56126378d949e3a9b915b73e7baead4');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('5af21373-f5d6-4b90-a016-64b2d0516df4', 'https://i.ibb.co/BH7DPZsH/fb147f8eb1b4.jpg', '0be52f78-6988-4ff8-bc32-05e0be030564', 'https://ibb.co/TDnXT8hD/e0bcd154ecfc661430392171f3c3f239');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('450e5833-bdde-4146-96bf-7be900da662f', 'https://i.ibb.co/67JdHFLM/5883cacd0dc4.jpg', 'ff6f9d7c-1c4c-40c9-a9f1-19cb2a32663a', 'https://ibb.co/ycB36q79/b6aea87d590c5c8d23d677d2c3b3bc60');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('a06bb53d-7c5a-41a9-a8b1-0aabd79e54d2', 'https://i.ibb.co/Myk14yyQ/02a9a6fae913.jpg', 'ff6f9d7c-1c4c-40c9-a9f1-19cb2a32663a', 'https://ibb.co/nqM1vqqt/a51b7ea73c75fbd62349e0e3aa64b02e');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('f059110d-f066-4057-ac5f-a6a1591c08fe', 'https://i.ibb.co/0pKjnkvN/acf066c7c43c.jpg', 'ff6f9d7c-1c4c-40c9-a9f1-19cb2a32663a', 'https://ibb.co/xKYS2ydv/42e719df297a48bbaa9d5c6faa506b43');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('840f4108-a463-4b63-a811-8ab00530c522', 'https://i.ibb.co/7J9dtwVw/e5cb570823cb.jpg', '6e45b5ee-232f-4c05-a8d1-b5b39380836e', 'https://ibb.co/C5r3Kkvk/542f09ba094d4565195555d68dc9f30f');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('f675f494-0f4f-451c-b417-90115a63b6a1', 'https://i.ibb.co/39TJSdzz/0260ea70c75e.jpg', '6e45b5ee-232f-4c05-a8d1-b5b39380836e', 'https://ibb.co/0RnwY2tt/c79e32f6eb14e68bd3923a834a578630');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('ef356cbb-0e8b-46ac-9909-81b379821d37', 'https://i.ibb.co/fdxn68Pf/b40007a5a3a7.jpg', '6e45b5ee-232f-4c05-a8d1-b5b39380836e', 'https://ibb.co/3mCM6fL2/a3ce21e70c51baade6750e8900b6370f');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('2c3244ac-da97-4294-afdf-d0c1c943f759', 'https://i.ibb.co/xSWwzJfL/e83271cc0799.jpg', 'eda476f1-ce43-4cb6-8db2-525826e5fb88', 'https://ibb.co/cc0R2DC3/7105e41cc80b8bee6e2fcf878ac97193');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('6f05ace2-173b-4db9-ac78-221888778787', 'https://i.ibb.co/G4kP0cZd/8f36ee58f426.jpg', 'eda476f1-ce43-4cb6-8db2-525826e5fb88', 'https://ibb.co/Jw2kK5Yc/4303029c22c39c393c96611209684721');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('bc4096c5-0432-4e65-8852-59ce69eb937b', 'https://i.ibb.co/Q3sKMVkJ/0aa36faa58ac.jpg', 'eda476f1-ce43-4cb6-8db2-525826e5fb88', 'https://ibb.co/8LF79wbm/2f1f1050f198da896733d3eaac70f2aa');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('be28ae9f-37da-4979-aee9-4cdbd45a4ddb', 'https://i.ibb.co/MksnrJCJ/7d669221a4e8.jpg', 'efdfd5d3-3079-4e1c-be94-ab1fc1f81d44', 'https://ibb.co/VYtVRkqk/2a3a13dc537c50696e70279df6c0402c');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('2db9074b-e11f-44d3-b9cc-762df2966db9', 'https://i.ibb.co/v6L7jSsL/7b4c4cb05e9b.jpg', '1c9f59e2-c361-4781-8540-0d5b97e080e0', 'https://ibb.co/5gsNRPYs/b1debe3c74b7fe309cc59c9d474a2c84');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('eaa01229-d395-4fdc-a75e-363d53964da0', 'https://i.ibb.co/LXGRW5M6/3697a358519d.jpg', 'e91e0100-1ede-4449-a7bb-a773fe10f2be', 'https://ibb.co/xt4L0HyG/1a1fcff00fc72d9b2345bad1b72fee31');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('4ddc0efa-c973-4a71-857e-6ea9bd587efa', 'https://i.ibb.co/VcTbRHD9/ed8113d0251e.jpg', 'd074de09-03ef-47fd-b611-c5e8507e2870', 'https://ibb.co/zTZCp8bx/7859e9833bd45cb32f5ba01cb22617a0');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('37020456-f4a5-4e60-bbc4-55696d50acec', 'https://i.ibb.co/YFQWpCBC/e0faee019db9.jpg', 'd074de09-03ef-47fd-b611-c5e8507e2870', 'https://ibb.co/0R2Xh7y7/5401eb3e2bf7486d1e24c826929138f5');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('b69f871a-1654-4381-8526-5eb03fe7405f', 'https://i.ibb.co/Kz7w1k2Z/3bde09d8bd63.jpg', 'd074de09-03ef-47fd-b611-c5e8507e2870', 'https://ibb.co/4gMdQG8y/03e6e5e7aab0e53e77074c0d72c30cad');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('f451ba44-1581-444e-9057-5e6ca1a587ad', 'https://i.ibb.co/tPk0n340/63266d35124b.jpg', 'd074de09-03ef-47fd-b611-c5e8507e2870', 'https://ibb.co/DgsBmLtB/77512377cb20097f68542fc6e042f674');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('9e25d8cc-9bea-47eb-9db8-c50421770108', 'https://i.ibb.co/0VVCvm7x/a4a90a2c1b8f.jpg', '28c1d68b-878e-43f4-912d-d6e6431c5ef2', 'https://ibb.co/cXX6VkBj/d175a969a2bca5f7db8d11d54c429844');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('252c746c-c94f-4d7b-8142-0f41476fb059', 'https://i.ibb.co/QvqtQH4F/9777a4faad0e.jpg', '2f0e3328-df80-4ff0-9ca7-f755a3fafa7d', 'https://ibb.co/s9DzR1Zv/9a90ea9907b09a542cb5bcf701253718');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('4158ff47-f69d-46c3-b816-77e670da625f', 'https://i.ibb.co/DHzWQ7pB/5c3f8917dc4a.png', '017e48e4-df8f-4a79-9323-c360ef386927', 'https://ibb.co/nN6mjDCX/a88a481c68abb3f91ec208f8541d1863');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('da42fe4f-87ba-411f-a8c4-b0ce9612b33c', 'https://i.ibb.co/rfy3wj13/4d49c88090c7.jpg', '1c70539e-cf4a-4b6e-9872-895933c26e65', 'https://ibb.co/x85Y7kRY/ad88f04995b9f244d7ffdda03390facf');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('51d2ec80-7cbb-4ab0-9ff8-42b3384443db', 'https://i.ibb.co/rfy3wj13/4d49c88090c7.jpg', '2f0e3328-df80-4ff0-9ca7-f755a3fafa7d', 'https://ibb.co/x85Y7kRY/ad88f04995b9f244d7ffdda03390facf');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('682db57d-87ef-4851-912d-590e1246425f', 'https://i.ibb.co/VcKnHZm6/f18842bd1121.png', '1c70539e-cf4a-4b6e-9872-895933c26e65', 'https://ibb.co/YFrnDMZg/b8bde2a6aec0b27da49a42a6157a9b91');
INSERT INTO car_images (id, url, car_listing_id, delete_url) VALUES ('31eacce9-dbc7-42a9-b8c4-f932fb9f1356', 'https://i.ibb.co/C5CVxGTM/19b724bdd817.jpg', 'dceba3d0-a921-4e31-8202-894595c3c5c6', 'https://ibb.co/4Zv4Br5Y/eabc973bcd4857b4f29577fdb046ef62');

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

INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ('2a51ad7f-9c5e-4d6a-aa0a-baf6bd62b5c3', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'seller');
INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ('2a51ad7f-9c5e-4d6a-aa0a-baf6bd62b5c3', 'a17f42ca-1051-47cf-bd67-9ec132e759c9', 'buyer');
INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ('340f95a3-c4be-496e-b84a-4c5030b982e9', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'seller');
INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ('340f95a3-c4be-496e-b84a-4c5030b982e9', 'a17f42ca-1051-47cf-bd67-9ec132e759c9', 'buyer');
INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ('1a6cb5aa-6c4e-4248-adfb-ab38858a4d93', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'seller');
INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ('1a6cb5aa-6c4e-4248-adfb-ab38858a4d93', '67ad8803-7b7b-45cb-9f0b-0aa92734ac86', 'buyer');
INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ('1535031c-1c53-4538-b289-76d5e29fc2d4', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'seller');
INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ('1535031c-1c53-4538-b289-76d5e29fc2d4', '67ad8803-7b7b-45cb-9f0b-0aa92734ac86', 'buyer');
INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ('3cffab4c-6938-4881-bf21-25b2e2d6ae60', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'seller');
INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ('3cffab4c-6938-4881-bf21-25b2e2d6ae60', '67ad8803-7b7b-45cb-9f0b-0aa92734ac86', 'buyer');
INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ('5bc5117c-e270-4cc8-9b27-de55a636b946', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'seller');
INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ('5bc5117c-e270-4cc8-9b27-de55a636b946', '67ad8803-7b7b-45cb-9f0b-0aa92734ac86', 'buyer');

-- Table: conversations
CREATE TABLE IF NOT EXISTS conversations (
    id             BLOB      UNIQUE
                             NOT NULL
                             DEFAULT (uuid() ),
    car_listing_id           REFERENCES listed_cars (id) ON DELETE CASCADE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO conversations (id, car_listing_id, created_at, updated_at) VALUES ('2a51ad7f-9c5e-4d6a-aa0a-baf6bd62b5c3', '7633ba44-09c5-4ae5-8fc8-f65f082fb6bd', '2025-02-03 23:49:34', '2025-02-03 23:49:34');
INSERT INTO conversations (id, car_listing_id, created_at, updated_at) VALUES ('340f95a3-c4be-496e-b84a-4c5030b982e9', 'd8263be8-563a-4df2-ae4f-4d7992c2086d', '2025-03-11 13:51:12', '2025-03-11 13:51:12');
INSERT INTO conversations (id, car_listing_id, created_at, updated_at) VALUES ('1a6cb5aa-6c4e-4248-adfb-ab38858a4d93', 'dceba3d0-a921-4e31-8202-894595c3c5c6', NULL, NULL);
INSERT INTO conversations (id, car_listing_id, created_at, updated_at) VALUES ('1535031c-1c53-4538-b289-76d5e29fc2d4', '0e532b55-f937-421e-bd18-2edfe51c32d7', '2025-06-04T12:28:40.069Z', '2025-06-04T12:28:40.069Z');
INSERT INTO conversations (id, car_listing_id, created_at, updated_at) VALUES ('3cffab4c-6938-4881-bf21-25b2e2d6ae60', 'e186de6c-7791-4fee-bc3c-23e2d9c414fa', '2025-06-04T12:29:06.389Z', '2025-06-04T12:29:06.389Z');
INSERT INTO conversations (id, car_listing_id, created_at, updated_at) VALUES ('5bc5117c-e270-4cc8-9b27-de55a636b946', '1c70539e-cf4a-4b6e-9872-895933c26e65', '2025-06-04T12:34:33.788Z', '2025-06-04T12:34:33.788Z');

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

INSERT INTO favorites (id, seller_id, car_listing_id, created_at) VALUES ('7e9410ae-ec68-4f5b-a09f-96c93cced819', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', '7633ba44-09c5-4ae5-8fc8-f65f082fb6bd', '2025-02-02 15:43:14');
INSERT INTO favorites (id, seller_id, car_listing_id, created_at) VALUES ('35b62234-d917-4f9e-93e5-1fd211b192af', 'a17f42ca-1051-47cf-bd67-9ec132e759c9', '1c9f59e2-c361-4781-8540-0d5b97e080e0', '2025-03-15 02:29:26');
INSERT INTO favorites (id, seller_id, car_listing_id, created_at) VALUES ('1481ed60-b96b-494e-961f-9d5d61b968c8', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', '2f0e3328-df80-4ff0-9ca7-f755a3fafa7d', '2025-05-31 21:28:50');
INSERT INTO favorites (id, seller_id, car_listing_id, created_at) VALUES ('45b4b043-c7aa-408f-b7a2-8dbb6f3fb08b', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', '1c70539e-cf4a-4b6e-9872-895933c26e65', '2025-05-31 21:29:38');
INSERT INTO favorites (id, seller_id, car_listing_id, created_at) VALUES ('52313c12-958a-44ef-8483-6fbc02133365', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', '28c1d68b-878e-43f4-912d-d6e6431c5ef2', '2025-05-31 21:29:39');
INSERT INTO favorites (id, seller_id, car_listing_id, created_at) VALUES ('34e8fe1f-8747-4b63-b49e-9d8934f14a48', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', '1c9f59e2-c361-4781-8540-0d5b97e080e0', '2025-05-31 21:29:41');
INSERT INTO favorites (id, seller_id, car_listing_id, created_at) VALUES ('a1173e93-8f93-4472-900f-b4e43379fab3', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'e91e0100-1ede-4449-a7bb-a773fe10f2be', '2025-05-31 21:30:57');
INSERT INTO favorites (id, seller_id, car_listing_id, created_at) VALUES ('e3bf122d-56a3-404b-a757-525f09f686ab', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'd074de09-03ef-47fd-b611-c5e8507e2870', '2025-05-31 21:30:58');
INSERT INTO favorites (id, seller_id, car_listing_id, created_at) VALUES ('4df42f90-3a7c-4d32-9b82-674caf9db770', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'efdfd5d3-3079-4e1c-be94-ab1fc1f81d44', '2025-05-31 21:31:01');

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

INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('d8263be8-563a-4df2-ae4f-4d7992c2086d', 66666, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', '20 000', 'دمشق', 'active', '2025-02-20 23:03:31', 'سيدان', 'أحمر', 'cR', 'BMW', 'اوتوماتيك', '2023', 'M3', 'بنزين', 'usd', '2025-02-20 23:03:31', 666, NULL, NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('376137c4-157a-4d53-8dff-1b45f093345f', 30000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', '80 000', 'دمشق', 'active', '2025-02-20 23:07:03', 'بابين', 'أزرق', 'CC', 'BMW', 'اوتوماتيك', '2017', 'M2', 'بنزين', 'usd', '2025-02-20 23:07:03', 400, NULL, NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('72979b21-28b4-4e44-865f-bf24647af4d5', 43655, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 120000, 'دمشق', 'expired', '2025-03-12 00:47:34', 'هاتشباك', 'أسود', 'car', 'Mercedes-Benz', 'اوتوماتيك', '2019', 'Mercedes-AMG A-Class', 'بنزين', 'usd', '2025-05-24 19:27:07', 400, NULL, NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('d867939c-f22f-4fb7-bc51-f109e7e9cc20', 45000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 120000, 'دمشق', 'active', '2025-03-12 00:49:14', 'سيدان', 'أسود', 'very nice car', 'BMW', 'اوتوماتيك', '2018', 'M3', 'بنزين', 'usd', '2025-03-12 00:49:14', 600, NULL, NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('03b5e35c-d82e-4f79-80f3-aba7a2f88e94', 50000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'حلب', 'active', '2025-03-12 00:50:38', 'سيدان', 'أبيض', 'car', 'BMW', 'اوتوماتيك', '2017', 'M5', 'بنزين', 'usd', '2025-03-12 00:50:38', 600, NULL, NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('3ec68987-f058-4d41-87f0-bd12bf938908', 25000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 120000, 'حلب', 'active', '2025-03-12 00:52:14', 'هاتشباك', 'أبيض', 'car', 'Mercedes-Benz', 'اوتوماتيك', '2014', 'Mercedes-AMG A-Class', 'بنزين', 'usd', '2025-03-12 00:52:14', 360, NULL, NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('ca0297b0-66cc-4549-86b5-bd4a3c25515d', 55000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 150000, 'حلب', 'active', '2025-03-12 00:56:27', 'سيدان', 'أسود', 'car', 'Mercedes-Benz', 'اوتوماتيك', '2018', 'Mercedes-AMG GT', 'بنزين', 'usd', '2025-03-12 00:56:27', 600, NULL, NULL, NULL, 1, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('44163e14-4800-41e5-910d-2fea248e92fa', 100000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 30000, 'اللاذقية', 'expired', '2025-03-12 01:08:50', 'بابين', 'أخضر', 'car', 'Mercedes-Benz', 'اوتوماتيك', '2019', 'Mercedes-AMG GT', 'بنزين', 'usd', '2025-05-24 19:25:58', 'undefined', NULL, NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('95a417e8-c6fc-4f88-97b0-4130ee5f13f8', 80000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 70000, 'دمشق', 'active', '2025-03-12 01:14:08', 'بابين', 'أحمر', 'car', 'Porsche', 'اوتوماتيك', '2018', 'Cayman', 'بنزين', 'usd', '2025-03-12 01:14:08', 600, NULL, NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('e6723ffc-097f-42a9-8e64-ec8110072bda', 80000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'حلب', 'active', '2025-03-12 01:16:28', '(ستيشن) واغن', 'أسود', 'aud', 'Audi', 'اوتوماتيك', '2019', 'RS 6', 'بنزين', 'usd', '2025-03-12 01:16:28', 800, NULL, NULL, NULL, 1, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('9cf185fe-b26a-41d3-9198-a6b85876bbb3', 66742, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 20000, 'دمشق', 'active', '2025-03-12 01:29:26', 'جبلية', 'أبيض', 'aaaaaaaa', 'Lexus', 'اوتوماتيك', '2021', 'LS', 'بنزين', 'usd', '2025-03-12 01:29:26', 'undefined', NULL, NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('0be52f78-6988-4ff8-bc32-05e0be030564', 60000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 80000, 'دمشق', 'active', '2025-03-12 22:43:02', 'بابين', 'أحمر', 'supra', 'Toyota', 'اوتوماتيك', '2021', 'Supra', 'بنزين', 'usd', '2025-03-12 22:43:02', 650, NULL, NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('ff6f9d7c-1c4c-40c9-a9f1-19cb2a32663a', 20000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 120000, 'حمص', 'active', '2025-03-12 22:46:13', 'بابين', 'أحمر', 'gt86', 'Toyota', 'اوتوماتيك', '2013', 'GR86', 'بنزين', 'usd', '2025-03-12 22:46:13', 211, NULL, NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('6e45b5ee-232f-4c05-a8d1-b5b39380836e', 30000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 100000, 'دمشق', 'active', '2025-03-12 22:57:33', 'هاتشباك', 'أخضر', 'اودي', 'Audi', 'اوتوماتيك', '2018', 'RS 3', 'بنزين', 'usd', '2025-03-12 22:57:33', 500, NULL, NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('eda476f1-ce43-4cb6-8db2-525826e5fb88', 50000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 40000, 'حلب', 'active', '2025-03-13 03:30:19', 'بابين', 'أزرق', 'bmw', 'BMW', 'اوتوماتيك', '2019', 'M2', 'بنزين', 'usd', '2025-03-13 03:30:19', 500, NULL, NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('efdfd5d3-3079-4e1c-be94-ab1fc1f81d44', 30000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 20000, 'دمشق', 'active', '2025-03-13 15:00:52', NULL, 'أبيض', 'aa', 'Hyundai', 'اوتوماتيك', '2021', 'Elantra', 'بنزين', 'usd', '2025-03-13 15:00:52', 270, NULL, NULL, 'هيونداي النترا ن', 1, NULL, 30000, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('1c9f59e2-c361-4781-8540-0d5b97e080e0', 10000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 100000, 'دمشق', 'active', '2025-03-13 15:44:57', 'بابين', 'فضي', 'hyunda', 'Hyundai', 'اوتوماتيك', '2012', 'Genesis Coupe', 'بنزين', 'usd', '2025-03-13 15:44:57', 300, NULL, NULL, NULL, 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('4ccf4478-8f9f-480a-b9a5-f701aa90c36f', 70000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 70000, 'دمشق', 'expired', '2025-03-13 15:47:56', 'بابين', 'فضي', 'merc', 'Mercedes-Benz', 'اوتوماتيك', '2019', 'Mercedes-AMG C-Class', 'بنزين', 'usd', '2025-05-24 19:27:45', 600, NULL, NULL, NULL, 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('e91e0100-1ede-4449-a7bb-a773fe10f2be', 70000, 'a17f42ca-1051-47cf-bd67-9ec132e759c9', 6000, 'دمشق', 'active', '2025-03-15 02:53:33', 'بابين', 'أسود', 'bmw m2 ', 'BMW', 'يدوي', '2022', 'M2', 'بنزين', 'usd', '2025-03-15 02:53:33', 666, NULL, NULL, NULL, 2, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('d074de09-03ef-47fd-b611-c5e8507e2870', 25000, 'a17f42ca-1051-47cf-bd67-9ec132e759c9', 10000, 'دمشق', 'active', '2025-03-15T14:25:58.583Z', 'هاتشباك', 'فضي', 'هيونداي النترا بحالة جيدة', 'Hyundai', 'يدوي', '2022', 'Elantra', 'بنزين', 'usd', '2025-03-15T14:25:58.583Z', 270, NULL, NULL, 'هيونداي النترا ن', 2, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('28c1d68b-878e-43f4-912d-d6e6431c5ef2', 120, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 3000, 'دمشق', 'active', '2025-03-24T02:30:22.555Z', 'بيكأب', 'أزرق', 'gra', 'Dodge', 'اوتوماتيك', '1999', 'Caravan Cargo', 'بنزين', 'usd', '2025-03-24T02:30:22.555Z', 'undefined', NULL, NULL, 'clio', 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('262a3c9d-8c30-4cbd-8d5e-a16d619dbbf3', 'undefined', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'undefined', 'undefined', 'expired', '2025-03-31T09:44:41.060Z', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'usd', '2025-05-24 19:22:44', 'undefined', NULL, NULL, 'undefined', 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('42f23432-3e50-46f9-8434-02cc5cb990ae', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', '2025-05-23T15:04:42.739Z', 'جبلية', 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-24 19:24:58', 'undefined', NULL, NULL, 'Test Car Listing', 3, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('58fe8af7-e711-451b-870a-ac0145852f7e', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', '2025-05-24T20:52:46.606Z', 'جبلية', 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:55:45', 'undefined', NULL, NULL, 'Test Car Listing', 2, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('29eaa65a-9ceb-4b79-b16f-43155cc7f95c', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:55:26', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('b028baee-0dad-4c9f-8b70-2b99f5c2aa8d', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:56:01', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('017e48e4-df8f-4a79-9323-c360ef386927', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'active', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', NULL, 'usd', NULL, NULL, NULL, NULL, 'Test Car Listing', 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('530d8b0b-ab4c-405d-977e-5ab325ba0368', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:55:43', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('d7b9a0ac-3a9b-4b2a-aa55-ccf683bb4c11', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:56:10', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('14b6b5b1-d22a-47fa-b177-0539743da0f8', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:54:55', NULL, NULL, NULL, 'Test Car Listing', 0, 'changed_mind', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('d08f6416-015c-4593-93b1-e89c2c16a2c0', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:56:06', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('8317a8ac-a06b-43c8-ad1c-f4fde5551d96', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:55:56', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('287a17d6-4463-4be5-a72a-32932b41f377', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:55:18', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('143010fe-6919-4647-80c8-aee22927cd9d', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:54:37', NULL, NULL, NULL, 'Test Car Listing', 0, 'sold', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('e7edd35a-420e-4d37-b59e-9f2fbcdbaf4b', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:56:13', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('7b516464-3ad4-4dd7-9581-b27548590eb6', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:55:54', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('40c27b20-50ec-43d8-aaf7-4a4cab085b01', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 21:08:25', NULL, NULL, NULL, 'Test Car Listing', 0, NULL, NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('d5cc9273-a623-400e-bff1-3606a4c64b57', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:56:08', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('2d493244-13b1-42cf-ae4d-7d1e8f851d3f', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:55:29', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('e8efec7f-5c57-4f2c-9e65-30a69a8cfa2d', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:56:16', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('3576b630-1850-495b-a76c-140a450558fd', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:55:32', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('166492cb-a1b7-49c6-a6f2-a657d378ddb2', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:55:03', NULL, NULL, NULL, 'Test Car Listing', 0, 'price_change', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('cb1b5ab0-9e08-4bbc-96db-67a12d953f80', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:56:03', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('60ee8b74-4988-414d-8078-90ac213be109', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-31 10:55:49', NULL, NULL, NULL, 'Test Car Listing', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('5a894781-65f4-4b0d-b59a-6098fd2bdf4c', 33333, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 1000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'aaa', 'BMW', 'اوتوماتيك', '2017', 'M2', 'بنزين', 'usd', '2025-05-31 10:55:47', 333, NULL, NULL, 'bmw m2 بحالة جيدة', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('6b6e9cbf-a349-4739-9e2d-d0b8f6cd9135', 33333, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 2000, 'دمشق', 'expired', NULL, NULL, 'أبيض', 'aaaa', 'BMW', 'اوتوماتيك', '2017', 'M2', 'بنزين', 'usd', '2025-05-31 10:55:52', 333, NULL, NULL, 'bmw m2 بحالة جيدة', 0, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('ab23ce9a-fd02-4c3a-9293-8ab07359bffe', 33333, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 3000, 'دمشق', 'expired', '2025-05-30T18:18:39.278Z', NULL, 'رمادي', 'aaaa', 'BMW', 'اوتوماتيك', '2017', 'M3', 'بنزين', 'usd', '2025-05-31 10:55:58', 333, NULL, NULL, 'bmw m3 بحالة جيدة', 1, 'other', NULL, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('2f0e3328-df80-4ff0-9ca7-f755a3fafa7d', 33333, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 6000, 'دمشق', 'active', '2025-05-30T18:49:32.380Z', NULL, 'أبيض', 'aaaaaaaa', 'BMW', 'اوتوماتيك', '2021', 'M', 'بنزين', 'usd', '2025-05-30T18:49:32.380Z', 333, NULL, NULL, 'bmw m2 بحالة جيدة', 14, NULL, 33333, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('1c70539e-cf4a-4b6e-9872-895933c26e65', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'active', '2025-05-30T21:35:00.345Z', NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-05-30T21:35:00.345Z', NULL, NULL, NULL, 'Test Car Listing', 10, NULL, 15000, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('e186de6c-7791-4fee-bc3c-23e2d9c414fa', 15000, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 50000, 'دمشق', 'active', '2025-06-01T13:34:39.298Z', NULL, 'أبيض', 'This is a test car listing', 'Toyota', 'اوتوماتيك', '2020', 'Camry', 'بنزين', 'usd', '2025-06-01T13:34:39.298Z', NULL, NULL, NULL, 'Test Car Listing', 2, NULL, 15000, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('0e532b55-f937-421e-bd18-2edfe51c32d7', 12344, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 4000, 'دمشق', 'active', '2025-06-01T23:06:38.865Z', NULL, 'أبيض', 'car', 'Hyundai', 'اوتوماتيك', '2018', 'Elantra', 'بنزين', 'usd', '2025-06-01T23:06:38.865Z', 321, NULL, NULL, 'هيونداي النترا ن', 2, NULL, 12344, 0, 0);
INSERT INTO listed_cars (id, price, seller_id, mileage, location, status, created_at, car_type, color, description, make, transmission, year, model, fuel, currency, updated_at, hp, engine_cylinders, engine_liters, title, views, removal_reason, new_price, highlight, auto_relist) VALUES ('dceba3d0-a921-4e31-8202-894595c3c5c6', 22212, '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 3000, 'حلب', 'active', '2025-06-01T23:08:05.641Z', NULL, 'أبيض', 'aaaaa', 'Hyundai', 'اوتوماتيك', '2020', 'Elantra', 'بنزين', 'usd', '2025-06-01T23:08:05.641Z', 322, NULL, NULL, 'هيونداي النترا ن', 3, NULL, 22212, 0, 0);

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

INSERT INTO listing_reports (id, listing_id, reporter_id, report_type, reason, details, status, created_at, resolved_at, admin_notes, to_report, userid) VALUES (1, '376137c4-157a-4d53-8dff-1b45f093345f', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'INAPPROPRIATE', 'always negative comments making fun of people', '111', 'PENDING', '2025-03-11 15:04:38', NULL, NULL, NULL, NULL);

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

INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('cbe3282d-7f53-43f8-8eb7-ab5fafb01ff5', '340f95a3-c4be-496e-b84a-4c5030b982e9', 'a17f42ca-1051-47cf-bd67-9ec132e759c9', 'hi', '2025-03-21T02:17:46.368Z', 1);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('94f7ae05-76fb-43fe-9b78-c52b6d5dd6a2', '340f95a3-c4be-496e-b84a-4c5030b982e9', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'hi', '2025-03-22T01:56:22.309Z', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('bf4dde05-5d3b-4e7b-bfee-566d3b5489f9', '340f95a3-c4be-496e-b84a-4c5030b982e9', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', '?', '2025-05-30T21:45:37.064Z', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('67c24206-9db4-45b6-8fb3-c5ed3fc68023', '1a6cb5aa-6c4e-4248-adfb-ab38858a4d93', '67ad8803-7b7b-45cb-9f0b-0aa92734ac86', 'nice car', NULL, 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('207fd3cb-245d-4c1e-9dcd-c6ccb3e5bba4', '1535031c-1c53-4538-b289-76d5e29fc2d4', '67ad8803-7b7b-45cb-9f0b-0aa92734ac86', 'hi', '2025-06-04T12:28:40.069Z', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('7ba93350-89c2-473f-9c83-acea7aa65ad5', '3cffab4c-6938-4881-bf21-25b2e2d6ae60', '67ad8803-7b7b-45cb-9f0b-0aa92734ac86', 'hi', '2025-06-04T12:29:06.389Z', 1);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('2af773fb-2b84-4edb-9e27-2db63a90052d', '5bc5117c-e270-4cc8-9b27-de55a636b946', '67ad8803-7b7b-45cb-9f0b-0aa92734ac86', 'car', '2025-06-04T12:34:33.788Z', 1);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('f480d5f4-936f-48ce-ac9c-990a76eb3ca6', '5bc5117c-e270-4cc8-9b27-de55a636b946', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'hi', '2025-06-04T14:53:42.739Z', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('64d65d2d-2079-404b-917f-a9ccb7beff7e', '5bc5117c-e270-4cc8-9b27-de55a636b946', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'Hey there! Just dropping in with a longer message to help you test whatever you''re working on. Let’s imagine this is part of a journal entry from someone who''s just moved to a new city to start a fresh chapter in their life.

So today was my second full day in the new apartment, and it still feels kind of surreal. The morning sunlight hits the living room just right, and the view from the tiny balcony is better than I expected — lots of green trees and the occasional cyclist zooming by. I unpacked a few more boxes today, mostly books and kitchen stuff, but it still feels like there’s an endless amount of small things I need to sort through.

I also walked down to the local market — there’s this old guy selling fresh bread from a cart and it smells amazing. I bought one loaf even though I didn’t need it just because I couldn’t resist. On the way back, I noticed there’s a small gym just a block away, and I’m', '2025-06-04T15:33:59.451Z', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('91c9a8b7-ad90-4ff0-a566-d16693c3cc45', '5bc5117c-e270-4cc8-9b27-de55a636b946', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', ' you''re working on. Let’s imagine this is part of a journal entry from someone who''s just moved to a new city to start a fresh chapter in their life. So today was my second full day in the new apartment, and it still feels kind of surreal. The mornin', '2025-06-04T19:04:33.691Z', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('37b557f3-704a-455b-ae4f-d361593a681d', '5bc5117c-e270-4cc8-9b27-de55a636b946', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', ' you''re working on. Let’s imagine this is part of a journal entry from someone who''s just moved to a new city to start a fresh chapter in their life. So today was my second full day in the new apartment, and it still feels kind of surreal. The mornin', '2025-06-04T19:04:39.004Z', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('fbdd8355-367a-4494-8482-53ac39d401e6', '5bc5117c-e270-4cc8-9b27-de55a636b946', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', ' you''re working on. Let’s imagine this is part of a journal entry from someone who''s just moved to a new city to start a fresh chapter in their life. So today was my second full day in the new apartment, and it still feels kind of surreal. The mornin', '2025-06-04T19:04:41.921Z', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('ae3303ed-19ee-4db2-9221-dbe5c8310054', '5bc5117c-e270-4cc8-9b27-de55a636b946', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', ' you''re working on. Let’s imagine this is part of a journal entry from someone who''s just moved to a new city to start a fresh chapter in their life. So today was my second full day in the new apartment, and it still feels kind of surreal. The mornin', '2025-06-04T19:04:46.096Z', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('fb44cf46-d74c-4195-a089-26c9c93ca383', '5bc5117c-e270-4cc8-9b27-de55a636b946', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', ' you''re working on. Let’s imagine this is part of a journal entry from someone who''s just moved to a new city to start a fresh chapter in their life. So today was my second full day in the new apartment, and it still feels kind of surreal. The mornin', '2025-06-04T19:04:47.974Z', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('a49a020c-039e-4e3d-8864-84e0a73db272', '5bc5117c-e270-4cc8-9b27-de55a636b946', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', ' you''re working on. Let’s imagine this is part of a journal entry from someone who''s just moved to a new city to start a fresh chapter in their life. So today was my second full day in the new apartment, and it still feels kind of surreal. The mornin', '2025-06-04T19:04:52.845Z', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('c2cd11a0-4e8b-4892-a5a0-e7d983e8ee95', '5bc5117c-e270-4cc8-9b27-de55a636b946', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', ' you''re working on. Let’s imagine this is part of a journal entry from someone who''s just moved to a new city to start a fresh chapter in their life. So today was my second full day in the new apartment, and it still feels kind of surreal. The mornin', '2025-06-04T19:05:03.449Z', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('32ffa865-7548-4938-811f-7e5cb58e6d99', '5bc5117c-e270-4cc8-9b27-de55a636b946', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', ' you''re working on. Let’s imagine this is part of a journal entry from someone who''s just moved to a new city to start a fresh chapter in their life. So today was my second full day in the new apartment, and it still feels kind of surreal. The mornin', '2025-06-04T19:05:04.960Z', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('088e80d0-d217-4faa-833d-8c810a57f0c6', '5bc5117c-e270-4cc8-9b27-de55a636b946', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', ' you''re working on. Let’s imagine this is part of a journal entry from someone who''s just moved to a new city to start a fresh chapter in their life. So today was my second full day in the new apartment, and it still feels kind of surreal. The mornin', '2025-06-04T19:05:08.736Z', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, created_at, is_read) VALUES ('15d9f886-2dd3-41d7-a3ae-0c123d9b4a4b', '5bc5117c-e270-4cc8-9b27-de55a636b946', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', ' you''re working on. Let’s imagine this is part of a journal entry from someone who''s just moved to a new city to start a fresh chapter in their life. So today was my second full day in the new apartment, and it still feels kind of surreal. The mornin', '2025-06-04T19:05:12.040Z', 0);

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

INSERT INTO sellers (id, email, location, first_name, picture, created_at, last_login, access_token, username, hashed_password, salt, last_name, phone, date_of_birth, reset_token, reset_token_expiry, email_token_expiry, user_ip, email_verification_token, email_verified) VALUES ('98c06c3d-7a03-46a2-86cb-630f3b88f36d', 'atefm6@outlook.com', NULL, 'Atef', 'https://media.istockphoto.com/vectors/default-profile-picture-avatar-photo-placeholder-vector-illustration-vector-id1223671392?k=6&m=1223671392&s=612x612&w=0&h=NGxdexflb9EyQchqjQP0m6wYucJBYLfu46KCLNMHZYM=', '2025-01-29 22:39:16', '2025-02-02 02:24:09', NULL, 'atefmo', X'CC1A35CE6267DB83ED0596D551D3E0328F553FB7DAD4EE2BA23B442900DE30F6', '791ce5e27d009ae2afba2e95dcf6e750', 'Moazzen', '0793496556', '2025-01-20T23:00:00.000Z', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO sellers (id, email, location, first_name, picture, created_at, last_login, access_token, username, hashed_password, salt, last_name, phone, date_of_birth, reset_token, reset_token_expiry, email_token_expiry, user_ip, email_verification_token, email_verified) VALUES ('7234c02b-28c3-4e7b-a2a8-d0d92e73b7f1', 'atefm6@gmail.com', NULL, 'mohammad', 'https://media.istockphoto.com/vectors/default-profile-picture-avatar-photo-placeholder-vector-illustration-vector-id1223671392?k=6&m=1223671392&s=612x612&w=0&h=NGxdexflb9EyQchqjQP0m6wYucJBYLfu46KCLNMHZYM=', '2025-02-02 00:05:53', NULL, NULL, 'moh', X'84B065A5C9D6B359247843BF0EE93A25027820FD5880D04A581C0D17A6693898', X'9CADAD175F703391A80F2B1FA891EE9E', 'Moazzen', '0793496556', '2009-02-09T23:00:00.000Z', NULL, NULL, NULL, NULL, NULL, 0);
INSERT INTO sellers (id, email, location, first_name, picture, created_at, last_login, access_token, username, hashed_password, salt, last_name, phone, date_of_birth, reset_token, reset_token_expiry, email_token_expiry, user_ip, email_verification_token, email_verified) VALUES ('67ad8803-7b7b-45cb-9f0b-0aa92734ac86', 'atefmoazzen@gmail.com', NULL, 'mohammad', 'https://media.istockphoto.com/vectors/default-profile-picture-avatar-photo-placeholder-vector-illustration-vector-id1223671392?k=6&m=1223671392&s=612x612&w=0&h=NGxdexflb9EyQchqjQP0m6wYucJBYLfu46KCLNMHZYM=', '2025-02-02 00:12:35', '2025-06-04 12:52:14', NULL, 'amoh', X'2E21FAFF43C71F2FE13DB87C92B3965FF89565B2208207740F6025AC9E9858C0', X'2EF2270C41DC0F695AC655155ED17D1F', 'Moazzen', '0793496556', '2009-02-09T23:00:00.000Z', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO sellers (id, email, location, first_name, picture, created_at, last_login, access_token, username, hashed_password, salt, last_name, phone, date_of_birth, reset_token, reset_token_expiry, email_token_expiry, user_ip, email_verification_token, email_verified) VALUES ('a17f42ca-1051-47cf-bd67-9ec132e759c9', 'atefcodes@gmail.com', NULL, 'mohammad', 'https://media.istockphoto.com/vectors/default-profile-picture-avatar-photo-placeholder-vector-illustration-vector-id1223671392?k=6&m=1223671392&s=612x612&w=0&h=NGxdexflb9EyQchqjQP0m6wYucJBYLfu46KCLNMHZYM=', '2025-02-02 11:40:34', '2025-03-15 14:44:55', NULL, 'moha', X'B7CD8863EF362B7DC504826B3CD94D0C0B84134EE240E2C4C4320A1B541130F6', X'38C9235AE1991E4533361B8DAE15ED2B', 'Moazzen', '0793496556', '2005-02-01T23:00:00.000Z', NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO sellers (id, email, location, first_name, picture, created_at, last_login, access_token, username, hashed_password, salt, last_name, phone, date_of_birth, reset_token, reset_token_expiry, email_token_expiry, user_ip, email_verification_token, email_verified) VALUES ('50ed7946-0f3b-4f87-b7f3-65740bdd7ebf', 'cardriver.se@gmail.com', NULL, 'Atef', 'https://media.istockphoto.com/vectors/default-profile-picture-avatar-photo-placeholder-vector-illustration-vector-id1223671392?k=6&m=1223671392&s=612x612&w=0&h=NGxdexflb9EyQchqjQP0m6wYucJBYLfu46KCLNMHZYM=', '2025-02-02 12:20:11', '2025-06-04 21:19:18', NULL, 'ter', X'FBFAA5CEFA265F526D16017C34159221D9C4C134ADFADEC5B4FEAF110F5F8A00', X'A5D7D9FFE7AE0F75967D493B6611A858', 'Moazzen', '0793496556', '2000-02-05T23:00:00.000Z', NULL, NULL, NULL, NULL, NULL, 1);

-- Table: specs
CREATE TABLE IF NOT EXISTS specs (
    car_listing_id BLOB REFERENCES listed_cars (id) ON DELETE CASCADE,
    spec_name      TEXT
);

INSERT INTO specs (car_listing_id, spec_name) VALUES ('6e45b5ee-232f-4c05-a8d1-b5b39380836e', '["مقاعد جلدية","مقاعد أمامية مدفأة","تشغيل السيارة عن بعد","شاحن لاسلكي للهواتف"]');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('eda476f1-ce43-4cb6-8db2-525826e5fb88', '["مقاعد جلدية"');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('eda476f1-ce43-4cb6-8db2-525826e5fb88', '"مقاعد أمامية كهربائية"');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('eda476f1-ce43-4cb6-8db2-525826e5fb88', '"مقاعد أمامية بذاكرة حفظ الوضعيات"]');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('1c9f59e2-c361-4781-8540-0d5b97e080e0', '["مقاعد جلدية"');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('1c9f59e2-c361-4781-8540-0d5b97e080e0', '"مقاعد أمامية كهربائية"]');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('4ccf4478-8f9f-480a-b9a5-f701aa90c36f', 'مقاعد جلدية');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('4ccf4478-8f9f-480a-b9a5-f701aa90c36f', 'مقاعد أمامية كهربائية');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('e91e0100-1ede-4449-a7bb-a773fe10f2be', 'مقاعد جلدية');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('e91e0100-1ede-4449-a7bb-a773fe10f2be', 'مقاعد أمامية مهواة');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('e91e0100-1ede-4449-a7bb-a773fe10f2be', 'مقاعد أمامية مدفأة');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('d074de09-03ef-47fd-b611-c5e8507e2870', 'مقاعد مخملية');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('5a894781-65f4-4b0d-b59a-6098fd2bdf4c', 'مقاعد جلدية');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('5a894781-65f4-4b0d-b59a-6098fd2bdf4c', 'أبل كاربلاي & أندرويد أوتو');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('5a894781-65f4-4b0d-b59a-6098fd2bdf4c', 'شاحن لاسلكي للهواتف');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('6b6e9cbf-a349-4739-9e2d-d0b8f6cd9135', 'مقاعد جلدية');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('6b6e9cbf-a349-4739-9e2d-d0b8f6cd9135', 'مقاعد أمامية كهربائية');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('6b6e9cbf-a349-4739-9e2d-d0b8f6cd9135', 'شاشة لمس متعددة الوظائف');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('ab23ce9a-fd02-4c3a-9293-8ab07359bffe', 'مقاعد أمامية كهربائية');
INSERT INTO specs (car_listing_id, spec_name) VALUES ('ab23ce9a-fd02-4c3a-9293-8ab07359bffe', 'مقاعد جلدية');

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
