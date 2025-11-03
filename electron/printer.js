const { BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');

class PrinterManager {
  constructor() {
    this.thermalWidth = 48; // default line width for thermal printer
    this.defaultPrinter = null; // ضع هنا اسم الطابعة الافتراضية لو عندك مثلاً: "EPSON-TM-T20"
    this.printWindow = null; // نافذة واحدة مُعاد استخدامها
    this.isProcessing = false; // منع الطباعة المتزامنة
    this.windowCleanupTimeout = null; // للتحكم بإغلاق النافذة
  }

  setupHandlers(mainWindow) {
    ipcMain.handle('print', async (event, data) => {
      try {
        const result = await this.printReceipt(mainWindow, data);
        return { success: true, result };
      } catch (error) {
        console.error('❌ Print failed:', error);
        return { success: false, error: error.message };
      }
    });
  }

  formatReceiptContent(data) {
    const {
      businessName,
      address,
      phone,
      items = [],
      subtotal = 0,
      tax = 0,
      discount = 0,
      total = 0,
      currency = '',
      date = new Date().toISOString(),
      id = '0000'
    } = data;

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: "Arial", sans-serif;
            font-size: 12px;
            width: 80mm;
            padding: 4mm;
            margin: 0;
            direction: rtl;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 4px; }
          th, td { text-align: right; padding: 2px 0; }
          .totals div { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="center bold">
          <h2>${businessName || 'Glass POS'}</h2>
          ${address ? `<div>${address}</div>` : ''}
          ${phone ? `<div>📞 ${phone}</div>` : ''}
        </div>
        <hr/>
        <div>
          <div>📅 التاريخ: ${new Date(date).toLocaleString()}</div>
          <div>🧾 رقم الفاتورة: ${id}</div>
        </div>
        <hr/>
        <table>
          <thead>
            <tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${currency}${item.price.toFixed(2)}</td>
                <td>${currency}${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr/>
        <div class="totals">
          <div><span>المجموع الفرعي:</span><span>${currency}${subtotal.toFixed(2)}</span></div>
          ${discount > 0 ? `<div><span>الخصم:</span><span>- ${currency}${discount.toFixed(2)}</span></div>` : ''}
          <div><span>الضريبة:</span><span>${currency}${tax.toFixed(2)}</span></div>
          <div class="bold"><span>الإجمالي:</span><span>${currency}${total.toFixed(2)}</span></div>
        </div>
        <hr/>
        <div class="center">
          <p>شكراً لتسوقكم معنا ❤️</p>
        </div>
      </body>
      </html>
    `;
  }

  async initializePrintWindow() {
    if (!this.printWindow || this.printWindow.isDestroyed()) {
      console.log('🔧 Creating new print window');
      this.printWindow = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        webPreferences: {
          sandbox: false,
          contextIsolation: false,
          nodeIntegration: true,
          backgroundThrottling: false
        }
      });

      // إضافة error handlers
      this.printWindow.webContents.on('crashed', () => {
        console.error('❌ Print window crashed');
        this.printWindow = null;
      });

      this.printWindow.on('closed', () => {
        console.log('🚪 Print window closed');
        this.printWindow = null;
      });
    }
  }

  async cleanupPrintWindow() {
    if (this.windowCleanupTimeout) {
      clearTimeout(this.windowCleanupTimeout);
    }

    this.windowCleanupTimeout = setTimeout(() => {
      if (this.printWindow && !this.printWindow.isDestroyed()) {
        console.log('🧹 Cleaning up print window');
        try {
          this.printWindow.close();
        } catch (error) {
          console.error('Error closing print window:', error);
        }
        this.printWindow = null;
      }
    }, 3000); // 3 ثواني لضمان انتهاء الطباعة
  }

  async printReceipt(mainWindow, data) {
    // منع الطباعة المتزامنة
    if (this.isProcessing) {
      throw new Error('طباعة أخرى قيد التشغيل، انتظر لحظة');
    }

    this.isProcessing = true;
    
    try {
      console.log('🖨️ Starting print process...');
      
      // إنشاء أو استخدام نافذة الطباعة
      await this.initializePrintWindow();

      const content = this.formatReceiptContent(data);
      const timestamp = Date.now();
      const htmlFile = path.join(os.tmpdir(), `receipt_${timestamp}.html`);
      
      // كتابة الملف مع error handling
      try {
        fs.writeFileSync(htmlFile, content, 'utf8');
      } catch (writeError) {
        throw new Error(`فشل في إنشاء ملف HTML: ${writeError.message}`);
      }

      // تحميل الملف
      await this.printWindow.loadFile(htmlFile);
      
      // انتظار حتى يتم تحميل المحتوى بالكامل
      await new Promise(resolve => {
        this.printWindow.webContents.once('did-finish-load', resolve);
      });

      //const pdfPath = path.join(os.tmpdir(), `receipt_${timestamp}.pdf`);
      
      // إنشاء PDF مع error handling محسّن
      const pdfData = await this.printWindow.webContents.printToPDF({
        marginsType: 1,
        pageSize: { width: 80000, height: 297000 },
        printBackground: true,
        landscape: false
      });

      fs.writeFileSync(pdfPath, pdfData);
      console.log(`📄 PDF saved at: ${pdfPath}`);

      // تنظيف الملف HTML
      try {
        fs.unlinkSync(htmlFile);
      } catch (unlinkError) {
        console.warn('تحذير: لم يتم حذف ملف HTML:', unlinkError.message);
      }

      // طباعة بطريقة آمنة
      const printResult = await this.safePrint(pdfPath);
      
      // تنظيف نافذة الطباعة بعد الانتهاء
      this.cleanupPrintWindow();
      
      return printResult;

    } catch (error) {
      console.error('🔥 Printing error:', error);
      throw new Error(`فشل في الطباعة: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  async safePrint(pdfPath) {
    return new Promise((resolve, reject) => {
      // تحديد طابعة افتراضية أو الطابعة المحددة
      const lpCommand = this.defaultPrinter
        ? `lp -d "${this.defaultPrinter}" "${pdfPath}"`
        : `lp "${pdfPath}"`;

      console.log(`📨 Executing print command: ${lpCommand}`);

      const childProcess = exec(lpCommand, { timeout: 10000 }, (error, stdout, stderr) => {
        // حذف ملف PDF بعد الطباعة
        try {
          fs.unlinkSync(pdfPath);
        } catch (unlinkError) {
          console.warn('تحذير: لم يتم حذف ملف PDF:', unlinkError.message);
        }

        if (error) {
          console.error('❌ Print command failed:', stderr || error.message);
          reject(new Error(`فشل في إرسال للطابعة: ${stderr || error.message}`));
        } else {
          console.log('✅ Print command successful:', stdout.trim());
          resolve({
            success: true,
            output: stdout.trim(),
            printer: this.defaultPrinter || 'default'
          });
        }
      });

      // timeout للعملية
      childProcess.on('error', (error) => {
        console.error('❌ Process error:', error);
        reject(new Error(`خطأ في العملية: ${error.message}`));
      });
    });
  }

  // cleanup method للاستدعاء عند إغلاق التطبيق
  cleanup() {
    console.log('🧹 Cleaning up PrinterManager...');
    
    if (this.windowCleanupTimeout) {
      clearTimeout(this.windowCleanupTimeout);
      this.windowCleanupTimeout = null;
    }

    if (this.printWindow && !this.printWindow.isDestroyed()) {
      try {
        this.printWindow.close();
      } catch (error) {
        console.error('Error during PrinterManager cleanup:', error);
      }
      this.printWindow = null;
    }
    
    this.isProcessing = false;
  }
}

module.exports = PrinterManager;