

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useI18n } from '../contexts/I18nContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import GlassCard from '../components/ui/GlassCard';
import { useSettings } from '../contexts/SettingsContext';

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: string }) => (
  <GlassCard className="flex-1">
    <div className="flex items-center">
      <div className="p-3 bg-blue-500/20 rounded-lg mr-4">
        <i data-lucide={icon} className="w-8 h-8 text-blue-500"></i>
      </div>
      <div className="mr-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </GlassCard>
);


const DashboardPage = () => {
  const { t } = useI18n();
  const { sales, customers, products } = useDatabase();
  const { settings } = useSettings();

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  
  const dailyRevenue = sales
    .filter(sale => sale.date >= startOfDay)
    // Fix: Use 'totalMinor' instead of 'total'.
    .reduce((sum, sale) => sum + sale.totalMinor, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const monthlyRevenue = sales
    .filter(sale => sale.date >= startOfMonth)
    // Fix: Use 'totalMinor' instead of 'total'.
    .reduce((sum, sale) => sum + sale.totalMinor, 0);

  const totalProductsInStock = products.reduce((sum, p) => sum + p.stock, 0);

  // Prepare data for the chart
  const salesData = sales.reduce((acc, sale) => {
    const date = new Date(sale.date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = 0;
    }
    // Fix: Use 'totalMinor' and convert to major currency unit for chart.
    acc[date] += sale.totalMinor / 100;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(salesData).map(date => ({
    name: date,
    sales: salesData[date]
  })).slice(-7); // Last 7 days

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('dashboard')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Fix: Format revenue from minor units to major units. */}
        <StatCard title={t('daily_revenue')} value={`${settings.currency}${(dailyRevenue / 100).toFixed(2)}`} icon="sun" />
        <StatCard title={t('monthly_revenue')} value={`${settings.currency}${(monthlyRevenue / 100).toFixed(2)}`} icon="calendar" />
        <StatCard title={t('total_sales')} value={sales.length} icon="receipt" />
        <StatCard title={t('total_customers')} value={customers.length} icon="users" />
      </div>
      <GlassCard>
        <h2 className="text-xl font-semibold mb-4">{t('sales_over_time')}</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: 'none',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
};

export default DashboardPage;