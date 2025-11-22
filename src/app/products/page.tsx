'use client'

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, ShoppingCart, Star, Leaf, Search, Filter, Home } from "lucide-react";
import { useRouter } from 'next/navigation';

/* -----------------------------
   🔹 Type Definitions
--------------------------------*/
interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  fullDescription: string;
  price: number;
  unit: string;
  category: string;
  emoji: string;
  gradient: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  featured: boolean;
  benefits: string[];
  specifications: Record<string, string>;
}

interface ProductsPageProps {
  onProductClick: (slug: string) => void;
}

interface ProductDetailPageProps {
  productSlug: string | null;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

interface CartItem extends Product {
  quantity: number;
}

/* -----------------------------
   🔹 Mock Database
--------------------------------*/
const mockDatabase: Product[] = [
  {
    id: 1,
    name: "Fresh Potatoes",
    slug: "fresh-potatoes",
    description:
      "Certified seed potatoes, perfect for planting or cooking. Premium quality 5kg bags grown sustainably on our farm.",
    fullDescription:
      "Our premium potatoes are carefully selected and grown using sustainable farming practices. Perfect for both planting and cooking, these certified seed potatoes offer excellent yield and taste. Each 5kg bag contains quality-inspected potatoes that are ideal for various culinary applications or starting your own potato garden.",
    price: 49.99,
    unit: "bag",
    category: "Vegetables",
    emoji: "🥔",
    gradient: "from-amber-400 to-orange-500",
    rating: 4.8,
    reviews: 127,
    inStock: true,
    featured: true,
    benefits: ["High yield variety", "Disease resistant", "Perfect for cooking", "Long storage life"],
    specifications: {
      weight: "5kg per bag",
      origin: "GreenSprout Farm, Gaborone",
      organic: "Yes",
      variety: "Certified seed potatoes",
    },
  },
  {
    id: 2,
    name: "Kito F1 Watermelon",
    slug: "kito-f1-watermelon",
    description: "High-yield hybrid watermelon seedlings. Disease resistant and fast growing for optimal harvest.",
    fullDescription:
      "The Kito F1 is a premium hybrid watermelon variety known for its exceptional disease resistance and high yield. These seedlings are carefully nurtured in our nursery before being ready for transplant. Perfect for Botswana's climate, this variety produces sweet, juicy watermelons with excellent market appeal.",
    price: 12.0,
    unit: "seedling",
    category: "Seedlings",
    emoji: "🍉",
    gradient: "from-red-400 to-pink-500",
    rating: 4.9,
    reviews: 203,
    inStock: true,
    featured: true,
    benefits: ["Disease resistant", "High sugar content", "Fast maturity", "Excellent market size"],
    specifications: {
      maturityDays: "75-80 days",
      plantingSpacing: "2m x 2m",
      wateringNeeds: "Moderate to high",
      harvestSeason: "Summer",
    },
  },
  // ... (rest of mock products)
];

/* -----------------------------
   🔹 Simulated API Calls
--------------------------------*/
const fetchProductsFromDB = (): Promise<Product[]> =>
  new Promise((resolve) => setTimeout(() => resolve(mockDatabase), 500));

const fetchProductBySlug = (slug: string): Promise<Product | undefined> =>
  new Promise((resolve) =>
    setTimeout(() => {
      const product = mockDatabase.find((p) => p.slug === slug);
      resolve(product);
    }, 300)
  );

/* -----------------------------
   🔹 Products Page Component
--------------------------------*/
function ProductsPage({ onProductClick }: ProductsPageProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchProductsFromDB();
    setProducts(data);
    setLoading(false);
  };

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading products...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Selokong Farms Logo" width={56} height={56} className="w-14 h-14 rounded-full shadow-lg transform hover:scale-105 transition-transform"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Shop Products</h1>
                <p className="text-sm text-gray-600">Fresh from Selokong Farms</p>
              </div>
            </div>
            <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors shadow-md"
                >
                <Home className="w-5 h-5" />
                  Back to Home
                </button>

