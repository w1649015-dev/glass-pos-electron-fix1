-- Migration: initial_schema
-- Created at: 2025-11-02

BEGIN TRANSACTION;

-- Create enhanced products table
CREATE TABLE IF NOT EXISTS products_new (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    barcode TEXT UNIQUE,
    description TEXT,
    category_id TEXT,
    price_minor INTEGER NOT NULL,
    cost_minor INTEGER,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create enhanced categories table
CREATE TABLE IF NOT EXISTS categories_new (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (parent_id) REFERENCES categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create enhanced sales table
CREATE TABLE IF NOT EXISTS sales_new (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    user_id TEXT NOT NULL,
    total_minor INTEGER NOT NULL,
    discount_minor INTEGER DEFAULT 0,
    payment_method TEXT NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    shift_id TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

-- Create enhanced customers table
CREATE TABLE IF NOT EXISTS customers_new (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_purchases_minor INTEGER DEFAULT 0,
    last_purchase_at TIMESTAMP,
    status TEXT DEFAULT 'active',
    notes TEXT
);

-- Data migration triggers
CREATE TRIGGER IF NOT EXISTS update_product_timestamp
AFTER UPDATE ON products_new
BEGIN
    UPDATE products_new SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_category_timestamp
AFTER UPDATE ON categories_new
BEGIN
    UPDATE categories_new SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_customer_timestamp
AFTER UPDATE ON customers_new
BEGIN
    UPDATE customers_new SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create suppliers table (legacy name) so migrator can insert supplier records
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create expenses table (legacy name)
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    date DATETIME NOT NULL,
    category TEXT NOT NULL,
    userId TEXT NOT NULL,
    supplierId TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Note: data migration INSERTs are handled by the migration script (DatabaseMigrator).
COMMIT;