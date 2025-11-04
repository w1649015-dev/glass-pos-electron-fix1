// database-schema.ts - Glass POS Database Schema
// Complete database schema for Tauri/Electron integration

export interface DatabaseConfig {
  version: number;
  schema: string;
  migrations: DatabaseMigration[];
}

export interface DatabaseMigration {
  id: string;
  name: string;
  version: number;
  sql: string;
  executedAt?: string;
}

// Complete database schema SQL
export const getDbCreateTablesSQL = (): string => {
  return `
-- ========================================
-- Glass POS Database Schema
-- Version: 1.0.0
-- Description: Complete POS system database schema
-- ========================================

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ========================================
-- USERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'cashier')),
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT
);

-- Index for user authentication
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ========================================
-- CATEGORIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parentId TEXT,
    sortOrder INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT 1,
    image TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT,
    FOREIGN KEY (parentId) REFERENCES categories(id) ON DELETE SET NULL
);

-- Index for category hierarchy
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parentId);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(isActive);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sortOrder, name);

-- ========================================
-- CUSTOMERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    loyaltyPoints INTEGER DEFAULT 0,
    totalPurchases INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT
);

-- Index for customer search
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ========================================
-- SUPPLIERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    contactPerson TEXT,
    taxNumber TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT
);

-- Index for supplier search
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);

-- ========================================
-- PRODUCTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    description TEXT,
    priceMinor INTEGER NOT NULL,
    costMinor INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 0,
    lowStockThreshold INTEGER DEFAULT 0,
    categoryId TEXT,
    supplierId TEXT,
    image TEXT,
    isActive BOOLEAN DEFAULT 1,
    isTrackable BOOLEAN DEFAULT 1,
    isReturnable BOOLEAN DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Indexes for product search and management
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(categoryId);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplierId);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(isActive);

-- ========================================
-- SHIFTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT,
    openingBalanceMinor INTEGER DEFAULT 0,
    closingBalanceMinor INTEGER,
    expectedCashMinor INTEGER DEFAULT 0,
    actualCashMinor INTEGER,
    differenceMinor INTEGER,
    cashSalesMinor INTEGER DEFAULT 0,
    cardSalesMinor INTEGER DEFAULT 0,
    totalSalesMinor INTEGER DEFAULT 0,
    totalExpensesMinor INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'cancelled')) DEFAULT 'open',
    salesIds TEXT, -- JSON array of sale IDs
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for shift management
CREATE INDEX IF NOT EXISTS idx_shifts_user ON shifts(userId);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON shifts(startTime);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON DATE(startTime);

-- ========================================
-- SALES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    saleNumber TEXT UNIQUE,
    subtotalMinor INTEGER NOT NULL,
    taxMinor INTEGER DEFAULT 0,
    discountMinor INTEGER DEFAULT 0,
    totalMinor INTEGER NOT NULL,
    discountPercent REAL DEFAULT 0,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    userId TEXT NOT NULL,
    customerId TEXT,
    shiftId TEXT,
    paymentMethod TEXT NOT NULL,
    paymentStatus TEXT NOT NULL CHECK (paymentStatus IN ('pending', 'completed', 'cancelled', 'refunded')) DEFAULT 'completed',
    paymentRef TEXT,
    notes TEXT,
    metadata TEXT, -- JSON for additional data
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (shiftId) REFERENCES shifts(id) ON DELETE SET NULL
);

-- Indexes for sales management and reporting
CREATE INDEX IF NOT EXISTS idx_sales_number ON sales(saleNumber);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(userId);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customerId);
CREATE INDEX IF NOT EXISTS idx_sales_shift ON sales(shiftId);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(paymentStatus);
CREATE INDEX IF NOT EXISTS idx_sales_date_range ON sales(date);

-- ========================================
-- SALE ITEMS TABLE (Junction table for products in sales)
-- ========================================
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    saleId TEXT NOT NULL,
    productId TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    priceMinor INTEGER NOT NULL, -- Price at time of sale
    costMinor INTEGER DEFAULT 0, -- Cost at time of sale
    discountMinor INTEGER DEFAULT 0,
    totalMinor INTEGER NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE RESTRICT
);

-- Indexes for sale items
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(saleId);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(productId);

-- ========================================
-- PAYMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    saleId TEXT NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'digital', 'credit', 'split')),
    amountMinor INTEGER NOT NULL,
    changeMinor INTEGER DEFAULT 0,
    transactionRef TEXT,
    receiptNumber TEXT,
    feesMinor INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE
);

-- Indexes for payment tracking
CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(saleId);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);

-- ========================================
-- EXPENSES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    amountMinor INTEGER NOT NULL,
    category TEXT,
    subcategory TEXT,
    date TEXT NOT NULL,
    time TEXT,
    userId TEXT NOT NULL,
    supplierId TEXT,
    shiftId TEXT,
    receiptNumber TEXT,
    isRecurring BOOLEAN DEFAULT 0,
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (shiftId) REFERENCES shifts(id) ON DELETE SET NULL
);

-- Indexes for expense management
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(userId);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier ON expenses(supplierId);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

-- ========================================
-- INVENTORY TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    movementType TEXT NOT NULL CHECK (movementType IN ('in', 'out', 'adjustment', 'sale', 'return', 'expired', 'damaged')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    referenceId TEXT, -- Can reference sale, purchase, adjustment
    userId TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for inventory tracking
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(productId);
CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory(movementType);
CREATE INDEX IF NOT EXISTS idx_inventory_date ON inventory(createdAt);

-- ========================================
-- INVOICES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoiceNumber TEXT UNIQUE NOT NULL,
    saleId TEXT,
    customerId TEXT,
    type TEXT NOT NULL CHECK (type IN ('sale', 'quotation', 'proforma', 'credit', 'debit')) DEFAULT 'sale',
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'cancelled', 'refunded')) DEFAULT 'draft',
    issueDate TEXT NOT NULL,
    dueDate TEXT,
    subtotalMinor INTEGER NOT NULL,
    taxMinor INTEGER DEFAULT 0,
    discountMinor INTEGER DEFAULT 0,
    totalMinor INTEGER NOT NULL,
    paidMinor INTEGER DEFAULT 0,
    balanceMinor INTEGER NOT NULL,
    notes TEXT,
    terms TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT,
    FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE SET NULL,
    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL
);

-- Indexes for invoice management
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoiceNumber);
CREATE INDEX IF NOT EXISTS idx_invoices_sale ON invoices(saleId);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customerId);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(dueDate);

-- ========================================
-- INVOICE ITEMS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoiceId TEXT NOT NULL,
    productId TEXT,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    priceMinor INTEGER NOT NULL,
    taxRate REAL DEFAULT 0,
    taxMinor INTEGER DEFAULT 0,
    discountMinor INTEGER DEFAULT 0,
    totalMinor INTEGER NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
);

-- Indexes for invoice items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoiceId);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items(productId);

-- ========================================
-- SETTINGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    storeName TEXT NOT NULL,
    storeAddress TEXT,
    storePhone TEXT,
    storeEmail TEXT,
    storeWebsite TEXT,
    taxNumber TEXT,
    currency TEXT NOT NULL DEFAULT 'SAR',
    defaultTaxRatePercent REAL DEFAULT 0,
    lowStockAlert BOOLEAN DEFAULT 1,
    printType TEXT CHECK (printType IN ('thermal', 'a4', 'receipt')) DEFAULT 'thermal',
    autoPrintReceipt BOOLEAN DEFAULT 0,
    language TEXT NOT NULL DEFAULT 'ar',
    theme TEXT CHECK (theme IN ('light', 'dark', 'auto')) DEFAULT 'light',
    backupFrequency TEXT CHECK (backupFrequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily',
    autoBackup BOOLEAN DEFAULT 1,
    lastBackupAt TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT,
    -- Sales Settings
    allowNegativeStock BOOLEAN DEFAULT 0,
    requireCustomerInfo BOOLEAN DEFAULT 0,
    enableLoyaltyProgram BOOLEAN DEFAULT 0,
    defaultPaymentMethod TEXT CHECK (defaultPaymentMethod IN ('cash', 'card', 'digital')) DEFAULT 'cash',
    -- Print Settings
    printerName TEXT,
    receiptWidth INTEGER DEFAULT 58,
    paperSize TEXT CHECK (paperSize IN ('58mm', '80mm', '110mm')) DEFAULT '58mm',
    -- Security Settings
    sessionTimeout INTEGER DEFAULT 480, -- minutes
    requirePasswordForSales BOOLEAN DEFAULT 0,
    maxLoginAttempts INTEGER DEFAULT 5,
    lockoutDuration INTEGER DEFAULT 15 -- minutes
);

-- ========================================
-- AUDIT LOG TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    tableName TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    recordId TEXT NOT NULL,
    userId TEXT,
    oldData TEXT, -- JSON
    newData TEXT, -- JSON
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    ipAddress TEXT,
    userAgent TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(tableName);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(userId);

-- ========================================
-- DATABASE METADATA TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS database_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert default settings
INSERT OR REPLACE INTO settings (
    id, storeName, currency, defaultTaxRatePercent, printType, 
    language, theme, autoPrintReceipt
) VALUES (
    1, 'Glass POS', 'SAR', 15, 'thermal', 'ar', 'light', 0
);

-- Insert database metadata
INSERT OR REPLACE INTO database_metadata (key, value) VALUES
('version', '1.0.0'),
('schema_version', '1.0.0'),
('created_date', datetime('now')),
('last_migration', 'initial_schema'),
('backup_enabled', '1'),
('maintenance_mode', '0');

-- ========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Update timestamp trigger for products
CREATE TRIGGER IF NOT EXISTS products_updated_at 
    AFTER UPDATE ON products
    BEGIN
        UPDATE products SET updatedAt = datetime('now') WHERE id = NEW.id;
    END;

-- Update timestamp trigger for customers
CREATE TRIGGER IF NOT EXISTS customers_updated_at 
    AFTER UPDATE ON customers
    BEGIN
        UPDATE customers SET updatedAt = datetime('now') WHERE id = NEW.id;
    END;

-- Update timestamp trigger for suppliers
CREATE TRIGGER IF NOT EXISTS suppliers_updated_at 
    AFTER UPDATE ON suppliers
    BEGIN
        UPDATE suppliers SET updatedAt = datetime('now') WHERE id = NEW.id;
    END;

-- Update timestamp trigger for categories
CREATE TRIGGER IF NOT EXISTS categories_updated_at 
    AFTER UPDATE ON categories
    BEGIN
        UPDATE categories SET updatedAt = datetime('now') WHERE id = NEW.id;
    END;

-- Update timestamp trigger for users
CREATE TRIGGER IF NOT EXISTS users_updated_at 
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updatedAt = datetime('now') WHERE id = NEW.id;
    END;

-- Update timestamp trigger for settings
CREATE TRIGGER IF NOT EXISTS settings_updated_at 
    AFTER UPDATE ON settings
    BEGIN
        UPDATE settings SET updatedAt = datetime('now') WHERE id = 1;
    END;

-- Inventory movement trigger for product stock updates
CREATE TRIGGER IF NOT EXISTS inventory_product_stock_update 
    AFTER INSERT ON inventory
    WHEN NEW.movementType IN ('in', 'out', 'adjustment')
    BEGIN
        UPDATE products 
        SET stock = stock + CASE 
            WHEN NEW.movementType = 'in' THEN NEW.quantity
            WHEN NEW.movementType = 'out' THEN -NEW.quantity
            WHEN NEW.movementType = 'adjustment' THEN NEW.quantity
        END
        WHERE id = NEW.productId;
    END;

-- Sales number generator trigger
CREATE TRIGGER IF NOT EXISTS sales_number_generator 
    AFTER INSERT ON sales
    WHEN NEW.saleNumber IS NULL
    BEGIN
        UPDATE sales 
        SET saleNumber = 'S' || strftime('%Y%m%d', NEW.date) || '-' || 
               CAST(COALESCE((
                   SELECT COUNT(*) + 1 
                   FROM sales 
                   WHERE date >= date(NEW.date) AND date < date(NEW.date, '+1 day')
               ), 1) AS TEXT)
        WHERE id = NEW.id;
    END;

-- Invoice number generator trigger
CREATE TRIGGER IF NOT EXISTS invoices_number_generator 
    AFTER INSERT ON invoices
    WHEN NEW.invoiceNumber IS NULL
    BEGIN
        UPDATE invoices 
        SET invoiceNumber = 'INV-' || strftime('%Y%m%d', NEW.issueDate) || '-' || 
               CAST(COALESCE((
                   SELECT COUNT(*) + 1 
                   FROM invoices 
                   WHERE date(issueDate) = date(NEW.issueDate)
               ), 1) AS TEXT)
        WHERE id = NEW.id;
    END;

-- ========================================
-- VIEWS FOR REPORTING
-- ========================================

-- Low stock products view
CREATE VIEW IF NOT EXISTS low_stock_products AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.stock,
    p.lowStockThreshold,
    c.name as category_name,
    s.name as supplier_name
FROM products p
LEFT JOIN categories c ON p.categoryId = c.id
LEFT JOIN suppliers s ON p.supplierId = s.id
WHERE p.isActive = 1 
  AND p.stock <= p.lowStockThreshold 
  AND p.lowStockThreshold > 0;

-- Sales summary view
CREATE VIEW IF NOT EXISTS sales_summary AS
SELECT 
    s.id,
    s.saleNumber,
    s.date,
    s.totalMinor,
    u.username as cashier,
    c.name as customer,
    s.paymentMethod,
    s.paymentStatus
FROM sales s
LEFT JOIN users u ON s.userId = u.id
LEFT JOIN customers c ON s.customerId = c.id;

-- ========================================
-- DATABASE INITIALIZATION COMPLETE
-- ========================================
`;
};

