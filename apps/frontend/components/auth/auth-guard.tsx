"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Never make redirect decisions before persisted auth state has hydrated.
    if (!hydrated) {
      return;
    }
    if (!token && !pathname.startsWith("/auth")) {
      router.push("/auth/login");
    } else if (token && pathname.startsWith("/auth")) {
      router.push("/dashboard");
    }
  }, [token, pathname, router, hydrated]);

  return <>{children}</>;
}
