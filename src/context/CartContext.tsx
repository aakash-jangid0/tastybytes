import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { toastUtils } from '../utils/toastUtils';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CartState {
  cartItems: CartItem[];
  lastAction?: {
    type: string;
    itemName?: string;
  };
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearCartSilently: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export type CartAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART'; silent?: boolean };

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.cartItems.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          cartItems: state.cartItems.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
          lastAction: { type: 'ADD_EXISTING', itemName: action.payload.name }
        };
      }
      return {
        cartItems: [...state.cartItems, { ...action.payload, quantity: 1 }],
        lastAction: { type: 'ADD_NEW', itemName: action.payload.name }
      };
    }
    case 'REMOVE_FROM_CART':
      return {
        cartItems: state.cartItems.filter(item => item.id !== action.payload),
        lastAction: { type: 'REMOVE' }
      };
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity === 0) {
        return {
          cartItems: state.cartItems.filter(item => item.id !== action.payload.id),
          lastAction: { type: 'REMOVE' }
        };
      }
      return {
        cartItems: state.cartItems.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
        lastAction: { type: 'UPDATE' }
      };
    case 'CLEAR_CART':
      return {
        cartItems: [],
        lastAction: action.silent ? undefined : { type: 'CLEAR' }
      };
    default:
      return state;
  }
}

const CART_STORAGE_KEY = 'tastybytes_cart';

function loadCartFromStorage(): CartState {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) return { cartItems: JSON.parse(stored) };
  } catch {}
  return { cartItems: [] };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCartFromStorage);
  const prevStateRef = useRef<CartState>();

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cartItems));
    } catch {}
  }, [state.cartItems]);

  useEffect(() => {
    if (state.lastAction && state.lastAction !== prevStateRef.current?.lastAction) {
      switch (state.lastAction.type) {
        case 'ADD_NEW':
          toastUtils.quickSuccess(`${state.lastAction.itemName} added to cart`);
          break;
        case 'ADD_EXISTING':
          toastUtils.quickSuccess(`Added another ${state.lastAction.itemName} to cart`);
          break;
        case 'REMOVE':
          toastUtils.quickSuccess('Item removed from cart');
          break;
        case 'CLEAR':
          toastUtils.quickSuccess('Cart cleared');
          break;
      }
    }
    prevStateRef.current = state;
  }, [state]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_TO_CART', payload: { ...item, quantity: 1 } });
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const clearCartSilently = () => {
    dispatch({ type: 'CLEAR_CART', silent: true });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems: state.cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        clearCartSilently,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}