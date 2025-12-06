// utils/cart.ts
import { authService } from '../../services/authService';

// 🔴 EDIT THIS: Change to your API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface Product {
  product_id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string;
  full_description: string;
  price: number;
  compare_at_price: number | null;
  unit: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  rating: number;
  review_count: number;
  views_count: number;
  emoji: string | null;
  gradient_class: string | null;
  category_name: string;
  category_slug?: string;
  primary_image?: string | null;
}

export interface CartItem {
  product: Product;
  subtotal: number;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  emoji: string | null;
  gradient_class: string | null;
  cart_item_id?: string; // For database operations
  stock_quantity?: number; // For validation
}

export const cartUtils = {
  // Get cart from localStorage or database based on auth status
  getCart: async (): Promise<CartItem[]> => {
    const isAuthenticated = authService.isAuthenticated();

    if (isAuthenticated) {
      // Try to get from database first
      try {
        const token = authService.getToken();
        if (!token) {
          console.warn('No auth token found');
          return cartUtils.getLocalStorageCart();
        }

        const response = await fetch(`${API_URL}/cart`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const dbCart = await response.json();
          
          // ✅ FIX: Better data mapping with validation
          return dbCart.map((item: any): CartItem => {
            const cartItem: CartItem = {
              product_id: item.product_id || '',
              name: item.name || '',
              price: parseFloat(item.price) || 0,
              quantity: parseInt(item.quantity) || 0,
              unit: item.unit || 'unit',
              emoji: item.emoji || null,
              gradient_class: item.gradient_class || '',
              cart_item_id: item.cart_item_id || '',
              stock_quantity: item.stock_quantity || 0,
              product: {
                product_id: item.product_id || '',
                name: item.name || '',
                price: parseFloat(item.price) || 0,
                unit: item.unit || 'unit',
                emoji: item.emoji || null,
                gradient_class: item.gradient_class || '',
                stock_quantity: item.stock_quantity || 0,
                category_id: item.category_id || '',
                slug: item.slug || '',
                short_description: item.short_description || '',
                full_description: item.full_description || '',
                compare_at_price: item.compare_at_price || null,
                sku: item.sku || '',
                low_stock_threshold: item.low_stock_threshold || 0,
                is_active: item.is_active || true,
                is_featured: item.is_featured || false,
                rating: item.rating || 0,
                review_count: item.review_count || 0,
                views_count: item.views_count || 0,
                category_name: item.category_name || '',
                primary_image: item.primary_image || null
              },
              subtotal: (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)
            };
            return cartItem;
          }).filter((item: CartItem) => item.product_id && item.quantity > 0);
        } else {
          console.error('Failed to fetch cart:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch cart from database:', error);
      }
    }

    // Fallback to localStorage
    return cartUtils.getLocalStorageCart();
  },

  // Save cart to appropriate storage
  saveCart: async (cartItems: CartItem[]): Promise<void> => {
    const isAuthenticated = authService.isAuthenticated();

    if (isAuthenticated) {
      // Save to database
      try {
        const token = authService.getToken();
        if (!token) {
          throw new Error('No auth token');
        }

        // Get current cart from database
        const currentCartResponse = await fetch(`${API_URL}/cart`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        let currentCart: any[] = [];
        if (currentCartResponse.ok) {
          currentCart = await currentCartResponse.json();
        }

        // Create maps for efficient comparison
        const currentCartMap = new Map(
          currentCart.map((item: any) => [item.product_id, item])
        );
        const newCartMap = new Map(
          cartItems.map((item: CartItem) => [item.product_id, item])
        );

        // ✅ FIX: Use Promise.allSettled for better error handling
        const operations: Promise<any>[] = [];

        // Remove items that are no longer in cart
        const itemsToRemove = currentCart.filter(
          (item: any) => !newCartMap.has(item.product_id)
        );
        
        for (const item of itemsToRemove) {
          if (item.cart_item_id) {
            operations.push(
              fetch(`${API_URL}/cart/${item.cart_item_id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }).catch(err => {
                console.error(`Failed to remove item ${item.product_id}:`, err);
                return null;
              })
            );
          }
        }

        // Update existing items
        for (const item of cartItems) {
          const current = currentCartMap.get(item.product_id);
          
          if (current) {
            // Item exists, update quantity if changed
            if (current.quantity !== item.quantity && current.cart_item_id) {
              operations.push(
                fetch(`${API_URL}/cart/${current.cart_item_id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ quantity: item.quantity })
                }).catch(err => {
                  console.error(`Failed to update item ${item.product_id}:`, err);
                  return null;
                })
              );
            }
          } else {
            // New item, add to cart
            operations.push(
              fetch(`${API_URL}/cart`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  product_id: item.product_id,
                  quantity: item.quantity
                })
              }).catch(err => {
                console.error(`Failed to add item ${item.product_id}:`, err);
                return null;
              })
            );
          }
        }

        // ✅ FIX: Wait for all operations to complete
        await Promise.allSettled(operations);

      } catch (error) {
        console.error('Failed to save cart to database:', error);
        // Fallback to localStorage
        cartUtils.saveToLocalStorage(cartItems);
      }
    } else {
      // Save to localStorage for guest users
      cartUtils.saveToLocalStorage(cartItems);
    }
  },

  // Add item to cart
  addToCart: async (
    product: Product,
    quantity: number = 1
  ): Promise<void> => {
    // ✅ FIX: Validate quantity
    if (quantity <= 0) {
      console.warn('Invalid quantity:', quantity);
      return;
    }

    const cartItems = await cartUtils.getCart();
    const existingItem = cartItems.find(
      item => item.product_id === product.product_id
    );

    let updatedCart: CartItem[];
    
    if (existingItem) {
      // ✅ FIX: Check stock availability
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock_quantity && newQuantity > product.stock_quantity) {
        throw new Error(`Only ${product.stock_quantity} items available in stock`);
      }

      updatedCart = cartItems.map(item =>
        item.product_id === product.product_id
          ? { ...item, quantity: newQuantity }
          : item
      );
    } else {
      // ✅ FIX: Check stock for new item
      if (product.stock_quantity && quantity > product.stock_quantity) {
        throw new Error(`Only ${product.stock_quantity} items available in stock`);
      }

      const newCartItem: CartItem = {
        product_id: product.product_id,
        name: product.name,
        price: product.price,
        quantity,
        unit: product.unit,
        emoji: product.emoji,
        gradient_class: product.gradient_class,
        stock_quantity: product.stock_quantity,
        product,
        subtotal: product.price * quantity
      };
      updatedCart = [...cartItems, newCartItem];
    }

    await cartUtils.saveCart(updatedCart);
    await cartUtils.updateCartCounter();
  },

  // Update item quantity
  updateQuantity: async (productId: string, quantity: number): Promise<void> => {
    // ✅ FIX: Remove item if quantity is 0 or negative
    if (quantity <= 0) {
      await cartUtils.removeFromCart(productId);
      return;
    }

    const cartItems = await cartUtils.getCart();
    const item = cartItems.find(item => item.product_id === productId);

    if (!item) {
      console.warn('Item not found in cart:', productId);
      return;
    }

    // ✅ FIX: Validate against stock
    if (item.stock_quantity && quantity > item.stock_quantity) {
      throw new Error(`Only ${item.stock_quantity} items available in stock`);
    }

    const updatedCart = cartItems.map(cartItem =>
      cartItem.product_id === productId
        ? { ...cartItem, quantity }
        : cartItem
    );

    await cartUtils.saveCart(updatedCart);
    await cartUtils.updateCartCounter();
  },

  // Remove item from cart
  removeFromCart: async (productId: string): Promise<void> => {
    const cartItems = await cartUtils.getCart();
    const updatedCart = cartItems.filter(
      item => item.product_id !== productId
    );
    
    await cartUtils.saveCart(updatedCart);
    await cartUtils.updateCartCounter();
  },

  // Clear entire cart
  clearCart: async (): Promise<void> => {
    const isAuthenticated = authService.isAuthenticated();

    if (isAuthenticated) {
      try {
        const token = authService.getToken();
        if (token) {
          await fetch(`${API_URL}/cart`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } catch (error) {
        console.error('Failed to clear cart in database:', error);
      }
    }

    // Clear localStorage
    cartUtils.clearLocalStorage();
    await cartUtils.updateCartCounter();
  },

  // Get cart count
  getCartCount: async (): Promise<number> => {
    try {
      const cartItems = await cartUtils.getCart();
      return cartItems.reduce(
        (total: number, item: CartItem) => total + item.quantity, 
        0
      );
    } catch (error) {
      console.error('Failed to get cart count:', error);
      return 0;
    }
  },

  // Get cart subtotal
  getCartSubtotal: async (): Promise<number> => {
    try {
      const cartItems = await cartUtils.getCart();
      return cartItems.reduce(
        (total: number, item: CartItem) => total + (item.price * item.quantity),
        0
      );
    } catch (error) {
      console.error('Failed to get cart subtotal:', error);
      return 0;
    }
  },

  // Sync local cart to database when user logs in
  syncCartToDatabase: async (): Promise<void> => {
    if (!authService.isAuthenticated()) {
      console.warn('Cannot sync cart: user not authenticated');
      return;
    }

    try {
      const localCart = cartUtils.getLocalStorageCart();
      
      if (localCart.length > 0) {
        console.log('Syncing local cart to database...', localCart.length, 'items');
        
        // Get existing cart from database
        const dbCart = await cartUtils.getCart();
        
        // Merge local and database carts
        const mergedCart = [...dbCart];
        
        for (const localItem of localCart) {
          const existingIndex = mergedCart.findIndex(
            item => item.product_id === localItem.product_id
          );
          
          if (existingIndex >= 0) {
            // Combine quantities
            mergedCart[existingIndex].quantity += localItem.quantity;
          } else {
            // Add new item
            mergedCart.push(localItem);
          }
        }
        
        // Save merged cart to database
        await cartUtils.saveCart(mergedCart);
        
        // Clear localStorage after successful sync
        cartUtils.clearLocalStorage();
        
        console.log('Cart synced successfully');
      }
    } catch (error) {
      console.error('Failed to sync cart to database:', error);
    }
  },

  // Helper methods
  saveToLocalStorage: (cartItems: CartItem[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('selokong-cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  getLocalStorageCart: (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const savedCart = localStorage.getItem('selokong-cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return [];
    }
  },

  clearLocalStorage: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('selokong-cart');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },

  // ✅ FIX: Made async to wait for getCartCount
  updateCartCounter: async (): Promise<void> => {
    try {
      // Get fresh count
      const count = await cartUtils.getCartCount();
      
      // Dispatch custom event to update all cart counters
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('cartUpdated', {
          detail: { count }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Failed to update cart counter:', error);
    }
  },

  // ✅ NEW: Validate cart item
  validateCartItem: (item: CartItem): boolean => {
    return !!(
      item.product_id &&
      item.name &&
      item.price > 0 &&
      item.quantity > 0
    );
  },

  // ✅ NEW: Get cart with calculated totals
  getCartWithTotals: async () => {
    const cartItems = await cartUtils.getCart();
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
    const deliveryFee = subtotal >= 200 ? 0 : 50;
    const total = subtotal + deliveryFee;

    return {
      items: cartItems,
      subtotal,
      deliveryFee,
      total,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  }
};

// ✅ NEW: Export individual functions for easier testing
export const {
  getCart,
  saveCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getCartCount,
  getCartSubtotal,
  syncCartToDatabase,
  updateCartCounter,
  getCartWithTotals
} = cartUtils;