import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import NeuButton from '../components/ui/NeuButton';
import { Dashboard } from './ReportsPage/components/Dashboard';
import { FilterBar } from './ReportsPage/components/FilterBar';
import { Chart } from './ReportsPage/components/Chart';
import { Sale, Expense, Product, UserId } from '../types';
import { DateRange } from 'react-date-range';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Declare global variables for export libraries
declare const jspdf: any;
declare const XLSX: any;

const ReportsPage = () => {
    const { t } = useI18n();
    const { sales, expenses, products, users, categories } = useDatabase();
    const { settings } = useSettings();
    const { can } = useAuth();

    if (can('view_reports') === false) {
        return <Navigate to="/" />;
    }

    const [reportType, setReportType] = useState<'sales' | 'expenses' | 'products'>('sales');
    const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date; key: string }>({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(),
        key: 'selection'
    });
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const filteredData = useMemo(() => {
        let data;
        if (reportType === 'sales') {
            data = sales;
        } else if (reportType === 'expenses') {
            data = expenses;
        } else {
            data = products;
        }

        return data.filter(item => {
            if (reportType === 'products') {
                return selectedCategories.length === 0 || 
                    (item.categoryId && selectedCategories.includes(item.categoryId));
            }

            const itemDate = new Date(item.date);
            const dateMatch = itemDate >= dateRange.startDate! && itemDate <= dateRange.endDate!;
            const userMatch = selectedUsers.length === 0 || selectedUsers.includes(item.userId);
            const categoryMatch = selectedCategories.length === 0 || 
                (reportType === 'expenses' && selectedCategories.includes(item.category)) ||
                (reportType === 'sales' && item.items.some(i => {
                    const product = products.find(p => p.id === i.productId);
                    return product && product.categoryId && selectedCategories.includes(product.categoryId);
                }));

            return dateMatch && userMatch && categoryMatch;
        });
    }, [reportType, dateRange, selectedCategories, selectedUsers, sales, expenses, products]);

    // Calculate dashboard metrics
    const dashboardMetrics = useMemo(() => {
        const totalSales = reportType === 'sales' ? 
            filteredData.reduce((sum, sale: Sale) => sum + sale.totalMinor, 0) / 100 : 0;
        
        const totalExpenses = reportType === 'expenses' ? 
            filteredData.reduce((sum, expense: Expense) => sum + expense.amountMinor, 0) / 100 : 0;
        
        const totalProducts = products.length;
        
        const averageTicket = reportType === 'sales' && filteredData.length > 0 ? 
            totalSales / filteredData.length : 0;

        // Calculate top products
        const productSales = new Map<string, number>();
        if (reportType === 'sales') {
            (filteredData as Sale[]).forEach(sale => {
                sale.items.forEach(item => {
                    const product = products.find(p => p.id === item.productId);
                    if (product) {
                        productSales.set(product.name, 
                            (productSales.get(product.name) || 0) + item.quantity);
                    }
                });
            });
        }

        const topProducts = Array.from(productSales.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, sales]) => ({ name, sales }));

        return {
            totalSales,
            totalExpenses,
            totalProducts,
            averageTicket,
            topProducts
        };
    }, [filteredData, reportType, products]);
    
    const getUserName = (id: string) => users.find(u => u.id === id)?.username || 'Unknown';
    const getCategoryName = (id?: string) => categories.find(c => c.id === id)?.name || 'N/A';

    const chartData = useMemo(() => {
        if (reportType === 'products' || filteredData.length === 0) return [];
        
        const dataMap: { [key: string]: number } = {};

        filteredData.forEach((item: any) => {
            const date = new Date(item.date);
            const key = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

            if (!dataMap[key]) dataMap[key] = 0;
            dataMap[key] += 'totalMinor' in item ? item.totalMinor / 100 : item.amountMinor / 100;
        });

        return Object.entries(dataMap).map(([name, value]) => ({ name, value }));
    }, [filteredData, reportType]);

    const handleExportPDF = () => {
        const doc = new jspdf.jsPDF();
        const tableData: (string | number)[][] = [];
        let headers: string[] = [];
        
        const title = `${t(reportType + '_report')} - ${dateRange.startDate?.toLocaleDateString()} to ${dateRange.endDate?.toLocaleDateString()}`;
        doc.text(title, 14, 16);

        if (reportType === 'sales') {
            headers = [t('date'), t('items'), t('user'), t('total')];
            (filteredData as Sale[]).forEach(s => tableData.push([
                new Date(s.date).toLocaleDateString(),
                s.items.length,
                getUserName(s.userId),
                `${settings.currency}${(s.totalMinor / 100).toFixed(2)}`
            ]));
        } else if (reportType === 'expenses') {
            headers = [t('date'), t('title'), t('category'), t('user'), t('amount')];
             (filteredData as Expense[]).forEach(e => tableData.push([
                new Date(e.date).toLocaleDateString(),
                e.title,
                e.category || '',
                getUserName(e.userId),
                `${settings.currency}${(e.amountMinor / 100).toFixed(2)}`
            ]));
        } else {
            headers = [t('name'), t('sku'), t('category'), t('price'), t('stock_level')];
            (filteredData as Product[]).forEach(p => tableData.push([
                p.name,
                p.sku || '',
                getCategoryName(p.categoryId),
                `${settings.currency}${(p.priceMinor / 100).toFixed(2)}`,
                p.stock
            ]));
        }

        doc.autoTable({
            head: [headers],
            body: tableData,
            startY: 22,
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [59, 130, 246]
            }
        });

        doc.save(`${reportType}_report.pdf`);
    };

    const handleExportExcel = () => {
        const formattedData = filteredData.map(item => {
            const base: any = { ...item };
            
            // Convert date
            if ('date' in base) {
                base.date = new Date(base.date).toLocaleDateString();
            }
            
            // Format currency values
            if ('totalMinor' in base) {
                base.total = `${settings.currency}${(base.totalMinor / 100).toFixed(2)}`;
                delete base.totalMinor;
            }
            if ('amountMinor' in base) {
                base.amount = `${settings.currency}${(base.amountMinor / 100).toFixed(2)}`;
                delete base.amountMinor;
            }
            if ('priceMinor' in base) {
                base.price = `${settings.currency}${(base.priceMinor / 100).toFixed(2)}`;
                delete base.priceMinor;
            }

            // Resolve references
            if ('userId' in base) {
                base.user = getUserName(base.userId);
                delete base.userId;
            }
            if ('categoryId' in base) {
                base.category = getCategoryName(base.categoryId);
                delete base.categoryId;
            }

            return base;
        });

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, t(reportType + '_report'));
        XLSX.writeFile(workbook, `${reportType}_report.xlsx`);
    };

    const renderTable = () => {
        if (filteredData.length === 0) {
            return <p className="text-center p-8">{t('no_data_for_report')}</p>;
        }

        if (reportType === 'sales') {
            return (
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/20">
                            <th className="p-4">{t('date')}</th>
                            <th className="p-4">{t('items')}</th>
                            <th className="p-4">{t('user')}</th>
                            <th className="p-4 text-right">{t('total')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(filteredData as Sale[]).map(s => (
                            <tr key={s.id} className="border-b border-white/20 last:border-b-0">
                                <td className="p-4">{new Date(s.date).toLocaleString()}</td>
                                <td className="p-4">{s.items.length}</td>
                                <td className="p-4">{getUserName(s.userId)}</td>
                                <td className="p-4 text-right">
                                    {settings.currency}{(s.totalMinor / 100).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (reportType === 'expenses') {
            return (
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/20">
                            <th className="p-4">{t('date')}</th>
                            <th className="p-4">{t('title')}</th>
                            <th className="p-4">{t('category')}</th>
                            <th className="p-4">{t('user')}</th>
                            <th className="p-4 text-right">{t('amount')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(filteredData as Expense[]).map(e => (
                            <tr key={e.id} className="border-b border-white/20 last:border-b-0">
                                <td className="p-4">{new Date(e.date).toLocaleDateString()}</td>
                                <td className="p-4">{e.title}</td>
                                <td className="p-4">{e.category}</td>
                                <td className="p-4">{getUserName(e.userId)}</td>
                                <td className="p-4 text-right">
                                    {settings.currency}{(e.amountMinor / 100).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        return (
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-white/20">
                        <th className="p-4">{t('name')}</th>
                        <th className="p-4">{t('sku')}</th>
                        <th className="p-4">{t('category')}</th>
                        <th className="p-4 text-right">{t('price')}</th>
                        <th className="p-4 text-right">{t('stock_level')}</th>
                    </tr>
                </thead>
                <tbody>
                    {(filteredData as Product[]).map(p => (
                        <tr key={p.id} className="border-b border-white/20 last:border-b-0">
                            <td className="p-4">{p.name}</td>
                            <td className="p-4">{p.sku}</td>
                            <td className="p-4">{getCategoryName(p.categoryId)}</td>
                            <td className="p-4 text-right">
                                {settings.currency}{(p.priceMinor / 100).toFixed(2)}
                            </td>
                            <td className="p-4 text-right">{p.stock}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{t('reports')}</h1>
                <div className="flex gap-2">
                    <NeuButton onClick={handleExportPDF} variant="secondary" title={t('export_to_pdf')}>
                        <i data-lucide="file-down" className="w-4 h-4" />
                    </NeuButton>
                    <NeuButton onClick={handleExportExcel} variant="secondary" title={t('export_to_excel')}>
                        <i data-lucide="sheet" className="w-4 h-4" />
                    </NeuButton>
                </div>
            </div>

            {/* Report Type Selection */}
            <GlassCard className="p-4">
                <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg"
                >
                    <option value="sales">{t('sales_report')}</option>
                    <option value="expenses">{t('expenses_report')}</option>
                    <option value="products">{t('products_report')}</option>
                </select>
            </GlassCard>

            {/* Dashboard Component */}
            <Dashboard
                totalSales={dashboardMetrics.totalSales}
                totalExpenses={dashboardMetrics.totalExpenses}
                totalProducts={dashboardMetrics.totalProducts}
                averageTicket={dashboardMetrics.averageTicket}
                topProducts={dashboardMetrics.topProducts}
            />

            {/* Filter Component */}
            <FilterBar
                reportType={reportType}
                dateRange={dateRange}
                selectedCategories={selectedCategories}
                selectedUsers={selectedUsers}
                onDateRangeChange={setDateRange}
                onCategoriesChange={setSelectedCategories}
                onUsersChange={setSelectedUsers}
                categories={categories}
                users={users}
            />

            {/* Charts */}
            {reportType !== 'products' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Chart
                        data={chartData}
                        type="line"
                        dataKey="value"
                        title={t('trend_over_time')}
                    />
                    <Chart
                        data={
                            reportType === 'sales'
                                ? dashboardMetrics.topProducts
                                : filteredData.reduce((acc: any[], item: any) => {
                                    const category = item.category || t('uncategorized');
                                    const existing = acc.find(x => x.name === category);
                                    if (existing) {
                                        existing.value += item.amountMinor / 100;
                                    } else {
                                        acc.push({ name: category, value: item.amountMinor / 100 });
                                    }
                                    return acc;
                                }, [])
                        }
                        type="pie"
                        dataKey="value"
                        xAxisKey="name"
                        title={reportType === 'sales' ? t('top_products') : t('expense_categories')}
                    />
                </div>
            )}

            {/* Data Table */}
            <GlassCard className="overflow-x-auto">
                {renderTable()}
            </GlassCard>
        </div>
    );
};

export default ReportsPage;