import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import { Shift } from '../types';
import GlassCard from '../components/ui/GlassCard';
import NeuButton from '../components/ui/NeuButton';

const ShiftReportPrint = ({ shift, settings, t }: { shift: Shift, settings: any, t: (key: string) => string }) => {
    // Fix: Use '...Minor' properties for calculations.
    const expectedCash = shift.openingBalanceMinor + shift.cashSalesMinor;
    const discrepancy = (shift.closingBalanceMinor ?? 0) - expectedCash;
    
    React.useEffect(() => {
        const timer = setTimeout(() => window.print(), 500);
        window.onafterprint = () => window.close();
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
            <h1 style={{ textAlign: 'center' }}>{t('shift_report')}</h1>
            <p><strong>{t('user')}:</strong> {shift.userId}</p>
            <p><strong>{t('start_time')}:</strong> {new Date(shift.startTime).toLocaleString()}</p>
            <p><strong>{t('end_time')}:</strong> {shift.endTime ? new Date(shift.endTime).toLocaleString() : 'N/A'}</p>
            <hr style={{ margin: '20px 0' }} />
            <h2 style={{marginTop: '20px'}}>{t('reconciliation_report')}</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    {/* Fix: Display formatted currency from minor units. */}
                    <tr><td style={{ padding: '8px' }}>{t('opening_balance')}</td><td style={{ padding: '8px', textAlign: 'right' }}>{settings.currency}{(shift.openingBalanceMinor / 100).toFixed(2)}</td></tr>
                    <tr><td style={{ padding: '8px' }}>+ {t('total_cash_sales')}</td><td style={{ padding: '8px', textAlign: 'right' }}>{settings.currency}{(shift.cashSalesMinor / 100).toFixed(2)}</td></tr>
                    <tr style={{ borderBottom: '1px solid #ccc' }}><td style={{ padding: '8px' }}><strong>= {t('expected_in_drawer')}</strong></td><td style={{ padding: '8px', textAlign: 'right' }}><strong>{settings.currency}{(expectedCash / 100).toFixed(2)}</strong></td></tr>
                    <tr><td style={{ padding: '8px', paddingTop: '15px' }}>{t('counted_cash')}</td><td style={{ padding: '8px', paddingTop: '15px', textAlign: 'right' }}>{settings.currency}{((shift.closingBalanceMinor ?? 0) / 100).toFixed(2)}</td></tr>
                     <tr style={{ fontWeight: 'bold' }}><td style={{ padding: '8px' }}>= {t('discrepancy')}</td><td style={{ padding: '8px', textAlign: 'right', color: discrepancy < 0 ? 'red' : 'green' }}>{settings.currency}{(discrepancy / 100).toFixed(2)} {discrepancy !== 0 ? (discrepancy > 0 ? `(${t('over')})` : `(${t('short')})`) : ''}</td></tr>
                </tbody>
            </table>
             <hr style={{ margin: '20px 0' }} />
            <p><strong>{t('total_card_sales')}:</strong> {settings.currency}{(shift.cardSalesMinor / 100).toFixed(2)}</p>
            <p><strong>{t('total_sales')}:</strong> {settings.currency}{(shift.totalSalesMinor / 100).toFixed(2)}</p>
        </div>
    );
}

const printShiftReport = (shift: Shift, settings: any, t: (key: string) => string) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Print Shift Report</title></head><body><div id="print-root"></div></body></html>');
        printWindow.document.close();
        const printRootEl = printWindow.document.getElementById('print-root');
        if (printRootEl) {
            const root = ReactDOM.createRoot(printRootEl);
            root.render(
                <React.StrictMode>
                    <ShiftReportPrint shift={shift} settings={settings} t={t} />
                </React.StrictMode>
            );
        }
    }
}


