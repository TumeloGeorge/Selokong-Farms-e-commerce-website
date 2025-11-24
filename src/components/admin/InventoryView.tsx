'use client';
import React from 'react';

export default function InventoryView() {
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

      <table className="w-full bg-white shadow rounded-lg">
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
            <tr key={i} className="border-b hover:bg-gray-50">
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
