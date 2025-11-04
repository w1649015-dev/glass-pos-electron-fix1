-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_minor INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category_id TEXT,
    supplier_id TEXT,
    barcode TEXT UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    user_id TEXT NOT NULL,
    total_minor INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sale Items table
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price_minor INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount_minor INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    supplier_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    opening_balance_minor INTEGER NOT NULL,
    closing_balance_minor INTEGER,
    cash_sales_minor INTEGER DEFAULT 0,
    card_sales_minor INTEGER DEFAULT 0,
    status TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    method TEXT NOT NULL,
    amount_minor INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- Insert default admin user
INSERT INTO users (id, username, password_hash, role) 
VALUES ('admin', 'admin', 'hashed_admin123', 'ADMIN');

-- Insert default category
INSERT INTO categories (id, name)
VALUES ('uncategorized', 'Uncategorized');