const ShiftPage = () => {
    const { t } = useI18n();
    const { user } = useAuth();
    const { settings } = useSettings();
    const { shifts, startShift, closeShift, getActiveShiftForUser } = useDatabase();

    const [openingBalance, setOpeningBalance] = useState('');
    const [countedCash, setCountedCash] = useState('');
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [closedShift, setClosedShift] = useState<Shift | null>(null);

    const activeShift = user ? getActiveShiftForUser(user.id) : null;
    const userShifts = useMemo(() => 
        shifts.filter(s => s.userId === user?.id).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
        [shifts, user]
    );

    const handleStartShift = () => {
        const balance = parseFloat(openingBalance);
        if (user && !isNaN(balance)) {
            // Fix: Convert major unit input to minor units for storage.
            startShift(user.id, Math.round(balance * 100));
            setOpeningBalance('');
        }
    };

    const handleCloseShift = () => {
        const counted = parseFloat(countedCash);
        if (activeShift && !isNaN(counted)) {
            // Fix: Convert major unit input to minor units for storage.
            const finalShift = closeShift(activeShift.id, Math.round(counted * 100));
            setClosedShift(finalShift);
            setShowCloseModal(false);
            setCountedCash('');
        }
    };

    // Fix: Use '...Minor' properties for calculations.
    const expectedCash = activeShift ? activeShift.openingBalanceMinor + activeShift.cashSalesMinor : 0;
    
    if (closedShift) {
        return (
            <GlassCard>
                <h2 className="text-2xl font-bold mb-4">{t('shift_closed_successfully')}</h2>
                <ShiftReportPrint shift={closedShift} settings={settings} t={t} />
                <div className="flex gap-4 mt-6 print-hidden">
                    <NeuButton variant="secondary" onClick={() => setClosedShift(null)}>{t('ok')}</NeuButton>
                    <NeuButton variant="primary" onClick={() => printShiftReport(closedShift, settings, t)}>{t('print_shift_report')}</NeuButton>
                </div>
            </GlassCard>
        );
    }
    
    if (activeShift) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-6">{t('shift_summary')}</h1>
                <GlassCard className="mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {/* Fix: Display formatted currency from minor units. */}
                        <div><p className="text-sm">{t('start_time')}</p><p className="font-bold">{new Date(activeShift.startTime).toLocaleTimeString()}</p></div>
                        <div><p className="text-sm">{t('opening_balance')}</p><p className="font-bold">{settings.currency}{(activeShift.openingBalanceMinor / 100).toFixed(2)}</p></div>
                        <div><p className="text-sm">{t('total_sales')}</p><p className="font-bold">{settings.currency}{(activeShift.totalSalesMinor / 100).toFixed(2)}</p></div>
                         <NeuButton variant="primary" onClick={() => setShowCloseModal(true)}>{t('close_shift')}</NeuButton>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-white/20">
                        <div><p className="text-sm">{t('total_cash_sales')}</p><p className="font-bold text-green-500">{settings.currency}{(activeShift.cashSalesMinor / 100).toFixed(2)}</p></div>
                        <div><p className="text-sm">{t('total_card_sales')}</p><p className="font-bold text-blue-500">{settings.currency}{(activeShift.cardSalesMinor / 100).toFixed(2)}</p></div>
                        <div><p className="text-sm">{t('expected_in_drawer')}</p><p className="font-bold text-orange-500">{settings.currency}{(expectedCash / 100).toFixed(2)}</p></div>
                    </div>
                </GlassCard>
                {showCloseModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <GlassCard className="w-full max-w-md">
                             <h2 className="text-xl font-bold mb-4">{t('shift_reconciliation')}</h2>
                             <p className="mb-4">{t('enter_counted_amount')}</p>
                              <div className="text-center my-4">
                                <p className="text-lg">{t('expected_in_drawer')}</p>
                                <p className="text-3xl font-bold">{settings.currency}{(expectedCash / 100).toFixed(2)}</p>
                              </div>
                             <input type="number" placeholder={t('counted_cash')} value={countedCash} onChange={(e) => setCountedCash(e.target.value)} className="w-full px-4 py-2 mb-4 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus/>
                             <div className="flex gap-4 mt-6">
                                <NeuButton variant="secondary" onClick={() => setShowCloseModal(false)}>{t('cancel')}</NeuButton>
                                <NeuButton variant="primary" onClick={handleCloseShift} disabled={!countedCash}>{t('confirm_close_shift')}</NeuButton>
                            </div>
                        </GlassCard>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">{t('shift_management')}</h1>
            <GlassCard className="mb-6">
                <h2 className="text-xl font-bold mb-4">{t('start_shift')}</h2>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm mb-1">{t('opening_balance')}</label>
                        <input
                            type="number"
                            value={openingBalance}
                            onChange={(e) => setOpeningBalance(e.target.value)}
                            className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                        />
                    </div>
                    <NeuButton variant="primary" onClick={handleStartShift} disabled={!openingBalance}>{t('start_shift')}</NeuButton>
                </div>
            </GlassCard>

             <GlassCard>
                <h2 className="text-xl font-bold mb-4">{t('shift_history')}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="p-2">{t('start_time')}</th>
                                <th className="p-2">{t('end_time')}</th>
                                <th className="p-2 text-right">{t('total_sales')}</th>
                                <th className="p-2">{t('status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userShifts.map(s => (
                                <tr key={s.id} className="border-b border-white/20 last:border-b-0">
                                    <td className="p-2">{new Date(s.startTime).toLocaleString()}</td>
                                    <td className="p-2">{s.endTime ? new Date(s.endTime).toLocaleString() : '-'}</td>
                                    {/* Fix: Use 'totalSalesMinor' and format currency. */}
                                    <td className="p-2 text-right">{settings.currency}{(s.totalSalesMinor / 100).toFixed(2)}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded-full text-xs ${s.status === 'open' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                                            {t(s.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

        </div>
    );
};

export default ShiftPage;