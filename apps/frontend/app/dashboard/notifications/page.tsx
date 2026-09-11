"use client";

import { useEffect, useState, useCallback } from "react";
import { Info, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@oracle69/ui";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

interface ActivityItem {
  id: string;
  action: string;
  resource: string;
  status: string;
  userId: string | null;
  user: { name: string; email: string } | null;
  organizationId: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<ActivityItem[]>("/activity/feed");
      setActivities(data);
    } catch {
      setError("Failed to load activity feed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const formatDate = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return "Unknown";
    }
  };

  const getIcon = () => {
    return <Info className="h-5 w-5" />;
  };

  const getIconColor = (status: string) => {
    return status === "EVENT"
      ? "bg-indigo-100 text-indigo-600"
      : "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Feed</h1>
          <p className="text-gray-500">
            Recent activity from your organization's systems.
            {organizationId && ` Organization: ${organizationId}`}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            onClick={fetchActivities}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center p-6">
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-lg border border-amber-100">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {activities.length === 0 ? (
              <EmptyState
                title="No activity available"
                description="There are currently no activity records for your organization. Activity will appear here as your team uses the system."
              />
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {activities.map((item) => (
                    <div
                      key={item.id}
                      className="flex p-6 transition-colors hover:bg-gray-50"
                    >
                      <div className="mr-4 mt-1">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", getIconColor(item.status))}>
                          {getIcon()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-gray-900">
                            {item.action.replace(/([A-Z])/g, " $1").trim()}
                          </h3>
                          <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {item.resource}
                          {item.user && ` by ${item.user.name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-100">
                  <span className="text-sm text-gray-400">
                    Showing the latest {activities.length} activity records
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
