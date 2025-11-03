use serde::{Deserialize, Serialize};
use std::process::Command;

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

pub fn init_printer() -> Result<(), String> {
    println!("🖨️ Printer system initialized");
    Ok(())
}

pub fn print_receipt(receipt: Receipt) -> Result<String, String> {
    // Safe printing implementation for Linux
    println!("📄 Printing receipt: {:?}", receipt);
    
    // Use CUPS directly without creating windows
    match Command::new("lp")
        .arg("-")
        .spawn() 
    {
        Ok(_) => Ok("Receipt printed successfully".to_string()),
        Err(e) => Err(format!("Print failed: {}", e))
    }
}

pub fn get_available_printers() -> Result<Vec<String>, String> {
    let output = Command::new("lpstat")
        .arg("-p")
        .output()
        .map_err(|e| e.to_string())?;
    
    let printers = String::from_utf8_lossy(&output.stdout)
        .lines()
        .map(|line| line.to_string())
        .collect();
    
    Ok(printers)
}
