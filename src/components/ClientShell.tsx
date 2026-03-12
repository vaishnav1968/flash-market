"use client";

import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="min-h-[calc(100vh-57px)]">{children}</main>
      <footer className="border-t border-gray-100 bg-white py-4 text-center text-xs text-gray-400">
        © 2026 FlashMarket — Zero-waste food, flash prices. Claim &amp; Pay at
        Shop.
      </footer>
    </AuthProvider>
  );
}
