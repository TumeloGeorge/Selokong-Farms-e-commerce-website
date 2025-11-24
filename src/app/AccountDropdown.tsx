"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccountDropdown() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Detect clicks outside dropdown to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load user from localStorage (JWT)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setUser({ loggedIn: true });
    } else {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-gray-700 hover:text-green-700 font-medium transition-colors"
      >
        <User className="w-5 h-5" />
        <span>Account</span>
        <ChevronDown className="w-4 h-4 mt-[2px]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
          {!user ? (
            <>
              <button
                onClick={() => router.push("/login")}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-green-50 transition"
              >
                Login
              </button>
              <button
                onClick={() => router.push("/signup")}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-green-50 transition"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/profile")}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-green-50 transition"
              >
                My Profile
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
