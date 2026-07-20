"use client";

import { Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-6">
        <Construction className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-lg text-gray-500 max-w-md mb-8">
        {description || "We're currently building this module to provide you with the best AI-driven experience. Stay tuned!"}
      </p>
      <Link 
        href="/dashboard"
        className="flex items-center space-x-2 text-indigo-600 font-semibold hover:text-indigo-500 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </Link>
    </div>
  );
}
