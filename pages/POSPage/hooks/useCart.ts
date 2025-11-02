

import { useReducer, useMemo, useCallback } from 'react';
import { CartItem, Product } from '../../../types';
import { useSettings } from '../../../contexts/SettingsContext';

// Define the shape of the cart state
interface CartState {
  items: CartItem[];
  discount: number;
}

// Define the actions that can be dispatched to the reducer
type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'SET_DISCOUNT'; payload: number }
  | { type: 'CLEAR_CART' };

/**
 * Reducer function to manage cart state transitions.
 * @param state - The current cart state.
 * @param action - The action to perform.
 * @returns The new cart state.
 */
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const product = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);

      if (existingItem) {
        // Increase quantity if item exists and stock is available
        const newQuantity = existingItem.quantity + 1;
        if (newQuantity > product.stock) return state; // Do not add if stock is exceeded
        return {
          ...state,
          items: state.items.map(item =>
            item.id === product.id ? { ...item, quantity: newQuantity } : item
          ),
        };
      } else {
        // Add new item if stock is available
        if (product.stock <= 0) return state;
        return {
          ...state,
          items: [...state.items, { ...product, quantity: 1 }],
        };
      }
    }
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        return {
          ...state,
          items: state.items.filter(item => item.id !== productId),
        };
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.id === productId ? { ...item, quantity } : item
        ),
      };
    }
    case 'SET_DISCOUNT':
      return { ...state, discount: action.payload };
    case 'CLEAR_CART':
      return { items: [], discount: 0 };
    default:
      return state;
  }
};

/**
 * Custom hook to manage the shopping cart.
 * Encapsulates all logic for cart operations and total calculations.
 */
export const useCart = () => {
  const { settings } = useSettings();
  const [state, dispatch] = useReducer(cartReducer, { items: [], discount: 0 });

  const totals = useMemo(() => {
    // Fix: Use 'priceMinor' for calculations.
    const subtotal = state.items.reduce((sum, item) => sum + item.priceMinor * item.quantity, 0);
    const discount = Math.min(state.discount, subtotal); // Ensure discount isn't more than subtotal
    const taxableAmount = subtotal - discount;
    // Fix: Use 'defaultTaxRatePercent' for tax calculation.
    const tax = taxableAmount * (settings.defaultTaxRatePercent / 100);
    const total = taxableAmount + tax;
    return { subtotal, discount, tax, total };
  }, [state.items, state.discount, settings.defaultTaxRatePercent]);

  const addToCart = useCallback((product: Product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);
  
  const setDiscount = useCallback((amount: number) => {
    // Fix: Store discount in minor units.
    dispatch({ type: 'SET_DISCOUNT', payload: Math.round(amount * 100) });
  }, []);

  return {
    cartItems: state.items,
    discount: state.discount,
    totals,
    addToCart,
    updateQuantity,
    setDiscount,
    clearCart,
  };
};

export type UseCartReturn = ReturnType<typeof useCart>;