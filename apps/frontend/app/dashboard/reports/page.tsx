"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  LineChart, 
  Filter,
  Download,
  Loader2,
  FileText,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { eiClient } from "../ei-client";
import { EnterpriseReport } from "../ei-types";

export default function AnalyticsPage() {
  const [reports, setReports] = useState<EnterpriseReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const data = await eiClient.getReports();
        setReports(data);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Report Archive</h1>
          <p className="text-gray-500">Historical snapshots of enterprise performance and intelligence.</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            <span>Filter Period</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-gray-900">No reports generated yet</h3>
            <p className="mt-1 text-sm text-gray-500">The Executive Intelligence engine will generate reports as your organization grows.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Report Period</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Health Score</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Revenue Forecast</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Generated At</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-indigo-500 mr-2" />
                        <span className="text-sm font-bold text-gray-900">{report.period}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                        (report.healthScore ?? 0) >= 75 ? "bg-green-100 text-green-800" :
                        (report.healthScore ?? 0) >= 45 ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      )}>
                        {report.healthScore ?? 0}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      ${report.summary.forecast.expectedRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 flex items-center ml-auto">
                        <Download className="h-4 w-4 mr-1" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Trend Placeholder - Real data would be needed for a proper chart */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-indigo-600" />
            Executive Health Trend
          </h2>
          <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            {reports.length > 1 ? (
              <>
                <LineChart className="h-12 w-12 text-gray-200" />
                <p className="mt-2 text-gray-400 text-sm italic">Multi-period trend visualization active</p>
              </>
            ) : (
              <p className="text-gray-400 text-sm italic">Accumulate more reports to visualize trends</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-indigo-600" />
            Forecast Accuracy
          </h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <PieChart className="h-12 w-12 text-gray-200" />
            <p className="ml-3 text-gray-400 text-sm italic">Historical variance analysis pending</p>
          </div>
        </div>
      </div>
    </div>
  );
}

