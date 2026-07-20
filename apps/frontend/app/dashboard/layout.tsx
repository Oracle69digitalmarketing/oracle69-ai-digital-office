"use client";

import dynamic from 'next/dynamic';

const ProtectedLayout = dynamic(() => import("@/components/layout/protected-layout"), {
  ssr: false,
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
