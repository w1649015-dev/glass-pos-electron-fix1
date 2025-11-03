/**
 * Tauri API Wrapper
 * Provides a unified interface for communicating with Rust backend
 */

import { invoke } from '@tauri-apps/api/core';

export interface Receipt {
  business_name: string;
  address?: string;
  phone?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

/**
 * Tauri API - Database Operations
 */
export const tauriDB = {
  /**
   * Execute a single query and return one result
   */
  query: async (sql: string, params: any[] = []): Promise<any> => {
    try {
      const result = await invoke('db_query', { 
        sql, 
        params: params.map(p => String(p)) 
      });
      return result;
    } catch (error) {
      console.error('DB Query Error:', error);
      throw error;
    }
  },

  /**
   * Execute a query and return all results
   */
  all: async (sql: string, params: any[] = []): Promise<any[]> => {
    try {
      const result = await invoke('db_all', { 
        sql, 
        params: params.map(p => String(p)) 
      });
      return result as any[];
    } catch (error) {
      console.error('DB All Error:', error);
      throw error;
    }
  },

  /**
   * Execute a command (INSERT, UPDATE, DELETE)
   */
  run: async (sql: string, params: any[] = []): Promise<{ changes: number; lastID: number }> => {
    try {
      const result = await invoke('db_run', { 
        sql, 
        params: params.map(p => String(p)) 
      });
      return result as { changes: number; lastID: number };
    } catch (error) {
      console.error('DB Run Error:', error);
      throw error;
    }
  },

  /**
   * Export database
   */
  export: async (): Promise<string> => {
    try {
      const result = await invoke('db_export');
      return result as string;
    } catch (error) {
      console.error('DB Export Error:', error);
      throw error;
    }
  },

  /**
   * Import database
   */
  import: async (data: string): Promise<string> => {
    try {
      const result = await invoke('db_import', { data });
      return result as string;
    } catch (error) {
      console.error('DB Import Error:', error);
      throw error;
    }
  },
};

/**
 * Tauri API - Printer Operations
 */
export const tauriPrinter = {
  /**
   * Print a receipt
   */
  printReceipt: async (receipt: Receipt): Promise<string> => {
    try {
      console.log('🖨️ Printing receipt via Tauri:', receipt);
      const result = await invoke('print_receipt', { receipt });
      return result as string;
    } catch (error) {
      console.error('Print Error:', error);
      throw error;
    }
  },

  /**
   * Get list of available printers
   */
  getPrinters: async (): Promise<string[]> => {
    try {
      const result = await invoke('get_printers');
      return result as string[];
    } catch (error) {
      console.error('Get Printers Error:', error);
      throw error;
    }
  },

  /**
   * Set default printer
   */
  setDefaultPrinter: async (printerName: string): Promise<string> => {
    try {
      const result = await invoke('set_default_printer', { printerName });
      return result as string;
    } catch (error) {
      console.error('Set Default Printer Error:', error);
      throw error;
    }
  },
};

/**
 * Combined Tauri API
 */
export const tauriAPI = {
  db: tauriDB,
  printer: tauriPrinter,
};

export default tauriAPI;
