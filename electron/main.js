const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron')
const path = require('path')
const EnhancedDatabase = require('./enhanced-database')
const DatabaseMigration = require('./database-migration')
const PrinterManager = require('./printer')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !fs.existsSync(path.join(__dirname, '../dist'))

let mainWindow
let db
let dbMigration
let printerManager

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
    },
  })

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../dist/index.html')}`

  mainWindow.loadURL(startUrl)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}
// إضافة هذه الـ flags قبل app.on('ready')
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-software-rasterizer'); 
app.commandLine.appendSwitch('--no-sandbox');
app.commandLine.appendSwitch('--disable-dev-shm-usage');
app.on('ready', async () => {
  try {
    db = new EnhancedDatabase();
    await db.initialize();
    printerManager = new PrinterManager();
    createWindow();
    printerManager.setupHandlers(mainWindow);
    createMenu();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    app.quit();
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// Database IPC Handlers
ipcMain.handle('db:query', async (event, sql, params) => {
  try {
    return await db.db.getAsync(sql, params || []);
  } catch (error) {
    console.error('DB Query Error:', error)
    throw error
  }
})

ipcMain.handle('db:all', async (event, sql, params) => {
  try {
    return await db.db.allAsync(sql, params || []);
  } catch (error) {
    console.error('DB All Error:', error)
    throw error
  }
})

ipcMain.handle('db:run', async (event, sql, params) => {
  try {
    const result = await db.db.runAsync(sql, params || []);
    return { changes: result?.changes, lastID: result?.lastID };
  } catch (error) {
    console.error('DB Run Error:', error)
    throw error
  }
})

ipcMain.handle('db:export', () => {
  try {
    return db.exportData()
  } catch (error) {
    console.error('DB Export Error:', error)
    throw error
  }
})

ipcMain.handle('db:import', (event, data) => {
  try {
    db.importData(data)
    return { success: true }
  } catch (error) {
    console.error('DB Import Error:', error)
    throw error
  }
})

ipcMain.handle('app:getPath', () => {
  return app.getPath('userData')
})

// Menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Point of Sale System',
              message: 'Glass POS v1.0.0',
              detail: 'A modern point of sale system',
            })
          },
        },
      ],
    },
  ]

  if (isDev) {
    template.push({
      label: 'Developer',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
      ],
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Handle Squirrel on Windows
try {
  require('electron-squirrel-startup')
} catch (e) {
  // Ignored
}
