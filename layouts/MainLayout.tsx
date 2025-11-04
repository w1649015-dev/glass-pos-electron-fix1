// MainLayout.tsx - Glass POS Main Layout with Tauri Integration
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import {
  HomeIcon, ShoppingCartIcon, ChartBarIcon, DocumentTextIcon, 
  FolderIcon, UserIcon, BuildingOfficeIcon, CashIcon,
  DocumentIcon, CogIcon, ChevronLeftIcon, ChevronRightIcon,
  PhoneIcon, MagnifyingGlassIcon, SunIcon, MoonIcon
} from '@/components/icons';

// Main Layout Component
export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings, updateSettings, theme } = useSettings();
  const { t, currentLanguage } = useI18n();
  const { isConnected, isLoading, error } = useDatabase();

  // Updated navigation with proper routes
  const navigation = [
    { 
      name: 'dashboard', 
      nameAr: 'لوحة التحكم',
      nameEn: 'Dashboard',
      href: '/', 
      icon: HomeIcon,
      description: 'نظرة عامة على الأداء والمبيعات'
    },
    { 
      name: 'pos', 
      nameAr: 'نقاط البيع',
      nameEn: 'Point of Sale',
      href: '/pos', 
      icon: ShoppingCartIcon,
      description: 'واجهة البيع الرئيسية'
    },
    { 
      name: 'products', 
      nameAr: 'المنتجات',
      nameEn: 'Products',
      href: '/products', 
      icon: ChartBarIcon,
      description: 'إدارة المخزون والمنتجات'
    },
    { 
      name: 'categories', 
      nameAr: 'الفئات',
      nameEn: 'Categories',
      href: '/categories', 
      icon: FolderIcon,
      description: 'تصنيف المنتجات'
    },
    { 
      name: 'customers', 
      nameAr: 'العملاء',
      nameEn: 'Customers',
      href: '/customers', 
      icon: UserIcon,
      description: 'إدارة بيانات العملاء'
    },
    { 
      name: 'suppliers', 
      nameAr: 'الموردين',
      nameEn: 'Suppliers',
      href: '/suppliers', 
      icon: BuildingOfficeIcon,
      description: 'إدارة الموردين والتوريدات'
    },
    { 
      name: 'expenses', 
      nameAr: 'المصروفات',
      nameEn: 'Expenses',
      href: '/expenses', 
      icon: CashIcon,
      description: 'تتبع المصروفات والنفقات'
    },
    { 
      name: 'sales', 
      nameAr: 'المبيعات',
      nameEn: 'Sales',
      href: '/sales', 
      icon: DocumentTextIcon,
      description: 'تقارير المبيعات والفواتير'
    },
    { 
      name: 'reports', 
      nameAr: 'التقارير',
      nameEn: 'Reports',
      href: '/reports', 
      icon: DocumentTextIcon,
      description: 'التقارير والإحصائيات'
    },
    { 
      name: 'settings', 
      nameAr: 'الإعدادات',
      nameEn: 'Settings',
      href: '/settings', 
      icon: CogIcon,
      description: 'إعدادات النظام'
    }
  ];

  const currentPageName = navigation.find(item => item.href === location.pathname);

  // Handle logout
  const handleLogout = () => {
    if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      logout();
      navigate('/login');
    }
  };

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    updateSettings({ theme: newTheme });
  };

  // Handle language toggle
  const handleLanguageToggle = () => {
    const newLang = currentLanguage === 'ar' ? 'en' : 'ar';
    // Note: You need to implement this in I18nContext
    console.log('Language toggle requested:', newLang);
  };

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Database Status Alert */}
      {error && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 z-50 text-center">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.266 14.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>خطأ في قاعدة البيانات: {error}</span>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-center h-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-2">
                <HomeIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">
                  {settings?.storeName || 'Glass POS'}
                </span>
                <div className="text-xs opacity-75">
                  {currentLanguage === 'ar' ? 'نقاط البيع' : 'Point of Sale'}
                </div>
              </div>
            </div>
          </div>

          {/* Database Connection Status */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {isConnected 
                  ? (currentLanguage === 'ar' ? 'متصل' : 'Connected')
                  : (currentLanguage === 'ar' ? 'غير متصل' : 'Disconnected')
                }
              </span>
              {isLoading && (
                <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const IconComponent = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title={item.description}
                >
                  <IconComponent className={`w-5 h-5 mr-3 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  <span className="flex-1 text-left">
                    {currentLanguage === 'ar' ? item.nameAr : item.nameEn}
                  </span>
                  {isActive && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-l-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role === 'ADMIN' 
                    ? (currentLanguage === 'ar' ? 'مدير النظام' : 'System Admin')
                    : (currentLanguage === 'ar' ? 'كاشير' : 'Cashier')
                  }
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title={currentLanguage === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sidebarOpen ? (
                  <ChevronLeftIcon className="w-6 h-6" />
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentPageName ? (currentLanguage === 'ar' ? currentPageName.nameAr : currentPageName.nameEn) : 'Glass POS'}
                </h1>
                {currentPageName?.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentPageName.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={currentLanguage === 'ar' ? 'البحث...' : 'Search...'}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>

              {/* Language Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={handleLanguageToggle}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentLanguage === 'en' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={handleLanguageToggle}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentLanguage === 'ar' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  ع
                </button>
              </div>

              {/* Theme Toggle */}
              <button 
                onClick={handleThemeToggle}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={currentLanguage === 'ar' ? 'تغيير المظهر' : 'Toggle theme'}
              >
                {theme === 'light' ? (
                  <MoonIcon className="w-5 h-5" />
                ) : (
                  <SunIcon className="w-5 h-5" />
                )}
              </button>

              {/* Notifications */}
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Notification dot */}
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}