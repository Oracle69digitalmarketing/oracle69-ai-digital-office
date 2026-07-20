"use client";

import { Info, AlertTriangle, CheckCircle, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const notifications = [
  { id: 1, type: "info", title: "New Task Routed", message: "AI Receptionist has routed a new task: 'Acme Corp Proposal'.", time: "5 minutes ago", read: false },
  { id: 2, type: "warning", title: "Deadline Approaching", message: "Project 'Nexus Infrastructure' is nearing its deadline in 48 hours.", time: "1 hour ago", read: false },
  { id: 3, type: "success", title: "Report Generated", message: "Monthly financial report for June 2026 has been successfully generated.", time: "2 hours ago", read: true },
  { id: 4, type: "info", title: "System Update", message: "Oracle69 AI core has been updated to v2.4.5. Check the changelog for details.", time: "5 hours ago", read: true },
  { id: 5, type: "success", title: "Client Onboarding", message: "Global Tech has completed the onboarding process.", time: "1 day ago", read: true },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">Stay updated with your AI organization's latest activities.</p>
        </div>
        <div className="flex space-x-3">
          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Mark all as read
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button className="flex items-center space-x-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {notifications.map((notif) => (
            <div key={notif.id} className={cn(
              "flex p-6 transition-colors hover:bg-gray-50",
              !notif.read && "bg-indigo-50/30"
            )}>
              <div className="mr-4 mt-1">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  notif.type === "info" && "bg-blue-100 text-blue-600",
                  notif.type === "warning" && "bg-amber-100 text-amber-600",
                  notif.type === "success" && "bg-green-100 text-green-600",
                )}>
                  {notif.type === "info" && <Info className="h-5 w-5" />}
                  {notif.type === "warning" && <AlertTriangle className="h-5 w-5" />}
                  {notif.type === "success" && <CheckCircle className="h-5 w-5" />}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={cn("text-sm font-bold", notif.read ? "text-gray-900" : "text-indigo-900")}>
                    {notif.title}
                  </h3>
                  <span className="text-xs text-gray-500">{notif.time}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{notif.message}</p>
                {!notif.read && (
                  <div className="mt-3 flex space-x-4">
                    <button className="text-xs font-bold text-indigo-600 hover:text-indigo-500">Mark as read</button>
                    <button className="text-xs font-bold text-gray-400 hover:text-gray-500">Archive</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 px-6 py-4 text-center">
          <button className="text-sm font-medium text-gray-500 hover:text-gray-700">
            Load older notifications
          </button>
        </div>
      </div>
    </div>
  );
}
