"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  Edit2,
  Lock,
  ChevronRight,
  AlertCircle,
  X,
  Plus,
  Home,
  Briefcase,
  User,
  Phone,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { authService } from "../../services/authService";

// Define types
interface CartItem {
  product_id: string;
  quantity: number;
  price: number;
  name: string;
  product?: {
    gradient_class?: string | null;
    emoji?: string | null;
  };
}

interface Address {
  id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  isDefault: boolean;
  addressType?: 'home' | 'work' | 'other';
}

interface OrderData {
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
  }>;
  shipping_address: string;
  city: string;
  phone: string;
  customer_name: string;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes?: string;
}

interface AddressFormData {
  full_name: string;
  phone_number: string;
  street_address: string;
  city: string;
  is_default: boolean;
  address_type: 'home' | 'work' | 'other';
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function AmazonStyleCheckout() {
  const router = useRouter();
  const { cart, clearCart, getSubtotal, getItemCount } = useCart();
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Address, 2: Payment, 3: Review, 4: Success
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>("cod");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>("");
  
  // Address management states
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Address form modal states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [addressFormData, setAddressFormData] = useState<AddressFormData>({
    full_name: "",
    phone_number: "",
    street_address: "",
    city: "Gaborone",
    is_default: false,
    address_type: "home",
  });

  // Calculate totals
  const subtotal = getSubtotal();
  const deliveryFee = subtotal >= 200 ? 0 : 50;
  const total = subtotal + deliveryFee;

  // Cities in Botswana
  const cities = [
    "Gaborone",
    "Francistown",
    "Molepolole",
    "Maun",
    "Serowe",
    "Kanye",
    "Mochudi",
    "Mahalapye",
    "Lobatse",
    "Palapye",
    "Tlokweng",
    "Ramotswa",
    "Thamaga",
    "Letlhakane",
    "Tonota",
    "Mogoditshane",
    "Gabane",
    "Shoshong",
    "Other"
  ];

  // Load saved addresses on component mount
  const loadAddresses = async () => {
    if (!authService.isAuthenticated()) {
      setIsLoadingAddresses(false);
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        setIsLoadingAddresses(false);
        return;
      }

      const response = await fetch(`${API_URL}/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const addresses = data.map((addr: any) => ({
          id: addr.id,
          name: addr.full_name || "Customer",
          phone: addr.phone_number || "",
          address: addr.street_address || "",
          city: addr.city || "Gaborone",
          isDefault: addr.is_default || false,
          addressType: addr.address_type || 'home'
        }));
        
        setSavedAddresses(addresses);
        
        // Set default address if available
        const defaultAddr = addresses.find((addr: Address) => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
        } else if (addresses.length > 0) {
          setSelectedAddress(addresses[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load addresses:", error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // Redirect if cart is empty on mount (except success step)
  useEffect(() => {
    if (cart.length === 0 && currentStep !== 4 && !isInitialLoad) {
      router.push('/cart');
    }
    setIsInitialLoad(false);
  }, [cart, currentStep, router, isInitialLoad]);

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError("Please select a delivery address");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Prepare order data
      const orderData: OrderData = {
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_address: selectedAddress.address,
        city: selectedAddress.city,
        phone: selectedAddress.phone,
        customer_name: selectedAddress.name,
        payment_method: selectedPayment,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        total: total
      };

      const token = authService.getToken();
      let response;

      if (authService.isAuthenticated() && token) {
        // Authenticated user - save to database
        response = await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(orderData)
        });
      } else {
        // Guest user - localStorage only
        response = await fetch(`${API_URL}/orders/guest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        });
      }

