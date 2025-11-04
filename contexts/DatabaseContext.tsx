// DatabaseContext.tsx - Tauri Database Integration
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { tauriAPI } from '@/tauri'; // 🔄 Tauri API Integration
import { 
  User, Product, Category, Customer, Supplier, 
  Expense, Sale, Invoice, Shift, Settings, 
  UserId, ProductId, CategoryId, CustomerId, 
  SupplierId, SaleId, InvoiceId, ShiftId,
  UserRole, PaymentMethod
} from '@/types';

// 🔄 Tauri Database Service
class TauriDatabaseService {
  private static instance: TauriDatabaseService;
  private isTauriAvailable: boolean = false;

  static getInstance(): TauriDatabaseService {
    if (!TauriDatabaseService.instance) {
      TauriDatabaseService.instance = new TauriDatabaseService();
    }
    return TauriDatabaseService.instance;
  }

  async initialize() {
    try {
      // Probe Tauri availability by attempting a benign invoke.
      // This is more reliable than checking `window.__TAURI__` which may not
      // be present in all dev contexts (browser vs Tauri webview).
      try {
        await tauriAPI.dbQuery('SELECT 1'); // Test connection
        this.isTauriAvailable = true;
        console.log('🚀 Tauri Database Service initialized');
      } catch (probeErr) {
        this.isTauriAvailable = false;
        console.log('⚠️ Running in web mode - using fallback data');
      }
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      this.isTauriAvailable = false;
    }
  }

  // Generic database query function
  async query<T = any>(sql: string, params: any[] = []): Promise<T> {
    if (this.isTauriAvailable) {
      try {
        return await tauriAPI.dbQuery(sql, params) as T;
      } catch (error) {
        console.error('Database query error:', error);
        throw error;
      }
    } else {
      // Fallback to mock data for web development
      return this.getMockData<T>(sql);
    }
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    if (this.isTauriAvailable) {
      try {
        await tauriAPI.dbRun(sql, params);
      } catch (error) {
        console.error('Database run error:', error);
        throw error;
      }
    } else {
      console.log('📝 SQL would run:', sql, params);
    }
  }

