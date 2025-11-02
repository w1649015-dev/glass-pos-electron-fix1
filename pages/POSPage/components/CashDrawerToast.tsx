
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../../../contexts/I18nContext';
// Fix: Changed named import to default import for GlassCard.
import GlassCard from '../../../components/ui/GlassCard';

/**
 * A toast notification to indicate that the cash drawer has opened.
 */
export const CashDrawerToast: React.FC = () => {
  const { t } = useI18n();

  useEffect(() => {
    // Fix: Cast window to any to access lucide property without type errors.
    if ((window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, []);

  return (
    <motion.div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      layout
    >
      <GlassCard className="flex items-center gap-2 p-3 text-green-500 bg-green-500/10">
        <i data-lucide="archive" className="w-6 h-6" />
        <span>{t('cash_drawer_opened')}</span>
      </GlassCard>
    </motion.div>
  );
};
