
import React from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

// Fix: Changed named import to default import for GlassCard.
import GlassCard from '../components/ui/GlassCard';
import { ProductGrid } from './POSPage/components/ProductGrid';
import { Cart } from './POSPage/components/Cart';
import { PaymentDialog } from './POSPage/components/PaymentDialog';
import { SuccessDialog } from './POSPage/components/SuccessDialog';
import { NoShiftWarning } from './POSPage/components/NoShiftWarning';
import { CashDrawerToast } from './POSPage/components/CashDrawerToast';

import { useCart } from './POSPage/hooks/useCart';
import { useCheckout } from './POSPage/hooks/useCheckout';

/**
 * The main Point of Sale page component.
 * This component has been refactored to act as a container, orchestrating various sub-components and hooks.
 * - `useCart` hook manages all shopping cart state and logic.
 * - `useCheckout` hook manages the entire checkout process, including dialogs and sale submission.
 * - The UI is split into logical components like `ProductGrid` and `Cart`.
 */
const POSPage: React.FC = () => {
  const { products, customers } = useData();
  const { user } = useAuth();
  const { getActiveShiftForUser } = useData();

  const activeShift = user ? getActiveShiftForUser(user.id) : null;

  const cartHook = useCart();
  const checkoutHook = useCheckout(cartHook);

  const {
    isPaymentDialogOpen,
    isSuccessDialogOpen,
    isDrawerToastVisible,
    processedSale,
    startCheckout,
    confirmPayment,
    startNewSale,
    closeSuccessDialog,
  } = checkoutHook;

  if (!activeShift) {
    return <NoShiftWarning />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      <ProductGrid products={products} onAddToCart={cartHook.addToCart} />

      <GlassCard className="lg:w-2/5 flex flex-col">
        <Cart cartHook={cartHook} onCheckout={startCheckout} />
      </GlassCard>

      {isPaymentDialogOpen && (
        <PaymentDialog
          total={cartHook.totals.total}
          onClose={checkoutHook.closePaymentDialog}
          onConfirm={confirmPayment}
        />
      )}

      {isSuccessDialogOpen && processedSale && (
        <SuccessDialog
          sale={processedSale}
          onClose={closeSuccessDialog}
          onNewSale={startNewSale}
        />
      )}

      {isDrawerToastVisible && <CashDrawerToast />}
    </div>
  );
};

export default POSPage;