  // 🔄 Real Tauri Database Operations
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // 👥 Users CRUD
  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: this.generateId() as UserId
    };
    
    await this.run(
      'INSERT INTO users (id, username, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?)',
      [newUser.id, newUser.username, newUser.passwordHash, newUser.role, new Date().toISOString()]
    );
    
    console.log('👤 User created:', newUser.username);
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    return await this.query<User[]>('SELECT * FROM users ORDER BY createdAt DESC');
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      const users = await this.query<User[]>('SELECT * FROM users WHERE username = ?', [username]);
      const user = users[0];
      
      if (user && await this.verifyPassword(password, user.passwordHash)) {
        return user;
      }
      return null;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  private async verifyPassword(inputPassword: string, hashedPassword: string): Promise<boolean> {
    console.log('Verifying password:', inputPassword, hashedPassword);
    try {
    // Use bcryptjs for password verification
    // const bcrypt = await import('bcryptjs');
    // return await bcrypt.compare(inputPassword, hashedPassword);
    return inputPassword === hashedPassword;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  // 📦 Products CRUD
  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: this.generateId() as ProductId
    };
    
    await this.run(
      `INSERT INTO products (id, name, sku, priceMinor, stock, lowStockThreshold, 
       categoryId, barcode, image, supplierId, description, isActive, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newProduct.id, newProduct.name, newProduct.sku, newProduct.priceMinor, newProduct.stock,
       newProduct.lowStockThreshold, newProduct.categoryId, newProduct.barcode, newProduct.image,
       newProduct.supplierId, newProduct.description, newProduct.isActive, new Date().toISOString()]
    );
    
    console.log('📦 Product created:', newProduct.name);
    return newProduct;
  }

  async getProducts(): Promise<Product[]> {
    return await this.query<Product[]>('SELECT * FROM products ORDER BY name ASC');
  }

  async updateProduct(id: ProductId, product: Partial<Product>): Promise<Product> {
    const updatedProduct = { ...product, updatedAt: new Date().toISOString() };
    
    await this.run(
      `UPDATE products SET name = ?, sku = ?, priceMinor = ?, stock = ?, lowStockThreshold = ?,
       categoryId = ?, barcode = ?, image = ?, supplierId = ?, description = ?, isActive = ?, 
       updatedAt = ? WHERE id = ?`,
      [updatedProduct.name, updatedProduct.sku, updatedProduct.priceMinor, updatedProduct.stock,
       updatedProduct.lowStockThreshold, updatedProduct.categoryId, updatedProduct.barcode,
       updatedProduct.image, updatedProduct.supplierId, updatedProduct.description,
       updatedProduct.isActive, updatedProduct.updatedAt, id]
    );
    
    return { id, ...product } as Product;
  }

  async deleteProduct(id: ProductId): Promise<boolean> {
    try {
      await this.run('DELETE FROM products WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Delete product error:', error);
      return false;
    }
  }

  // 🏷️ Categories CRUD
  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const newCategory: Category = {
      ...category,
      id: this.generateId() as CategoryId
    };
    
    await this.run(
      'INSERT INTO categories (id, name, description, parentId, sortOrder, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newCategory.id, newCategory.name, newCategory.description, newCategory.parentId, 
       newCategory.sortOrder, newCategory.isActive, new Date().toISOString()]
    );
    
    console.log('🏷️ Category created:', newCategory.name);
    return newCategory;
  }

  async getCategories(): Promise<Category[]> {
    return await this.query<Category[]>('SELECT * FROM categories ORDER BY sortOrder ASC, name ASC');
  }

  // 💰 Sales CRUD
  async createSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
    const newSale: Sale = {
      ...sale,
      id: this.generateId() as SaleId
    };
    
    // Use transaction for complex sale operation
    await this.run('BEGIN TRANSACTION');
    
    try {
      // Insert sale
      await this.run(
        `INSERT INTO sales (id, subtotalMinor, taxMinor, discountMinor, totalMinor, 
         date, userId, customerId, shiftId, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newSale.id, newSale.subtotalMinor, newSale.taxMinor, newSale.discountMinor, newSale.totalMinor,
         newSale.date, newSale.userId, newSale.customerId, newSale.shiftId, JSON.stringify(newSale.metadata || {})]
      );
      
      // Insert sale items
      for (const item of newSale.items) {
        await this.run(
          'INSERT INTO sale_items (saleId, productId, quantity, priceMinor) VALUES (?, ?, ?, ?)',
          [newSale.id, item.id, item.quantity, item.priceMinor]
        );
        
        // Update product stock
        await this.run(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.id]
        );
      }
      
      await this.run('COMMIT');
      console.log('💰 Sale created:', newSale.id);
      return newSale;
      
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }

  async getSales(): Promise<Sale[]> {
    return await this.query<Sale[]>('SELECT * FROM sales ORDER BY date DESC');
  }

  // 👤 Customers CRUD
  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const newCustomer: Customer = {
      ...customer,
      id: this.generateId() as CustomerId
    };
    
    await this.run(
      'INSERT INTO customers (id, name, phone, email, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [newCustomer.id, newCustomer.name, newCustomer.phone, newCustomer.email, newCustomer.notes, new Date().toISOString()]
    );
    
    return newCustomer;
  }

  async getCustomers(): Promise<Customer[]> {
    return await this.query<Customer[]>('SELECT * FROM customers ORDER BY name ASC');
  }

  // 🏢 Suppliers CRUD
  async createSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const newSupplier: Supplier = {
      ...supplier,
      id: this.generateId() as SupplierId
    };
    
    await this.run(
      'INSERT INTO suppliers (id, name, phone, email, address, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [newSupplier.id, newSupplier.name, newSupplier.phone, newSupplier.email, newSupplier.address, new Date().toISOString()]
    );
    
    return newSupplier;
  }

  async getSuppliers(): Promise<Supplier[]> {
    return await this.query<Supplier[]>('SELECT * FROM suppliers ORDER BY name ASC');
  }

  // 💳 Expenses CRUD
  async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const newExpense: Expense = {
      ...expense,
      id: this.generateId() as ExpenseId
    };
    
    await this.run(
      'INSERT INTO expenses (id, title, amountMinor, date, category, userId, supplierId, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newExpense.id, newExpense.title, newExpense.amountMinor, newExpense.date, newExpense.category,
       newExpense.userId, newExpense.supplierId, newExpense.notes]
    );
    
    return newExpense;
  }

  async getExpenses(): Promise<Expense[]> {
    return await this.query<Expense[]>('SELECT * FROM expenses ORDER BY date DESC');
  }

  // 🧾 Invoices CRUD
  async createInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
    const newInvoice: Invoice = {
      ...invoice,
      id: this.generateId() as InvoiceId
    };
    
    await this.run(
      'INSERT INTO invoices (id, saleId, invoiceNumber, issueDate, dueDate, totalMinor, status, notes, customerId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newInvoice.id, newInvoice.saleId, newInvoice.invoiceNumber, newInvoice.issueDate, newInvoice.dueDate,
       newInvoice.totalMinor, newInvoice.status, newInvoice.notes, newInvoice.customerId, new Date().toISOString()]
    );
    
    return newInvoice;
  }

  async getInvoices(): Promise<Invoice[]> {
    return await this.query<Invoice[]>('SELECT * FROM invoices ORDER BY createdAt DESC');
  }

  // ⏰ Shifts CRUD
  async startShift(userId: UserId, openingBalanceMinor: number): Promise<Shift> {
    // Check for existing open shift
    const existingShifts = await this.query<Shift[]>('SELECT * FROM shifts WHERE userId = ? AND status = "open"', [userId]);
    if (existingShifts.length > 0) {
      throw new Error('User already has an active shift');
    }
    
    const newShift: Shift = {
      id: this.generateId() as ShiftId,
      userId,
      startTime: new Date().toISOString(),
      openingBalanceMinor,
      cashSalesMinor: 0,
      cardSalesMinor: 0,
      totalSalesMinor: 0,
      status: 'open',
      salesIds: []
    };
    
    await this.run(
      'INSERT INTO shifts (id, userId, startTime, openingBalanceMinor, cashSalesMinor, cardSalesMinor, totalSalesMinor, status, salesIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newShift.id, newShift.userId, newShift.startTime, newShift.openingBalanceMinor, newShift.cashSalesMinor,
       newShift.cardSalesMinor, newShift.totalSalesMinor, newShift.status, JSON.stringify(newShift.salesIds)]
    );
    
    return newShift;
  }

  async closeShift(shiftId: ShiftId, closingBalanceMinor: number): Promise<Shift> {
    const shift = await this.query<Shift>('SELECT * FROM shifts WHERE id = ?', [shiftId]);
    if (!shift) {
      throw new Error('Shift not found');
    }
    
    const updatedShift: Shift = {
      ...shift,
      endTime: new Date().toISOString(),
      closingBalanceMinor,
      status: 'closed'
    };
    
    await this.run(
      'UPDATE shifts SET endTime = ?, closingBalanceMinor = ?, status = ? WHERE id = ?',
      [updatedShift.endTime, updatedShift.closingBalanceMinor, updatedShift.status, shiftId]
    );
    
    return updatedShift;
  }

  async getShifts(): Promise<Shift[]> {
    return await this.query<Shift[]>('SELECT * FROM shifts ORDER BY startTime DESC');
  }

  // ⚙️ Settings
  async getSettings(): Promise<Settings> {
    return await this.query<Settings>('SELECT * FROM settings LIMIT 1').then(settings => settings[0] || {
      storeName: 'Glass POS',
      currency: 'SAR',
      defaultTaxRatePercent: 15,
      printType: 'receipt',
      language: 'ar',
      theme: 'light',
      categoriesEnabled: true,
      taxNumber: '123456789012345',
      storeAddress: 'الرياض، المملكة العربية السعودية',
      storePhone: '+966500000000',
      autoPrintReceipt: true
    });
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    
    // Use UPSERT (INSERT OR REPLACE) for settings
    await this.run(
      'INSERT OR REPLACE INTO settings (id, storeName, currency, defaultTaxRatePercent, printType, language, theme, categoriesEnabled, taxNumber, storeAddress, storePhone, autoPrintReceipt) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [updated.storeName, updated.currency, updated.defaultTaxRatePercent, updated.printType,
       updated.language, updated.theme, updated.categoriesEnabled, updated.taxNumber,
       updated.storeAddress, updated.storePhone, updated.autoPrintReceipt]
    );
    
    console.log('⚙️ Settings updated:', updated.storeName);
    return updated;
  }

  // 📊 Analytics
  async getTotalSales(startDate?: string, endDate?: string): Promise<number> {
    const params = [];
    let query = 'SELECT SUM(totalMinor) as total FROM sales WHERE 1=1';
    
    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }
    
    const result = await this.query<{total: number}>(query, params);
    return result[0]?.total || 0;
  }

  // 🖨️ Printer operations
  async printReceipt(data: any): Promise<void> {
    if (this.isTauriAvailable) {
      await tauriAPI.print(data);
      console.log('🖨️ Receipt printed successfully');
    } else {
      console.log('🖨️ Print simulation:', data);
    }
  }

  async getPrinters(): Promise<any[]> {
    if (this.isTauriAvailable) {
      return await tauriAPI.getPrinters();
    } else {
      return [{ id: 'mock-printer', name: 'Mock Printer' }];
    }
  }

  // 💾 Data management
  async exportData(): Promise<string> {
    if (this.isTauriAvailable) {
      return await tauriAPI.dbExport();
    } else {
      return JSON.stringify({ timestamp: new Date().toISOString(), data: 'mock export' });
    }
  }

  async importData(data: string): Promise<boolean> {
    if (this.isTauriAvailable) {
      await tauriAPI.dbImport(data);
      return true;
    } else {
      console.log('📥 Data import simulation:', data);
      return true;
    }
  }

  // 🔄 Fallback mock data for development
  private getMockData<T>(sql: string): T {
    console.log('📝 Using mock data for:', sql);
    return [] as T;
  }
}

