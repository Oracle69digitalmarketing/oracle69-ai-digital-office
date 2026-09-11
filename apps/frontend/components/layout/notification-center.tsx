"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";

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
        <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-gray-400"></span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
            <button onClick={() => setIsOpen(false)} aria-label="Close notifications">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="flex items-center justify-center p-8 text-gray-500">
              <div className="text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications available</p>
              </div>
            </div>
          </div>
          <div className="border-t px-4 py-2 text-center">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all activity
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
