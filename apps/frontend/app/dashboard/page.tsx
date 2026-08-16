"use client";

import { useEffect, useState } from "react";
import { fetchAuthenticated } from "@/lib/api-client";
import { CheckSquare, Briefcase, Users, DollarSign, AlertCircle } from "lucide-react";
import { StatCard, Card, LoadingSkeleton, EmptyState } from "@oracle69/ui";

interface DashboardSummary {
  activeClients: number;
  activeProjects: number;
  pendingTasks: number;
  monthlyRevenue: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await fetchAuthenticated("/dashboard/summary");
        setSummary(data);
      } catch (error) {
        console.error("Failed to fetch dashboard summary:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading)
    return (
      <div className="p-8">
        <LoadingSkeleton className="h-64" />
      </div>
    );

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="mt-2 text-gray-600">Oracle69 AI Business Operating System</p>
        </div>
      </div>

      {summary ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Clients" value={summary.activeClients} icon={Users} />
          <StatCard title="Active Projects" value={summary.activeProjects} icon={Briefcase} />
          <StatCard title="Pending Tasks" value={summary.pendingTasks} icon={CheckSquare} />
          <StatCard
            title="Monthly Revenue"
            value={`$${summary.monthlyRevenue.toLocaleString()}`}
            icon={DollarSign}
          />
        </div>
      ) : (
        <EmptyState
          title="No data available"
          description="Connect your data sources to view your business health."
        />
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-6">Business Performance</h2>
            <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-sm text-gray-500">
                Business performance metrics not yet connected.
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
              Critical Alerts
            </h2>
            <p className="text-sm text-gray-500 italic">No critical alerts.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
