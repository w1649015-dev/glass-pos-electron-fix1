// Fix: Replaced placeholder content with a full implementation of the CategoriesPage, which allows users to view, rename, and delete product categories.
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import NeuButton from '../components/ui/NeuButton';
// Fix: Import Category and CategoryId types for correct data handling.
import { Category, CategoryId } from '../types';

const CategoriesPage = () => {
  const { t } = useI18n();
  // Fix: Use the correct functions and state from DataContext (categories, updateCategory, deleteCategory).
  const { categories, updateCategory, deleteCategory, products } = useData();
  const { can } = useAuth();
  const [editingCategory, setEditingCategory] = useState<CategoryId | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    // @ts-ignore
    if (window.lucide) {
      // Fix: Add @ts-ignore to suppress TypeScript error for lucide on window object.
      // @ts-ignore
      window.lucide.createIcons();
    }
  }, [categories, editingCategory]);

  const handleEdit = (category: Category) => {
    setEditingCategory(category.id);
    setNewName(category.name);
  };

  const handleSave = (category: Category) => {
    if (newName.trim() && newName.trim() !== category.name) {
      updateCategory({ ...category, name: newName.trim() });
    }
    setEditingCategory(null);
    setNewName('');
  };

  const handleDelete = (categoryId: CategoryId) => {
    if (window.confirm(`${t('confirm_delete_category')}? ${t('category_delete_warning')}`)) {
      deleteCategory(categoryId);
    }
  };

  const getProductCount = (categoryId: CategoryId) => {
    // Fix: Filter products by 'categoryId' instead of the non-existent 'category' property.
    return products.filter(p => p.categoryId === categoryId).length;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('categories')}</h1>
      
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="border-b border-white/20">
                <th className="p-4">{t('category_name')}</th>
                <th className="p-4">{t('products_count')}</th>
                <th className="p-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id} className="border-b border-white/20 last:border-b-0">
                  <td className="p-4">
                    {editingCategory === category.id ? (
                      <input 
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={() => handleSave(category)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave(category)}
                        className="px-2 py-1 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="font-semibold">{category.name}</span>
                    )}
                  </td>
                  <td className="p-4">{getProductCount(category.id)}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleEdit(category)} className="p-2 hover:bg-white/20 rounded-full" title={t('edit')}>
                        <i data-lucide="pencil" className="w-4 h-4"></i>
                      </button>
                      {can('delete_categories') && (
                        <button onClick={() => handleDelete(category.id)} className="p-2 hover:bg-white/20 rounded-full text-red-500" title={t('delete')}>
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
    </div>
  );
};

export default CategoriesPage;