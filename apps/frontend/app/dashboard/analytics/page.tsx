"use client";

import { useEffect, useState } from "react";
import { fetchAuthenticated } from "@/lib/api-client";
import { Card, LoadingSkeleton, EmptyState } from "@oracle69/ui";

interface KpiData {
  eiKpi: Record<string, unknown>;
  oiOperations: Record<string, unknown>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const result: KpiData = await fetchAuthenticated("/v1/analytics/kpis");
        setData(result);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading)
    return (
      <div className="p-8">
        <LoadingSkeleton className="h-64" />
      </div>
    );

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>

      {!data || (!data.eiKpi && !data.oiOperations) ? (
        <EmptyState
          title="No analytics data"
          description="System activity is not yet sufficient to generate analytics insights."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {data.eiKpi && (
            <Card>
              <h2 className="font-bold mb-4">Enterprise KPI Snapshot</h2>
              <pre className="text-xs">{JSON.stringify(data.eiKpi, null, 2)}</pre>
            </Card>
          )}
          {data.oiOperations && (
            <Card>
              <h2 className="font-bold mb-4">Operations Snapshot</h2>
              <pre className="text-xs">{JSON.stringify(data.oiOperations, null, 2)}</pre>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
