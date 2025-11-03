const PrinterManager = require('../printer');

// Mock Electron modules
jest.mock('electron', () => ({
  BrowserWindow: jest.fn().mockImplementation(() => ({
    show: false,
    webContents: {
      on: jest.fn(),
      once: jest.fn(),
      printToPDF: jest.fn().mockResolvedValue(Buffer.from('fake-pdf-data'))
    },
    on: jest.fn(),
    close: jest.fn(),
    isDestroyed: jest.fn().mockReturnValue(false),
    loadFile: jest.fn().mockResolvedValue()
  })),
  ipcMain: {
    handle: jest.fn()
  }
}));

// Mock fs and other modules
jest.mock('fs');
jest.mock('child_process');

const fs = require('fs');
const { exec } = require('child_process');

describe('PrinterManager', () => {
  let printerManager;

  beforeEach(() => {
    printerManager = new PrinterManager();
    jest.clearAllMocks();
    
    // Mock fs functions
    fs.writeFileSync = jest.fn();
    fs.unlinkSync = jest.fn();
    
    // Mock exec for print command
    exec.mockImplementation((command, options, callback) => {
      // Simulate successful print
      callback(null, 'request id is printer-1 (1 file(s))', '');
      return { on: jest.fn() };
    });
  });

  afterEach(() => {
    if (printerManager) {
      printerManager.cleanup();
    }
  });

  test('should initialize PrinterManager with correct properties', () => {
    expect(printerManager.thermalWidth).toBe(48);
    expect(printerManager.defaultPrinter).toBeNull();
    expect(printerManager.printWindow).toBeNull();
    expect(printerManager.isProcessing).toBe(false);
  });

  test('should prevent concurrent printing', async () => {
    printerManager.isProcessing = true;
    
    const testData = {
      businessName: 'Test Store',
      items: [{ name: 'Test Item', price: 10, quantity: 1 }],
      total: 10
    };

    await expect(printerManager.printReceipt(null, testData))
      .rejects
      .toThrow('طباعة أخرى قيد التشغيل، انتظر لحظة');
  });

  test('should format receipt content correctly', () => {
    const testData = {
      businessName: 'Test Store',
      address: '123 Test St',
      phone: '123-456-7890',
      items: [
        { name: 'Test Item 1', price: 10, quantity: 2 },
        { name: 'Test Item 2', price: 5, quantity: 1 }
      ],
      subtotal: 25,
      tax: 2.5,
      total: 27.5,
      currency: '$',
      id: 'TEST-001'
    };

    const content = printerManager.formatReceiptContent(testData);
    
    expect(content).toContain('Test Store');
    expect(content).toContain('123 Test St');
    expect(content).toContain('123-456-7890');
    expect(content).toContain('Test Item 1');
    expect(content).toContain('Test Item 2');
    expect(content).toContain('$27.50');
    expect(content).toContain('TEST-001');
  });

  test('should cleanup resources properly', () => {
    const mockWindow = {
      close: jest.fn(),
      isDestroyed: jest.fn().mockReturnValue(false)
    };
    
    printerManager.printWindow = mockWindow;
    printerManager.isProcessing = true;
    printerManager.windowCleanupTimeout = setTimeout(() => {}, 1000);

    printerManager.cleanup();

    expect(mockWindow.close).toHaveBeenCalled();
    expect(printerManager.printWindow).toBeNull();
    expect(printerManager.isProcessing).toBe(false);
  });

  test('should handle print window creation', async () => {
    await printerManager.initializePrintWindow();
    
    expect(printerManager.printWindow).toBeDefined();
    expect(printerManager.printWindow.webContents.on).toHaveBeenCalledWith('crashed', expect.any(Function));
  });

  test('should setup IPC handlers correctly', () => {
    const { ipcMain } = require('electron');
    const mockMainWindow = {};
    
    printerManager.setupHandlers(mockMainWindow);
    
    expect(ipcMain.handle).toHaveBeenCalledWith('print', expect.any(Function));
  });
});