// 🔄 Enhanced Database Context with Tauri Integration
interface DatabaseContextType {
  // Connection status
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 🔄 Data operations
  refreshData: () => Promise<void>;
  
  // 👥 User operations
  users: User[];
  createUser: (user: Omit<User, 'id'>) => Promise<User>;
  getUsers: () => Promise<User[]>;
  updateUser?: (id: UserId, user: Partial<User>) => Promise<User>;
  deleteUser?: (id: UserId) => Promise<void>;
  
  // 📦 Product operations
  products: Product[];
  createProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  getProducts: () => Promise<Product[]>;
  updateProduct: (id: ProductId, product: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: ProductId) => Promise<boolean>;
  
  // 🏷️ Category operations
  categories: Category[];
  createCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  getCategories: () => Promise<Category[]>;
  
  // 👤 Customer operations
  customers: Customer[];
  createCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer>;
  getCustomers: () => Promise<Customer[]>;
  
  // 🏢 Supplier operations
  suppliers: Supplier[];
  createSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier>;
  getSuppliers: () => Promise<Supplier[]>;
  
  // 💰 Sale operations
  sales: Sale[];
  createSale: (sale: Omit<Sale, 'id'>) => Promise<Sale>;
  getSales: () => Promise<Sale[]>;
  
