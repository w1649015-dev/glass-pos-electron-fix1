// Fix: Replaced placeholder content with a full implementation of the App component, including context providers and routing setup.
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import { DataProvider } from './contexts/DataContext';

import MainLayout from './layouts/MainLayout';
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
import InvoicesPage from './pages/InvoicesPage'; // Import the new InvoicesPage

const ThemedApp = () => {
  const { theme, language } = useSettings();

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [theme, language]);

  const { isAuthenticated } = useAuth();
  
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/*" element={isAuthenticated ? <MainLayoutWithRoutes /> : <Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
};

// Fix: Explicitly pass children prop to MainLayout to resolve TypeScript error.
const MainLayoutWithRoutes = () => (
    <MainLayout children={
        <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/pos" element={<POSPage />} />
            <Route path="/shift" element={<ShiftPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/invoices" element={<InvoicesPage />} /> 
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    } />
);

function App() {
  return (
    // Fix: Explicitly pass children prop to providers to resolve TypeScript errors.
    <SettingsProvider children={
      <I18nProvider children={
        <DataProvider children={
          <AuthProvider children={
            <ThemedApp />
          } />
        } />
      } />
    } />
  );
}

export default App;