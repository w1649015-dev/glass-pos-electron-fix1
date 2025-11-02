import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import { Invoice, Sale, Settings, Customer, User } from '../types';
import GlassCard from '../components/ui/GlassCard';
import { formatCurrency } from '../utils/currency';

// Declare JsBarcode for TypeScript
declare const JsBarcode: any;

const PrintInvoice = ({ invoice, sale, settings, customer, user }: { invoice: Invoice, sale: Sale, settings: Settings, customer?: Customer, user?: User }) => {
    const { t } = useI18n(); // Using main context as this is simpler than passing 't' down
    const barcodeRef = React.useRef(null);

    useEffect(() => {
        if (barcodeRef.current) {
            JsBarcode(barcodeRef.current, sale.id, { format: "CODE128", displayValue: false, height: 50, margin: 10 });
        }
        const timer = setTimeout(() => window.print(), 500);
        window.onafterprint = () => window.close();
        return () => clearTimeout(timer);
    }, [sale.id]);

    const styles: Record<string, React.CSSProperties> = {
        page: { fontFamily: 'sans-serif', padding: '40px', width: '210mm', height: '297mm', boxSizing: 'border-box' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' },
        headerInfo: { textAlign: 'left'},
        invoiceTitle: { fontSize: '2.5em', margin: 0, color: '#333', textAlign: 'right' },
        address: { display: 'flex', justifyContent: 'space-between', marginBottom: '40px' },
        table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
        th: { background: '#f4f4f4', padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' },
        td: { padding: '10px', borderBottom: '1px solid #eee' },
        totals: { marginTop: '30px', float: 'right', width: '40%' },
        totalsTable: { width: '100%' },
        footer: { position: 'absolute', bottom: '40px', left: '40px', right: '40px', textAlign: 'center', fontSize: '0.8em', color: '#777' }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div style={styles.headerInfo}>
                    <h2 style={{ fontSize: '1.5em', margin: 0 }}>{settings.storeName}</h2>
                    <p>{settings.storeAddress}</p>
                    <p>{settings.storePhone}</p>
                    <p>{settings.storeEmail}</p>
                </div>
                <div>
                    <h1 style={styles.invoiceTitle}>{t('invoice').toUpperCase()}</h1>
                    <p style={{ textAlign: 'right' }}>#{invoice.invoiceNumber}</p>
                </div>
            </div>
            
            <div style={styles.address}>
                <div>
                    <h4>{t('bill_to')}:</h4>
                    <p><strong>{customer?.name || t('walk_in_customer')}</strong></p>
                    <p>{customer?.email}</p>
                    <p>{customer?.phone}</p>
                </div>
                <div style={{textAlign: 'right'}}>
                    <p><strong>{t('issue_date')}:</strong> {new Date(invoice.issueDate).toLocaleDateString()}</p>
                    <p><strong>{t('sale_id')}:</strong> {sale.id}</p>
                </div>
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
                            <td style={styles.td}>{item.name}</td>
                            <td style={{...styles.td, textAlign: 'center'}}>{item.quantity}</td>
                            <td style={{...styles.td, textAlign: 'right'}}>{formatCurrency(item.priceMinor, settings)}</td>
                            <td style={{...styles.td, textAlign: 'right'}}>{formatCurrency(item.priceMinor * item.quantity, settings)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={styles.totals}>
                 <table style={styles.totalsTable}>
                     <tbody>
                        <tr><td>{t('subtotal')}:</td><td style={{textAlign: 'right'}}>{formatCurrency(sale.subtotalMinor, settings)}</td></tr>
                        <tr><td>{t('discount')}:</td><td style={{textAlign: 'right'}}>-{formatCurrency(sale.discountMinor, settings)}</td></tr>
                        <tr><td>{t('tax')} ({settings.defaultTaxRatePercent}%):</td><td style={{textAlign: 'right'}}>{formatCurrency(sale.taxMinor, settings)}</td></tr>
                        <tr style={{fontWeight: 'bold', fontSize: '1.2em', borderTop: '2px solid #333'}}><td style={{paddingTop: '10px'}}>{t('total')}:</td><td style={{textAlign: 'right', paddingTop: '10px'}}>{formatCurrency(sale.totalMinor, settings)}</td></tr>
                    </tbody>
                 </table>
            </div>

            <div style={{...styles.footer, clear: 'both'}}>
                <p>{t('thank_you_message')}</p>
                <canvas ref={barcodeRef} style={{height: '50px'}}></canvas>
            </div>
        </div>
    );
};

const printInvoice = (invoice: Invoice, sale: Sale, settings: Settings, customer?: Customer, user?: User) => {
    const printWindow = window.open('', '_blank', 'width=880,height=1240');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Print Invoice</title></head><body><div id="print-root"></div></body></html>');
        printWindow.document.close();
        const printRootEl = printWindow.document.getElementById('print-root');
        if (printRootEl) {
            const root = ReactDOM.createRoot(printRootEl);
            root.render(
              <React.StrictMode>
                 <PrintInvoice invoice={invoice} sale={sale} settings={settings} customer={customer} user={user} />
              </React.StrictMode>
            );
        }
    }
};

const InvoiceDetailsModal = ({ invoice, onClose }: { invoice: Invoice, onClose: () => void }) => {
    const { t } = useI18n();
    const { sales, customers, users } = useData();
    const { settings } = useSettings();

    const sale = sales.find(s => s.id === invoice.saleId);
    const customer = customers.find(c => c.id === invoice.customerId);
    const user = sale ? users.find(u => u.id === sale.userId) : undefined;
    
    if (!sale) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <GlassCard className="w-full max-w-3xl">
                <h2 className="text-2xl font-bold mb-4">{t('invoice')} #{invoice.invoiceNumber}</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <p><strong>{t('status')}:</strong> <span className="capitalize px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-500">{t(invoice.status)}</span></p>
                    <p><strong>{t('issue_date')}:</strong> {new Date(invoice.issueDate).toLocaleString()}</p>
                    <p><strong>{t('customer')}:</strong> {customer?.name || t('none')}</p>
                    <p><strong>{t('user')}:</strong> {user?.username || 'N/A'}</p>
                </div>
                
                <div className="max-h-60 overflow-y-auto border-y border-white/20 my-4 py-2">
                    {sale.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center mb-2 p-2">
                            <span>{item.name} x {item.quantity}</span>
                            <span>{formatCurrency(item.priceMinor * item.quantity, settings)}</span>
                        </div>
                    ))}
                </div>
                
                <div className="text-right">
                    <p>{t('subtotal')}: {formatCurrency(sale.subtotalMinor, settings)}</p>
                    <p>{t('discount')}: -{formatCurrency(sale.discountMinor, settings)}</p>
                    <p>{t('tax')}: {formatCurrency(sale.taxMinor, settings)}</p>
                    <p className="font-bold text-lg">{t('total')}: {formatCurrency(sale.totalMinor, settings)}</p>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button className="p-2" onClick={onClose}>{t('close')}</button>
                    <button className="p-2" onClick={() => printInvoice(invoice, sale, settings, customer, user)}>{t('print_invoice')}</button>
                </div>
            </GlassCard>
        </div>
    );
};


