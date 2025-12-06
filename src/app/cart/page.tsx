'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { ArrowLeft, ShoppingBag, Trash2, Minus, Plus } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, clearCart, getSubtotal, getTotal, getItemCount } = useCart();

  const subtotal = getSubtotal();
  const deliveryFee = subtotal >= 200 ? 0 : 50;
  const total = getTotal();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <button onClick={() => router.push('/products')} className="flex items-center gap-2 text-gray-700 hover:text-green-700 font-medium">
              <ArrowLeft className="w-5 h-5" />
              Back to Shopping
            </button>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Add some fresh products to get started!</p>
          <button
            onClick={() => router.push('/products')}
            className="bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Continue Shopping
        </button>
      </main>
    </div>
  );
}

return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/products')}
              className="flex items-center gap-2 text-gray-700 hover:text-green-700 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/checkout')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
              >
                Checkout
              </button>
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 font-medium text-sm"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.product.product_id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className={`w-32 h-32 rounded-xl bg-gradient-to-br ${item.product.gradient_class} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-5xl">{item.product.emoji}</span>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{item.product.name}</h3>
                      <button
                        onClick={async () => await removeFromCart(item.product.product_id)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-2xl font-bold text-green-700 mb-4">
                      P{item.product.price.toFixed(2)} <span className="text-sm text-gray-500">/ {item.product.unit}</span>
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => await updateQuantity(item.product.product_id, item.quantity - 1)}
                          className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4 mx-auto" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={async (e) => await updateQuantity(item.product.product_id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center text-lg font-bold border-2 border-gray-300 rounded-lg py-2"
                          min="1"
                        />
                        <button
                          onClick={async () => await updateQuantity(item.product.product_id, item.quantity + 1)}
                          className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
                        >
                          <Plus className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-semibold">Subtotal:</span>
                        <span className="text-2xl font-bold text-gray-900">P{item.subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({getItemCount()} items)</span>
                  <span className="font-semibold">P{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery Fee</span>
                  <span className="font-semibold">
                    {deliveryFee === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `P${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-green-700">P{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg mb-3"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={() => router.push('/products')}
                className="w-full border-2 border-green-600 text-green-700 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all"
              >
                Continue Shopping
              </button>

              {subtotal < 200 && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800">
                    Add <strong>P{(200 - subtotal).toFixed(2)}</strong> more for <strong>FREE delivery</strong>!
                  </p>
                </div>
              )}

              {deliveryFee === 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-800 font-semibold">
                    🎉 You qualify for FREE delivery!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}