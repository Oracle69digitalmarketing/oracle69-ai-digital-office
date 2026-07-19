import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
