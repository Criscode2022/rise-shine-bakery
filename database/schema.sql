-- Rise & Shine Bakery - Database Schema

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_customizable BOOLEAN DEFAULT false,
    customization_options JSONB,
    is_available BOOLEAN DEFAULT true,
    location_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    opening_hours JSONB,
    is_active BOOLEAN DEFAULT true
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    is_wholesale BOOLEAN DEFAULT false,
    loyalty_points INTEGER DEFAULT 0,
    loyalty_tier VARCHAR(20) DEFAULT 'bronze',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    location_id UUID REFERENCES locations(id),
    order_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(10,2),
    delivery_address TEXT,
    delivery_date DATE,
    delivery_time_slot VARCHAR(20),
    special_instructions TEXT,
    is_subscription BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    customization_notes TEXT,
    subtotal DECIMAL(10,2)
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    product_id UUID REFERENCES products(id),
    frequency VARCHAR(20) NOT NULL,
    quantity INTEGER DEFAULT 1,
    delivery_day VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    next_delivery_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Transactions table
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    points INTEGER NOT NULL,
    transaction_type VARCHAR(20),
    description TEXT,
    order_id UUID REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY authenticated_products ON products FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_locations ON locations FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_customers ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_orders ON orders FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_order_items ON order_items FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_subscriptions ON subscriptions FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_loyalty ON loyalty_transactions FOR ALL TO authenticated USING (true);
