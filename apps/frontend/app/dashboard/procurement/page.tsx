"use client";
import { useEffect, useState, useCallback } from "react";
import { procurementClient } from "./client";
import { Card, CardContent, CardHeader, CardTitle } from "@oracle69/ui";
import { ProcurementKpiMetrics, ProcurementHealthResult, ProcurementInsights } from "./client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ProcurementData {
  kpi: ProcurementKpiMetrics;
  health: ProcurementHealthResult;
  insights: ProcurementInsights;
}

export default function ProcurementDashboard() {
  const [data, setData] = useState<ProcurementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [kpi, health, insights] = await Promise.all([
        procurementClient.getKpi(),
        procurementClient.getHealth(),
        procurementClient.getInsights(),
      ]);
      setData({ kpi, health, insights });
      setError(null);
    } catch (err) {
      console.error("Failed to fetch procurement data:", err);
      setError("Failed to load procurement dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div>Loading...</div>;

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Procurement Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Spend</CardTitle>
            </CardHeader>
            <CardContent>-</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Health</CardTitle>
            </CardHeader>
            <CardContent>-</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Insights</CardTitle>
            </CardHeader>
            <CardContent>-</CardContent>
          </Card>
        </div>
        <div className="p-12 text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => fetchData()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Procurement Dashboard</h1>
        <div className="p-12 text-center">
          <div className="text-gray-500">No procurement data available.</div>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => fetchData()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const spendData = data.kpi.spendBySupplier
    ? Object.entries(data.kpi.spendBySupplier).map(([name, value]) => ({
        name,
        value: value ?? 0,
      }))
    : [];

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
