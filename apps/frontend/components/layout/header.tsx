"use client";

import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { logoutSession } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { NotificationCenter } from "./notification-center";
import { GlobalSearch } from "./global-search";

export function Header() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const handleLogout = async () => {
    // Best-effort server revocation; local session is always cleared.
    await logoutSession();
    router.push("/auth/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-8">
      <GlobalSearch />

      <div className="flex items-center space-x-4">
        <NotificationCenter />

        <div className="flex items-center space-x-3 border-l pl-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium text-gray-900">{user?.name}</span>
            <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="rounded-full bg-gray-200 p-2 text-gray-600 hover:bg-gray-300"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
