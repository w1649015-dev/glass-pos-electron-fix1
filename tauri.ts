// src-tauri/src/tauri.ts - Tauri API Integration
// This file provides safe access to Tauri API with fallback for web development

// Tauri API interface
interface TauriAPI {
  dbQuery: (sql: string, params?: any[]) => Promise<any>;
  dbAll: (sql: string, params?: any[]) => Promise<any[]>;
  dbRun: (sql: string, params?: any[]) => Promise<void>;
  print: (data: any) => Promise<void>;
  getPrinters: () => Promise<any[]>;
  setDefaultPrinter: (printerId: string) => Promise<void>;
  dbExport: () => Promise<string>;
  dbImport: (data: string) => Promise<void>;
}

// Safe invoke function for Tauri
async function invoke<T = any>(command: string, options?: any): Promise<T> {
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke(command, options);
    } catch (error) {
      console.error('Tauri invoke error:', error);
      throw error;
    }
  } else {
    console.warn('Tauri not available, using fallback');
    throw new Error('Tauri not available');
  }
}

// Mock Tauri API for development/fallback
const mockTauriAPI: TauriAPI = {
  async dbQuery(sql: string, params: any[] = []) {
    console.log('📊 Mock DB Query:', sql, params);
    return []; // Return empty array for all queries in mock mode
  },
  
  async dbAll(sql: string, params: any[] = []) {
    console.log('📋 Mock DB All:', sql, params);
    return [];
  },
  
  async dbRun(sql: string, params: any[] = []) {
    console.log('🏃 Mock DB Run:', sql, params);
    // Simulate successful execution
    await new Promise(resolve => setTimeout(resolve, 100));
  },
  
  async print(data: any) {
    console.log('🖨️ Mock Print:', data);
  },
  
  async getPrinters() {
    console.log('🖨️ Mock Get Printers');
    return [{ id: 'mock-printer', name: 'Mock Printer' }];
  },
  
  async setDefaultPrinter(printerId: string) {
    console.log('🖨️ Mock Set Printer:', printerId);
  },
  
  async dbExport() {
    console.log('💾 Mock DB Export');
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: 'mock export data'
    });
  },
  
  async dbImport(data: string) {
    console.log('💾 Mock DB Import:', data);
  }
};

// Real Tauri API implementation
const realTauriAPI: TauriAPI = {
  async dbQuery(sql: string, params: any[] = []) {
    return await invoke('db_query', { sql, params });
  },
  
  async dbAll(sql: string, params: any[] = []) {
    return await invoke('db_all', { sql, params });
  },
  
  async dbRun(sql: string, params: any[] = []) {
    return await invoke('db_run', { sql, params });
  },
  
  async print(data: any) {
    return await invoke('print_receipt', { receipt: data });
  },
  
  async getPrinters() {
    return await invoke('get_printers');
  },
  
  async setDefaultPrinter(printerId: string) {
    return await invoke('set_default_printer', { printerId });
  },
  
  async dbExport() {
    return await invoke('db_export');
  },
  
  async dbImport(data: string) {
    return await invoke('db_import', { data });
  }
};

// Export the appropriate API based on environment
export const tauriAPI: TauriAPI = (typeof window !== 'undefined' && (window as any).__TAURI__)
  ? realTauriAPI
  : mockTauriAPI;

// Export individual functions for convenience
export const {
  dbQuery,
  dbAll,
  dbRun,
  print,
  getPrinters,
  setDefaultPrinter,
  dbExport,
  dbImport
} = tauriAPI;

// Helper functions
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && (window as any).__TAURI__;
};

export const assertTauriEnvironment = (): void => {
  if (!isTauriEnvironment()) {
    throw new Error('This function requires Tauri environment');
  }
};