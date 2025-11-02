

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../../../contexts/I18nContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { PaymentDetail } from '../../../types';
// Fix: Changed named import to default import for GlassCard.
import GlassCard from '../../../components/ui/GlassCard';
// Fix: Changed named import to default import for NeuButton.
import NeuButton from '../../../components/ui/NeuButton';
// Fix: Added missing import for useData.
import { useData } from '../../../contexts/DataContext';

/**
 * A reusable numeric keypad component for touch-based input.
 */
const NumericKeypad: React.FC<{ onKeyPress: (key: string) => void }> = React.memo(({ onKeyPress }) => {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'backspace'];
  useEffect(() => {
    // Fix: Cast window to any to access lucide property without type errors.
    if ((window as any).lucide) {
        (window as any).lucide.createIcons();
    }
  }, []);
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map(key => (
        <NeuButton
          key={key}
          onClick={() => onKeyPress(key)}
          variant="secondary"
          className="text-xl h-14 flex justify-center items-center"
          aria-label={`Key ${key}`}
        >
          {key === 'backspace' ? <i data-lucide="delete" className="w-6 h-6" /> : key}
        </NeuButton>
      ))}
    </div>
  );
});

/**
 * A dialog component for handling single or split payments.
 */
export const PaymentDialog = ({
  total,
  onClose,
  onConfirm,
}: {
  total: number;
  onClose: () => void;
  onConfirm: (payments: PaymentDetail[], customerId: string) => void;
}) => {
  const { t } = useI18n();
  const { settings } = useSettings();
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [activeInput, setActiveInput] = useState<'cash' | 'card'>('cash');
  const { customers } = useData();
  const [customerId, setCustomerId] = useState<string>('');

  // Fix: Use 'amountMinor' for calculations.
  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amountMinor, 0), [payments]);
  const remaining = useMemo(() => total - totalPaid, [total, totalPaid]);

  const addPayment = (method: 'cash' | 'card', amountStr: string) => {
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount > 0) {
      // Fix: Create payment object with 'amountMinor' property and convert value to minor units.
      setPayments(prev => [...prev, { method, amountMinor: Math.round(amount * 100) }]);
      if (method === 'cash') setCashAmount('');
      if (method === 'card') setCardAmount('');
    }
  };
  
  const handleNumpadPress = (key: string) => {
    const currentSetter = activeInput === 'cash' ? setCashAmount : setCardAmount;
    const currentValue = activeInput === 'cash' ? cashAmount : cardAmount;
    if (key === 'backspace') {
      currentSetter(currentValue.slice(0, -1));
    } else if (key === '.' && currentValue.includes('.')) {
      return;
    } else {
      currentSetter(currentValue + key);
    }
  };
  
  useEffect(() => {
    // Fix: Cast window to any to access lucide property without type errors.
    if ((window as any).lucide) {
        (window as any).lucide.createIcons();
    }
  }, [payments]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
        <GlassCard className="w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">{t('checkout')}</h2>
          
          <div className="text-center my-4 p-4 rounded-lg bg-white/10 dark:bg-black/10">
            <p className="text-lg">{t('amount_due')}</p>
            {/* Fix: Format total from minor units. */}
            <p className="text-4xl font-bold">{settings.currency}{(total / 100).toFixed(2)}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-4">
            <div className="md:col-span-3 flex flex-col">
              {/* Inputs */}
              <div className="space-y-4">
                <PaymentInput label={t('cash')} value={cashAmount} onValueChange={setCashAmount} onFocus={() => setActiveInput('cash')} onAdd={() => addPayment('cash', cashAmount)} />
                <PaymentInput label={t('card')} value={cardAmount} onValueChange={setCardAmount} onFocus={() => setActiveInput('card')} onAdd={() => addPayment('card', cardAmount)} />
              </div>

              {/* Totals */}
              <div className="bg-white/20 dark:bg-black/20 p-4 rounded-lg my-4 mt-auto">
                <div className="flex justify-between text-lg font-semibold">
                  <span>{t('total_paid')}</span>
                  <span>{settings.currency}{(totalPaid / 100).toFixed(2)}</span>
                </div>
                <div className={`flex justify-between text-lg font-bold mt-2 ${remaining > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  <span>{t('remaining')}</span>
                  <span>{settings.currency}{(remaining / 100).toFixed(2)}</span>
                </div>
              </div>
              
               {/* Payments List */}
                <div className="space-y-2 my-2 flex-grow overflow-y-auto max-h-24">
                  <AnimatePresence>
                    {payments.map((p, i) => (
                      <motion.div key={i} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="flex justify-between items-center p-2 bg-white/10 dark:bg-black/10 rounded">
                        <span className="capitalize">{t(p.method)}</span>
                        {/* Fix: Display payment amount from 'amountMinor'. */}
                        <span>{settings.currency}{(p.amountMinor / 100).toFixed(2)}</span>
                        <button onClick={() => setPayments(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400" aria-label={`Remove ${p.method} payment`}>
                          <i data-lucide="x" className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
            </div>
            
            <div className="md:col-span-2">
              <NumericKeypad onKeyPress={handleNumpadPress} />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <NeuButton className="flex-1" variant="secondary" onClick={onClose}>{t('cancel')}</NeuButton>
            <NeuButton className="flex-1" variant="primary" disabled={remaining > 0 || payments.length === 0} onClick={() => onConfirm(payments, customerId)}>{t('confirm_payment')}</NeuButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};


const PaymentInput = ({ label, value, onValueChange, onFocus, onAdd }: { label: string, value: string, onValueChange: (v: string) => void, onFocus: () => void, onAdd: () => void }) => {
  const { t } = useI18n();
  return (
    <div>
      <label className="text-sm mb-1">{label}</label>
      <div className="flex">
        <input type="number" value={value} onChange={e => onValueChange(e.target.value)} onFocus={onFocus} className="w-full px-4 py-2 bg-white/50 dark:bg-black/50 rounded-l-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
        <NeuButton onClick={onAdd} className="rounded-l-none">{t('add')}</NeuButton>
      </div>
    </div>
  );
};