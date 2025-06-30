CREATE TABLE IF NOT EXISTS make (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,  
);

CREATE TABLE IF NOT EXISTS model (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    make_id     INTEGER NOT NULL REFERENCES make(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    UNIQUE (make_id, name)
);

CREATE TABLE IF NOT EXISTS year (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id    INTEGER NOT NULL REFERENCES model(id) ON DELETE CASCADE,
    year        INTEGER NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS body_style (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id    INTEGER NOT NULL REFERENCES model(id) ON DELETE CASCADE,
    style       TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS engine (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id    INTEGER NOT NULL REFERENCES model(id) ON DELETE CASCADE,
    cylinders   INTEGER NOT NULL,
    cylinders_type TEXT NOT NULL CHECK (cylinders_type IN ('Inline', 'V', 'Flat', 'W', 'Rotary')),
    liters      REAL NOT NULL,
    horsepower  INTEGER NOT NULL
);

INSERT INTO make (id, name) VALUES ('Abarth');
INSERT INTO make (id, name) VALUES ('AC');
INSERT INTO make (id, name) VALUES ('Acura');
INSERT INTO make (id, name) VALUES ('AIXAM');
INSERT INTO make (id, name) VALUES ('Alfa Romeo');
INSERT INTO make (id, name) VALUES ('Alpine');
INSERT INTO make (id, name) VALUES ('Arash');
INSERT INTO make (id, name) VALUES ('Ariel');
INSERT INTO make (id, name) VALUES ('Artega');
INSERT INTO make (id, name) VALUES ('Ascari');
INSERT INTO make (id, name) VALUES ('Aston Martin');
INSERT INTO make (id, name) VALUES ('Audi');
INSERT INTO make (id, name) VALUES ('AutoVAZ');
INSERT INTO make (id, name) VALUES ('BAIC');
INSERT INTO make (id, name) VALUES ('Bentley');
INSERT INTO make (id, name) VALUES ('BMW');
INSERT INTO make (id, name) VALUES ('Borgward');
INSERT INTO make (id, name) VALUES ('Brilliance');
INSERT INTO make (id, name) VALUES ('Bristol');
INSERT INTO make (id, name) VALUES ('Bufori');
INSERT INTO make (id, name) VALUES ('Bugatti');
INSERT INTO make (id, name) VALUES ('Buick');
INSERT INTO make (id, name) VALUES ('BYD');
INSERT INTO make (id, name) VALUES ('Byton');
INSERT INTO make (id, name) VALUES ('Cadillac');
INSERT INTO make (id, name) VALUES ('Campagna');
INSERT INTO make (id, name) VALUES ('Caterham');
INSERT INTO make (id, name) VALUES ('Changan');
INSERT INTO make (id, name) VALUES ('Changhe');
INSERT INTO make (id, name) VALUES ('Chery');
INSERT INTO make (id, name) VALUES ('Chevrolet');
INSERT INTO make (id, name) VALUES ('Chrysler');
INSERT INTO make (id, name) VALUES ('Citroen');
INSERT INTO make (id, name) VALUES ('Cupra');
INSERT INTO make (id, name) VALUES ('Coda');
INSERT INTO make (id, name) VALUES ('CT&T');
INSERT INTO make (id, name) VALUES ('Dacia');
INSERT INTO make (id, name) VALUES ('Daewoo');
INSERT INTO make (id, name) VALUES ('DAF');
INSERT INTO make (id, name) VALUES ('Daihatsu');
INSERT INTO make (id, name) VALUES ('Datsun');
INSERT INTO make (id, name) VALUES ('Dodge');
INSERT INTO make (id, name) VALUES ('Donkervoort');
INSERT INTO make (id, name) VALUES ('DS Automobiles');
INSERT INTO make (id, name) VALUES ('Ferrari');
INSERT INTO make (id, name) VALUES ('Fiat');
INSERT INTO make (id, name) VALUES ('Fisker');
INSERT INTO make (id, name) VALUES ('Force Motors');
INSERT INTO make (id, name) VALUES ('Ford');
INSERT INTO make (id, name) VALUES ('Foton');
INSERT INTO make (id, name) VALUES ('GAZ');
INSERT INTO make (id, name) VALUES ('Geely');
INSERT INTO make (id, name) VALUES ('Genesis');
INSERT INTO make (id, name) VALUES ('Ginetta');
INSERT INTO make (id, name) VALUES ('GMC');
INSERT INTO make (id, name) VALUES ('Gordon Murray');
INSERT INTO make (id, name) VALUES ('Great Wall');
INSERT INTO make (id, name) VALUES ('Haima');
INSERT INTO make (id, name) VALUES ('Hino');
INSERT INTO make (id, name) VALUES ('Holden');
INSERT INTO make (id, name) VALUES ('Honda');
INSERT INTO make (id, name) VALUES ('Hummer');
INSERT INTO make (id, name) VALUES ('Hyundai');
INSERT INTO make (id, name) VALUES ('Iconic');
INSERT INTO make (id, name) VALUES ('Infiniti');
INSERT INTO make (id, name) VALUES ('Isuzu');
INSERT INTO make (id, name) VALUES ('Iveco');
INSERT INTO make (id, name) VALUES ('Jaguar');
INSERT INTO make (id, name) VALUES ('Jeep');
INSERT INTO make (id, name) VALUES ('Jetour');
INSERT INTO make (id, name) VALUES ('JMC');
INSERT INTO make (id, name) VALUES ('Karma');
INSERT INTO make (id, name) VALUES ('Kia');
INSERT INTO make (id, name) VALUES ('Koenigsegg');
INSERT INTO make (id, name) VALUES ('KTM');
INSERT INTO make (id, name) VALUES ('Lada');
INSERT INTO make (id, name) VALUES ('Lamborghini');
INSERT INTO make (id, name) VALUES ('Lancia');
INSERT INTO make (id, name) VALUES ('Land Rover');
INSERT INTO make (id, name) VALUES ('Landwind');
INSERT INTO make (id, name) VALUES ('Lexus');
INSERT INTO make (id, name) VALUES ('Lifan');
INSERT INTO make (id, name) VALUES ('Lincoln');
INSERT INTO make (id, name) VALUES ('Lotus');
INSERT INTO make (id, name) VALUES ('Lucid');
INSERT INTO make (id, name) VALUES ('Luxgen');
INSERT INTO make (id, name) VALUES ('Mahindra');
INSERT INTO make (id, name) VALUES ('Magna Steyr');
INSERT INTO make (id, name) VALUES ('Maserati');
INSERT INTO make (id, name) VALUES ('Maxus');
INSERT INTO make (id, name) VALUES ('Maybach');
INSERT INTO make (id, name) VALUES ('Mazda');
INSERT INTO make (id, name) VALUES ('Mazzanti');
INSERT INTO make (id, name) VALUES ('McLaren');
INSERT INTO make (id, name) VALUES ('Mercedes-Benz');
INSERT INTO make (id, name) VALUES ('Mercury');
INSERT INTO make (id, name) VALUES ('MG');
INSERT INTO make (id, name) VALUES ('Mini');
INSERT INTO make (id, name) VALUES ('Mitsubishi');
INSERT INTO make (id, name) VALUES ('Mitsuoka');
INSERT INTO make (id, name) VALUES ('Morgan');
INSERT INTO make (id, name) VALUES ('Morris');
INSERT INTO make (id, name) VALUES ('Nissan');
INSERT INTO make (id, name) VALUES ('Noble');
INSERT INTO make (id, name) VALUES ('Nio');
INSERT INTO make (id, name) VALUES ('Oldsmobile');
INSERT INTO make (id, name) VALUES ('Opel');
INSERT INTO make (id, name) VALUES ('Pagani');
INSERT INTO make (id, name) VALUES ('Peugeot');
INSERT INTO make (id, name) VALUES ('Perodua');
INSERT INTO make (id, name) VALUES ('Pininfarina');
INSERT INTO make (id, name) VALUES ('Polestar');
INSERT INTO make (id, name) VALUES ('Pontiac');
INSERT INTO make (id, name) VALUES ('Porsche');
INSERT INTO make (id, name) VALUES ('Proton');
INSERT INTO make (id, name) VALUES ('Qoros');
INSERT INTO make (id, name) VALUES ('Ram');
INSERT INTO make (id, name) VALUES ('Renault');
Insert INTO make (id, name) VALUES ('Reliant');
INSERT INTO make (id, name) VALUES ('Rimac');
INSERT INTO make (id, name) VALUES ('Rivian');
INSERT INTO make (id, name) VALUES ('Roewe');
INSERT INTO make (id, name) VALUES ('Rover');
INSERT INTO make (id, name) VALUES ('Rolls-Royce');
INSERT INTO make (id, name) VALUES ('RUF');
INSERT INTO make (id, name) VALUES ('Saab');
INSERT INTO make (id, name) VALUES ('Saleen');
INSERT INTO make (id, name) VALUES ('Saturn');
INSERT INTO make (id, name) VALUES ('Scion');
INSERT INTO make (id, name) VALUES ('Seat');
INSERT INTO make (id, name) VALUES ('Senova');
INSERT INTO make (id, name) VALUES ('SIN');
INSERT INTO make (id, name) VALUES ('Skoda');
INSERT INTO make (id, name) VALUES ('Smart');
INSERT INTO make (id, name) VALUES ('Spyker');
INSERT INTO make (id, name) VALUES ('SsangYong');
INSERT INTO make (id, name) VALUES ('Subaru');
INSERT INTO make (id, name) VALUES ('Suzuki');
INSERT INTO make (id, name) VALUES ('Tata');
INSERT INTO make (id, name) VALUES ('Tatra');
INSERT INTO make (id, name) VALUES ('Tesla');
INSERT INTO make (id, name) VALUES ('Toyota');
INSERT INTO make (id, name) VALUES ('Triumph');
INSERT INTO make (id, name) VALUES ('TVR');
INSERT INTO make (id, name) VALUES ('Vauxhall');
INSERT INTO make (id, name) VALUES ('Venucia');
INSERT INTO make (id, name) VALUES ('Volkswagen');
INSERT INTO make (id, name) VALUES ('Volvo');
INSERT INTO make (id, name) VALUES ('Wiesmann');
INSERT INTO make (id, name) VALUES ('W Motors');
INSERT INTO make (id, name) VALUES ('Zenos');
INSERT INTO make (id, name) VALUES ('The Zenvo');
INSERT INTO make (id, name) VALUES ('Zotye');


INSERT INTO model (make_id, name) VALUES (1, '500');
INSERT INTO body_style (model_id, style) VALUES (1, 'Hatchback');
INSERT INTO model (make_id, name) VALUES (1, '124 Spider');
INSERT INTO body_style (model_id, style) VALUES (2, 'Convertible');
INSERT INTO model (make_id, name) VALUES (1, '124 GT');
INSERT INTO body_style (model_id, style) VALUES (3, 'Convertible');
INSERT INTO model (make_id, name) VALUES (1, '595');
INSERT INTO body_style (model_id, style) VALUES (4, 'Hatchback');
INSERT INTO model (make_id, name) VALUES (1, '595C');
INSERT INTO body_style (model_id, style) VALUES (5, 'Convertible');
INSERT INTO model (make_id, name) VALUES (1, '595 Competizione');
INSERT INTO body_style (model_id, style) VALUES (6, 'Hatchback');
INSERT INTO model (make_id, name) VALUES (1, '595 Turismo');
INSERT INTO body_style (model_id, style) VALUES (7, 'Hatchback');
INSERT INTO model (make_id, name) VALUES (1, '695');
INSERT INTO body_style (model_id, style) VALUES (8, 'Hatchback');
INSERT INTO model (make_id, name) VALUES (1, '695C');
INSERT INTO body_style (model_id, style) VALUES (9, 'Convertible');
INSERT INTO model (make_id, name) VALUES (1, '695 Rivale');
INSERT INTO body_style (model_id, style) VALUES (10, 'Hatchback');
INSERT INTO model (make_id, name) VALUES (1, '695 XSR Yamaha');
INSERT INTO body_style (model_id, style) VALUES (11, 'Hatchback');

INSERT INTO model (make_id, name) VALUES (2, 'Ace');
INSERT INTO body_style (model_id, style) VALUES (12, 'Convertible');
INSERT INTO model (make_id, name) VALUES (2, 'Cobra');
INSERT INTO body_style (model_id, style) VALUES (13, 'Convertible');
INSERT INTO model (make_id, name) VALUES (2, 'Le Mans');
INSERT INTO body_style (model_id, style) VALUES (14, 'Convertible');
INSERT INTO model (make_id, name) VALUES (3, 'Integra');
INSERT INTO body_style (model_id, style) VALUES (15, 'Sedan');
INSERT INTO body_style (model_id, style) VALUES (15, 'Hatchback');
INSERT INTO model (make_id, name) VALUES (3, 'Legend');
INSERT INTO body_style (model_id, style) VALUES (16, 'Sedan');
INSERT INTO body_style (model_id, style) VALUES (16, 'Coupe');
INSERT INTO model (make_id, name) VALUES (3, 'NSX');
INSERT INTO body_style (model_id, style) VALUES (17, 'Coupe');
INSERT INTO model (make_id, name) VALUES (3, 'Vigor');
INSERT INTO body_style (model_id, style) VALUES (18, 'Sedan');
INSERT INTO model (make_id, name) VALUES (4, 'Coupé');
INSERT INTO body_style (model_id, style) VALUES (19, 'Sedan');
INSERT INTO model (make_id, name) VALUES (SELECT id FROM make WHERE name = 'Alfa Romeo', '164');
INSERT INTO body_style (model_id, style) VALUES (20, 'Sedan');
INSERT INTO model (make_id, name) VALUES (SELECT id FROM make WHERE name = 'Alfa Romeo', 'Spider');
INSERT INTO body_style (model_id, style) VALUES (21, 'Convertible');
INSERT INTO model (make_id, name) VALUES (5, '100');
INSERT INTO body_style (model_id, style) VALUES (22, 'Sedan');
INSERT INTO body_style (model_id, style) VALUES (22, 'Wagon');
INSERT INTO model (make_id, name) VALUES (5, '80');
INSERT INTO body_style (model_id, style) VALUES (23, 'Sedan');
INSERT INTO model (make_id, name) VALUES (5, 'Quattro');
INSERT INTO body_style (model_id, style) VALUES (24, 'Sedan');
INSERT INTO model (make_id, name) VALUES (5, 'S4');
INSERT INTO body_style (model_id, style) VALUES (25, 'Sedan');