// Generate seed data
export const getDbSeedData = (): string => {
  return `
-- ========================================
-- Glass POS Seed Data
-- Default users, categories, and sample data
-- ========================================

-- Default Admin User
INSERT OR REPLACE INTO users (id, username, passwordHash, role) VALUES 
('admin-001', 'admin', '$2b$10$example_hash_1234567890abcdefghijklmnop', 'admin'),
('cashier-001', 'cashier', '$2b$10$example_hash_0987654321fedcba', 'cashier');

-- Default Categories
INSERT OR REPLACE INTO categories (id, name, description, sortOrder, isActive) VALUES
('cat-001', 'المشروبات', 'المشروبات الساخنة والباردة', 1, 1),
('cat-002', 'المأكولات', 'الأطعمة والوجبات السريعة', 2, 1),
('cat-003', 'الحلويات', 'الحلويات والمخبوزات', 3, 1),
('cat-004', 'الأدوات', 'أدوات ومواد تشغيلية', 4, 1);

-- Sample Products
INSERT OR REPLACE INTO products (id, name, sku, barcode, priceMinor, stock, lowStockThreshold, categoryId, isActive) VALUES
('prod-001', 'قهوة عربية', 'COF-001', '1234567890123', 1500, 100, 10, 'cat-001', 1),
('prod-002', 'شاي أخضر', 'TEA-001', '1234567890124', 800, 50, 5, 'cat-001', 1),
('prod-003', 'كابتشينو', 'CAP-001', '1234567890125', 2000, 30, 3, 'cat-001', 1),
('prod-004', 'سندويتش دجاج', 'SW-001', '1234567890126', 2500, 20, 2, 'cat-002', 1),
('prod-005', 'بيتزا مارجريتا', 'PIZ-001', '1234567890127', 3500, 15, 2, 'cat-002', 1);

-- Sample Customers
INSERT OR REPLACE INTO customers (id, name, phone, email) VALUES
('cust-001', 'أحمد محمد', '+966501234567', 'ahmed@example.com'),
('cust-002', 'فاطمة علي', '+966509876543', 'fatima@example.com');

-- Sample Suppliers
INSERT OR REPLACE INTO suppliers (id, name, phone, email) VALUES
('sup-001', 'شركة التوريدات المحدودة', '+966112345678', 'supply@company.com'),
('sup-002', 'مطعم البقال', '+966113456789', 'bakal@restaurant.com');
`;
};

