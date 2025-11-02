const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  // Database Operations
  dbQuery: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  dbAll: (sql, params) => ipcRenderer.invoke('db:all', sql, params),
  dbRun: (sql, params) => ipcRenderer.invoke('db:run', sql, params),
  dbExport: () => ipcRenderer.invoke('db:export'),
  dbImport: (data) => ipcRenderer.invoke('db:import', data),
  
  // Printing
  print: (data) => ipcRenderer.invoke('print', data),
  
  // App Info
  getAppPath: () => ipcRenderer.invoke('app:getPath'),
})
