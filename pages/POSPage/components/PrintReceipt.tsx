import React, { useEffect, useRef, createContext, useContext } from 'react';
import { Sale, Settings } from '../../../types';

declare const JsBarcode: any;

// Create a dedicated context to pass the 't' function to the print window
const I18nPrintContext = createContext<{ t: (key: string) => string } | undefined>(undefined);
const useI18nPrint = () => {
    const context = useContext(I18nPrintContext);
    if (!context) throw new Error('useI18nPrint must be used within an I18nPrintProvider');
    return context;
};
export const I18nPrintProvider: React.FC<{ children: React.ReactNode; t: (key: string) => string }> = ({ children, t }) => (
    <I18nPrintContext.Provider value={{ t }}>{children}</I18nPrintContext.Provider>
);

/**
 * Generates a Base64 encoded TLV (Tag-Length-Value) string for QR code generation.
 * This is a simplified implementation based on e-invoicing standards (e.g., ZATCA).
 * @param sale - The sale object.
 * @param settings - The store settings.
 * @returns A Base64 string or null if essential data is missing.
 */
const generateQrCodeData = (sale: Sale, settings: Settings): string | null => {
    if (!settings.taxNumber || !settings.storeName) {
        return null;
    }

    const toTlv = (tag: number, value: string): string => {
        const valueBytes = new TextEncoder().encode(value);
        const tagBuffer = [tag];
        const lengthBuffer = [valueBytes.length];
        const buffer = new Uint8Array([...tagBuffer, ...lengthBuffer, ...valueBytes]);
        return String.fromCharCode.apply(null, Array.from(buffer));
    };
    
    // Fix: Use 'totalMinor' and 'taxMinor' and format them as major units for the QR code.
    const tlvString = [
        toTlv(1, settings.storeName),
        toTlv(2, settings.taxNumber),
        toTlv(3, new Date(sale.date).toISOString()),
        toTlv(4, (sale.totalMinor / 100).toFixed(2)),
        toTlv(5, (sale.taxMinor / 100).toFixed(2))
    ].join('');

    // btoa expects a binary string, which we have constructed.
    return btoa(tlvString);
};


/**
 * A self-contained component for rendering and printing a sales receipt.
 * It handles its own printing lifecycle, barcode, and QR code generation.
 */
export const PrintReceipt = ({ sale, settings }: { sale: Sale; settings: Settings }) => {
  const { t } = useI18nPrint();
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const qrCodeData = generateQrCodeData(sale, settings);

  useEffect(() => {
    // Generate barcode
    if (barcodeRef.current && typeof JsBarcode === 'function') {
      try {
        JsBarcode(barcodeRef.current, sale.id, {
          format: 'CODE128',
          displayValue: false,
          height: 40,
          margin: 10,
        });
      } catch (e) {
        console.error('JsBarcode error:', e);
      }
    }
    
    // Trigger print dialog and close window after printing
    const timer = setTimeout(() => window.print(), 300);
    const handleAfterPrint = () => window.close();
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [sale.id]);

  const styles: { [key: string]: React.CSSProperties } = {
    receipt: {
      width: settings.printType === 'thermal' ? '78mm' : '100%',
      fontFamily: settings.printType === 'thermal' ? "'Courier New', monospace" : 'sans-serif',
      fontSize: settings.printType === 'thermal' ? '10px' : '12px',
      padding: settings.printType === 'thermal' ? '5px' : '20px',
      boxSizing: 'border-box'
    },
    header: { textAlign: 'center', marginBottom: '15px' },
    logo: { maxWidth: '150px', maxHeight: '60px', margin: '0 auto 10px' },
    storeName: { fontSize: '1.4em', margin: '0 0 5px' },
    p: { margin: '2px 0' },
    table: { width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '0.95em' },
    th: { textAlign: 'left', padding: '5px', borderBottom: '1px solid black' },
    td: { padding: '4px 5px' },
    totals: { textAlign: 'right', marginTop: '10px' },
    payments: { textAlign: 'left', marginTop: '10px', borderTop: '1px dashed #555', paddingTop: '10px' },
    barcode: { textAlign: 'center', marginTop: '15px' },
  };

  return (
    <div style={styles.receipt}>
      <div style={styles.header}>
        {settings.logoImage && <img src={settings.logoImage} alt="logo" style={styles.logo} />}
        <h2 style={styles.storeName}>{settings.storeName}</h2>
        {settings.storeAddress && <p style={styles.p}>{settings.storeAddress}</p>}
        {settings.storePhone && <p style={styles.p}>{settings.storePhone}</p>}
        {settings.taxNumber && <p style={styles.p}>{t('tax_number')}: {settings.taxNumber}</p>}
      </div>
      
      <div>
        <p><strong>{t('invoice_id')}:</strong> {sale.id}</p>
        <p><strong>{t('date')}:</strong> {new Date(sale.date).toLocaleString()}</p>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>{t('product_name')}</th>
            <th style={{...styles.th, textAlign: 'center'}}>{t('quantity')}</th>
            <th style={{...styles.th, textAlign: 'right'}}>{t('price')}</th>
            <th style={{...styles.th, textAlign: 'right'}}>{t('total')}</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map(item => (
            <tr key={item.id}>
              {/* Fix: Use 'priceMinor' and format currency correctly. */}
              <td style={styles.td}>{item.name}</td>
              <td style={{...styles.td, textAlign: 'center'}}>{item.quantity}</td>
              <td style={{...styles.td, textAlign: 'right'}}>{(item.priceMinor / 100).toFixed(2)}</td>
              <td style={{...styles.td, textAlign: 'right'}}>{((item.priceMinor * item.quantity) / 100).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={styles.totals}>
        {/* Fix: Use '...Minor' properties and 'defaultTaxRatePercent'. */}
        <p><strong>{t('subtotal')}:</strong> {settings.currency}{(sale.subtotalMinor / 100).toFixed(2)}</p>
        <p><strong>{t('discount')}:</strong> -{settings.currency}{(sale.discountMinor / 100).toFixed(2)}</p>
        <p><strong>{t('tax')} ({settings.defaultTaxRatePercent}%):</strong> {settings.currency}{(sale.taxMinor / 100).toFixed(2)}</p>
        <h3 style={{ fontSize: '1.2em' }}><strong>{t('total')}:</strong> {settings.currency}{(sale.totalMinor / 100).toFixed(2)}</h3>
      </div>
      
      <div style={styles.payments}>
        <h4>{t('payments')}:</h4>
        {sale.payments.map((p, index) => (
          // Fix: Use 'amountMinor' and format currency.
          <p key={index} style={styles.p}><strong>{t(p.method)}:</strong> {settings.currency}{(p.amountMinor / 100).toFixed(2)}</p>
        ))}
      </div>

      <div style={styles.barcode}>
        <canvas ref={barcodeRef}></canvas>
      </div>

      {qrCodeData && (
        <div style={{...styles.barcode, marginTop: '10px' }}>
            <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrCodeData)}`}
                alt="QR Code"
                style={{ margin: '0 auto' }}
            />
        </div>
      )}
    </div>
  );
};