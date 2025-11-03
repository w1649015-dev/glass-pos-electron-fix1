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
export const printReceipt = async (sale: Sale, settings: Settings, t: (key: string) => string) => {
  try {
    // Try to open the window in response to a user action
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes,noopener=yes');
    
    if (!printWindow) {
      throw new Error('popup_blocked');
    }

    // Set up the print window with required content
    // Set up translations in the print window
    const translations = {
      popup_blocked_message: t('popup_blocked_message'),
      print_error: t('print_error'),
      print_receipt: t('print_receipt')
    };
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('print_receipt')}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script>
            window.translations = ${JSON.stringify(translations)};
            window.t = function(key) {
              return window.translations[key] || key;
            };
          </script>
        </head>
        <body><div id="print-root"></div></body>
      </html>
    `);
    printWindow.document.close();
    
    const printRootEl = printWindow.document.getElementById('print-root');
    if (!printRootEl) {
      throw new Error('print_root_not_found');
    }
    
    const root = ReactDOM.createRoot(printRootEl);
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
  } catch (error: any) {
    if (error.message === 'popup_blocked') {
      alert(t('popup_blocked_message'));
    } else if (error.message === 'print_root_not_found') {
      console.error('Print window initialization error');
      alert(t('print_error'));
    } else {
      console.error('Print error:', error);
      alert(t('print_error'));
    }
  }
};