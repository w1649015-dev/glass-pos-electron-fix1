

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Settings } from '../types';

const defaultSettings: Settings = {
  storeName: 'POS',
  currency: '﷼',
  // Fix: Renamed 'defaultTaxRate' to 'defaultTaxRatePercent' to match the Settings type.
  defaultTaxRatePercent: 15,
  printType: 'receipt',
  language: 'ar',
  theme: 'light',
  taxNumber: '123456789',
  storeAddress: 'ABCDEFG',
  storePhone: '123456',
  storeEmail: 'email@email.com',
  storeWebsite: 'www.website.com',
  logoImage: '',
  autoPrintReceipt: true,
};

interface SettingsContextType {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  toggleTheme: () => void;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  language: 'en' | 'ar';
  theme: 'light' | 'dark';
  exportBackup: () => string;
  importBackup: (jsonData: string) => boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const storedSettings = localStorage.getItem('pos_settings');
      // Merge stored settings with defaults to handle new fields
      return storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings;
    } catch (error) {
      console.error('Failed to parse settings from localStorage', error);
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem('pos_settings', JSON.stringify(settings));
  }, [settings]);

  const toggleTheme = () => {
    setSettings(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };
  
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({...prev, [key]: value}));
  };

  const exportBackup = (): string => {
    const allData = {
      settings,
      users: JSON.parse(localStorage.getItem('pos_users') || '[]'),
      products: JSON.parse(localStorage.getItem('pos_products') || '[]'),
      customers: JSON.parse(localStorage.getItem('pos_customers') || '[]'),
      suppliers: JSON.parse(localStorage.getItem('pos_suppliers') || '[]'),
      expenses: JSON.parse(localStorage.getItem('pos_expenses') || '[]'),
      sales: JSON.parse(localStorage.getItem('pos_sales') || '[]'),
      timestamp: new Date().toISOString(),
    };
    return JSON.stringify(allData, null, 2);
  };

  const importBackup = (jsonData: string): boolean => {
    try {
      const backup = JSON.parse(jsonData);
      if (backup.settings) setSettings(backup.settings);
      if (backup.users) localStorage.setItem('pos_users', JSON.stringify(backup.users));
      if (backup.products) localStorage.setItem('pos_products', JSON.stringify(backup.products));
      if (backup.customers) localStorage.setItem('pos_customers', JSON.stringify(backup.customers));
      if (backup.suppliers) localStorage.setItem('pos_suppliers', JSON.stringify(backup.suppliers));
      if (backup.expenses) localStorage.setItem('pos_expenses', JSON.stringify(backup.expenses));
      if (backup.sales) localStorage.setItem('pos_sales', JSON.stringify(backup.sales));
      return true;
    } catch {
      return false;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings, toggleTheme, updateSetting, language: settings.language, theme: settings.theme, exportBackup, importBackup }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
