const { BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');

class PrinterManager {
  constructor() {
    this.thermalWidth = 48; // default line width for thermal printer
    this.defaultPrinter = null; // ضع هنا اسم الطابعة الافتراضية لو عندك مثلاً: "EPSON-TM-T20"
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

  async printReceipt(mainWindow, data) {
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: { sandbox: false }
    });

    try {
      const content = this.formatReceiptContent(data);
      const htmlFile = path.join(os.tmpdir(), `receipt_${Date.now()}.html`);
      fs.writeFileSync(htmlFile, content, 'utf8');

      await printWindow.loadFile(htmlFile);

      const pdfPath = path.join(os.tmpdir(), `receipt_${Date.now()}.pdf`);
      const pdfData = await printWindow.webContents.printToPDF({
        marginsType: 1,
        pageSize: { width: 80000, height: 297000 },
        printBackground: true
      });

      fs.writeFileSync(pdfPath, pdfData);
      console.log(`🖨️ PDF saved at: ${pdfPath}`);

      // نغلق النافذة بعد التأكد من حفظ الملف
      setTimeout(() => {
        if (!printWindow.isDestroyed()) printWindow.destroy();
      }, 1000);

      // إذا عندك طابعة محددة، غيّر هنا
      const lpCommand = this.defaultPrinter
        ? `lp -d "${this.defaultPrinter}" "${pdfPath}"`
        : `lp "${pdfPath}"`;

      return await new Promise((resolve, reject) => {
        exec(lpCommand, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Print failed:', stderr || error);
            reject(new Error(stderr || error.message));
          } else {
            console.log('✅ Printed successfully:', stdout);
            resolve(true);
          }
        });
      });

    } catch (error) {
      console.error('🔥 Printing error:', error);
      if (!printWindow.isDestroyed()) printWindow.destroy();
      throw error;
    }
  }
}

module.exports = PrinterManager;

