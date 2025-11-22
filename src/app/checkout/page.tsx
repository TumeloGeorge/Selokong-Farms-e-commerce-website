"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  Edit2,
  Lock,
  ChevronRight,
} from "lucide-react";

// ✅ Sample cart data
const sampleCart = [
  { id: 1, name: "Fresh Potatoes", price: 80.00, quantity: 2, emoji: "🥔", unit: "bag" },
  { id: 2, name: "Kito F1 Watermelon", price: 12.0, quantity: 5, emoji: "🍉", unit: "seedling" },
  { id: 3, name: "Organic Tomatoes", price: 35.0, quantity: 1, emoji: "🍅", unit: "2kg" },
];

export default function AmazonStyleCheckout() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Address, 2: Payment, 3: Review, 4: Success
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Sample saved addresses
  const savedAddresses = [
    {
      id: 1,
      name: "John Doe",
      phone: "+267 7X XXX XXX",
      address: "123 Main Street, Plot 5234",
      city: "Gaborone",
      isDefault: true,
    },
    {
      id: 2,
      name: "John Doe",
      phone: "+267 7X XXX XXX",
      address: "456 Farm Road, Block 8",
      city: "Gaborone",
      isDefault: false,
    },
  ];

  const subtotal = sampleCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // simulate API
    setCurrentStep(4);
    setIsProcessing(false);
  };

  // ✅ Step 4: Success Screen
  if (currentStep === 4) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-2xl w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Placed Successfully!</h1>
          <p className="text-lg text-gray-600 mb-2">
            Order number:{" "}
            <span className="font-semibold text-gray-900">
              #GS-{Date.now().toString().slice(-8)}
            </span>
          </p>
          <p className="text-gray-600 mb-8">
            Thank you for your order! We'll send you a confirmation message shortly.
          </p>

          <div className="bg-green-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-bold text-lg mb-4 text-gray-900">What happens next?</h3>
            <div className="space-y-3">
              {[
                ["Order Confirmation", "You'll receive an SMS confirmation within 5 minutes"],
                ["Order Preparation", "We'll prepare your fresh products for delivery"],
                ["Delivery", "Expected delivery: 1-3 business days"],
              ].map(([title, desc], i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{title}</p>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              View Order Details
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Main Checkout UI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Cart</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Selokong Farms Logo"
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full shadow-lg transform hover:scale-105 transition-transform"
                />
              </div>
              <span className="text-xl font-bold text-gray-900">Selokong Farms</span>
            </div>

            <div className="flex items-center gap-1 text-gray-400">
              <Lock className="w-4 h-4" />
              <span className="text-sm">Secure Checkout</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  currentStep >= 1 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
              </div>
              <span
                className={`text-sm font-medium ${
                  currentStep >= 1 ? "text-gray-900" : "text-gray-500"
                }`}
              >
                Address
              </span>
            </div>
            <div className={`w-12 h-0.5 mx-2 ${currentStep >= 2 ? "bg-green-600" : "bg-gray-200"}`} />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  currentStep >= 2 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : "2"}
              </div>
              <span
                className={`text-sm font-medium ${
                  currentStep >= 2 ? "text-gray-900" : "text-gray-500"
                }`}
              >
                Payment
              </span>
            </div>
            <div className={`w-12 h-0.5 mx-2 ${currentStep >= 3 ? "bg-green-600" : "bg-gray-200"}`} />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  currentStep >= 3 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                3
              </div>
              <span
                className={`text-sm font-medium ${
                  currentStep >= 3 ? "text-gray-900" : "text-gray-500"
                }`}
              >
                Review
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Delivery Address */}
            <div className={`bg-white rounded-xl shadow-sm border-2 ${currentStep === 1 ? 'border-green-500' : 'border-gray-200'}`}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <MapPin className={`w-5 h-5 ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">1. Delivery Address</h2>
                      {currentStep > 1 && selectedAddress && (
                        <p className="text-sm text-gray-600">
                          {savedAddresses.find(a => a.id === selectedAddress)?.address}
                        </p>
                      )}
                    </div>
                  </div>
                  {currentStep > 1 && (
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Change
                    </button>
                  )}
                </div>
              </div>

              {currentStep === 1 && (
                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    {savedAddresses.map((address) => (
                      <label
                        key={address.id}
                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedAddress === address.id
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="address"
                            checked={selectedAddress === address.id}
                            onChange={() => setSelectedAddress(address.id)}
                            className="mt-1 w-5 h-5 text-green-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">{address.name}</span>
                              {address.isDefault && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700">{address.address}, {address.city}</p>
                            <p className="text-gray-600 text-sm mt-1">Phone: {address.phone}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <button className="w-full border-2 border-dashed border-gray-300 text-gray-600 py-3 px-4 rounded-lg font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors mb-4">
                    + Add a new address
                  </button>

                  <button
                    onClick={() => {
                      if (selectedAddress) setCurrentStep(2);
                      else alert('Please select a delivery address');
                    }}
                    disabled={!selectedAddress}
                    className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue to Payment
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Payment Method */}
            <div className={`bg-white rounded-xl shadow-sm border-2 ${currentStep === 2 ? 'border-green-500' : 'border-gray-200'} ${currentStep < 2 ? 'opacity-60' : ''}`}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <CreditCard className={`w-5 h-5 ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">2. Payment Method</h2>
                      {currentStep > 2 && selectedPayment && (
                        <p className="text-sm text-gray-600">
                          {selectedPayment === 'cod' ? 'Cash on Delivery' : selectedPayment}
                        </p>
                      )}
                    </div>
                  </div>
                  {currentStep > 2 && (
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Change
                    </button>
                  )}
                </div>
              </div>

              {currentStep === 2 && (
                <div className="p-6">
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded mb-6">
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900">Cash on Delivery Available</p>
                        <p className="text-sm text-amber-700">Pay when you receive your order</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <label
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPayment === 'cod'
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={selectedPayment === 'cod'}
                          onChange={() => setSelectedPayment('cod')}
                          className="w-5 h-5 text-green-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">Cash on Delivery</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              Recommended
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Pay with cash when your order is delivered</p>
                        </div>
                      </div>
                    </label>

                    <label className="block p-4 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <input type="radio" disabled className="w-5 h-5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-500">Credit/Debit Card</span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                              Coming Soon
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Pay securely with your card</p>
                        </div>
                      </div>
                    </label>

                    <label className="block p-4 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <input type="radio" disabled className="w-5 h-5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-500">Mobile Money</span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                              Coming Soon
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Pay with Orange Money or MyZaka</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        if (selectedPayment) setCurrentStep(3);
                        else alert('Please select a payment method');
                      }}
                      disabled={!selectedPayment}
                      className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Continue to Review
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Review Order */}
            <div className={`bg-white rounded-xl shadow-sm border-2 ${currentStep === 3 ? 'border-green-500' : 'border-gray-200'} ${currentStep < 3 ? 'opacity-60' : ''}`}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <CheckCircle className={`w-5 h-5 ${currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">3. Review Your Order</h2>
                </div>
              </div>

              {currentStep === 3 && (
                <div className="p-6">
                  {/* Order Items */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                    <div className="space-y-3">
                      {sampleCart.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center text-3xl">
                            {item.emoji}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-600">Qty: {item.quantity} × P{item.price}</p>
                          </div>
                          <div className="font-bold text-gray-900">
                            P{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Details */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Delivery Address</h3>
                    {selectedAddress && (
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">{savedAddresses.find(a => a.id === selectedAddress)?.name}</p>
                        <p>{savedAddresses.find(a => a.id === selectedAddress)?.address}</p>
                        <p>{savedAddresses.find(a => a.id === selectedAddress)?.city}</p>
                        <p className="mt-1">{savedAddresses.find(a => a.id === selectedAddress)?.phone}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Payment Method</h3>
                    <p className="text-sm text-gray-700">💰 Cash on Delivery</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          Place Order
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    By placing your order, you agree to Selokong's terms and conditions
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-gray-700">
                  <span>Items ({sampleCart.length})</span>
                  <span className="font-semibold">P{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery Fee</span>
                  <span className="font-semibold">P{deliveryFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-bold text-gray-900 mb-6">
                <span>Order Total</span>
                <span className="text-green-700">P{total.toFixed(2)}</span>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Truck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 text-sm">Free Delivery</p>
                    <p className="text-xs text-green-700">On orders over P200</p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>✓ Secure checkout</p>
                <p>✓ Expected delivery: 1-3 business days</p>
                <p>✓ Customer support available 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}