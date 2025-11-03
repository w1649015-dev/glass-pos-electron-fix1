use rusqlite::{Connection, Result, ToSql};
use std::sync::Mutex;
use once_cell::sync::Lazy;

pub struct Database {
    conn: Mutex<Connection>,
}

static DB: Lazy<Database> = Lazy::new(|| {
    Database::new(":memory:").expect("Failed to initialize database")
});

impl Database {
    pub fn new(path: &str) -> Result<Self, rusqlite::Error> {
        let conn = Connection::open(path)?;
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
}

pub fn init_database() -> Result<(), String> {
    println!("🗄️ Database initialized");
    // Initialize tables
    DB.execute(
        "CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER NOT NULL
        )",
        &[],
    ).map_err(|e| e.to_string())?;

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
