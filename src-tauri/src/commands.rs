use crate::printer::{self, Receipt};
use crate::database;
use serde::{Deserialize, Serialize};

#[tauri::command]
pub async fn db_query(sql: String, params: Vec<String>) -> Result<String, String> {
    println!("[Tauri] db_query START: {}", sql);
    let result = database::execute_query(&sql, params);
    println!("[Tauri] db_query END: {}", sql);
    result
}

#[tauri::command]
pub async fn db_all(sql: String, params: Vec<String>) -> Result<String, String> {
    println!("[Tauri] db_all START: {}", sql);
    let result = database::run_query(&sql, params)
        .map(|rows| serde_json::to_string(&rows).unwrap());
    println!("[Tauri] db_all END: {}", sql);
    result
}

#[tauri::command]
pub async fn db_run(sql: String, params: Vec<String>) -> Result<String, String> {
    println!("[Tauri] db_run START: {}", sql);
    let result = database::execute_query(&sql, params);
    println!("[Tauri] db_run END: {}", sql);
    result
}

#[tauri::command]
pub async fn print_receipt(receipt: Receipt) -> Result<String, String> {
    println!("[Tauri] print_receipt START");
    let result = printer::print_receipt(receipt);
    println!("[Tauri] print_receipt END");
    result
}

#[tauri::command]
pub async fn get_printers() -> Result<Vec<String>, String> {
    println!("[Tauri] get_printers START");
    let result = printer::get_available_printers();
    println!("[Tauri] get_printers END");
    result
}

#[tauri::command]
pub async fn db_export() -> Result<String, String> {
    Ok("Export completed".to_string())
}

#[tauri::command]
pub async fn db_import(_data: String) -> Result<String, String> {
    Ok("Import completed".to_string())
}

#[tauri::command]
pub async fn set_default_printer(printer_name: String) -> Result<String, String> {
    Ok(format!("Default printer set to: {}", printer_name))
}

#[derive(Serialize, Deserialize)]
pub struct UserLogin {
    username: String,
    password: String,
}

#[tauri::command]
pub async fn login_user(login_data: UserLogin) -> Result<String, String> {
    let conn = database::get_db().get_connection();
    
    // Find user by username
    let user_result = conn.query_row(
        "SELECT id, password_hash, full_name, role, is_active FROM users WHERE username = ?",
        &[&login_data.username],
        |row| {
            Ok((
                row.get::<_, String>(0)?, // id
                row.get::<_, String>(1)?, // password_hash
                row.get::<_, String>(2)?, // full_name
                row.get::<_, String>(3)?, // role
                row.get::<_, i32>(4)?,    // is_active
            ))
        }
    );
    
    match user_result {
        Ok((user_id, password_hash, full_name, role, is_active)) => {
            if is_active == 0 {
                return Err("Account is disabled".to_string());
            }
            
            // Verify password
            if bcrypt::verify(&login_data.password, &password_hash).map_err(|e| e.to_string())? {
                let result = serde_json::json!({
                    "success": true,
                    "user": {
                        "id": user_id,
                        "username": login_data.username,
                        "full_name": full_name,
                        "role": role
                    }
                });
                Ok(serde_json::to_string(&result).unwrap())
            } else {
                Err("Invalid username or password".to_string())
            }
        }
        Err(_) => Err("User not found".to_string()),
    }
}

#[tauri::command]
pub async fn get_users() -> Result<String, String> {
    let result = database::run_query(
        "SELECT id, username, full_name, role, is_active, created_at FROM users",
        vec![]
    ).map_err(|e| e.to_string())?;
    
    Ok(serde_json::to_string(&result).unwrap())
}

#[tauri::command]
pub async fn create_user(user_data: serde_json::Value) -> Result<String, String> {
    // Extract user data from JSON
    let id = user_data.get("id").and_then(|v| v.as_str()).unwrap_or("");
    let username = user_data.get("username").and_then(|v| v.as_str()).unwrap_or("");
    let password = user_data.get("password").and_then(|v| v.as_str()).unwrap_or("");
    let full_name = user_data.get("full_name").and_then(|v| v.as_str()).unwrap_or("");
    let role = user_data.get("role").and_then(|v| v.as_str()).unwrap_or("cashier");
    
    if id.is_empty() || username.is_empty() || password.is_empty() || full_name.is_empty() {
        return Err("Missing required fields".to_string());
    }
    
    // Hash password
    let password_hash = bcrypt::hash(password, bcrypt::DEFAULT_COST)
        .map_err(|e| format!("Failed to hash password: {}", e))?;
    
    let created_at = chrono::Utc::now().to_rfc3339();
    
    // Insert user
    database::execute_query(
        "INSERT INTO users (id, username, password_hash, full_name, role, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)",
        vec![
            id.to_string(),
            username.to_string(),
            password_hash,
            full_name.to_string(),
            role.to_string(),
            created_at
        ]
    )?;
    
    Ok("User created successfully".to_string())
}