import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
// Fix: Add SaleId to imports for type safety.
import { Sale, Settings, CartItem, Customer, User, SaleId } from '../types';
import GlassCard from '../components/ui/GlassCard';
import NeuButton from '../components/ui/NeuButton';
import { useAuth } from '../contexts/AuthContext';

// Declare JsBarcode for TypeScript
declare const JsBarcode: any;

// Create a dedicated context for the print window
const I18nPrintContext = React.createContext<{ t: (key: string) => string } | undefined>(undefined);

// A custom hook to use the print-specific i18n context
function useI18nPrint() {
    const context = React.useContext(I18nPrintContext);
    if (!context) {
        throw new Error('useI18nPrint must be used within an I18nPrintProvider');
    }
    return context;
}

// The provider that will be used in the print window
const I18nPrintProvider: React.FC<{ children: React.ReactNode; t: (key: string) => string }> = ({ children, t }) => {
    return <I18nPrintContext.Provider value={{ t }}>{children}</I18nPrintContext.Provider>;
};

// A self-contained component for rendering and printing the receipt
const PrintReceipt = ({ sale, settings }: { sale: Sale, settings: Settings }) => {
    const { t } = useI18nPrint();
    const barcodeRef = React.useRef(null);

    useEffect(() => {
        if (barcodeRef.current) {
            try {
                JsBarcode(barcodeRef.current, sale.id, {
                    format: "CODE128",
                    displayValue: false,
                    height: 50,
                    margin: 10,
                });
            } catch (e) {
                console.error("JsBarcode error:", e);
            }
        }

        // Use a timeout to ensure the content is rendered before printing
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        
        window.onafterprint = () => window.close();

        return () => {
            clearTimeout(timer);
        };
    }, [sale.id]);

    const receiptStyle: React.CSSProperties = settings.printType === 'thermal'
        ? { width: '80mm', fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', padding: '10px' }
        : { width: '100%', fontFamily: "sans-serif", padding: '20px' };
    
    return (
        <div style={receiptStyle}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {settings.logoImage && <img src={settings.logoImage} alt="logo" style={{ maxWidth: '150px', maxHeight: '80px', margin: '0 auto' }} />}
                <h2 style={{ fontSize: '1.5em', margin: '10px 0 5px' }}>{settings.storeName}</h2>
                {settings.storeAddress && <p style={{ margin: 0 }}>{settings.storeAddress}</p>}
                {settings.storePhone && <p style={{ margin: 0 }}>{settings.storePhone}</p>}
                {settings.taxNumber && <p style={{ margin: 0 }}>{t('tax_number')}: {settings.taxNumber}</p>}
            </div>
            <div style={{ marginBottom: '20px' }}>
                <p><strong>{t('invoice_id')}:</strong> {sale.id}</p>
                <p><strong>{t('date')}:</strong> {new Date(sale.date).toLocaleString()}</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid black' }}>
                        <th style={{ textAlign: 'left', padding: '5px' }}>{t('product_name')}</th>
                        <th style={{ textAlign: 'center', padding: '5px' }}>{t('quantity')}</th>
                        <th style={{ textAlign: 'right', padding: '5px' }}>{t('price')}</th>
                        <th style={{ textAlign: 'right', padding: '5px' }}>{t('total')}</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map(item => (
                        <tr key={item.id}>
                            {/* Fix: Use 'priceMinor' and format currency correctly. */}
                            <td style={{ padding: '5px' }}>{item.name}</td>
                            <td style={{ textAlign: 'center', padding: '5px' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '5px' }}>{settings.currency}{(item.priceMinor / 100).toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '5px' }}>{settings.currency}{((item.priceMinor * item.quantity) / 100).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ textAlign: 'right' }}>
                {/* Fix: Use '...Minor' properties and 'defaultTaxRatePercent'. */}
                <p><strong>{t('subtotal')}:</strong> {settings.currency}{(sale.subtotalMinor / 100).toFixed(2)}</p>
                <p><strong>{t('discount')}:</strong> -{settings.currency}{(sale.discountMinor / 100).toFixed(2)}</p>
                <p><strong>{t('tax')} ({settings.defaultTaxRatePercent}%):</strong> {settings.currency}{(sale.taxMinor / 100).toFixed(2)}</p>
                <h3 style={{ fontSize: '1.2em' }}><strong>{t('total')}:</strong> {settings.currency}{(sale.totalMinor / 100).toFixed(2)}</h3>
            </div>
             <div style={{ textAlign: 'left', marginTop: '10px', borderTop: '1px dashed black', paddingTop: '10px' }}>
                <h4>{t('payments')}:</h4>
                {sale.payments.map((p, index) => (
                    // Fix: Use 'amountMinor' and format currency.
                    <p key={index} style={{margin: '2px 0'}}><strong>{t(p.method)}:</strong> {settings.currency}{(p.amountMinor / 100).toFixed(2)}</p>
                ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <canvas ref={barcodeRef}></canvas>
            </div>
        </div>
    );
};

// Helper to open a new window and render the receipt for printing
const printReceipt = (sale: Sale, settings: Settings, t: (key: string) => string) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Print Receipt</title></head><body><div id="print-root"></div></body></html>');
        printWindow.document.close();
        const printRootEl = printWindow.document.getElementById('print-root');
        if (printRootEl) {
            const root = ReactDOM.createRoot(printRootEl);
            root.render(
              <React.StrictMode>
                <I18nPrintProvider t={t}>
                  <PrintReceipt sale={sale} settings={settings} />
                </I18nPrintProvider>
              </React.StrictMode>
            );
        }
    }
};

const SaleDetailsModal = ({ sale, onClose, onPrint }: { sale: Sale, onClose: () => void, onPrint: () => void }) => {
    const { t } = useI18n();
    const { settings } = useSettings();
    const { customers, users } = useData();

    const customer = customers.find(c => c.id === sale.customerId);
    const user = users.find(u => u.id === sale.userId);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <GlassCard className="w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">{t('sale_details')}</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <p><strong>{t('invoice_id')}:</strong> {sale.id}</p>
                    <p><strong>{t('date')}:</strong> {new Date(sale.date).toLocaleString()}</p>
                    <p><strong>{t('customer')}:</strong> {customer?.name || t('none')}</p>
                    <p><strong>{t('user')}:</strong> {user?.username || 'N/A'}</p>
                </div>
                
                <div className="max-h-60 overflow-y-auto border-y border-white/20 my-4 py-2">
                    {sale.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center mb-2 p-2">
                            {/* Fix: Use 'priceMinor' and format currency. */}
                            <span>{item.name} x {item.quantity}</span>
                            <span>{settings.currency}{((item.priceMinor * item.quantity) / 100).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                
                <div className="flex justify-between">
                    <div>
                        <h4 className="font-bold">{t('payments')}</h4>
                        {sale.payments.map((p, i) => (
                             // Fix: Use 'amountMinor' and format currency.
                             <p key={i}>{t(p.method)}: {settings.currency}{(p.amountMinor / 100).toFixed(2)}</p>
                        ))}
                    </div>
                    <div className="text-right">
                        {/* Fix: Use '...Minor' properties and format currency. */}
                        <p>{t('subtotal')}: {settings.currency}{(sale.subtotalMinor / 100).toFixed(2)}</p>
                        <p>{t('discount')}: -{settings.currency}{(sale.discountMinor / 100).toFixed(2)}</p>
                        <p>{t('tax')}: {settings.currency}{(sale.taxMinor / 100).toFixed(2)}</p>
                        <p className="font-bold text-lg">{t('total')}: {settings.currency}{(sale.totalMinor / 100).toFixed(2)}</p>
                    </div>
                </div>


                <div className="flex justify-end gap-4 mt-6">
                    <NeuButton onClick={onClose} variant="secondary">{t('close')}</NeuButton>
                    <NeuButton onClick={onPrint} variant="primary">{t('print_receipt')}</NeuButton>
                </div>
            </GlassCard>
        </div>
    );
};


const SalesPage = () => {
    const { t } = useI18n();
    const { sales, customers, users, deleteSale } = useData();
    const { settings } = useSettings();
    const { can } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    useEffect(() => {
        // @ts-ignore
        if (window.lucide) {
            // @ts-ignore
            window.lucide.createIcons();
        }
    });

    const filteredSales = useMemo(() => {
        return sales
            .filter(sale => sale.id.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, searchTerm]);

    const getCustomerName = (id?: string) => customers.find(c => c.id === id)?.name || t('none');
    const getUserName = (id: string) => users.find(u => u.id === id)?.username || 'N/A';

    // Fix: Correctly type the sale ID.
    const handleDelete = (id: SaleId) => {
        if (window.confirm(t('confirm_delete_sale'))) {
            deleteSale(id);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">{t('sales')}</h1>
            <GlassCard className="mb-6">
                <input
                    type="text"
                    placeholder={t('search_sales')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:max-w-sm px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </GlassCard>
            <GlassCard>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="p-4">{t('invoice_id')}</th>
                                <th className="p-4">{t('date')}</th>
                                <th className="p-4">{t('customer')}</th>
                                <th className="p-4">{t('user')}</th>
                                <th className="p-4">{t('payment_method')}</th>
                                <th className="p-4 text-right">{t('total')}</th>
                                <th className="p-4 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSales.map(sale => (
                                <tr key={sale.id} className="border-b border-white/20 last:border-b-0 hover:bg-white/10 dark:hover:bg-black/10 transition-colors">
                                    <td className="p-4 font-mono text-sm">{sale.id}</td>
                                    <td className="p-4">{new Date(sale.date).toLocaleString()}</td>
                                    <td className="p-4">{getCustomerName(sale.customerId)}</td>
                                    <td className="p-4">{getUserName(sale.userId)}</td>
                                    <td className="p-4">{sale.payments.map(p => t(p.method)).join(', ')}</td>
                                    {/* Fix: Use 'totalMinor' and format currency. */}
                                    <td className="p-4 text-right font-bold">{settings.currency}{(sale.totalMinor / 100).toFixed(2)}</td>
                                    <td className="p-4">
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => setSelectedSale(sale)} className="p-2 hover:bg-white/20 rounded-full" title={t('view')}>
                                                <i data-lucide="eye" className="w-4 h-4"></i>
                                            </button>
                                            <button onClick={() => printReceipt(sale, settings, t)} className="p-2 hover:bg-white/20 rounded-full" title={t('print_receipt')}>
                                                <i data-lucide="printer" className="w-4 h-4"></i>
                                            </button>
                                            {can('delete_products') && (
                                                <button onClick={() => handleDelete(sale.id)} className="p-2 hover:bg-white/20 rounded-full text-red-500" title={t('delete')}>
                                                    <i data-lucide="trash-2" className="w-4 h-4"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
            {selectedSale && <SaleDetailsModal sale={selectedSale} onClose={() => setSelectedSale(null)} onPrint={() => printReceipt(selectedSale, settings, t)} />}
        </div>
    );
};

export default SalesPage;