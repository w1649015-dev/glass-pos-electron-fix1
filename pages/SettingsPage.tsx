

import React, { useState, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useI18n } from '../contexts/I18nContext';
import GlassCard from '../components/ui/GlassCard';
import NeuButton from '../components/ui/NeuButton';

const SettingsInput = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="mb-4">
        <label className="block mb-2 text-sm font-medium">{label}</label>
        <input
            {...props}
            className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>
);

const SettingsSelect = ({ label, children, ...props }: { label: string, children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <div className="mb-4">
        <label className="block mb-2 text-sm font-medium">{label}</label>
        <select {...props} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500">
            {children}
        </select>
    </div>
);

const SettingsPage = () => {
  const { t } = useI18n();
  const { settings, updateSetting, toggleTheme, exportBackup, importBackup } = useSettings();
  const [logoPreview, setLogoPreview] = useState<string | undefined>(settings.logoImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        updateSetting(name as keyof typeof settings, checked);
    } else {
        // Fix: Use 'defaultTaxRatePercent' for the number conversion check.
        updateSetting(name as keyof typeof settings, name === 'defaultTaxRatePercent' ? parseFloat(value) : value);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        updateSetting('logoImage', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportBackup = () => {
    const backupData = exportBackup();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(backupData));
    element.setAttribute('download', `pos-backup-${new Date().toISOString().split('T')[0]}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    alert(t('backup_created_successfully'));
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const jsonData = reader.result as string;
          if (importBackup(jsonData)) {
            alert(t('backup_restored_successfully'));
            window.location.reload();
          } else {
            alert(t('invalid_backup_file'));
          }
        } catch {
          alert(t('invalid_backup_file'));
        }
      };
      reader.readAsText(file);
    }
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('settings')}</h1>
      
      <div className="space-y-6 max-w-4xl mx-auto">
        
        <GlassCard>
          <h2 className="text-xl font-bold mb-4">{t('store')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingsInput label={t('store_name')} name="storeName" value={settings.storeName} onChange={handleInputChange} />
            <SettingsInput label={t('tax_number')} name="taxNumber" value={settings.taxNumber || ''} onChange={handleInputChange} />
            <SettingsInput label={t('store_address')} name="storeAddress" value={settings.storeAddress || ''} onChange={handleInputChange} />
            <SettingsInput label={t('store_phone')} name="storePhone" value={settings.storePhone || ''} onChange={handleInputChange} />
            <SettingsInput label={t('store_email')} name="storeEmail" value={settings.storeEmail || ''} onChange={handleInputChange} />
            <SettingsInput label={t('store_website')} name="storeWebsite" value={settings.storeWebsite || ''} onChange={handleInputChange} />
          </div>

          <div className="mt-4">
            <label className="block mb-2 text-sm font-medium">{t('store_logo')}</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <div className="flex gap-4 items-center">
              <NeuButton onClick={() => fileInputRef.current?.click()} variant="secondary">
               {t('select_logo_file')}
              </NeuButton>
              {logoPreview && (
                <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain rounded border border-white/20" />
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-xl font-bold mb-4">{t('currency_defaultTaxRate')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingsInput label={t('currency')} name="currency" value={settings.currency} onChange={handleInputChange} />
            {/* Fix: Use 'defaultTaxRatePercent' for name and value properties. */}
            <SettingsInput label={t('tax_rate')} name="defaultTaxRatePercent" type="number" step="0.1" value={settings.defaultTaxRatePercent} onChange={handleInputChange} />
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-xl font-bold mb-4">{t('print_view')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingsSelect label={t('options_print')} name="printType" value={settings.printType} onChange={handleInputChange}>
              <option value="receipt">إيصال (Receipt)</option>
              <option value="thermal">إيصال حراري (Thermal)</option>
              <option value="a4">A4</option>
              <option value="invoice">فاتورة (Invoice)</option>
            </SettingsSelect>

            <SettingsSelect label={t('language')} name="language" value={settings.language} onChange={handleInputChange}>
              <option value="en">{t('english')}</option>
              <option value="ar">{t('arabic')}</option>
            </SettingsSelect>
          </div>
           <div className="mt-4 flex items-center gap-2">
            <input type="checkbox" id="autoPrintReceipt" name="autoPrintReceipt" checked={settings.autoPrintReceipt} onChange={handleInputChange} className="w-4 h-4" />
            <label htmlFor="autoPrintReceipt" className="text-sm font-medium">{t('auto_print_receipt')}</label>
          </div>

          <div className="mt-4">
            <label className="block mb-2 text-sm font-medium">{t('theme')}</label>
            <NeuButton onClick={toggleTheme} variant="secondary">
              {settings.theme === 'light' ? t('dark_mode') : t('light_mode')}
            </NeuButton>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-xl font-bold mb-4">{t('backup')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('save_restore_backup')}</p>
          <div className="flex gap-4">
            <NeuButton onClick={handleExportBackup} variant="primary">
              {t('create_backup')}
            </NeuButton>
            <NeuButton onClick={() => restoreFileInputRef.current?.click()} variant="secondary">
              {t('restore_backup')}
            </NeuButton>
            <input
              type="file"
              ref={restoreFileInputRef}
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default SettingsPage;