  // 💳 Expense operations
  expenses: Expense[];
  createExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense>;
  getExpenses: () => Promise<Expense[]>;
  
  // 🧾 Invoice operations
  invoices: Invoice[];
  createInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<Invoice>;
  getInvoices: () => Promise<Invoice[]>;
  
  // ⏰ Shift operations
  shifts: Shift[];
  startShift: (userId: UserId, openingBalanceMinor: number) => Promise<Shift>;
  closeShift: (shiftId: ShiftId, closingBalanceMinor: number) => Promise<Shift>;
  getShifts: () => Promise<Shift[]>;
  
  // ⚙️ Settings
  settings: Settings | null;
  getSettings: () => Promise<Settings>;
  updateSettings: (settings: Partial<Settings>) => Promise<Settings>;
  
  // 🖨️ Printer operations
  printReceipt: (data: any) => Promise<void>;
  getPrinters: () => Promise<any[]>;
  
  // 🔐 Authentication
  authenticateUser: (username: string, password: string) => Promise<User | null>;
  
  // 💾 Data management
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<boolean>;
  
  // 📊 Analytics
  getTotalSales: (startDate?: string, endDate?: string) => Promise<number>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

// Database Provider Component with Tauri Integration
interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  // 🔄 Enhanced state management
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  
  // Connection status
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const db = TauriDatabaseService.getInstance();

