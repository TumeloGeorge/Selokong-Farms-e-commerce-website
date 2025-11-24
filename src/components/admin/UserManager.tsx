'use client';
import React from 'react';

export default function UserManager() {
  const users = [
    { name: 'John Doe', email: 'john@example.com', role: 'Customer' },
    { name: 'Jane Smith', email: 'jane@example.com', role: 'Admin' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">User Management</h2>

      <div className="mb-4 flex gap-4">
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          + Add User
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Send Weekly Promotions
        </button>
      </div>

      <table className="w-full bg-white shadow rounded-lg">
        <thead>
          <tr className="text-left bg-gray-50 border-b">
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="p-3">{u.name}</td>
              <td className="p-3">{u.email}</td>
              <td className="p-3">{u.role}</td>
              <td className="p-3">
                <button className="text-blue-600 hover:underline mr-2">Edit</button>
                <button className="text-red-600 hover:underline mr-2">Delete</button>
                <button className="text-yellow-600 hover:underline">Reset Password</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
