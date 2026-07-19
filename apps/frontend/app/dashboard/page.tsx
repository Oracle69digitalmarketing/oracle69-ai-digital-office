"use client";

import { useAuthStore } from "@/store/auth-store";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
      <p className="mt-2 text-gray-600">Your Oracle69 AI Digital Office is ready.</p>
    </div>
  );
}
