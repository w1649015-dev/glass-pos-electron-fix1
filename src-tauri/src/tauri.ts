import { invoke } from '@tauri-apps/api/core';

export const tauriAPI = {
  // Database operations
  dbQuery: async (sql: string, params: any[]) => {
    return await invoke('db_query', { sql, params });
  },
  
  dbAll: async (sql: string, params: any[]) => {
    return await invoke('db_all', { sql, params });
  },
  
  dbRun: async (sql: string, params: any[]) => {
    return await invoke('db_run', { sql, params });
  },
  
  // Printer operations  
  print: async (data: any) => {
    return await invoke('print_receipt', { receipt: data });
  },
  
  getPrinters: async () => {
    return await invoke('get_printers');
  },
  
  // Export/Import
  dbExport: async () => {
    return await invoke('db_export');
  },
  
  dbImport: async (data: string) => {
    return await invoke('db_import', { data });
  },
};