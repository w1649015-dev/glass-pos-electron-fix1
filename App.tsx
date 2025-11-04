// src/App.tsx - Tauri Integration Enhanced
import React from 'react';

// Extend Window type for __TAURI__ property
declare global {
  interface Window {
    __TAURI__?: unknown;
  }
}
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import { DatabaseProvider } from './contexts/DatabaseContext'; // 🔄 Tauri Database Integration
import MainLayout  from '@/layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import ExpensesPage from './pages/ExpensesPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import UsersPage from './pages/UsersPage';
import SalesPage from './pages/SalesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ShiftPage from './pages/ShiftPage';
import InvoicesPage from './pages/InvoicesPage';
import { useSettings } from './contexts/SettingsContext';
import { useAuth } from './contexts/AuthContext';
//import  useData  from '@/contexts/DataContext'; // 🗄️ Legacy support for existing components

// 🔄 Tauri API Integration
import { tauriAPI } from './src-tauri/src/tauri';

// App container with theme and language management
function ThemedApp({ children }: { children: React.ReactNode }) {
  const { settings, language, theme } = useSettings();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    // Apply theme to document
    if (typeof window !== 'undefined' && window.__TAURI__ !== undefined) {
      console.log('🚀 Tauri Backend Connected');
    } else {
      console.log('⚠️ Running in web mode - Tauri features limited');
    }
    
    // Tauri integration check
    if (typeof window !== 'undefined' && window.__TAURI__) {
      console.log('🚀 Tauri Backend Connected');
    } else {
      console.log('⚠️ Running in web mode - Tauri features limited');
    }
  }, [settings, language, theme, isAuthenticated]);

  return <>{children}</>;
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Main app with all context providers and routing
function App() {
  return (
    <SettingsProvider>
      <DatabaseProvider>
        <AuthProvider>
          <I18nProvider>
              <HashRouter>
                <ThemedApp>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    
                    {/* Protected Routes */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }>
                      {/* Dashboard */}
                      <Route index element={<DashboardPage />} />
                      
                      {/* Core POS Features */}
                      <Route path="pos" element={<POSPage />} />
                      <Route path="products" element={<ProductsPage />} />
                      <Route path="categories" element={<CategoriesPage />} />
                      <Route path="customers" element={<CustomersPage />} />
                      <Route path="suppliers" element={<SuppliersPage />} />
                      <Route path="expenses" element={<ExpensesPage />} />
                      
                      {/* Sales & Management */}
                      <Route path="sales" element={<SalesPage />} />
                      <Route path="invoices" element={<InvoicesPage />} />
                      <Route path="shift" element={<ShiftPage />} />
                      
                      {/* Administration */}
                      <Route path="users" element={<UsersPage />} />
                      <Route path="reports" element={<ReportsPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>
                    
                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </ThemedApp>
              </HashRouter>
          </I18nProvider>
        </AuthProvider>
      </DatabaseProvider>
    </SettingsProvider>
  );
}

export default App;