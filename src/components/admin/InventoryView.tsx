'use client';
import React from 'react';

export default function InventoryView() {
  interface Product {
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

/* ----------------------------
    API Calls
    --------------------------*/
    // get all products
    const fetchProducts = async (): Promise<Product[]> => {
      try {
        const res = await fetch('http://localhost:4000/api/products', {cache: "no-store"});
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        return data.products || [];
      } catch (error){
        console.error("Error loading products:", error);
        return [];
      }
    };

    
  const products = [
    { name: 'Tomatoes', stock: 120, sold: 80, price: 10 },
    { name: 'Lettuce', stock: 50, sold: 100, price: 8 },
    { name: 'Carrots', stock: 0, sold: 40, price: 6 },
  ]; 

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Inventory Management</h2>

      <button className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
        + Add Product
      </button>

      <table className="w-full bg-white text-black shadow rounded-lg">
        <thead>
          <tr className="text-left bg-gray-50 border-b">
            <th className="p-3">Product</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Sold</th>
            <th className="p-3">Price (P)</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr key={i} className="border-b text-black hover:bg-gray-50">
              <td className="p-3">{p.name}</td>
              <td className={`p-3 ${p.stock === 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>{p.stock}</td>
              <td className="p-3 text-gray-700">{p.sold}</td>
              <td className="p-3 text-gray-700">{p.price}</td>
              <td className="p-3">
                <button className="text-blue-600 hover:underline mr-2">Edit</button>
                <button className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
