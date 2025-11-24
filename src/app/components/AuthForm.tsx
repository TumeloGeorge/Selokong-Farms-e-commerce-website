// src/app/(components)/AuthForm.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface AuthFormProps {
  type: "login" | "signup";
}

export default function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url =
        type === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${url}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      // Save token and redirect
      localStorage.setItem("token", data.token);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          {type === "login" ? "Welcome Back 👋" : "Create Your Account"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "signup" && (
            <>
              <div className="flex space-x-2">
                <input
                  name="first_name"
                  placeholder="First Name"
                  onChange={handleChange}
                  required
                  className="w-1/2 border p-2 rounded text-black placeholder-gray-500"
                />
                <input
                  name="last_name"
                  placeholder="Last Name"
                  onChange={handleChange}
                  required
                  className="w-1/2 border p-2 rounded text-black placeholder-gray-500"
                />
              </div>
              <input
                name="phone"
                type="tel"
                placeholder="Phone Number"
                onChange={handleChange}
                className="w-full border p-2 rounded text-black placeholder-gray-500"
              />
            </>
          )}
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="w-full border p-2 rounded text-black placeholder-gray-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full border p-2 rounded text-black placeholder-gray-500"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition"
          >
            {loading
              ? "Please wait..."
              : type === "login"
              ? "Log In"
              : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          {type === "login" ? (
            <>
              Don’t have an account?{" "}
              <a
                href="/signup"
                className="text-indigo-600 hover:underline font-medium"
              >
                Sign up
              </a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a
                href="/login"
                className="text-indigo-600 hover:underline font-medium"
              >
                Log in
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
