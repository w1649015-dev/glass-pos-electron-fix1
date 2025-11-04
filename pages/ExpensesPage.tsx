

import React, { useState, useEffect } from 'react';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useI18n } from '../contexts/I18nContext';
// Fix: Import ExpenseId for type safety.
import { Expense, ExpenseId } from '../types';
import GlassCard from '../components/ui/GlassCard';
import NeuButton from '../components/ui/NeuButton';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

const ExpenseModal = ({
    expense,
    onClose,
    onSave,
  }: {
    expense: Partial<Expense> | null;
    onClose: () => void;
    onSave: (expense: Omit<Expense, 'id'> | Expense) => void;
  }) => {
    const { t } = useI18n();
    const { suppliers } = useDatabase();
    const [formData, setFormData] = useState<Partial<Expense>>(
      // Fix: Use 'amountMinor' to match the Expense type.
      expense || { title: '', amountMinor: 0, category: '', date: new Date().toISOString(), supplierId: '' }
    );
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Fix: Added a specific handler for the amount input to convert major units (e.g., 10.50) to minor units (e.g., 1050).
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const amountInMajor = parseFloat(value) || 0;
        setFormData(prev => ({ ...prev, amountMinor: Math.round(amountInMajor * 100) }));
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Fix: Check for 'amountMinor' instead of 'amount'.
      if (!formData.title || !formData.amountMinor) {
        alert(t('fill_required_fields'));
        return;
      }
      onSave({ ...formData, date: new Date(formData.date!).toISOString() } as Omit<Expense, 'id'> | Expense);
    };
  
    if (!expense) return null;
  
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <GlassCard className="w-full max-w-lg">
          <h2 className="text-2xl font-bold mb-6">{expense.id ? t('edit_expense') : t('add_expense')}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">{t('title')}</label>
              <input name="title" value={formData.title || ''} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-2 text-sm font-medium">{t('amount')}</label>
                    {/* Fix: Use 'amountMinor' for value, handle conversion, and use the new amount change handler. */}
                    <input name="amount" type="number" step="0.01" value={formData.amountMinor !== undefined ? (formData.amountMinor / 100).toFixed(2) : ''} onChange={handleAmountChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium">{t('category')}</label>
                    <input name="category" value={formData.category || ''} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
            </div>
             <div>
                <label className="block mb-2 text-sm font-medium">{t('supplier')}</label>
                <select name="supplierId" value={formData.supplierId || ''} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">None</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
             </div>
            <div>
              <label className="block mb-2 text-sm font-medium">{t('date')}</label>
              <input name="date" type="date" value={formData.date?.substring(0, 10) || ''} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <NeuButton type="button" onClick={onClose} variant="secondary">{t('cancel')}</NeuButton>
              <NeuButton type="submit" variant="primary">{t('save')}</NeuButton>
            </div>
          </form>
        </GlassCard>
      </div>
    );
  };
  

const ExpensesPage = () => {
    const { t } = useI18n();
    const { expenses, suppliers, addExpense, updateExpense, deleteExpense } = useDatabase();
    const { user } = useAuth();
    const { settings } = useSettings();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentExpense, setCurrentExpense] = useState<Partial<Expense> | null>(null);

    useEffect(() => {
        // Fix: Correctly call createIcons on window.lucide and add ts-ignore to prevent type errors.
        // @ts-ignore
        if (window.lucide) {
            // @ts-ignore
            window.lucide.createIcons();
        }
    });

    const getSupplierName = (id?: string) => suppliers.find(s => s.id === id)?.name || '-';

    const handleAdd = () => {
        setCurrentExpense({});
        setIsModalOpen(true);
    };

    const handleEdit = (expense: Expense) => {
        setCurrentExpense(expense);
        setIsModalOpen(true);
    };

    // Fix: Correctly type the id as ExpenseId.
    const handleDelete = (id: ExpenseId) => {
        if(window.confirm(t('confirm_delete_expense'))) {
            deleteExpense(id);
        }
    };

    const handleSave = (expenseData: Omit<Expense, 'id'> | Expense) => {
        if (!user) return;
        const dataWithUser = { ...expenseData, userId: user.id };

        if ('id' in dataWithUser && dataWithUser.id) {
            updateExpense(dataWithUser as Expense);
        } else {
            addExpense(dataWithUser as Omit<Expense, 'id'>);
        }
        handleCloseModal();
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentExpense(null);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">{t('expenses')}</h1>
            <GlassCard className="mb-6">
                <div className="flex justify-end">
                    <NeuButton onClick={handleAdd} variant="primary">{t('add_expense')}</NeuButton>
                </div>
            </GlassCard>
            <GlassCard>
                <div className="overflow-x-auto">
                     <table className="w-full text-left min-w-[750px]">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="p-4">{t('title')}</th>
                                <th className="p-4">{t('category')}</th>
                                <th className="p-4">{t('supplier')}</th>
                                <th className="p-4">{t('date')}</th>
                                <th className="p-4 text-right">{t('amount')}</th>
                                <th className="p-4 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(expense => (
                                <tr key={expense.id} className="border-b border-white/20 last:border-b-0 hover:bg-white/10 dark:hover:bg-black/10 transition-colors">
                                    <td className="p-4 font-semibold">{expense.title}</td>
                                    <td className="p-4">{expense.category}</td>
                                    <td className="p-4">{getSupplierName(expense.supplierId)}</td>
                                    <td className="p-4">{new Date(expense.date).toLocaleDateString()}</td>
                                    {/* Fix: Display amount from 'amountMinor' and format it correctly. */}
                                    <td className="p-4 text-right">{settings.currency}{(expense.amountMinor / 100).toFixed(2)}</td>
                                    <td className="p-4">
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => handleEdit(expense)} className="p-2 hover:bg-white/20 rounded-full" title={t('edit')}>
                                                <i data-lucide="pencil" className="w-4 h-4"></i>
                                            </button>
                                            <button onClick={() => handleDelete(expense.id)} className="p-2 hover:bg-white/20 rounded-full text-red-500" title={t('delete')}>
                                                <i data-lucide="trash-2" className="w-4 h-4"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
            {isModalOpen && <ExpenseModal expense={currentExpense} onClose={handleCloseModal} onSave={handleSave} />}
        </div>
    );
};

export default ExpensesPage;