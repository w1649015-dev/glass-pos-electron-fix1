import { Product, Customer, Supplier, Expense, Sale, User, Category, UserRole, CategoryId, ProductId, CustomerId, SupplierId, UserId, ExpenseId } from '../types';
import bcrypt from 'bcryptjs';

// Use bcrypt for seeding so dev server users match the migrated DB hashes.
export const getSeedData = () => {
  // Temporary dev password for admin (matches migration): TempPass!2025
  const adminPasswordHash = bcrypt.hashSync('TempPass!2025', 10);
  const cashierPasswordHash = bcrypt.hashSync('cashier', 10);

  const users: User[] = [
    { id: '1' as UserId, username: 'admin', passwordHash: adminPasswordHash, role: UserRole.ADMIN },
    { id: '2' as UserId, username: 'cashier', passwordHash: cashierPasswordHash, role: UserRole.CASHIER },
  ];

  const suppliers: Supplier[] = [
    { id: 's1' as SupplierId, name: 'Coffee Beans Inc.', phone: '555-111-2222', email: 'sales@coffeebeans.com' },
    { id: 's2' as SupplierId, name: 'Fresh Pastries Co.', phone: '555-333-4444', email: 'orders@freshpastries.com' },
  ];

  const categories: Category[] = [
    { id: 'cat1' as CategoryId, name: 'Coffee', description: 'All coffee-based beverages' },
    { id: 'cat2' as CategoryId, name: 'Pastry', description: 'Baked goods' },
    { id: 'cat3' as CategoryId, name: 'Drinks', description: 'Other non-coffee drinks' },
    { id: 'cat4' as CategoryId, name: 'Hot Coffee', parentId: 'cat1' as CategoryId },
    { id: 'cat5' as CategoryId, name: 'Cold Coffee', parentId: 'cat1' as CategoryId },
    { id: 'uncat' as CategoryId, name: 'Uncategorized' },
  ];

  const products: Product[] = [
    { id: 'p1' as ProductId, name: 'Espresso', sku: 'SKU001', priceMinor: 250, stock: 100, lowStockThreshold: 10, categoryId: 'cat4' as CategoryId, image: 'https://picsum.photos/seed/espresso/100', supplierId: 's1' as SupplierId },
    { id: 'p2' as ProductId, name: 'Latte', sku: 'SKU002', priceMinor: 350, stock: 80, lowStockThreshold: 10, categoryId: 'cat4' as CategoryId, image: 'https://picsum.photos/seed/latte/100', supplierId: 's1' as SupplierId },
    { id: 'p3' as ProductId, name: 'Croissant', sku: 'SKU003', priceMinor: 275, stock: 50, lowStockThreshold: 5, categoryId: 'cat2' as CategoryId, image: 'https://picsum.photos/seed/croissant/100', supplierId: 's2' as SupplierId },
    { id: 'p4' as ProductId, name: 'Muffin', sku: 'SKU004', priceMinor: 300, stock: 45, lowStockThreshold: 5, categoryId: 'cat2' as CategoryId, image: 'https://picsum.photos/seed/muffin/100', supplierId: 's2' as SupplierId },
    { id: 'p5' as ProductId, name: 'Orange Juice', sku: 'SKU005', priceMinor: 400, stock: 60, lowStockThreshold: 15, categoryId: 'cat3' as CategoryId, image: 'https://picsum.photos/seed/juice/100' },
  ];

  const customers: Customer[] = [
    { id: 'c1' as CustomerId, name: 'John Doe', phone: '123-456-7890', email: 'john.doe@example.com' },
    { id: 'c2' as CustomerId, name: 'Jane Smith', phone: '098-765-4321', email: 'jane.smith@example.com' },
  ];
  
  const expenses: Expense[] = [
      { id: 'e1' as ExpenseId, title: 'Rent', amountMinor: 150000, date: new Date(new Date().setDate(1)).toISOString(), category: 'Utilities', userId: '1' as UserId, supplierId: undefined },
      { id: 'e2' as ExpenseId, title: 'Coffee Bean Order', amountMinor: 35000, date: new Date(new Date().setDate(3)).toISOString(), category: 'Inventory', userId: '1' as UserId, supplierId: 's1' as SupplierId },
  ];

  const sales: Sale[] = [];

  return {
    users,
    products,
    customers,
    suppliers,
    expenses,
    sales,
    categories,
  };
};