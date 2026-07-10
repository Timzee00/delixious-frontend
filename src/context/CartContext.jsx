import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null); // { cart, items, subtotal } | null

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {
      setCart(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const value = {
    cart,
    itemCount: cart?.items?.length || 0,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider.');
  return ctx;
}
