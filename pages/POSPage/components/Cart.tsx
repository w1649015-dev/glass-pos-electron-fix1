import React, { useState } from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useDatabase } from '@/contexts/DatabaseContext';
// Fix: Changed named import to default import for NeuButton.
import NeuButton from '../../../components/ui/NeuButton';
import { UseCartReturn } from '../hooks/useCart';
import { CartItem } from '../../../types';

/**
 * A memoized component for a single item in the cart.
 */
const CartListItem: React.FC<{ item: CartItem; currency: string; onUpdate: (id: string, qty: number) => void; }> = React.memo(({ item, currency, onUpdate }) => (
  <div className="flex justify-between items-center mb-2 p-2 rounded bg-white/20 dark:bg-black/20">
    <div>
      <p className="font-semibold text-sm">{item.name}</p>
      {/* Fix: Use 'priceMinor' and format correctly. */}
      <p className="text-xs">{currency}{(item.priceMinor / 100).toFixed(2)}</p>
    </div>
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={item.quantity}
        onChange={e => onUpdate(item.id, parseInt(e.target.value))}
        className="w-14 text-center bg-transparent rounded border border-gray-400/50"
        aria-label={`Quantity for ${item.name}`}
        max={item.stock}
        min={0}
      />
      <p className="font-semibold w-20 text-right text-sm">
        {/* Fix: Use 'priceMinor' for total calculation and format correctly. */}
        {currency}{((item.priceMinor * item.quantity) / 100).toFixed(2)}
      </p>
    </div>
  </div>
));

/**
 * Component for displaying the cart, totals, and checkout actions.
 */
export const Cart: React.FC<{ cartHook: UseCartReturn; onCheckout: (customerId: string) => void; }> = ({ cartHook, onCheckout }) => {
  const { t } = useI18n();
  const { settings } = useSettings();
  const { customers } = useDatabase();
  const { cartItems, totals, updateQuantity, setDiscount, discount } = cartHook;
  const [customerId, setCustomerId] = useState('');
  
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setDiscount(isNaN(value) ? 0 : value);
  };


  return (
    <>
      <h2 className="text-2xl font-bold mb-4">{t('cart')}</h2>
      <div className="flex-1 overflow-y-auto pr-2">
        {cartItems.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">{t('cart_empty')}</p>
        ) : (
          cartItems.map(item => (
            <CartListItem
              key={item.id}
              item={item}
              currency={settings.currency}
              onUpdate={updateQuantity}
            />
          ))
        )}
      </div>

      <div className="pt-4 border-t border-white/20">
        <div className="flex justify-between mb-2 text-sm">
          <p>{t('subtotal')}</p>
          {/* Fix: Format totals from minor units. */}
          <p>{settings.currency}{(totals.subtotal / 100).toFixed(2)}</p>
        </div>
        
        <div className="flex justify-between items-center mb-2 text-sm">
            <label htmlFor="discount-input">{t('discount')}</label>
            <div className="flex items-center gap-1">
                <input
                    id="discount-input"
                    type="number"
                    // Fix: Display discount from minor units.
                    value={discount > 0 ? (discount / 100).toFixed(2) : ''}
                    onChange={handleDiscountChange}
                    placeholder="0.00"
                    className="w-24 px-2 py-1 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-label={t('discount')}
                />
                <span>{settings.currency}</span>
            </div>
        </div>

        <div className="flex justify-between mb-2 text-sm">
          {/* Fix: Use 'defaultTaxRatePercent'. */}
          <p>{t('tax')} ({settings.defaultTaxRatePercent}%)</p>
          <p>{settings.currency}{(totals.tax / 100).toFixed(2)}</p>
        </div>
        <div className="flex justify-between font-bold text-xl mt-4">
          <p>{t('total')}</p>
          <p>{settings.currency}{(totals.total / 100).toFixed(2)}</p>
        </div>
        
        <div className="mt-4">
          <label htmlFor="customer-select" className="block text-sm mb-2">{t('customer')}</label>
          <select
            id="customer-select"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full p-2 rounded bg-white/20 dark:bg-black/20 border border-gray-400/50"
          >
            <option value="">{t('none')}</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <NeuButton 
          className="w-full mt-6" 
          variant="primary" 
          onClick={() => onCheckout(customerId)}
          disabled={cartItems.length === 0}
        >
          {t('checkout')}
        </NeuButton>
      </div>
    </>
  );
};