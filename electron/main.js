const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron')
const path = require('path')
const EnhancedDatabase = require('./enhanced-database')
const DatabaseMigration = require('./database-migration')
const PrinterManager = require('./printer')
const fs = require('fs')

// Force production mode since dist exists
const isDev = false

// Add critical GPU and sandbox flags to prevent segfault
app.commandLine.appendSwitch('--disable-gpu-sandbox')
app.commandLine.appendSwitch('--disable-software-rasterizer')
app.commandLine.appendSwitch('--no-sandbox')
app.commandLine.appendSwitch('--disable-dev-shm-usage')
app.commandLine.appendSwitch('--disable-web-security')

// Additional Ubuntu compatibility flags
app.commandLine.appendSwitch('--disable-seccomp-filter-sandbox')
app.commandLine.appendSwitch('--disable-setuid-sandbox')
app.commandLine.appendSwitch('--disable-namespace-sandbox')
app.commandLine.appendSwitch('--disable-zygote')
app.commandLine.appendSwitch('--no-zygote')
app.commandLine.appendSwitch('--disable-background-timer-throttling')
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows')
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor')

// Fix SIGTRAP debugging issues
app.commandLine.appendSwitch('--disable-breakpad')
app.commandLine.appendSwitch('--disable-crash-reporter')
app.commandLine.appendSwitch('--disable-gpu-process-crash-limit')
app.commandLine.appendSwitch('--disable-renderer-backgrounding')
app.commandLine.appendSwitch('--disable-background-networking')
app.commandLine.appendSwitch('--disable-default-apps')
app.commandLine.appendSwitch('--disable-extensions')
app.commandLine.appendSwitch('--disable-plugins')
app.commandLine.appendSwitch('--disable-sync')
app.commandLine.appendSwitch('--disable-translate')
app.commandLine.appendSwitch('--disable-ipc-flooding-protection')

// Process isolation alternatives (instead of single-process)
app.commandLine.appendSwitch('--max_old_space_size=4096')
app.commandLine.appendSwitch('--js-flags="--max-old-space-size=4096"')

// Fix GL surface presentation issues
app.commandLine.appendSwitch('--disable-gpu')
app.commandLine.appendSwitch('--disable-hardware-acceleration')
app.commandLine.appendSwitch('--disable-gpu-compositing')
app.commandLine.appendSwitch('--disable-gpu-rasterization')
app.commandLine.appendSwitch('--disable-gpu-memory-buffer-compositor-resources')
app.commandLine.appendSwitch('--disable-gpu-memory-buffer-video-frames')

// Fix /tmp directory access issues
const os = require('os')
const tempDir = process.env.TMPDIR || process.env.TMP || process.env.TEMP || os.tmpdir() || '/tmp'
app.commandLine.appendSwitch('--user-data-dir', path.join(tempDir, 'glass-pos-electron'))
app.commandLine.appendSwitch('--disk-cache-dir', path.join(tempDir, 'glass-pos-cache'))

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
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
  })

  // Add Content Security Policy - more permissive for development
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; " +
          "style-src 'self' 'unsafe-inline' https: data:; " +
          "font-src 'self' 'unsafe-inline' https: data:; " +
          "img-src 'self' data: blob: https:; " +
          "connect-src 'self' https: wss: data:; " +
          "media-src 'self' blob: data:;"
        ]
      }
    })
  })

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../dist/index.html')}`

  console.log(`🚀 Loading URL: ${startUrl}`)
  console.log(`📁 Dist exists: ${fs.existsSync(path.join(__dirname, '../dist/index.html'))}`)

  mainWindow.loadURL(startUrl)

  // Show window when ready to prevent white screen
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    console.log('✅ Window shown successfully')
  })

  // Error handling for loading
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`❌ Failed to load ${validatedURL}: ${errorDescription}`)
    
    // If development server fails, try to build and load dist
    if (validatedURL.includes('localhost:3000')) {
      console.log('🔄 Development server not running, switching to production build...')
      const distUrl = `file://${path.join(__dirname, '../dist/index.html')}`
      mainWindow.loadURL(distUrl)
    }
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully')
  })

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

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
  console.log('🚪 All windows closed, cleaning up...')
  
  // تنظيف شامل قبل الإغلاق
  if (printerManager) {
    try {
      printerManager.cleanup();
      console.log('✅ PrinterManager cleaned up')
    } catch (error) {
      console.error('❌ Error cleaning PrinterManager:', error)
    }
  }
  
  if (db && db.db) {
    try {
      db.db.close();
      console.log('✅ Database closed')
    } catch (error) {
      console.error('❌ Error closing database:', error)
    }
  }
  
  // Force cleanup of any remaining resources
  setTimeout(() => {
    if (process.platform !== 'darwin') {
      console.log('🔚 Exiting application...')
      process.exit(0)
    }
  }, 500)
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('before-quit', (event) => {
  console.log('🛑 Before quit event triggered')
  
  // منع الإغلاق المباشر للسماح بالتنظيف
  event.preventDefault()
  
  // تنظيف سريع
  if (printerManager) {
    try {
      printerManager.cleanup()
    } catch (error) {
      console.error('Error in before-quit cleanup:', error)
    }
  }
  
  // إغلاق آمن بعد تأخير قصير
  setTimeout(() => {
    app.exit(0)
  }, 200)
})

// إضافة معالج للإشارات
process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...')
  
  if (printerManager) {
    printerManager.cleanup()
  }
  
  if (db && db.db) {
    try {
      db.db.close()
    } catch (error) {
      console.error('Error closing database on SIGINT:', error)
    }
  }
  
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...')
  
  if (printerManager) {
    printerManager.cleanup()
  }
  
  process.exit(0)
})

// باقي الكود (IPC, Menu, etc.) كما هو...

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