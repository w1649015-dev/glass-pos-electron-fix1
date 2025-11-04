import React from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { useSettings } from '../../../contexts/SettingsContext';
import GlassCard from '../../../components/ui/GlassCard';
import { formatCurrency } from '../../../utils/currency';

interface DashboardProps {
  totalSales: number;
  totalExpenses: number;
  totalProducts: number;
  averageTicket: number;
  topProducts: Array<{ name: string; sales: number }>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  totalSales,
  totalExpenses,
  totalProducts,
  averageTicket,
  topProducts,
}) => {
  const { t } = useI18n();
  const { settings } = useSettings();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI Cards */}
      <GlassCard className="p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">{t('total_sales')}</div>
        <div className="text-2xl font-bold mt-2">{formatCurrency(totalSales * 100, settings)}</div>
        <div className="flex items-center mt-2">
          <i data-lucide="trending-up" className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-sm text-green-500">+12%</span>
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">{t('total_expenses')}</div>
        <div className="text-2xl font-bold mt-2">{formatCurrency(totalExpenses * 100, settings)}</div>
        <div className="flex items-center mt-2">
          <i data-lucide="trending-down" className="w-4 h-4 text-red-500 mr-1" />
          <span className="text-sm text-red-500">-3%</span>
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">{t('total_products')}</div>
        <div className="text-2xl font-bold mt-2">{totalProducts}</div>
        <div className="flex items-center mt-2">
          <i data-lucide="package" className="w-4 h-4 text-blue-500 mr-1" />
          <span className="text-sm text-blue-500">{t('in_stock')}</span>
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">{t('average_ticket')}</div>
        <div className="text-2xl font-bold mt-2">{formatCurrency(averageTicket * 100, settings)}</div>
        <div className="flex items-center mt-2">
          <i data-lucide="trending-up" className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-sm text-green-500">+5%</span>
        </div>
      </GlassCard>

      {/* Top Products */}
      <GlassCard className="p-4 col-span-full">
        <h3 className="text-lg font-semibold mb-4">{t('top_selling_products')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {topProducts.map((product, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
              <span>{product.name}</span>
              <span className="font-semibold">{product.sales}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};