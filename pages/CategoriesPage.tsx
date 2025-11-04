// CategoriesPage.tsx - إدارة فئات المنتجات
import React, { useState, useEffect } from 'react';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useI18n } from '@/contexts/I18nContext';
import { Category, CategoryId } from '@/types';
import { PlusIcon, PencilIcon, TrashIcon, FolderIcon, FolderOpenIcon } from '@/components/icons';

interface CategoryFormData {
  name: string;
  description: string;
  parentId: CategoryId | null;
  sortOrder: number;
  isActive: boolean;
}

export default function CategoriesPage() {
  const { categories, createCategory, getCategories, updateCategory, deleteCategory, isLoading, error } = useDatabase();
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parentId: null,
    sortOrder: 0,
    isActive: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Load categories on component mount
  useEffect(() => {
    getCategories();
  }, []);

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get root categories (no parent)
  const rootCategories = filteredCategories.filter(cat => !cat.parentId);

  // Get child categories for a parent
  const getChildCategories = (parentId: CategoryId) => {
    return filteredCategories.filter(cat => cat.parentId === parentId);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory.id, formData);
      } else {
        // Create new category
        await createCategory(formData);
      }
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        parentId: null,
        sortOrder: 0,
        isActive: true
      });
      setEditingCategory(null);
      setShowModal(false);
      
    } catch (error) {
      console.error('Category operation failed:', error);
      alert('فشل في حفظ الفئة');
    }
  };

  // Handle edit
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId || null,
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive !== false
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (categoryId: CategoryId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم نقل المنتجات إلى فئة "بدون فئة"')) {
      try {
        await deleteCategory(categoryId);
      } catch (error) {
        console.error('Delete category failed:', error);
        alert('فشل في حذف الفئة');
      }
    }
  };

  // Toggle category expansion
  const toggleExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      parentId: null,
      sortOrder: 0,
      isActive: true
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">خطأ: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderIcon className="h-6 w-6" />
            إدارة الفئات
          </h1>
          <p className="text-gray-600 mt-1">
            إجمالي الفئات: {categories.length}
          </p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          إضافة فئة جديدة
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="البحث في الفئات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">فئات المنتجات</h2>
        </div>
        
        <div className="p-4">
          {rootCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد فئات بعد</p>
              <p className="text-sm">انقر على "إضافة فئة جديدة" للبدء</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rootCategories.map((category) => {
                const children = getChildCategories(category.id);
                const isExpanded = expandedCategories.has(category.id);
                
                return (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    children={children}
                    isExpanded={isExpanded}
                    onToggleExpansion={() => toggleExpansion(category.id)}
                    onEdit={() => handleEdit(category)}
                    onDelete={() => handleDelete(category.id)}
                    level={0}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الفئة *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: المشروبات"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="وصف الفئة..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الفئة الأب
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    parentId: e.target.value ? e.target.value as CategoryId : null 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">فئة رئيسية</option>
                  {categories
                    .filter(cat => cat.id !== editingCategory?.id)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ترتيب العرض
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="mr-2 block text-sm text-gray-900">
                  نشطة
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {editingCategory ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Category Row Component
interface CategoryRowProps {
  category: Category;
  children: Category[];
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onEdit: () => void;
  onDelete: () => void;
  level: number;
}

function CategoryRow({ category, children, isExpanded, onToggleExpansion, onEdit, onDelete, level }: CategoryRowProps) {
  const hasChildren = children.length > 0;
  
  return (
    <div>
      <div
        className={`flex items-center p-3 hover:bg-gray-50 rounded-lg ${level > 0 ? 'ml-6 border-l-2 border-gray-200' : ''}`}
        style={{ marginLeft: `${level * 24}px` }}
      >
        {hasChildren ? (
          <button
            onClick={onToggleExpansion}
            className="mr-2 p-1 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <FolderOpenIcon className="h-4 w-4 text-gray-600" />
            ) : (
              <FolderIcon className="h-4 w-4 text-gray-600" />
            )}
          </button>
        ) : (
          <FolderIcon className="h-4 w-4 text-gray-400 mr-6" />
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{category.name}</h3>
            {!category.isActive && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">غير نشطة</span>
            )}
          </div>
          {category.description && (
            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {category.sortOrder}
          </span>
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            title="تعديل"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
            title="حذف"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <CategoryRow
              key={child.id}
              category={child}
              children={[]}
              isExpanded={false}
              onToggleExpansion={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}