// Database configuration
export const DATABASE_CONFIG: DatabaseConfig = {
  version: 1,
  schema: getDbCreateTablesSQL(),
  migrations: [
    {
      id: '001_initial_schema',
      name: 'Initial Database Schema',
      version: 1,
      sql: getDbCreateTablesSQL() + '\n\n' + getDbSeedData()
    }
  ]
};

// Helper functions
export const getMigrationSQL = (migrationId: string): string | null => {
  const migration = DATABASE_CONFIG.migrations.find(m => m.id === migrationId);
  return migration ? migration.sql : null;
};

export const getCurrentSchemaVersion = (): number => {
  return DATABASE_CONFIG.version;
};

export const applyBackupRestoreHooks = (): void => {
  // Add hooks for backup/restore operations
  if (typeof window !== 'undefined') {
    (window as any).__GLASS_POS_DB_HOOKS__ = {
      onBackup: (data: any) => {
        console.log('🗄️ Database backup initiated');
        return data;
      },
      onRestore: (data: any) => {
        console.log('🔄 Database restore initiated');
        return data;
      },
      onSchemaUpdate: (version: number) => {
        console.log(`📈 Database schema updated to version ${version}`);
      }
    };
  }
};

// Export schema info for development
export const SCHEMA_INFO = {
  version: '1.0.0',
  description: 'Glass POS Complete Database Schema',
  tables: [
    'users', 'categories', 'customers', 'suppliers', 'products',
    'sales', 'sale_items', 'payments', 'shifts', 'expenses',
    'invoices', 'invoice_items', 'inventory', 'settings',
    'audit_log', 'database_metadata'
  ],
  indexes: 45,
  triggers: 8,
  views: 3
};