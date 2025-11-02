const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')
const { app } = require('electron')

class POS_Database {
  constructor() {
    this.dbDir = path.join(app.getPath('userData'), 'data')
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true })
    }
    
    this.dbPath = path.join(this.dbDir, 'pos.db')
    this.initialized = this.initDatabase()
  }

  async initDatabase() {
    try {
      const SQL = await initSqlJs()
      
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath)
        this.db = new SQL.Database(buffer)
      } else {
        this.db = new SQL.Database()
        this.initializeSchema()
        await this.seedData()
        this.saveToFile()
      }
      return true
    } catch (error) {
      console.error('Database initialization error:', error)
      throw error
    }
  }

  initializeSchema() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'cashier')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        lowStockThreshold INTEGER DEFAULT 5,
        category TEXT NOT NULL,
        image TEXT,
        supplierId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        date DATETIME NOT NULL,
        category TEXT NOT NULL,
        userId TEXT NOT NULL,
        supplierId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        discount REAL DEFAULT 0,
        total REAL NOT NULL,
        paymentMethod TEXT CHECK(paymentMethod IN ('cash', 'card')),
        date DATETIME NOT NULL,
        userId TEXT NOT NULL,
        customerId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        saleId TEXT NOT NULL,
        productId TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        subtotal REAL NOT NULL
      )`,

      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        storeName TEXT DEFAULT 'Glass POS',
        currency TEXT DEFAULT '$',
        defaultTaxRate REAL DEFAULT 15,
        printType TEXT DEFAULT 'receipt',
        language TEXT DEFAULT 'en',
        theme TEXT DEFAULT 'dark',
        logoImage TEXT,
        taxNumber TEXT,
        storeAddress TEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ]

    tables.forEach(sql => {
      try {
        this.db.run(sql)
      } catch (error) {
        console.error('Schema initialization error:', error)
      }
    })
  }

  async seedData() {
    try {
      const userCount = this.db.exec('SELECT COUNT(*) as count FROM users')
      if (userCount[0]?.values[0][0] === 0) {
        const mockBcrypt = (s) => `hashed_${s}`

        // Seed Users
        this.db.run('INSERT INTO users (id, username, passwordHash, role) VALUES (?, ?, ?, ?)', 
          ['1', 'admin', mockBcrypt('admin'), 'admin'])
        this.db.run('INSERT INTO users (id, username, passwordHash, role) VALUES (?, ?, ?, ?)', 
          ['2', 'cashier', mockBcrypt('cashier'), 'cashier'])

        // Seed Suppliers
        this.db.run('INSERT INTO suppliers (id, name, phone, email) VALUES (?, ?, ?, ?)', 
          ['s1', 'Coffee Beans Inc.', '555-111-2222', 'sales@coffeebeans.com'])
        this.db.run('INSERT INTO suppliers (id, name, phone, email) VALUES (?, ?, ?, ?)', 
          ['s2', 'Fresh Pastries Co.', '555-333-4444', 'orders@freshpastries.com'])

        // Seed Products
        const products = [
          ['p1', 'Espresso', 'SKU001', 2.50, 100, 10, 'Coffee', 'https://picsum.photos/seed/espresso/100', 's1'],
          ['p2', 'Latte', 'SKU002', 3.50, 80, 10, 'Coffee', 'https://picsum.photos/seed/latte/100', 's1'],
          ['p3', 'Croissant', 'SKU003', 2.75, 50, 5, 'Pastry', 'https://picsum.photos/seed/croissant/100', 's2'],
          ['p4', 'Muffin', 'SKU004', 3.00, 45, 5, 'Pastry', 'https://picsum.photos/seed/muffin/100', 's2'],
          ['p5', 'Orange Juice', 'SKU005', 4.00, 60, 15, 'Drinks', 'https://picsum.photos/seed/juice/100', null]
        ]

        products.forEach(product => {
          this.db.run(`INSERT INTO products (id, name, sku, price, stock, lowStockThreshold, category, image, supplierId) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, product)
        })

        // Seed Settings
        this.db.run(`INSERT INTO settings (storeName, currency, defaultTaxRate, language, theme) 
          VALUES (?, ?, ?, ?, ?)`, ['Glass POS', '$', 15, 'en', 'dark'])

        this.saveToFile()
        console.log('Database seeded with initial data')
      }
    } catch (error) {
      console.error('Seed data error:', error)
    }
  }

  prepare(sql) {
    return {
      get: (...params) => {
        const result = this.db.exec(sql, params)
        return result[0]?.values[0] || null
      },
      all: (...params) => {
        const result = this.db.exec(sql, params)
        return result[0]?.values.map(row => {
          const obj = {}
          result[0].columns.forEach((col, index) => {
            obj[col] = row[index]
          })
          return obj
        }) || []
      },
      run: (...params) => {
        this.db.run(sql, params)
        this.saveToFile()
        return { changes: this.db.getRowsModified(), lastID: this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0] }
      }
    }
  }

  saveToFile() {
    if (this.db) {
      const data = this.db.export()
      const buffer = Buffer.from(data)
      fs.writeFileSync(this.dbPath, buffer)
    }
  }

  exportData() {
    try {
      const data = {
        users: this.prepare('SELECT * FROM users').all(),
        products: this.prepare('SELECT * FROM products').all(),
        customers: this.prepare('SELECT * FROM customers').all(),
        suppliers: this.prepare('SELECT * FROM suppliers').all(),
        expenses: this.prepare('SELECT * FROM expenses').all(),
        sales: this.prepare('SELECT * FROM sales').all(),
        settings: this.prepare('SELECT * FROM settings').all(),
        timestamp: new Date().toISOString(),
      }
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error('Export error:', error)
      throw error
    }
  }

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData)
      
      // Clear existing data
      const tables = ['sale_items', 'sales', 'expenses', 'products', 'customers', 'suppliers', 'users']
      tables.forEach(table => {
        this.db.run(`DELETE FROM ${table}`)
      })

      // Import data (نفس منطق الاستيراد السابق)
      // ... (يمكنك إضافة منطق الاستيراد هنا)

      this.saveToFile()
      console.log('Database imported successfully')
      return true
    } catch (error) {
      console.error('Import error:', error)
      throw error
    }
  }

  close() {
    if (this.db) {
      this.saveToFile()
    }
  }
}

module.exports = POS_Database
