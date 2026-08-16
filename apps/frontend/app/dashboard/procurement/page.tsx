"use client";
import { useEffect, useState } from "react";
import { procurementClient } from "./client";
import { Card, CardContent, CardHeader, CardTitle } from "@oracle69/ui";
import { ProcurementKpiMetrics } from "@oracle69/procurement-intelligence";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ApiResponse<T> {
  data: T;
}

export default function ProcurementDashboard() {
  const [data, setData] = useState<{
    kpi: ProcurementKpiMetrics;
    health: { status: string };
    insights: { summary: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      procurementClient.getKpi() as Promise<ApiResponse<ProcurementKpiMetrics>>,
      procurementClient.getHealth() as Promise<ApiResponse<{ status: string }>>,
      procurementClient.getInsights() as Promise<ApiResponse<{ summary: string }>>,
    ]).then(([kpi, health, insights]) => {
      setData({ kpi: kpi.data, health: health.data, insights: insights.data });
      setLoading(false);
    });
  }, []);

  if (loading || !data) return <div>Loading...</div>;

  const spendData = Object.entries(data.kpi.spendBySupplier).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Procurement Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Spend</CardTitle>
          </CardHeader>
          <CardContent>{data.kpi.totalSpend}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Health</CardTitle>
          </CardHeader>
          <CardContent>{data.health.status}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>{data.insights.summary}</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Spend by Supplier</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spendData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
