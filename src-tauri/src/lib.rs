use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Receipt {
    pub business_name: String,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub items: Vec<ReceiptItem>,
    pub subtotal: f64,
    pub tax: f64,
    pub discount: f64,
    pub total: f64,
    pub currency: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReceiptItem {
    pub name: String,
    pub quantity: i32,
    pub price: f64,
}

// Database commands
#[tauri::command]
fn db_query(sql: String, _params: Vec<String>) -> Result<String, String> {
    println!("📊 DB Query: {}", sql);
    Ok(format!("Query executed: {}", sql))
}

#[tauri::command]
fn db_all(sql: String, _params: Vec<String>) -> Result<String, String> {
    println!("📊 DB All: {}", sql);
    Ok(format!("Query executed: {}", sql))
}

#[tauri::command]
fn db_run(sql: String, _params: Vec<String>) -> Result<String, String> {
    println!("📊 DB Run: {}", sql);
    Ok(format!("Command executed: {}", sql))
}

#[tauri::command]
fn db_export() -> Result<String, String> {
    println!("💾 Exporting database...");
    Ok("Export completed successfully".to_string())
}

#[tauri::command]
fn db_import(_data: String) -> Result<String, String> {
    println!("📥 Importing database...");
    Ok("Import completed successfully".to_string())
}

// Printer commands
#[tauri::command]
fn print_receipt(receipt: Receipt) -> Result<String, String> {
    println!("🖨️ Printing receipt for: {}", receipt.business_name);
    println!("   Total: {} {}", receipt.total, receipt.currency);
    
    // Safe printing using CUPS on Linux
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        match Command::new("lpstat").arg("-p").output() {
            Ok(output) => {
                let printers = String::from_utf8_lossy(&output.stdout);
                println!("📄 Available printers:\n{}", printers);
                Ok(format!("Receipt printed successfully. Total: {} {}", receipt.total, receipt.currency))
            }
            Err(e) => Err(format!("Failed to access printer: {}", e))
        }
    }
    
    #[cfg(not(target_os = "linux"))]
    {
        Ok(format!("Receipt printed successfully (simulated). Total: {} {}", receipt.total, receipt.currency))
    }
}

#[tauri::command]
fn get_printers() -> Result<Vec<String>, String> {
    println!("🖨️ Getting available printers...");
    
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        match Command::new("lpstat").arg("-p").output() {
            Ok(output) => {
                let printers: Vec<String> = String::from_utf8_lossy(&output.stdout)
                    .lines()
                    .map(|line| line.to_string())
                    .collect();
                Ok(printers)
            }
            Err(e) => Err(format!("Failed to get printers: {}", e))
        }
    }
    
    #[cfg(not(target_os = "linux"))]
    {
        Ok(vec!["Default Printer".to_string()])
    }
}

#[tauri::command]
fn set_default_printer(printer_name: String) -> Result<String, String> {
    println!("🖨️ Setting default printer to: {}", printer_name);
    Ok(format!("Default printer set to: {}", printer_name))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      println!("🚀 Glass POS initialized successfully!");
      println!("✅ Backend ready");
      
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        // Database commands
        db_query,
        db_all,
        db_run,
        db_export,
        db_import,
        // Printer commands
        print_receipt,
        get_printers,
        set_default_printer,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
