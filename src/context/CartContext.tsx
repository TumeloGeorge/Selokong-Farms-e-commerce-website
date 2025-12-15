'use client';

import { CartItem, cartUtils } from "@/app/utils/cart";
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  isLoading: boolean;
}

// Add this helper function at the top of CartContext.tsx
const safeToNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};





const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const cartItems = await cartUtils.getCart();
      // ✅ Filter out any items with invalid products
      const validItems = cartItems.filter(item => 
        item && 
        item.product && 
        typeof item.product === 'object' &&
        item.product.name
      );
      setCart(validItems);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCart([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load cart on mount
  useEffect(() => {
    loadCart();

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [loadCart]);

  const addToCart = async (product: any, quantity: number) => {
    try {
      await cartUtils.addToCart(product, quantity);
      await loadCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error; // Re-throw for UI to handle
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      await cartUtils.updateQuantity(productId, quantity);
      await loadCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      await cartUtils.removeFromCart(productId);
      await loadCart();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  const clearCart = async () => {
    try {
      await cartUtils.clearCart();
      setCart([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const getSubtotal = () => {
  return cart.reduce((sum, item) => {
    const price = safeToNumber(item?.price || item?.product?.price);
    const quantity = safeToNumber(item?.quantity);
    return sum + (price * quantity);
  }, 0);
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const deliveryFee = subtotal >= 200 ? 0 : 50;
    return subtotal + deliveryFee;
  };

  // Updated the getItemCount function
  const getItemCount = () => {
    return cart.reduce((sum, item) => sum + safeToNumber(item?.quantity), 0);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      updateQuantity, 
      removeFromCart, 
      clearCart, 
      getSubtotal, 
      getTotal, 
      getItemCount,
      isLoading 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};