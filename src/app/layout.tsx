import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Reverse Auction Platform",
  description: "Real-time reverse auction system for buyers and suppliers.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
        {children}
      </body>
    </html>
  );
}

