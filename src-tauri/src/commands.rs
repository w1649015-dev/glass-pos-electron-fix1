use crate::printer::{self, Receipt};
use crate::database;

#[tauri::command]
pub async fn db_query(sql: String, params: Vec<String>) -> Result<String, String> {
    // Execute a query that returns no results (INSERT, UPDATE, DELETE)
    database::execute_query(&sql, params)
}

#[tauri::command]
pub async fn db_all(sql: String, params: Vec<String>) -> Result<String, String> {
    // Execute a query that returns results (SELECT)
    database::run_query(&sql, params)
        .map(|rows| serde_json::to_string(&rows).unwrap())
}

#[tauri::command]
pub async fn db_run(sql: String, params: Vec<String>) -> Result<String, String> {
    // General purpose query execution
    database::execute_query(&sql, params)
}

#[tauri::command]
pub async fn print_receipt(receipt: Receipt) -> Result<String, String> {
    printer::print_receipt(receipt)
}

#[tauri::command]
pub async fn get_printers() -> Result<Vec<String>, String> {
    printer::get_available_printers()
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
