import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../contexts/I18nContext';
// Fix: Import SupplierId for type safety.
import { Supplier, SupplierId } from '../types';
import GlassCard from '../components/ui/GlassCard';
import NeuButton from '../components/ui/NeuButton';

const SupplierModal = ({
  supplier,
  onClose,
  onSave,
}: {
  supplier: Partial<Supplier> | null;
  onClose: () => void;
  onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => void;
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<Partial<Supplier>>(
    supplier || { name: '', phone: '', email: '' }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert(t('fill_required_fields'));
      return;
    }
    onSave(formData as Omit<Supplier, 'id'> | Supplier);
  };

  if (!supplier) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <GlassCard className="w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">{supplier.id ? t('edit_supplier') : t('add_supplier')}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium">{t('supplier_name')}</label>
            <input name="name" value={formData.name || ''} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">{t('phone')}</label>
            <input name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">{t('email')}</label>
            <input name="email" type="email" value={formData.email || ''} onChange={handleChange} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

const SuppliersPage = () => {
  const { t } = useI18n();
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier> | null>(null);

  useEffect(() => {
    // Fix: Correctly call createIcons on window.lucide and add ts-ignore to prevent type errors.
    // @ts-ignore
    if (window.lucide) {
      // @ts-ignore
      window.lucide.createIcons();
    }
  });

  const filteredSuppliers = useMemo(() =>
    suppliers.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm))
    ), [suppliers, searchTerm]
  );

  const handleAdd = () => {
    setCurrentSupplier({});
    setIsModalOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setIsModalOpen(true);
  };

  // Fix: Correctly type the id as SupplierId.
  const handleDelete = (id: SupplierId) => {
    if (window.confirm(t('confirm_delete_supplier'))) {
      if(!deleteSupplier(id)){
        alert(t('supplier_in_use_error'));
      }
    }
  };

  const handleSave = (supplierData: Omit<Supplier, 'id'> | Supplier) => {
    if ('id' in supplierData && supplierData.id) {
      updateSupplier(supplierData as Supplier);
    } else {
      addSupplier(supplierData as Omit<Supplier, 'id'>);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSupplier(null);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('suppliers')}</h1>

      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <input
            type="text"
            placeholder={t('search_suppliers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:max-w-sm px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <NeuButton onClick={handleAdd} variant="primary" className="w-full md:w-auto">{t('add_supplier')}</NeuButton>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-white/20">
                <th className="p-4">{t('name')}</th>
                <th className="p-4">{t('phone')}</th>
                <th className="p-4">{t('email')}</th>
                <th className="p-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length > 0 ? filteredSuppliers.map(supplier => (
                <tr key={supplier.id} className="border-b border-white/20 last:border-b-0 hover:bg-white/10 dark:hover:bg-black/10 transition-colors">
                  <td className="p-4 font-semibold">{supplier.name}</td>
                  <td className="p-4">{supplier.phone}</td>
                  <td className="p-4">{supplier.email}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleEdit(supplier)} className="p-2 hover:bg-white/20 rounded-full" title={t('edit')}>
                        <i data-lucide="pencil" className="w-4 h-4"></i>
                      </button>
                      <button onClick={() => handleDelete(supplier.id)} className="p-2 hover:bg-white/20 rounded-full text-red-500" title={t('delete')}>
                        <i data-lucide="trash-2" className="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-gray-500">
                    {t('no_suppliers_found')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {isModalOpen && <SupplierModal supplier={currentSupplier} onClose={handleCloseModal} onSave={handleSave} />}
    </div>
  );
};

export default SuppliersPage;