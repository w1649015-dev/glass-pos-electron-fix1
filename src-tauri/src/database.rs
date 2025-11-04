use rusqlite::{Connection, Result, ToSql, params};
use std::sync::Mutex;
use once_cell::sync::Lazy;
use directories::ProjectDirs;
use bcrypt;

pub struct Database {
    conn: Mutex<Connection>,
}

static DB: Lazy<Database> = Lazy::new(|| {
    Database::new().expect("Failed to initialize database")
});

impl Database {
    pub fn new() -> Result<Self, rusqlite::Error> {
        // Get app data directory
        let proj_dirs = ProjectDirs::from("com", "glasspos", "pos")
            .expect("Failed to get project directories");
        let app_data_dir = proj_dirs.data_dir();
        
        // Create directory if it doesn't exist
        std::fs::create_dir_all(&app_data_dir).ok();
        
        let db_path = app_data_dir.join("glasspos.db");
        println!("📁 Database path: {:?}", db_path);
        
        let conn = Connection::open(db_path)?;
        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    pub fn execute(&self, sql: &str, params: &[&dyn ToSql]) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(sql, params)?;
        Ok(())
    }

    pub fn query(&self, sql: &str, params: &[&dyn ToSql]) -> Result<Vec<Vec<String>>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(sql)?;
        let column_count = stmt.column_count();
        
        let rows = stmt.query_map(params, |row| {
            let mut values = Vec::new();
            for i in 0..column_count {
                values.push(row.get::<_, String>(i).unwrap_or_default());
            }
            Ok(values)
        })?;

        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    pub fn get_connection(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.conn.lock().unwrap()
    }
}

pub fn init_database() -> Result<(), String> {
    println!("🗄️ Initializing database...");
    
    // Create all required tables
    let tables = vec![
        // Users table
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'cashier',
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )
        "#,
        
        // Categories table
        r#"
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )
        "#,
        
        // Suppliers table
        r#"
        CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            contact_person TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )
        "#,
        
        // Products table
        r#"
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            sku TEXT UNIQUE NOT NULL,
            description TEXT,
            price_minor INTEGER NOT NULL,
            cost_minor INTEGER NOT NULL DEFAULT 0,
            stock INTEGER NOT NULL DEFAULT 0,
            low_stock_threshold INTEGER NOT NULL DEFAULT 5,
            category_id TEXT,
            supplier_id TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            FOREIGN KEY (category_id) REFERENCES categories(id),
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        )
        "#,
        
        // Customers table
        r#"
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            loyalty_points INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )
        "#,
        
        // Sales table
        r#"
        CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            sale_number TEXT UNIQUE NOT NULL,
            customer_id TEXT,
            user_id TEXT NOT NULL,
            total_minor INTEGER NOT NULL,
            tax_minor INTEGER NOT NULL DEFAULT 0,
            discount_minor INTEGER NOT NULL DEFAULT 0,
            payment_method TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'completed',
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        "#,
        
        // Sale items table
        r#"
        CREATE TABLE IF NOT EXISTS sale_items (
            id TEXT PRIMARY KEY,
            sale_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price_minor INTEGER NOT NULL,
            total_minor INTEGER NOT NULL,
            FOREIGN KEY (sale_id) REFERENCES sales(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
        "#,
        
        // Expenses table
        r#"
        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            amount_minor INTEGER NOT NULL,
            supplier_id TEXT,
            user_id TEXT NOT NULL,
            receipt_number TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        "#,
        
        // Shifts table
        r#"
        CREATE TABLE IF NOT EXISTS shifts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            starting_cash_minor INTEGER NOT NULL DEFAULT 0,
            ending_cash_minor INTEGER,
            total_sales_minor INTEGER NOT NULL DEFAULT 0,
            total_expenses_minor INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'open',
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        "#,
    ];

    for (i, table_sql) in tables.iter().enumerate() {
        DB.execute(table_sql, &[])
            .map_err(|e| format!("Failed to create table {}: {}", i + 1, e))?;
    }
    
    println!("✅ Database tables created successfully");
    
    // Initialize default data
    match insert_default_admin() {
        Ok(_) => println!("👤 Default admin user initialization successful"),
        Err(e) => eprintln!("⚠️ Failed to create default admin: {}", e),
    }
    
    match insert_default_category() {
        Ok(_) => println!("📂 Default category initialization successful"),
        Err(e) => eprintln!("⚠️ Failed to create default category: {}", e),
    }
    
    println!("🎉 Database initialization completed!");
    Ok(())
}

fn insert_default_admin() -> Result<(), String> {
    let conn = DB.get_connection();
    
    // Check if admin user already exists
    match conn.query_row(
        "SELECT id FROM users WHERE username = ?",
        params!["admin"],
        |row| row.get::<_, String>(0)
    ) {
        Ok(_) => {
            println!("👤 Admin user already exists");
            return Ok(());
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => (), // Continue with creation
        Err(e) => return Err(format!("Failed to check for existing admin: {}", e)),
    };
    
    // Generate bcrypt hash for "admin123"
    let password = "admin123";
    let password_hash = match bcrypt::hash(password, bcrypt::DEFAULT_COST) {
        Ok(hash) => hash,
        Err(e) => return Err(format!("Failed to hash password: {}", e)),
    };
    
    // Insert default admin user
    let admin_id = "admin-001";
    let username = "admin";
    let full_name = "System Administrator";
    let role = "admin";
    let created_at = chrono::Utc::now().to_rfc3339();
    
    conn.execute(
        r#"
        INSERT INTO users (id, username, password_hash, full_name, role, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, 1, ?)
        "#,
        params![
            admin_id,
            username,
            password_hash,
            full_name,
            role,
            created_at,
        ]
    ).map_err(|e| format!("Failed to insert admin user: {}", e))?;
    
    println!("👨‍💼 Default admin user created - Username: admin, Password: admin123");
    Ok(())
}

fn insert_default_category() -> Result<(), String> {
    // Check if default category already exists
    let conn = DB.get_connection();
    let existing_category: Result<String, _> = conn.query_row(
        "SELECT id FROM categories WHERE name = 'General'",
        params![],
        |row| Ok(row.get::<_, String>(0)?)
    );
    
    if existing_category.is_ok() {
        println!("📂 Default category already exists");
        return Ok(());
    }
    
    // Insert default category
    let category_id = "cat-001";
    let name = "General";
    let description = "Default category for products";
    let created_at = chrono::Utc::now().to_rfc3339();
    
    DB.execute(
        r#"
        INSERT INTO categories (id, name, description, created_at)
        VALUES (?, ?, ?, ?)
        "#,
        &[
            &category_id as &dyn ToSql,
            &name as &dyn ToSql,
            &description as &dyn ToSql,
            &created_at as &dyn ToSql,
        ]
    ).map_err(|e| e.to_string())?;
    
    println!("📁 Default category created");
    Ok(())
}

pub fn execute_query(sql: &str, params: Vec<String>) -> Result<String, String> {
    let params: Vec<&dyn ToSql> = params.iter().map(|s| s as &dyn ToSql).collect();
    DB.execute(sql, &params)
        .map(|_| "Query executed successfully".to_string())
        .map_err(|e| e.to_string())
}

pub fn run_query(sql: &str, params: Vec<String>) -> Result<Vec<Vec<String>>, String> {
    let params: Vec<&dyn ToSql> = params.iter().map(|s| s as &dyn ToSql).collect();
    DB.query(sql, &params)
        .map_err(|e| e.to_string())
}

// Helper function to get database connection
pub fn get_db() -> &'static Database {
    &DB
}