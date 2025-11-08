"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-800 to-black p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 text-center">
            <Image
              src="/logo.svg"
              alt="RA Platform"
              width={50}
              height={50}
              className="mx-auto mb-3"
            />
            <h2 className="text-2xl font-bold text-white drop-shadow">{title}</h2>
            {subtitle && <p className="text-gray-300 text-sm mt-1">{subtitle}</p>}
          </div>
          <CardContent className="p-6">{children}</CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