      if (response.ok) {
        const result = await response.json();
        
        // Generate order number
        const orderNum = `#GS-${Date.now().toString().slice(-8)}`;
        setOrderNumber(orderNum);
        
        // Clear cart after successful order
        clearCart();
        
        // Proceed to success step
        setCurrentStep(4);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to place order");
      }
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
      console.error("Order placement error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle adding new address
  const handleSubmitAddress = async () => {
    // Validate form
    if (!addressFormData.full_name.trim()) {
      setError("Full name is required");
      return;
    }
    if (!addressFormData.phone_number.trim()) {
      setError("Phone number is required");
      return;
    }
    if (!addressFormData.street_address.trim()) {
      setError("Street address is required");
      return;
    }
    if (!addressFormData.city.trim()) {
      setError("City is required");
      return;
    }

    setIsSubmittingAddress(true);
    setError(null);

    try {
      const token = authService.getToken();
      let response;

      if (authService.isAuthenticated() && token) {
        // Save to backend
        response = await fetch(`${API_URL}/addresses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(addressFormData)
        });

        if (response.ok) {
          const newAddressData = await response.json();
          const newAddress: Address = {
            id: newAddressData.id,
            name: newAddressData.full_name,
            phone: newAddressData.phone_number,
            address: newAddressData.street_address,
            city: newAddressData.city,
            isDefault: newAddressData.is_default,
            addressType: newAddressData.address_type
          };

          // Update addresses list
          setSavedAddresses(prev => [...prev, newAddress]);
          setSelectedAddress(newAddress);
          setShowAddressForm(false);
          
          // Reset form
          setAddressFormData({
            full_name: "",
            phone_number: "",
            street_address: "",
            city: "Gaborone",
            is_default: false,
            address_type: "home",
          });
          
          setSuccessMessage("Address added successfully!");
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to save address");
        }
      } else {
        // For guest users, save locally
        const newAddress: Address = {
          id: savedAddresses.length > 0 ? Math.max(...savedAddresses.map(a => a.id)) + 1 : 1,
          name: addressFormData.full_name,
          phone: addressFormData.phone_number,
          address: addressFormData.street_address,
          city: addressFormData.city,
          isDefault: addressFormData.is_default,
          addressType: addressFormData.address_type
        };

        setSavedAddresses(prev => [...prev, newAddress]);
        setSelectedAddress(newAddress);
        setShowAddressForm(false);
        
        // Reset form
        setAddressFormData({
          full_name: "",
          phone_number: "",
          street_address: "",
          city: "Gaborone",
          is_default: false,
          address_type: "home",
        });
        
        setSuccessMessage("Address added successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error: any) {
      setError(error.message || "Failed to save address");
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  // Open address form with some default values if user is authenticated
  const handleAddNewAddress = async () => {
    if (authService.isAuthenticated()) {
      const user = await authService.getCurrentUser();
      if (user) {
        setAddressFormData(prev => ({
          ...prev,
          full_name: user.name || "",
          phone_number: user.phone_number || ""
        }));
      }
    }
    setShowAddressForm(true);
    setError(null);
  };

  // Navigate to address management
  const handleManageAddresses = () => {
    router.push('/account/addresses');
  };

  // Handle step navigation
  const handleNextStep = () => {
    if (currentStep === 1 && !selectedAddress) {
      setError('Please select a delivery address');
      return;
    }
    if (currentStep === 2 && !selectedPayment) {
      setError('Please select a payment method');
      return;
    }
    setError(null);
    setCurrentStep(currentStep + 1);
  };

  // Handle back navigation
  const handleBackStep = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Close address form
  const closeAddressForm = () => {
    setShowAddressForm(false);
    setError(null);
    // Reset form
    setAddressFormData({
      full_name: "",
      phone_number: "",
      street_address: "",
      city: "Gaborone",
      is_default: false,
      address_type: "home",
    });
  };

  // Get address type icon
  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="w-4 h-4" />;
      case 'work': return <Briefcase className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  // ✅ Step 4: Success Screen
  if (currentStep === 4) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-2xl w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Placed Successfully!</h1>
          <p className="text-lg text-gray-600 mb-2">
            Order number:{" "}
            <span className="font-semibold text-gray-900">
              {orderNumber || `#GS-${Date.now().toString().slice(-8)}`}
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
            <button
              onClick={() => router.push('/orders')}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              View Order Details
            </button>
            <button
              onClick={() => router.push('/products')}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while addresses are loading
  if (isLoadingAddresses) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Show cart empty state
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some products to your cart before checking out.</p>
          <button
            onClick={() => router.push('/products')}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  // Address Form Modal
  const AddressFormModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Add New Address</h3>
            <p className="text-sm text-gray-600">Enter your delivery address details</p>
          </div>
          <button
            onClick={closeAddressForm}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-700">{successMessage}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Address Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
                  { value: 'work', label: 'Work', icon: <Briefcase className="w-5 h-5" /> },
                  { value: 'other', label: 'Other', icon: <User className="w-5 h-5" /> },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      addressFormData.address_type === type.value
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address_type"
                      value={type.value}
                      checked={addressFormData.address_type === type.value}
                      onChange={(e) => setAddressFormData(prev => ({
                        ...prev,
                        address_type: e.target.value as 'home' | 'work' | 'other'
                      }))}
                      className="sr-only"
                    />
                    <div className={`mb-2 ${addressFormData.address_type === type.value ? 'text-green-600' : 'text-gray-400'}`}>
                      {type.icon}
                    </div>
                    <span className={`text-sm font-medium ${
                      addressFormData.address_type === type.value ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={addressFormData.full_name}
                onChange={(e) => setAddressFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="John Doe"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={addressFormData.phone_number}
                  onChange={(e) => setAddressFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="+267 71 234 567"
                  required
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <select
                value={addressFormData.city}
                onChange={(e) => setAddressFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                required
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <textarea
                value={addressFormData.street_address}
                onChange={(e) => setAddressFormData(prev => ({ ...prev, street_address: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="House/Plot number, Street name, Area"
                rows={3}
                required
              />
            </div>

            {/* Set as Default */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_default"
                checked={addressFormData.is_default}
                onChange={(e) => setAddressFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                Set as default delivery address
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={closeAddressForm}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitAddress}
              disabled={isSubmittingAddress}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmittingAddress ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Save Address
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ Main Checkout UI
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Cart</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full shadow-lg transform hover:scale-105 transition-transform bg-white flex items-center justify-center">
                    <span className="text-lg font-bold text-green-600">SF</span>
                  </div>
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

        {/* Error Message */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

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
                            {selectedAddress.address}
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
                    {savedAddresses.length > 0 ? (
                      <>
                        <div className="space-y-4 mb-6">
                          {savedAddresses.map((address) => (
                            <label
                              key={address.id}
                              className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedAddress?.id === address.id
                                  ? 'border-green-600 bg-green-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="radio"
                                  name="address"
                                  checked={selectedAddress?.id === address.id}
                                  onChange={() => setSelectedAddress(address)}
                                  className="mt-1 w-5 h-5 text-green-600 focus:ring-green-500 focus:ring-2"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="flex items-center gap-1">
                                      {getAddressTypeIcon(address.addressType || 'home')}
                                      <span className="font-semibold text-gray-900">{address.name}</span>
                                    </div>
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

                        <div className="flex gap-3 mb-4">
                          <button
                            onClick={handleAddNewAddress}
                            className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus className="w-5 h-5" />
                            Add New Address
                          </button>
                          {authService.isAuthenticated() && (
                            <button
                              onClick={handleManageAddresses}
                              className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                              Manage Addresses
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="mb-6">
                        <div className="text-center py-8">
                          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved addresses</h3>
                          <p className="text-gray-600 mb-4">Add an address to continue with checkout</p>
                          <button
                            onClick={handleAddNewAddress}
                            className="bg-green-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mx-auto"
                          >
                            <Plus className="w-5 h-5" />
                            Add New Address
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleNextStep}
                      disabled={!selectedAddress}
                      className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
                            className="w-5 h-5 text-green-600 focus:ring-green-500 focus:ring-2"
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
                        onClick={handleBackStep}
                        className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleNextStep}
                        disabled={!selectedPayment}
                        className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
                      <h3 className="font-semibold text-gray-900 mb-4">Order Items ({getItemCount()} items)</h3>
                      <div className="space-y-3">
                        {cart.map((item: CartItem) => (
                          <div key={item.product_id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-3xl bg-gradient-to-br ${item.product?.gradient_class || 'from-gray-100 to-gray-200'}`}>
                              {item.product?.emoji || '🛒'}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-600">Qty: {item.quantity} × P{item.price.toFixed(2)}</p>
                            </div>
                            <div className="font-bold text-gray-900">
                              P{(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Details */}
                    {selectedAddress && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-gray-900 mb-2">Delivery Address</h3>
                        <div className="text-sm text-gray-700">
                          <div className="flex items-center gap-2 mb-1">
                            {getAddressTypeIcon(selectedAddress.addressType || 'home')}
                            <p className="font-medium">{selectedAddress.name}</p>
                          </div>
                          <p>{selectedAddress.address}</p>
                          <p>{selectedAddress.city}</p>
                          <p className="mt-1">{selectedAddress.phone}</p>
                        </div>
                      </div>
                    )}

                    {/* Payment Method */}
                    <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Payment Method</h3>
                      <p className="text-sm text-gray-700">💰 Cash on Delivery</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleBackStep}
                        className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
                    <span>Items ({getItemCount()})</span>
                    <span className="font-semibold">P{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery Fee</span>
                    <span className="font-semibold">
                      {deliveryFee === 0 ? 'FREE' : `P${deliveryFee.toFixed(2)}`}
                    </span>
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

                {subtotal < 200 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-amber-800 font-medium">
                      Add <strong>P{(200 - subtotal).toFixed(2)}</strong> more for <strong>FREE delivery</strong>!
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                  <p className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Secure checkout
                  </p>
                  <p className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Expected delivery: 1-3 business days
                  </p>
                  <p className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Customer support available 24/7
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && <AddressFormModal />}
    </>
  );
}