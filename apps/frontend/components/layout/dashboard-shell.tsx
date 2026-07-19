"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ReceptionistWidget } from "../ai/receptionist-widget";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
          <ReceptionistWidget />
        </main>
      </div>
    </div>
  );
}