  // 🚀 Initialize database and Tauri connection
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🚀 Initializing database connection...');
        await db.initialize();
        console.log('✅ Database connection initialized.');

        setIsConnected(true);
        
        console.log('🗄️ Tauri Database initialized successfully');
        await refreshData();
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Database initialization failed';
        setError(errorMessage);
        setIsConnected(false);
        console.error('❌ Database initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  // 🔄 Refresh all data from Tauri database
  const refreshData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Refreshing data...');
      
      // Fetch data in parallel to improve performance
      const [
        usersData,
        productsData,
        categoriesData,
        customersData,
        suppliersData,
        salesData,
        expensesData,
        invoicesData,
        shiftsData,
        settingsData,
      ] = await Promise.all([
        db.getUsers().then(data => { console.log('✅ Users loaded'); return data; }),
        db.getProducts().then(data => { console.log('✅ Products loaded'); return data; }),
        db.getCategories().then(data => { console.log('✅ Categories loaded'); return data; }),
        db.getCustomers().then(data => { console.log('✅ Customers loaded'); return data; }),
        db.getSuppliers().then(data => { console.log('✅ Suppliers loaded'); return data; }),
        db.getSales().then(data => { console.log('✅ Sales loaded'); return data; }),
        db.getExpenses().then(data => { console.log('✅ Expenses loaded'); return data; }),
        db.getInvoices().then(data => { console.log('✅ Invoices loaded'); return data; }),
        db.getShifts().then(data => { console.log('✅ Shifts loaded'); return data; }),
        db.getSettings().then(data => { console.log('✅ Settings loaded'); return data; }),
      ]);

      console.log('🔄 All data loaded, setting state...');

      setUsers(usersData);
      setProducts(productsData);
      setCategories(categoriesData);
      setCustomers(customersData);
      setSuppliers(suppliersData);
      setSales(salesData);
      setExpenses(expensesData);
      setInvoices(invoicesData);
      setShifts(shiftsData);
      setSettings(settingsData);
      
      console.log('📊 Data refreshed successfully');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
      console.error('❌ Data refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 👥 User operations
  const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    const newUser = await db.createUser(user);
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const getUsers = async (): Promise<User[]> => {
    const usersData = await db.getUsers();
    setUsers(usersData);
    return usersData;
  };

  // 📦 Product operations
  const createProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
    const newProduct = await db.createProduct(product);
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  };

  const getProducts = async (): Promise<Product[]> => {
    const productsData = await db.getProducts();
    setProducts(productsData);
    return productsData;
  };

  const updateProduct = async (id: ProductId, product: Partial<Product>): Promise<Product> => {
    const updated = await db.updateProduct(id, product);
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  };

  const deleteProduct = async (id: ProductId): Promise<boolean> => {
    const success = await db.deleteProduct(id);
    if (success) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
    return success;
  };

  // 🏷️ Category operations
  const createCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
    const newCategory = await db.createCategory(category);
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const getCategories = async (): Promise<Category[]> => {
    const categoriesData = await db.getCategories();
    setCategories(categoriesData);
    return categoriesData;
  };

  // 👤 Customer operations
  const createCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const newCustomer = await db.createCustomer(customer);
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  const getCustomers = async (): Promise<Customer[]> => {
    const customersData = await db.getCustomers();
    setCustomers(customersData);
    return customersData;
  };

  // 🏢 Supplier operations
  const createSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
    const newSupplier = await db.createSupplier(supplier);
    setSuppliers(prev => [...prev, newSupplier]);
    return newSupplier;
  };

  const getSuppliers = async (): Promise<Supplier[]> => {
    const suppliersData = await db.getSuppliers();
    setSuppliers(suppliersData);
    return suppliersData;
  };

