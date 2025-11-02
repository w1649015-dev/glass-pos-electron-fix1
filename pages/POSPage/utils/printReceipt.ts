import React from 'react';
import ReactDOM from 'react-dom/client';
import { Sale, Settings } from '../../../types';
import { PrintReceipt, I18nPrintProvider } from '../components/PrintReceipt';

/**
 * Opens a new browser window and renders a receipt component for printing.
 * @param sale - The sale data to be printed.
 * @param settings - The application settings.
 * @param t - The translation function.
 */
export const printReceipt = (sale: Sale, settings: Settings, t: (key: string) => string) => {
  const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
  
  if (printWindow) {
    printWindow.document.write('<html><head><title>Print Receipt</title></head><body><div id="print-root"></div></body></html>');
    printWindow.document.close();
    
    const printRootEl = printWindow.document.getElementById('print-root');
    if (printRootEl) {
      const root = ReactDOM.createRoot(printRootEl);
      // Fix: Moved children into the props object to satisfy the component's required 'children' prop type.
      root.render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(
            I18nPrintProvider,
            { t, children: React.createElement(PrintReceipt, { sale, settings }) }
          )
        )
      );
    }
  } else {
    alert('Please allow pop-ups for this website to print receipts.');
  }
};