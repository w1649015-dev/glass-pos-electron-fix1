use bcrypt::hash;
use std::env;

fn main() {
    let password = env::args().nth(1).unwrap_or_else(|| "admin123".to_string());
    
    match hash(&password, bcrypt::DEFAULT_COST) {
        Ok(hash) => {
            println!("Password: {}", password);
            println!("Hash: {}", hash);
            println!("\nUse this hash in the database insert statement.");
        }
        Err(e) => {
            eprintln!("Error generating hash: {}", e);
        }
    }
}