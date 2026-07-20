import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/auth-guard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oracle69 AI Digital Office",
  description: "AI-native enterprise operating system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
