// src/types.ts
/**
 * Centralized domain types for POS application
 * Enhanced: Added Product Categories with hierarchy support.
 */

type Brand<K, T> = K & { __brand: T };

// ============================
// Strongly-typed ID aliases
// ============================

export type UserId = Brand<string, 'UserId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type CategoryId = Brand<string, 'CategoryId'>;
export type CustomerId = Brand<string, 'CustomerId'>;
export type SupplierId = Brand<string, 'SupplierId'>;
export type SaleId = Brand<string, 'SaleId'>;
export type ShiftId = Brand<string, 'ShiftId'>;
export type ExpenseId = Brand<string, 'ExpenseId'>;
export type InvoiceId = Brand<string, 'InvoiceId'>;


// ============================
// Enums & Fixed Value Types
// ============================

export enum UserRole {
  ADMIN = 'admin',
  CASHIER = 'cashier',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
}

export enum ShiftStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export type PrintType = 'receipt' | 'thermal' | 'a4' | 'invoice';
export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

// ============================
// Core Entities
// ============================

export interface User {
  readonly id: UserId;
  username: string;
  passwordHash: string;
  role: UserRole;
}

export interface Category {
  readonly id: CategoryId;
  name: string;
  description?: string;
  parentId?: CategoryId | null;
  readonly image?: string;
  sortOrder?: number;
  isActive?: boolean;
  readonly createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  readonly id: ProductId;
  name: string;
  sku?: string;
  priceMinor: number;
  stock: number;
  lowStockThreshold?: number;
  categoryId?: CategoryId;
  barcode?: string;
  image?: string;
  supplierId?: SupplierId;
  description?: string;
  isActive?: boolean;
  readonly createdAt?: string;
  updatedAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
}


export interface Customer {
  readonly id: CustomerId;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  readonly createdAt?: string;
}

export interface Supplier {
  readonly id: SupplierId;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  readonly createdAt?: string;
}

export interface Expense {
  readonly id: ExpenseId;
  title: string;
  amountMinor: number;
  date: string;
  category?: string;
  userId: UserId;
  supplierId?: SupplierId;
  notes?: string;
}

export interface PaymentDetail {
  readonly method: PaymentMethod;
  readonly amountMinor: number;
  readonly note?: string;
  readonly transactionRef?: string;
}

export interface Sale {
  readonly id: SaleId;
  readonly items: CartItem[];
  readonly subtotalMinor: number;
  readonly taxMinor: number;
  readonly discountMinor: number;
  readonly totalMinor: number;
  readonly payments: PaymentDetail[];
  readonly date: string;
  readonly userId: UserId;
  readonly customerId?: CustomerId;
  readonly shiftId?: ShiftId;
  readonly metadata?: Record<string, unknown>;
}

/** ✅ NEW: Invoice Type */
export interface Invoice {
  readonly id: InvoiceId;
  readonly saleId: SaleId;
  readonly invoiceNumber: string;
  readonly issueDate: string;
  readonly dueDate?: string;
  readonly totalMinor: number;
  readonly status: 'draft' | 'issued' | 'paid' | 'cancelled';
  readonly notes?: string;
  readonly customerId?: CustomerId;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface Shift {
  readonly id: ShiftId;
  readonly userId: UserId;
  readonly startTime: string;
  readonly endTime?: string;
  readonly openingBalanceMinor: number;
  closingBalanceMinor?: number;
  readonly cashSalesMinor: number;
  readonly cardSalesMinor: number;
  readonly totalSalesMinor: number;
  status: ShiftStatus;
  readonly salesIds: SaleId[];
}

export interface Settings {
  storeName: string;
  currency: string;
  defaultTaxRatePercent: number;
  printType: PrintType;
  language: Language;
  theme: Theme;
  categoriesEnabled?: boolean;
  defaultCategoryId?: CategoryId;
  taxNumber?: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  storeWebsite?: string;
  logoImage?: string;
  autoPrintReceipt?: boolean;
}

export interface Totals {
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
}