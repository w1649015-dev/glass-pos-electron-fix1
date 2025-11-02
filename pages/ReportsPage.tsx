

import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import GlassCard from '../components/ui/GlassCard';
import NeuButton from '../components/ui/NeuButton';
import { Sale, Expense, Product, UserId } from '../types';

// Declare global variables for export libraries
declare const jspdf: any;
declare const XLSX: any;

const ReportsPage = () => {
    const { t } = useI18n();
    const { sales, expenses, products, users, categories } = useData();
    const { settings } = useSettings();
    const { can } = useAuth();

    if (can('view_reports') === false) {
        return <Navigate to="/" />;
    }

    const [reportType, setReportType] = useState<'sales' | 'expenses' | 'products'>('sales');
    const [timeframe, setTimeframe] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
    const [selectedUserId, setSelectedUserId] = useState<string | UserId>('all');

    const filteredData = useMemo(() => {
        const now = new Date();
        let startDate: Date;

        if (timeframe === 'daily') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (timeframe === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else { // yearly
            startDate = new Date(now.getFullYear(), 0, 1);
        }

        let data;
        if (reportType === 'sales') {
            data = sales;
        } else if (reportType === 'expenses') {
            data = expenses;
        } else {
            return products; // Products don't have a date filter
        }

        return data.filter(item => {
            const itemDate = new Date(item.date);
            const userMatch = selectedUserId === 'all' || item.userId === selectedUserId;
            return itemDate >= startDate && userMatch;
        });
    }, [reportType, timeframe, selectedUserId, sales, expenses, products]);
    
    const getUserName = (id: string) => users.find(u => u.id === id)?.username || 'Unknown';
    const getCategoryName = (id?: string) => categories.find(c => c.id === id)?.name || 'N/A';

    const chartData = useMemo(() => {
        if (reportType === 'products' || filteredData.length === 0) return [];
        
        const dataMap: { [key: string]: number } = {};

        filteredData.forEach((item: any) => {
            const date = new Date(item.date);
            let key: string;

            if (timeframe === 'daily') {
                key = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (timeframe === 'monthly') {
                key = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            } else { // yearly
                key = date.toLocaleDateString([], { month: 'long' });
            }

            if (!dataMap[key]) dataMap[key] = 0;
            // Fix: Use 'totalMinor' or 'amountMinor' and convert to major units.
            dataMap[key] += 'totalMinor' in item ? item.totalMinor / 100 : item.amountMinor / 100;
        });

        return Object.entries(dataMap).map(([name, value]) => ({ name, value }));

    }, [filteredData, reportType, timeframe]);

    const handleExportPDF = () => {
        const doc = new jspdf.jsPDF();
        const tableData: (string | number)[][] = [];
        let headers: string[] = [];
        
        const title = `${t(reportType + '_report')} - ${t(timeframe)}`;
        doc.text(title, 14, 16);

        if (reportType === 'sales') {
            headers = [t('date'), t('items'), t('user'), t('total')];
            (filteredData as Sale[]).forEach(s => tableData.push([
                new Date(s.date).toLocaleDateString(),
                s.items.length,
                getUserName(s.userId),
                // Fix: Use 'totalMinor' and format currency.
                `${settings.currency}${(s.totalMinor / 100).toFixed(2)}`
            ]));
        } else if (reportType === 'expenses') {
            headers = [t('date'), t('title'), t('category'), t('user'), t('amount')];
             (filteredData as Expense[]).forEach(e => tableData.push([
                new Date(e.date).toLocaleDateString(),
                e.title,
                e.category || '',
                getUserName(e.userId),
                // Fix: Use 'amountMinor' and format currency.
                `${settings.currency}${(e.amountMinor / 100).toFixed(2)}`
            ]));
        } else { // products
            headers = [t('name'), t('sku'), t('category'), t('price'), t('stock_level')];
            (filteredData as Product[]).forEach(p => tableData.push([
                p.name, p.sku || '', 
                // Fix: Use 'categoryId' and get the category name.
                getCategoryName(p.categoryId), 
                // Fix: Use 'priceMinor' and format currency.
                `${settings.currency}${(p.priceMinor / 100).toFixed(2)}`, p.stock
            ]));
        }

        doc.autoTable({
            head: [headers],
            body: tableData,
            startY: 22,
        });

        doc.save(`${reportType}_report.pdf`);
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        XLSX.writeFile(workbook, `${reportType}_report.xlsx`);
    };

    const renderTable = () => {
        if (filteredData.length === 0) return <p className="text-center p-8">{t('no_data_for_report')}</p>;
        
        if (reportType === 'sales') {
            return (
                <table className="w-full text-left">
                    <thead><tr className="border-b border-white/20"><th className="p-4">{t('date')}</th><th className="p-4">{t('items')}</th><th className="p-4">{t('user')}</th><th className="p-4 text-right">{t('total')}</th></tr></thead>
                    <tbody>{(filteredData as Sale[]).map(s => <tr key={s.id} className="border-b border-white/20 last:border-b-0">
                        {/* Fix: Use 'totalMinor' and format currency. */}
                        <td className="p-4">{new Date(s.date).toLocaleString()}</td><td className="p-4">{s.items.length}</td>
                        <td className="p-4">{getUserName(s.userId)}</td><td className="p-4 text-right">{settings.currency}{(s.totalMinor / 100).toFixed(2)}</td></tr>)}</tbody>
                </table>
            );
        }
        if (reportType === 'expenses') {
             return (
                <table className="w-full text-left">
                    <thead><tr className="border-b border-white/20"><th className="p-4">{t('date')}</th><th className="p-4">{t('title')}</th><th className="p-4">{t('category')}</th><th className="p-4">{t('user')}</th><th className="p-4 text-right">{t('amount')}</th></tr></thead>
                    <tbody>{(filteredData as Expense[]).map(e => <tr key={e.id} className="border-b border-white/20 last:border-b-0">
                        {/* Fix: Use 'amountMinor' and format currency. */}
                        <td className="p-4">{new Date(e.date).toLocaleDateString()}</td><td className="p-4">{e.title}</td><td className="p-4">{e.category}</td>
                        <td className="p-4">{getUserName(e.userId)}</td><td className="p-4 text-right">{settings.currency}{(e.amountMinor / 100).toFixed(2)}</td></tr>)}</tbody>
                </table>
             );
        }
        if (reportType === 'products') {
            return (
                <table className="w-full text-left">
                    <thead><tr className="border-b border-white/20"><th className="p-4">{t('name')}</th><th className="p-4">{t('sku')}</th><th className="p-4">{t('category')}</th><th className="p-4 text-right">{t('price')}</th><th className="p-4 text-right">{t('stock_level')}</th></tr></thead>
                    <tbody>{(filteredData as Product[]).map(p => <tr key={p.id} className="border-b border-white/20 last:border-b-0">
                        {/* Fix: Use categoryId, priceMinor and format currency. */}
                        <td className="p-4">{p.name}</td><td className="p-4">{p.sku}</td><td className="p-4">{getCategoryName(p.categoryId)}</td>
                        <td className="p-4 text-right">{settings.currency}{(p.priceMinor / 100).toFixed(2)}</td><td className="p-4 text-right">{p.stock}</td></tr>)}</tbody>
                </table>
            );
        }
        return null;
    };


    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">{t('reports')}</h1>
            <GlassCard className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div><label className="block mb-1 text-sm">{t('select_report_type')}</label><select value={reportType} onChange={(e) => setReportType(e.target.value as any)} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="sales">{t('sales_report')}</option><option value="expenses">{t('expenses_report')}</option><option value="products">{t('products_report')}</option></select></div>
                    {reportType !== 'products' && <>
                        <div><label className="block mb-1 text-sm">{t('timeframe')}</label><select value={timeframe} onChange={(e) => setTimeframe(e.target.value as any)} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="daily">{t('daily')}</option><option value="monthly">{t('monthly')}</option><option value="yearly">{t('yearly')}</option></select></div>
                        <div><label className="block mb-1 text-sm">{t('select_user')}</label><select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="all">{t('all_users')}</option>{users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div>
                    </>}
                    <div className="flex gap-2 justify-end col-span-1 lg:col-start-4">
                        <NeuButton onClick={handleExportPDF} variant="secondary" title={t('export_to_pdf')}><i data-lucide="file-down" className="w-4 h-4"></i></NeuButton>
                        <NeuButton onClick={handleExportExcel} variant="secondary" title={t('export_to_excel')}><i data-lucide="sheet" className="w-4 h-4"></i></NeuButton>
                    </div>
                </div>
            </GlassCard>

            {reportType !== 'products' && (
                <GlassCard className="mb-6">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: 'none', borderRadius: '0.5rem' }} />
                            <Bar dataKey="value" fill="#3b82f6" name={reportType === 'sales' ? t('sales') : t('expenses')} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            )}

            <GlassCard>
                <div className="overflow-x-auto">
                    {renderTable()}
                </div>
            </GlassCard>
        </div>
    );
};

export default ReportsPage;