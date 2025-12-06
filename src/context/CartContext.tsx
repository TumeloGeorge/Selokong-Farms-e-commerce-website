'use client';

import { CartItem, cartUtils } from "@/app/utils/cart";
import { createContext, useContext, useState, useEffect } from 'react';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart on mount
  useEffect(() => {
    const loadCart = async () => {
      const cartItems = await cartUtils.getCart();
      setCart(cartItems);
    };
    loadCart();

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const addToCart = async (product: any, quantity: number) => {
    await cartUtils.addToCart(product, quantity);
    const updatedCart = await cartUtils.getCart();
    setCart(updatedCart);
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    await cartUtils.updateQuantity(productId, quantity);
    const updatedCart = await cartUtils.getCart();
    setCart(updatedCart);
  };

  const removeFromCart = async (productId: string) => {
    await cartUtils.removeFromCart(productId);
    const updatedCart = await cartUtils.getCart();
    setCart(updatedCart);
  };

  const clearCart = async () => {
    await cartUtils.clearCart();
    setCart([]);
  };

  const getSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getTotal = () => {
    const subtotal = getSubtotal();
    const deliveryFee = subtotal >= 200 ? 0 : 50;
    return subtotal + deliveryFee;
  };

  const getItemCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, getSubtotal, getTotal, getItemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};