// Fix: Replaced placeholder content with a full implementation of the DataContext, which manages application state using localStorage and provides CRUD functions for all data types.
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, Customer, Supplier, Expense, Sale, User, CartItem, Shift, PaymentDetail, Category, Invoice, CategoryId, SaleId, InvoiceId, UserId, CustomerId, SupplierId, ExpenseId, ShiftId, ProductId, UserRole, PaymentMethod, ShiftStatus } from '../types';
import { getSeedData } from '../data/seed';

// A simple deep copy function to avoid mutation issues
const deepCopy = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

// A custom hook to sync state with localStorage
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

interface DataContextType {
  // States
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  sales: Sale[];
  users: User[];
  shifts: Shift[];
  categories: Category[];
  invoices: Invoice[];

  // CRUD Functions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: ProductId) => boolean;

  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: CustomerId) => boolean;

  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: SupplierId) => boolean;

  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (expenseId: ExpenseId) => void;

  addSale: (sale: Omit<Sale, 'id'>) => Sale;
  deleteSale: (saleId: SaleId) => void;

  addUser: (user: Omit<User, 'id' | 'passwordHash'> & { password?: string }) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: UserId) => boolean;

  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: CategoryId) => void;
  
  // Shift Management
  startShift: (userId: UserId, openingBalanceMinor: number) => Shift;
  closeShift: (shiftId: ShiftId, closingBalanceMinor: number) => Shift;
  getActiveShiftForUser: (userId: UserId) => Shift | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const mockBcrypt = {
  hashSync: (s: string) => `hashed_${s}`,
};

