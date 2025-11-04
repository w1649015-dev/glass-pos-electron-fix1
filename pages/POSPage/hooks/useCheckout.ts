

import { useState, useCallback } from 'react';
// Fix: Import CustomerId for type casting.
import { Sale, PaymentDetail, CustomerId } from '../../../types';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useI18n } from '../../../contexts/I18nContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { UseCartReturn } from './useCart';
import { printReceipt } from '../utils/printReceipt';

/**
 * Custom hook to manage the checkout process.
 * @param cartHook - The return value from the useCart hook.
 */
export const useCheckout = (cartHook: UseCartReturn) => {
  const { t } = useI18n();
  const { settings } = useSettings();
  const { addSale } = useDatabase();
  const { user } = useAuth();

  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setSuccessDialogOpen] = useState(false);
  const [isDrawerToastVisible, setDrawerToastVisible] = useState(false);
  const [processedSale, setProcessedSale] = useState<Sale | null>(null);

  /**
   * Initiates the checkout process by opening the payment dialog.
   */
  const startCheckout = useCallback(() => {
    if (cartHook.cartItems.length > 0 && user) {
      setPaymentDialogOpen(true);
    }
  }, [cartHook.cartItems.length, user]);

  /**
   * Closes the payment dialog.
   */
  const closePaymentDialog = useCallback(() => {
    setPaymentDialogOpen(false);
  }, []);

  /**
   * Simulates opening the cash drawer and shows a notification.
   */
  const openCashDrawer = useCallback(() => {
    console.log('--- SIMULATING CASH DRAWER OPEN ---');
    setDrawerToastVisible(true);
    setTimeout(() => setDrawerToastVisible(false), 3000);
  }, []);

  /**
   * Confirms the payment, creates the sale record, and handles post-sale actions.
   * @param payments - An array of payment details.
   * @param customerId - The ID of the selected customer.
   */
  const confirmPayment = useCallback(async (payments: PaymentDetail[], customerId: string) => {
    if (!user) return;

    const { cartItems, totals } = cartHook;
    // Fix: Use '...Minor' properties to match the Sale type.
    const newSaleData: Omit<Sale, 'id'> = {
      items: cartItems,
      subtotalMinor: totals.subtotal,
      taxMinor: totals.tax,
      discountMinor: totals.discount,
      totalMinor: totals.total,
      payments,
      date: new Date().toISOString(),
      userId: user.id,
      // Fix: Cast customerId to the strongly-typed CustomerId.
      customerId: customerId ? customerId as CustomerId : undefined,
    };

    try {
      const sale = addSale(newSaleData);
      setProcessedSale(sale);
      setPaymentDialogOpen(false);
      setSuccessDialogOpen(true);

      if (payments.some(p => p.method === 'cash')) {
        openCashDrawer();
      }

      if (settings.autoPrintReceipt) {
        printReceipt(sale, settings, t);
      }
    } catch (error) {
      console.error('Failed to process sale:', error);
      alert(t('sale_error'));
    }
  }, [user, cartHook, addSale, settings, t, openCashDrawer]);

  /**
   * Resets the state to start a new sale.
   */
  const startNewSale = useCallback(() => {
    setSuccessDialogOpen(false);
    setProcessedSale(null);
    cartHook.clearCart();
  }, [cartHook]);
  
  const closeSuccessDialog = useCallback(() => {
    setSuccessDialogOpen(false);
  }, []);

  return {
    isPaymentDialogOpen,
    isSuccessDialogOpen,
    isDrawerToastVisible,
    processedSale,
    startCheckout,
    closePaymentDialog,
    confirmPayment,
    startNewSale,
    closeSuccessDialog,
  };
};