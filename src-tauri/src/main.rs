#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod database;
mod printer;

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            // Initialize database
            database::init_database()?;
            
            // Setup printer
            printer::init_printer()?;
            
            println!("✅ Glass POS initialized successfully!");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Database commands
            commands::db_query,
            commands::db_all,
            commands::db_run,
            commands::db_export,
            commands::db_import,

                        
            // User management
            commands::login_user,
            commands::get_users,
            commands::create_user,
            
            // Printer commands
            commands::print_receipt,
            commands::get_printers,
            commands::set_default_printer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}