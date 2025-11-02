import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../contexts/I18nContext';
// Fix: Import CustomerId for type safety.
import { Customer, CustomerId } from '../types';
import GlassCard from '../components/ui/GlassCard';
import NeuButton from '../components/ui/NeuButton';

const CustomerModal = ({
  customer,
  onClose,
  onSave,
}: {
  customer: Partial<Customer> | null;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id'> | Customer) => void;
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<Partial<Customer>>(
    customer || { name: '', phone: '', email: '' }
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
    onSave(formData as Omit<Customer, 'id'> | Customer);
  };

  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <GlassCard className="w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">{customer.id ? t('edit_customer') : t('add_customer')}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium">{t('customer_name')}</label>
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

const CustomersPage = () => {
  const { t } = useI18n();
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer> | null>(null);

  useEffect(() => {
    // Fix: Correctly call createIcons on window.lucide and add ts-ignore to prevent type errors.
    // @ts-ignore
    if (window.lucide) {
      // @ts-ignore
      window.lucide.createIcons();
    }
  });

  const filteredCustomers = useMemo(() =>
    customers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
    ), [customers, searchTerm]
  );

  const handleAdd = () => {
    setCurrentCustomer({});
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsModalOpen(true);
  };

  // Fix: Correctly type the id as CustomerId.
  const handleDelete = (id: CustomerId) => {
    if (window.confirm(t('confirm_delete_customer'))) {
      if(!deleteCustomer(id)){
        alert(t('customer_in_use_error'));
      }
    }
  };

  const handleSave = (customerData: Omit<Customer, 'id'> | Customer) => {
    if ('id' in customerData && customerData.id) {
      updateCustomer(customerData as Customer);
    } else {
      addCustomer(customerData as Omit<Customer, 'id'>);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCustomer(null);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('customers')}</h1>

      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <input
            type="text"
            placeholder={t('search_customers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:max-w-sm px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <NeuButton onClick={handleAdd} variant="primary" className="w-full md:w-auto">{t('add_customer')}</NeuButton>
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
              {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
                <tr key={customer.id} className="border-b border-white/20 last:border-b-0 hover:bg-white/10 dark:hover:bg-black/10 transition-colors">
                  <td className="p-4 font-semibold">{customer.name}</td>
                  <td className="p-4">{customer.phone}</td>
                  <td className="p-4">{customer.email}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleEdit(customer)} className="p-2 hover:bg-white/20 rounded-full" title={t('edit')}>
                        <i data-lucide="pencil" className="w-4 h-4"></i>
                      </button>
                      <button onClick={() => handleDelete(customer.id)} className="p-2 hover:bg-white/20 rounded-full text-red-500" title={t('delete')}>
                        <i data-lucide="trash-2" className="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-gray-500">
                    {t('no_customers_found')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {isModalOpen && <CustomerModal customer={currentCustomer} onClose={handleCloseModal} onSave={handleSave} />}
    </div>
  );
};

export default CustomersPage;