  // 💰 Sale operations
  const createSale = async (sale: Omit<Sale, 'id'>): Promise<Sale> => {
    const newSale = await db.createSale(sale);
    setSales(prev => [...prev, newSale]);
    return newSale;
  };

  const getSales = async (): Promise<Sale[]> => {
    const salesData = await db.getSales();
    setSales(salesData);
    return salesData;
  };

  // 💳 Expense operations
  const createExpense = async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
    const newExpense = await db.createExpense(expense);
    setExpenses(prev => [...prev, newExpense]);
    return newExpense;
  };

  const getExpenses = async (): Promise<Expense[]> => {
    const expensesData = await db.getExpenses();
    setExpenses(expensesData);
    return expensesData;
  };

  // 🧾 Invoice operations
  const createInvoice = async (invoice: Omit<Invoice, 'id'>): Promise<Invoice> => {
    const newInvoice = await db.createInvoice(invoice);
    setInvoices(prev => [...prev, newInvoice]);
    return newInvoice;
  };

  const getInvoices = async (): Promise<Invoice[]> => {
    const invoicesData = await db.getInvoices();
    setInvoices(invoicesData);
    return invoicesData;
  };

  // ⏰ Shift operations
  const startShift = async (userId: UserId, openingBalanceMinor: number): Promise<Shift> => {
    const newShift = await db.startShift(userId, openingBalanceMinor);
    setShifts(prev => [...prev, newShift]);
    return newShift;
  };

  const closeShift = async (shiftId: ShiftId, closingBalanceMinor: number): Promise<Shift> => {
    const updatedShift = await db.closeShift(shiftId, closingBalanceMinor);
    setShifts(prev => prev.map(s => s.id === shiftId ? updatedShift : s));
    return updatedShift;
  };

  const getShifts = async (): Promise<Shift[]> => {
    const shiftsData = await db.getShifts();
    setShifts(shiftsData);
    return shiftsData;
  };

  // ⚙️ Settings operations
  const getSettings = async (): Promise<Settings> => {
    const settingsData = await db.getSettings();
    setSettings(settingsData);
    return settingsData;
  };

  const updateSettings = async (settingsUpdate: Partial<Settings>): Promise<Settings> => {
    const updated = await db.updateSettings(settingsUpdate);
    setSettings(updated);
    return updated;
  };

  // 🖨️ Printer operations
  const printReceipt = async (data: any): Promise<void> => {
    await db.printReceipt(data);
  };

  const getPrinters = async (): Promise<any[]> => {
    return await db.getPrinters();
  };

  // 🔐 Authentication
  const authenticateUser = async (username: string, password: string): Promise<User | null> => {
    return await db.authenticateUser(username, password);
  };

  // 💾 Data management
  const exportData = async (): Promise<string> => {
    return await db.exportData();
  };

  const importData = async (data: string): Promise<boolean> => {
    const success = await db.importData(data);
    if (success) {
      await refreshData(); // Refresh after import
    }
    return success;
  };

  // 📊 Analytics
  const getTotalSales = async (startDate?: string, endDate?: string): Promise<number> => {
    return await db.getTotalSales(startDate, endDate);
  };

  const value: DatabaseContextType = {
    // Connection status
    isConnected,
    isLoading,
    error,
    
    // Data operations
    refreshData,
    
    // Users
    users,
    createUser,
    getUsers,
    
    // Products
    products,
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    
    // Categories
    categories,
    createCategory,
    getCategories,
    
    // Customers
    customers,
    createCustomer,
    getCustomers,
    
    // Suppliers
    suppliers,
    createSupplier,
    getSuppliers,
    
    // Sales
    sales,
    createSale,
    getSales,
    
    // Expenses
    expenses,
    createExpense,
    getExpenses,
    
    // Invoices
    invoices,
    createInvoice,
    getInvoices,
    
    // Shifts
    shifts,
    startShift,
    closeShift,
    getShifts,
    
    // Settings
    settings,
    getSettings,
    updateSettings,
    
    // Printer
    printReceipt,
    getPrinters,
    
    // Authentication
    authenticateUser,
    
    // Data management
    exportData,
    importData,
    
    // Analytics
    getTotalSales
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

// Custom hook to use database context
export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

export default DatabaseContext;