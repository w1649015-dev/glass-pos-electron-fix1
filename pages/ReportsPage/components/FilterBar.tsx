import React from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { UserRole } from '../../../types';

interface RangeObject {
  startDate: Date;
  endDate: Date;
  key: string;
}

interface FilterBarProps {
  reportType: 'sales' | 'expenses' | 'products';
  dateRange: RangeObject;
  selectedCategories: string[];
  selectedUsers: string[];
  onDateRangeChange: (range: RangeObject) => void;
  onCategoriesChange: (categories: string[]) => void;
  onUsersChange: (users: string[]) => void;
  categories: Array<{ id: string; name: string }>;
  users: Array<{ id: string; username: string; role: UserRole }>;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  reportType,
  dateRange,
  selectedCategories,
  selectedUsers,
  onDateRangeChange,
  onCategoriesChange,
  onUsersChange,
  categories,
  users,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white/5 rounded-lg">
      {/* Date Range Picker */}
      {reportType !== 'products' && (
        <div className="flex-1">
          <label className="block mb-2 text-sm">{t('date_range')}</label>
          <DateRangePicker
            ranges={[dateRange]}
            onChange={(item) => {
              const sel = (item as any).selection as {
                startDate?: Date;
                endDate?: Date;
                key?: string;
              };
              const newRange: RangeObject = {
                startDate: sel.startDate ?? dateRange.startDate,
                endDate: sel.endDate ?? dateRange.endDate,
                key: sel.key ?? 'selection',
              };
              onDateRangeChange(newRange);
            }}
            months={2}
            direction="horizontal"
            className="w-full"
            rangeColors={['#3b82f6']}
            color="#3b82f6"
            minDate={new Date(2020, 0, 1)}
            maxDate={new Date()}
          />
        </div>
      )}

      {/* Categories Filter */}
      <div className="flex-1">
        <label className="block mb-2 text-sm">{t('categories')}</label>
        <select
          multiple
          value={selectedCategories}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, option => option.value);
            onCategoriesChange(values);
          }}
          className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg"
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Users Filter */}
      {reportType !== 'products' && (
        <div className="flex-1">
          <label className="block mb-2 text-sm">{t('users')}</label>
          <select
            multiple
            value={selectedUsers}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              onUsersChange(values);
            }}
            className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg"
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};