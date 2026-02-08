'use client';
import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { authService } from '@/services/authService';

interface Product {
  product_id: string;
  name: string;
  stock_quantity: number;
  sold_count?: number;
  price: number;
}

export default function InventoryView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    stock_quantity: '',
    price: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = authService.getToken();
      if (!token) throw new Error('Not authenticated');

      const data = await adminService.getProducts(token);
      // adminService.getProducts may return an array or an object with `products` key
      const fetched: any = Array.isArray(data) ? data : (data.products || data);

      setProducts(fetched.map((p: any) => ({
        product_id: p.product_id || p.id || String(p._id || ''),
        name: p.name || 'Unnamed product',
        stock_quantity: Number(p.stock_quantity ?? p.stock ?? 0),
        sold_count: Number(p.sold_count ?? p.sold ?? 0),
        price: Number(p.price ?? 0)
      })));
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      const token = authService.getToken();
      if (!token) throw new Error('Not authenticated');
      await adminService.deleteProduct(token, id);
      setProducts(products.filter(p => p.product_id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    }
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      stock_quantity: String(product.stock_quantity),
      price: String(product.price)
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      stock_quantity: '',
      price: ''
    });
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const stock = Number(formData.stock_quantity);
    const price = Number(formData.price);

    if (!formData.name.trim()) {
      alert('Product name is required');
      return;
    }
    if (Number.isNaN(stock) || Number.isNaN(price)) {
      alert('Stock and price must be valid numbers');
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) throw new Error('Not authenticated');

      if (editingProduct) {
        // Update existing product
        await adminService.updateProduct(token, editingProduct.product_id, {
          name: formData.name,
          stock_quantity: stock,
          price: price
        });

        setProducts(products.map(p =>
          p.product_id === editingProduct.product_id
            ? { ...p, name: formData.name, stock_quantity: stock, price: price }
            : p
        ));
      } else {
        // Create new product
        const created = await adminService.createProduct(token, {
          name: formData.name,
          stock_quantity: stock,
          price: price
        });

        const createdProduct = created?.product || created;
        setProducts(prev => [
          {
            product_id: createdProduct.product_id || createdProduct.id || String(createdProduct._id || Date.now()),
            name: createdProduct.name || formData.name,
            stock_quantity: Number(createdProduct.stock_quantity ?? stock),
            sold_count: Number(createdProduct.sold_count ?? 0),
            price: Number(createdProduct.price ?? price)
          },
          ...prev
        ]);
      }

      setShowForm(false);
      setFormData({ name: '', stock_quantity: '', price: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Inventory Management</h2>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <button onClick={handleAdd} className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
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
          {products.map((p) => (
            <tr key={p.product_id} className="border-b text-black hover:bg-gray-50">
              <td className="p-3">{p.name}</td>
              <td className={`p-3 ${p.stock_quantity === 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>{p.stock_quantity}</td>
              <td className="p-3 text-gray-700">{p.sold_count ?? 0}</td>
              <td className="p-3 text-gray-700">{p.price}</td>
              <td className="p-3">
                <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline mr-2">Edit</button>
                <button onClick={() => handleDelete(p.product_id)} className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Tomatoes"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingProduct ? 'Update' : 'Add'} Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}