export function DataProvider({ children }: { children: ReactNode }) {
  const seedData = getSeedData();
  
  const [users, setUsers] = useLocalStorage<User[]>('pos_users', seedData.users);
  const [products, setProducts] = useLocalStorage<Product[]>('pos_products', seedData.products);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('pos_customers', seedData.customers);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('pos_suppliers', seedData.suppliers);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('pos_expenses', seedData.expenses);
  const [sales, setSales] = useLocalStorage<Sale[]>('pos_sales', seedData.sales);
  const [shifts, setShifts] = useLocalStorage<Shift[]>('pos_shifts', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('pos_categories', seedData.categories);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('pos_invoices', []);

  const generateId = () => new Date().getTime().toString() + Math.random().toString(36).substr(2, 9);
  
  // Products
  const addProduct = (product: Omit<Product, 'id'>) => setProducts(prev => [...prev, { ...product, id: generateId() as ProductId, createdAt: new Date().toISOString() }]);
  const updateProduct = (updatedProduct: Product) => setProducts(prev => prev.map(p => p.id === updatedProduct.id ? {...updatedProduct, updatedAt: new Date().toISOString() } : p));
  const deleteProduct = (productId: ProductId) => {
    const isInUse = sales.some(sale => sale.items.some(item => item.id === productId));
    if(isInUse) return false;
    setProducts(prev => prev.filter(p => p.id !== productId));
    return true;
  };

  // Categories
  const addCategory = (category: Omit<Category, 'id'>) => setCategories(prev => [...prev, { ...category, id: generateId() as CategoryId, createdAt: new Date().toISOString() }]);
  const updateCategory = (updatedCategory: Category) => setCategories(prev => prev.map(c => c.id === updatedCategory.id ? { ...updatedCategory, updatedAt: new Date().toISOString() } : c));
  const deleteCategory = (categoryId: CategoryId) => {
    // Before deleting, reassign products to an 'Uncategorized' category or null
    const uncatId = categories.find(c => c.name === 'Uncategorized')?.id;
    setProducts(prev => prev.map(p => p.categoryId === categoryId ? { ...p, categoryId: uncatId || undefined } : p));
    setCategories(prev => prev.filter(c => c.id !== categoryId));
  };

  // Customers
  const addCustomer = (customer: Omit<Customer, 'id'>) => setCustomers(prev => [...prev, { ...customer, id: generateId() as CustomerId, createdAt: new Date().toISOString() }]);
  const updateCustomer = (updatedCustomer: Customer) => setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  const deleteCustomer = (customerId: CustomerId) => {
      const isInUse = sales.some(s => s.customerId === customerId);
      if(isInUse) return false;
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      return true;
  };

  // Suppliers
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => setSuppliers(prev => [...prev, { ...supplier, id: generateId() as SupplierId, createdAt: new Date().toISOString() }]);
  const updateSupplier = (updatedSupplier: Supplier) => setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  const deleteSupplier = (supplierId: SupplierId) => {
    const isInUse = products.some(p => p.supplierId === supplierId) || expenses.some(e => e.supplierId === supplierId);
    if(isInUse) return false;
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    return true;
  };

  // Expenses
  const addExpense = (expense: Omit<Expense, 'id'>) => setExpenses(prev => [...prev, { ...expense, id: generateId() as ExpenseId }]);
  const updateExpense = (updatedExpense: Expense) => setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  const deleteExpense = (expenseId: ExpenseId) => setExpenses(prev => prev.filter(e => e.id !== expenseId));
  
  // Sales & Invoices
  const addSale = (sale: Omit<Sale, 'id'>) => {
    const newSale: Sale = { ...sale, id: generateId() as SaleId };
    setSales(prev => [...prev, newSale]);

    // Create a corresponding invoice
    const newInvoice: Invoice = {
      id: generateId() as InvoiceId,
      saleId: newSale.id,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(5, '0')}`,
      issueDate: new Date().toISOString(),
      totalMinor: newSale.totalMinor,
      status: 'paid',
      customerId: newSale.customerId,
      createdAt: new Date().toISOString(),
    };
    setInvoices(prev => [...prev, newInvoice]);

    // Update stock levels
    const updatedProducts = deepCopy(products);
    newSale.items.forEach((item: CartItem) => {
      const productIndex = updatedProducts.findIndex(p => p.id === item.id);
      if (productIndex !== -1) {
        updatedProducts[productIndex].stock -= item.quantity;
      }
    });
    setProducts(updatedProducts);

    // Update active shift if any
    const activeShift = getActiveShiftForUser(newSale.userId);
    if (activeShift) {
        const cashPayment = newSale.payments.find(p => p.method === PaymentMethod.CASH)?.amountMinor || 0;
        const cardPayment = newSale.payments.find(p => p.method === PaymentMethod.CARD)?.amountMinor || 0;
        
        setShifts(prevShifts => prevShifts.map(s => s.id === activeShift.id ? {
            ...s,
            cashSalesMinor: s.cashSalesMinor + cashPayment,
            cardSalesMinor: s.cardSalesMinor + cardPayment,
            totalSalesMinor: s.totalSalesMinor + newSale.totalMinor,
            salesIds: [...s.salesIds, newSale.id]
        } : s));
    }
    return newSale;
  };

  const deleteSale = (saleId: SaleId) => {
    const saleToDelete = sales.find(s => s.id === saleId);
    if (!saleToDelete) return;

    // Restore stock
    const updatedProducts = deepCopy(products);
    saleToDelete.items.forEach((item: CartItem) => {
      const productIndex = updatedProducts.findIndex(p => p.id === item.id);
      if (productIndex !== -1) {
        updatedProducts[productIndex].stock += item.quantity;
      }
    });
    setProducts(updatedProducts);

    // Revert shift totals
    const shiftForSale = shifts.find(s => s.salesIds.includes(saleId));
    if (shiftForSale) {
        const cashPayment = saleToDelete.payments.find(p => p.method === PaymentMethod.CASH)?.amountMinor || 0;
        const cardPayment = saleToDelete.payments.find(p => p.method === PaymentMethod.CARD)?.amountMinor || 0;

        setShifts(prevShifts => prevShifts.map(s => s.id === shiftForSale.id ? {
            ...s,
            cashSalesMinor: s.cashSalesMinor - cashPayment,
            cardSalesMinor: s.cardSalesMinor - cardPayment,
            totalSalesMinor: s.totalSalesMinor - saleToDelete.totalMinor,
            salesIds: s.salesIds.filter(id => id !== saleId)
        } : s));
    }

    // Delete sale and associated invoice
    setSales(prev => prev.filter(s => s.id !== saleId));
    setInvoices(prev => prev.filter(inv => inv.saleId !== saleId));
  };

  // Users
  const addUser = (user: Omit<User, 'id' | 'passwordHash'> & { password?: string }) => {
    const newUser = {
        ...user,
        id: generateId() as UserId,
        passwordHash: mockBcrypt.hashSync(user.password || '123456') // Default password
    };
    delete (newUser as any).password;
    setUsers(prev => [...prev, newUser]);
  };
  const updateUser = (updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  const deleteUser = (userId: UserId) => {
      const userToDelete = users.find(u => u.id === userId);
      const adminUsers = users.filter(u => u.role === UserRole.ADMIN);
      if (userToDelete?.role === UserRole.ADMIN && adminUsers.length <= 1) {
          alert("Cannot delete the last admin user.");
          return false;
      }
      
      const isInUse = sales.some(s => s.userId === userId) || expenses.some(e => e.userId === userId);
      if(isInUse) {
          alert("Cannot delete user with existing sales or expenses records.");
          return false;
      }

      setUsers(prev => prev.filter(u => u.id !== userId));
      return true;
  };

  // Shifts
  const getActiveShiftForUser = (userId: UserId) => {
      return shifts.find(s => s.userId === userId && s.status === ShiftStatus.OPEN);
  };

  const startShift = (userId: UserId, openingBalanceMinor: number) => {
      if (getActiveShiftForUser(userId)) {
          throw new Error("User already has an active shift.");
      }
      const newShift: Shift = {
          id: generateId() as ShiftId,
          userId,
          startTime: new Date().toISOString(),
          openingBalanceMinor,
          cashSalesMinor: 0,
          cardSalesMinor: 0,
          totalSalesMinor: 0,
          status: ShiftStatus.OPEN,
          salesIds: [],
      };
      setShifts(prev => [...prev, newShift]);
      return newShift;
  };

  const closeShift = (shiftId: ShiftId, closingBalanceMinor: number) => {
      let closedShift: Shift | null = null;
      setShifts(prev => prev.map(s => {
          if (s.id === shiftId) {
              closedShift = {
                  ...s,
                  status: ShiftStatus.CLOSED,
                  endTime: new Date().toISOString(),
                  closingBalanceMinor
              };
              return closedShift;
          }
          return s;
      }));
      if (!closedShift) {
          throw new Error("Shift not found.");
      }
      return closedShift;
  };

  const value = {
    products, customers, suppliers, expenses, sales, users, shifts, categories, invoices,
    addProduct, updateProduct, deleteProduct,
    addCustomer, updateCustomer, deleteCustomer,
    addSupplier, updateSupplier, deleteSupplier,
    addExpense, updateExpense, deleteExpense,
    addSale, deleteSale,
    addUser, updateUser, deleteUser,
    addCategory, updateCategory, deleteCategory,
    startShift, closeShift, getActiveShiftForUser,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}