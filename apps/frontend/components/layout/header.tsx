"use client";

import { Search, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { NotificationCenter } from "./notification-center";

export function Header() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-8">
      <div className="flex w-96 items-center rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-500">
        <Search className="mr-2 h-4 w-4" />
        <input
          type="text"
          placeholder="Search projects, tasks, memory..."
          className="w-full bg-transparent outline-none"
        />
      </div>

      <div className="flex items-center space-x-4">
        <NotificationCenter />

        <div className="flex items-center space-x-3 border-l pl-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium text-gray-900">{user?.name}</span>
            <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="rounded-full bg-gray-200 p-2 text-gray-600 hover:bg-gray-300"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
