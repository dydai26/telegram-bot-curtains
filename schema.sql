-- Create tables for the Tulle & Curtains bot

-- Categories (Tulle, Curtains, etc.)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_per_meter NUMERIC NOT NULL, -- price per linear meter or square meter
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL, -- Telegram User ID
    client_name TEXT,
    phone TEXT,
    product_name TEXT, -- Store name in case product is deleted
    width NUMERIC,
    height NUMERIC,
    total_price NUMERIC,
    status TEXT DEFAULT 'pending', -- pending, paid, cancelled, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot Users (optional but recommended)
CREATE TABLE IF NOT EXISTS bot_users (
    telegram_id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial Data
INSERT INTO categories (name) VALUES ('Тюль'), ('Штори') ON CONFLICT DO NOTHING;
