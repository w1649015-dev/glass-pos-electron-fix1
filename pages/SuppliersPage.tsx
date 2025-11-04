// SuppliersPage.tsx - إدارة الموردين
import React, { useState, useEffect } from 'react';
import { useDatabase } from '@/contexts/DatabaseContext';
import { Supplier, SupplierId } from '@/types';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon, PhoneIcon, EnvelopeIcon, MapPinIcon } from '@/components/icons';

interface SupplierFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export default function SuppliersPage() {
  const { suppliers, createSupplier, getSuppliers, updateSupplier, deleteSupplier, isLoading, error } = useDatabase();
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'phone' | 'email'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load suppliers on component mount
  useEffect(() => {
    getSuppliers();
  }, []);

  // Filter and sort suppliers
  const filteredAndSortedSuppliers = suppliers
    .filter(supplier =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.phone && supplier.phone.includes(searchQuery)) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (supplier.address && supplier.address.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue, 'ar')
          : bValue.localeCompare(aValue, 'ar');
      }
      
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSupplier) {
        // Update existing supplier
        await updateSupplier(editingSupplier.id, formData);
      } else {
        // Create new supplier
        await createSupplier(formData);
      }
      
      // Reset form and close modal
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: ''
      });
      setEditingSupplier(null);
      setShowModal(false);
      
    } catch (error) {
      console.error('Supplier operation failed:', error);
      alert('فشل في حفظ بيانات المورد');
    }
  };

  // Handle edit
  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || ''
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (supplierId: SupplierId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المورد؟ لن يكون بإستطاعك التراجع عن هذا الإجراء.')) {
      try {
        await deleteSupplier(supplierId);
      } catch (error) {
        console.error('Delete supplier failed:', error);
        alert('فشل في حذف المورد. تأكد من عدم وجود منتجات أو مصروفات مرتبطة بهذا المورد.');
      }
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: ''
    });
  };

  // Handle sorting
  const handleSort = (field: 'name' | 'phone' | 'email') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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
            <BuildingOfficeIcon className="h-6 w-6" />
            إدارة الموردين
          </h1>
          <p className="text-gray-600 mt-1">
            إجمالي الموردين: {suppliers.length}
          </p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          إضافة مورد جديد
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="البحث بالاسم، الهاتف، البريد، أو العنوان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'phone' | 'email')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="name">ترتيب بالاسم</option>
            <option value="phone">ترتيب بالهاتف</option>
            <option value="email">ترتيب بالبريد</option>
          </select>
        </div>
        
        <div>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
          </button>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedSuppliers.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <BuildingOfficeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد موردون بعد'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 text-blue-500 hover:text-blue-600 underline"
              >
                إضافة مورد جديد
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedSuppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="mr-3">
                      <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                      <p className="text-sm text-gray-500">مورد</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="تعديل"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="حذف"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {supplier.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  
                  {supplier.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="break-all">{supplier.email}</span>
                    </div>
                  )}
                  
                  {supplier.address && (
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{supplier.address}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    تاريخ الإضافة: {new Date(supplier.createdAt || '').toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table View Option */}
      {filteredAndSortedSuppliers.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">جدول الموردين</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    الاسم {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('phone')}
                  >
                    الهاتف {sortBy === 'phone' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('email')}
                  >
                    البريد الإلكتروني {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العنوان
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الإنشاء
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="mr-3">
                          <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {supplier.phone ? (
                        <div className="flex items-center text-sm text-gray-900">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {supplier.phone}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {supplier.email ? (
                        <div className="flex items-center text-sm text-gray-900">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {supplier.email}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {supplier.address ? (
                        <div className="flex items-center text-sm text-gray-900 max-w-xs">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                          <span className="truncate" title={supplier.address}>{supplier.address}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(supplier.createdAt || '').toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="تعديل"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="حذف"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المورد *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: شركة التوريدات المحدودة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: +966112345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: supplier@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  العنوان
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="عنوان المورد..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {editingSupplier ? 'تحديث' : 'إضافة'}
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