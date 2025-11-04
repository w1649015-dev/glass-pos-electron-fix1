import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useI18n } from '../../../contexts/I18nContext';
import { useSettings } from '../../../contexts/SettingsContext';
import GlassCard from '../../../components/ui/GlassCard';
import { formatCurrency } from '../../../utils/currency';

interface ChartProps {
  data: any[];
  type: 'line' | 'bar' | 'pie';
  dataKey: string;
  xAxisKey?: string;
  title: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const Chart: React.FC<ChartProps> = ({
  data,
  type,
  dataKey,
  xAxisKey = 'name',
  title,
}) => {
  const { t } = useI18n();
  const { settings } = useSettings();

  const formatValue = (value: number) => {
    if (typeof value === 'number') {
      return formatCurrency(value * 100, settings);
    }
    return value;
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis tickFormatter={formatValue} />
            <Tooltip formatter={formatValue} />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis tickFormatter={formatValue} />
            <Tooltip formatter={formatValue} />
            <Legend />
            <Bar dataKey={dataKey} fill="#8884d8" />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }) => `${name}: ${formatValue(value as number)}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={formatValue} />
            <Legend />
          </PieChart>
        );
    }
  };

  return (
    <GlassCard className="p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer>{renderChart()}</ResponsiveContainer>
      </div>
    </GlassCard>
  );
};