"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, X, Info, AlertTriangle, CheckCircle } from "lucide-react";

const notifications = [
  { id: 1, type: "info", message: "AI Receptionist has routed a new task.", time: "5m ago" },
  { id: 2, type: "warning", message: "Project 'Nexus' is nearing deadline.", time: "1h ago" },
  { id: 3, type: "success", message: "Monthly financial report generated.", time: "2h ago" },
];

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications"
        className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
      >
        <Bell className="h-6 w-6" />
        <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500"></span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <button 
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notif) => (
              <div key={notif.id} className="flex border-b px-4 py-4 hover:bg-gray-50">
                <div className="mr-3 mt-1">
                  {notif.type === "info" && <Info className="h-5 w-5 text-blue-500" />}
                  {notif.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                  {notif.type === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t px-4 py-2 text-center">
            <Link 
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