const InvoicesPage = () => {
    const { t } = useI18n();
    const { invoices, customers } = useData();
    const { settings } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    useEffect(() => {
        // @ts-ignore
        if (window.lucide) {
            // @ts-ignore
            window.lucide.createIcons();
        }
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        return invoices
            .filter(inv => inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    }, [invoices, searchTerm]);

    const getCustomerName = (id?: string) => customers.find(c => c.id === id)?.name || t('none');

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">{t('invoices')}</h1>
            <GlassCard className="mb-6">
                <input
                    type="text"
                    placeholder={t('search_invoices')}
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
                                <th className="p-4">{t('invoice_number')}</th>
                                <th className="p-4">{t('issue_date')}</th>
                                <th className="p-4">{t('customer')}</th>
                                <th className="p-4">{t('status')}</th>
                                <th className="p-4 text-right">{t('total')}</th>
                                <th className="p-4 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(invoice => (
                                <tr key={invoice.id} className="border-b border-white/20 last:border-b-0 hover:bg-white/10 dark:hover:bg-black/10 transition-colors">
                                    <td className="p-4 font-mono text-sm">{invoice.invoiceNumber}</td>
                                    <td className="p-4">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                                    <td className="p-4">{getCustomerName(invoice.customerId)}</td>
                                    <td className="p-4"><span className="capitalize">{t(invoice.status)}</span></td>
                                    <td className="p-4 text-right font-bold">{formatCurrency(invoice.totalMinor, settings)}</td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => setSelectedInvoice(invoice)} className="p-2 hover:bg-white/20 rounded-full" title={t('view')}>
                                            <i data-lucide="eye" className="w-4 h-4"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
            {selectedInvoice && <InvoiceDetailsModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
        </div>
    );
};

export default InvoicesPage;