
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../../../contexts/I18nContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { Sale } from '../../../types';
// Fix: Changed named import to default import for GlassCard.
import GlassCard from '../../../components/ui/GlassCard';
// Fix: Changed named import to default import for NeuButton.
import NeuButton from '../../../components/ui/NeuButton';
import { printReceipt } from '../utils/printReceipt';

/**
 * A dialog displayed upon successful payment completion.
 */
export const SuccessDialog = ({
  sale,
  onClose,
  onNewSale
}: {
  sale: Sale;
  onClose: () => void;
  onNewSale: () => void;
}) => {
  const { t } = useI18n();
  const { settings } = useSettings();
  
  useEffect(() => {
    // Fix: Cast window to any to access lucide property without type errors.
     if ((window as any).lucide) {
        (window as any).lucide.createIcons();
    }
  }, []);

  const handlePrint = () => {
    printReceipt(sale, settings, t);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <GlassCard className="w-full max-w-md">
          <div className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.2, type: 'spring' } }} className="mb-4 text-green-500">
              <i data-lucide="check-circle-2" className="w-20 h-20 mx-auto" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-4">{t('payment_success')}</h2>
            <p className="mb-6">{t('payment_success_message')}</p>
            <div className="space-y-4">
              <NeuButton className="w-full" onClick={handlePrint}>
                {t('print_receipt')}
              </NeuButton>
              <NeuButton className="w-full" variant="primary" onClick={onNewSale} autoFocus>
                {t('new_sale')}
              </NeuButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