            <button className="relative p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors shadow-lg"
              onClick={() => router.push('/checkout')}
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                0
              </span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-xl hover:border-green-500 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-green-50 rounded-xl">
              <h3 className="font-semibold mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                      selectedCategory === category
                        ? "bg-green-600 text-white"
                        : "bg-white text-gray-700 hover:bg-green-100"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredProducts.length}</span> products
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => onProductClick(product.slug)}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer"
              >
                <div className={`h-56 bg-gradient-to-br ${product.gradient} flex items-center justify-center relative`}>
                  {!product.inStock && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Out of Stock
                    </div>
                  )}
                  {product.featured && (
                    <div className="absolute top-4 left-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
                      Featured
                    </div>
                  )}
                  <div className="text-8xl transform hover:scale-110 transition-transform">{product.emoji}</div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h3>
                      <span className="inline-block text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {product.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                      <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-700">{product.rating}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-green-700">P{product.price}</span>
                    <span className="text-gray-500 text-sm ml-1">/ {product.unit}</span>
                  </div>

                  <button
                    disabled={!product.inStock}
                    className={`w-full mt-4 py-3 rounded-xl font-semibold transition-all ${
                      product.inStock
                        ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {product.inStock ? "View Details" : "Out of Stock"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* -----------------------------
   🔹 Product Detail Page
--------------------------------*/
function ProductDetailPage({ productSlug, onBack, onAddToCart }: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [productSlug]);

  const loadProduct = async () => {
    if (!productSlug) {
      setProduct(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchProductBySlug(productSlug);
    setProduct(data || null);
    setLoading(false);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading product details...</p>
        </div>
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-amber-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Product not found</p>
          <button onClick={onBack} className="text-green-600 hover:text-green-700 font-semibold">
            ← Back to Products
          </button>
        </div>
      </div>
    );

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    alert(`Added ${quantity} ${product.unit}(s) of ${product.name} to cart!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-green-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Products
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8 lg:p-12 grid lg:grid-cols-2 gap-12">
          {/* Image */}
          <div>
            <div className={`bg-gradient-to-br ${product.gradient} rounded-2xl h-96 flex items-center justify-center`}>
              <div className="text-9xl">{product.emoji}</div>
            </div>
            {!product.inStock && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4 rounded">
                <p className="text-red-800 font-semibold">Currently out of stock</p>
                <p className="text-red-600 text-sm">Contact us for availability</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-700 text-lg mb-6">{product.fullDescription}</p>

            <div className="bg-green-50 rounded-2xl p-6 mb-6">
              <span className="text-5xl font-bold text-green-700">P{product.price}</span>
              <span className="text-gray-600 text-lg ml-2">/ {product.unit}</span>
            </div>

            {product.inStock && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-xl"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center text-xl font-bold border-2 border-gray-300 rounded-lg py-2 focus:border-green-500"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-xl"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${
                product.inStock
                  ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <ShoppingCart className="w-6 h-6" />
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* -----------------------------
   🔹 Main Wrapper Component
--------------------------------*/
export default function ProductPage() {
  const [currentView, setCurrentView] = useState<"products" | "detail">("products");
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const handleProductClick = (slug: string) => {
    setSelectedProductSlug(slug);
    setCurrentView("detail");
  };

  const handleBack = () => {
    setCurrentView("products");
    setSelectedProductSlug(null);
  };

 
  const handleAddToCart = (product: Product, quantity: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        return [...prevCart, { ...product, quantity }];
      }
    });
  }
  return currentView === "products" ? (
    <ProductsPage onProductClick={handleProductClick} />
  ) : (
    <ProductDetailPage
      productSlug={selectedProductSlug}
      onBack={handleBack}
      onAddToCart={handleAddToCart}
    />
  );
}