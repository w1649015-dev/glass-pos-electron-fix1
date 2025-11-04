// Fix: Replaced placeholder content with a full implementation of the ProductsPage, which provides a UI for viewing, searching, adding, editing, and deleting products.
import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
// Fix: Import Category and ProductId types.
import { Product, Supplier, Category, ProductId } from '../types';
import GlassCard from '../components/ui/GlassCard';
import NeuButton from '../components/ui/NeuButton';
import { useSettings } from '../contexts/SettingsContext';

const ProductModal = ({
  product,
  onClose,
  onSave,
}: {
  product: Partial<Product> | null;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'> | Product) => void;
}) => {
  const { t } = useI18n();
  // Fix: Get categories from data context for dropdown.
  const { suppliers, categories } = useDatabase();
  const [formData, setFormData] = useState<Partial<Product>>(
    // Fix: Use 'priceMinor' and 'categoryId' to match Product type.
    product || { name: '', sku: '', priceMinor: 0, stock: 0, lowStockThreshold: 5, categoryId: '', supplierId: '' }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Fix: Handle 'priceMinor' correctly.
    const isNumber = type === 'number' || name === 'stock' || name === 'lowStockThreshold';
    setFormData(prev => ({ ...prev, [name]: isNumber ? parseInt(value, 10) || 0 : value }));
  };

  // Fix: Added a specific handler for the price input to convert major units (e.g., 10.50) to minor units (e.g., 1050).
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const priceInMajor = parseFloat(value) || 0;
    setFormData(prev => ({...prev, priceMinor: Math.round(priceInMajor * 100)}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Fix: Check for 'categoryId' instead of 'category'.
    if (!formData.name || !formData.sku || !formData.categoryId) {
      alert(t('fill_required_fields'));
      return;
    }
    onSave(formData as Omit<Product, 'id'> | Product);
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
      <GlassCard className="w-full max-w-2xl my-8">
        <h2 className="text-2xl font-bold mb-6">{product.id ? t('edit_product') : t('add_product')}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">{t('product_name')}</label>
              <input name="name" value={formData.name || ''} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">{t('sku')}</label>
              <input name="sku" value={formData.sku || ''} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label className="block mb-2 text-sm font-medium">{t('category')}</label>
              {/* Fix: Replaced text input with a select dropdown for categories. */}
              <select name="categoryId" value={formData.categoryId || ''} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">{t('select_category')}</option>
                {categories.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">{t('supplier')}</label>
              <select name="supplierId" value={formData.supplierId || ''} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">{t('none')}</option>
                {suppliers.map((s: Supplier) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">{t('price')}</label>
              {/* Fix: Use 'priceMinor', handle conversion, and use the new price change handler. */}
              <input name="price" type="number" step="0.01" value={formData.priceMinor !== undefined ? (formData.priceMinor / 100).toFixed(2) : ''} onChange={handlePriceChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">{t('stock_level')}</label>
              <input name="stock" type="number" value={formData.stock || 0} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
             <div>
              <label className="block mb-2 text-sm font-medium">{t('low_stock_threshold')}</label>
              <input name="lowStockThreshold" type="number" value={formData.lowStockThreshold || 0} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
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

const ProductsPage = () => {
  const { t } = useI18n();
  // Fix: Get categories for displaying category names.
  const { products, addProduct, updateProduct, deleteProduct, categories } = useDatabase();
  const { settings } = useSettings();
  const { can } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  
  useEffect(() => {
    // Fix: Correctly call createIcons on window.lucide and add ts-ignore to prevent type errors.
    // @ts-ignore
    if (window.lucide) {
      // @ts-ignore
      window.lucide.createIcons();
    }
  });

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return t('none');
    return categories.find(c => c.id === categoryId)?.name || categoryId;
  };

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      // Fix: Filter by category name instead of the incorrect 'category' property.
      (p.categoryId && getCategoryName(p.categoryId).toLowerCase().includes(searchTerm.toLowerCase()))
    ), [products, searchTerm, categories]
  );

  const handleAdd = () => {
    setCurrentProduct({});
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  // Fix: Correctly type the product ID.
  const handleDelete = (id: ProductId) => {
    if (window.confirm(t('confirm_delete_product'))) {
      if(!deleteProduct(id)) {
        alert(t('product_in_use_error'));
      }
    }
  };

  const handleSave = (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData && productData.id) {
      updateProduct(productData as Product);
    } else {
      addProduct(productData as Omit<Product, 'id'>);
    }
    handleCloseModal();
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('products')}</h1>
      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <input
            type="text"
            placeholder={t('search_products')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:max-w-sm px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <NeuButton onClick={handleAdd} variant="primary" className="w-full md:w-auto">{t('add_product')}</NeuButton>
        </div>
      </GlassCard>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-white/20">
                <th className="p-4">{t('name')}</th>
                <th className="p-4">{t('sku')}</th>
                <th className="p-4">{t('category')}</th>
                <th className="p-4 text-right">{t('price')}</th>
                <th className="p-4 text-right">{t('stock')}</th>
                <th className="p-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-b border-white/20 last:border-b-0 hover:bg-white/10 dark:hover:bg-black/10 transition-colors">
                  <td className="p-4 font-semibold">{product.name}</td>
                  <td className="p-4">{product.sku}</td>
                  {/* Fix: Display category name instead of ID. */}
                  <td className="p-4">{getCategoryName(product.categoryId)}</td>
                  {/* Fix: Display price from 'priceMinor' and format it correctly. */}
                  <td className="p-4 text-right">{settings.currency}{(product.priceMinor / 100).toFixed(2)}</td>
                  <td className={`p-4 text-right ${product.lowStockThreshold && product.stock <= product.lowStockThreshold ? 'text-red-500 font-bold' : ''}`}>
                    {product.stock}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleEdit(product)} className="p-2 hover:bg-white/20 rounded-full" title={t('edit')}>
                        <i data-lucide="pencil" className="w-4 h-4"></i>
                      </button>
                      {can('delete_products') && (
                        <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-white/20 rounded-full text-red-500" title={t('delete')}>
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
      {isModalOpen && <ProductModal product={currentProduct} onClose={handleCloseModal} onSave={handleSave} />}
    </div>
  );
};

export default ProductsPage;