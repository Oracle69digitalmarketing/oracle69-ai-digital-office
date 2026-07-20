"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Activity, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  action: string;
  resource: string;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/activity/feed`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        } else {
          // Fallback to mock activity
          setActivities([
            { id: "1", action: "ContractGenerated", resource: "Acme Corp Proposal", status: "EVENT", createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
            { id: "2", action: "TaskCompleted", resource: "Market Analysis Q3", status: "EVENT", createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), user: { name: "Owen", email: "owen@ai.com" } },
            { id: "3", action: "AgentAssigned", resource: "Nexus Project", status: "EVENT", createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
            { id: "4", action: "RevenueUpdated", resource: "Finance Dashboard", status: "EVENT", createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch activity, using mock data:", error);
        setActivities([
          { id: "1", action: "ContractGenerated", resource: "Acme Corp Proposal", status: "EVENT", createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
          { id: "2", action: "TaskCompleted", resource: "Market Analysis Q3", status: "EVENT", createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), user: { name: "Owen", email: "owen@ai.com" } },
          { id: "3", action: "AgentAssigned", resource: "Nexus Project", status: "EVENT", createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
          { id: "4", action: "RevenueUpdated", resource: "Finance Dashboard", status: "EVENT", createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [token]);

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((item) => (
        <div key={item.id} className="flex space-x-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
            item.status === "EVENT" ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-600"
          )}>
            {item.user ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                {item.action.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <span className="text-xs text-gray-500">
                {timeAgo(new Date(item.createdAt))}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Source: <span className="font-mono text-xs">{item.resource}</span>
            </p>
          </div>
        </div>
      ))}
      {activities.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>No recent activity found.</p>
        </div>
      )}
    </div>
  );
}
