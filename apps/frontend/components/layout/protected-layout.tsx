"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

import { DashboardShell } from "./dashboard-shell";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  const router = useRouter();
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
    // Never redirect on an assumed null session before hydration completes.
    if (!hydrated) {
      return;
    }
    if (!user || !token) {
      router.push("/auth/login");
    }
  }, [user, token, router, hydrated]);

  // Avoid rendering the dashboard shell for an obviously unauthenticated
  // session while persisted auth state is still hydrating.
  if (!hydrated) {
    return null;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
