"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!token && !pathname.startsWith("/auth")) {
      router.push("/auth/login");
    } else if (token && pathname.startsWith("/auth")) {
      router.push("/dashboard");
    }
  }, [token, pathname, router]);

  if (!token && !pathname.startsWith("/auth")) {
    return null;
  }

  return <>{children}</>;
}
