"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || !token) {
      router.push("/auth/login");
    }
  }, [user, token, router]);

  if (!user || !token) {
    return null;
  }

  return <>{children}</>;
}
