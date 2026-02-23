-- ОЧИЩЕННЯ ТА ПЕРЕСТВОРЕННЯ ТАБЛИЦЬ (Використовуйте, якщо були помилки)

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS bot_users;

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_per_meter NUMERIC NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    client_name TEXT,
    phone TEXT,
    product_name TEXT,
    width NUMERIC,
    height NUMERIC,
    total_price NUMERIC,
    shipping_address TEXT,
    shipping_method TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot Users
CREATE TABLE bot_users (
    telegram_id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ПЕРШІ ТОВАРИ (Каталог)
INSERT INTO categories (name) VALUES ('Тюль'), ('Штори') ON CONFLICT (name) DO NOTHING;

-- Додавання прикладів (можна змінити під свій сайт)
INSERT INTO products (category_id, name, description, price_per_meter, image_url)
SELECT id, 'Тюль "Мілан"', 'Високоякісна тюль з легким блиском', 450, 'https://curtain-sofiya-one.vercel.app/baner.jpg'
FROM categories WHERE name = 'Тюль' LIMIT 1;

INSERT INTO products (category_id, name, description, price_per_meter, image_url)
SELECT id, 'Штори "Оксамит"', 'Щільні штори для спальні', 850, 'https://curtain-sofiya-one.vercel.app/baner.jpg'
FROM categories WHERE name = 'Штори' LIMIT 1;
