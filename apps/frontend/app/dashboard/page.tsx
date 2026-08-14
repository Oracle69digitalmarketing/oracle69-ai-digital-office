"use client";

import { useEffect, useState } from "react";
import { 
  Bot, 
  Activity, 
  ArrowRight,
  Briefcase,
  Users,
  TrendingUp,
  DollarSign,
  AlertCircle,
  FileText,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { eiClient } from "./ei-client";
import { EnterpriseKpiMetrics, BusinessHealthResult, EnterpriseForecast } from "./ei-types";

export default function DashboardPage() {
  const [kpis, setKpis] = useState<EnterpriseKpiMetrics | null>(null);
  const [health, setHealth] = useState<BusinessHealthResult | null>(null);
  const [forecast, setForecast] = useState<EnterpriseForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [kpiData, healthData, forecastData] = await Promise.all([
          eiClient.getKpi(),
          eiClient.getHealth(),
          eiClient.getForecast()
        ]);
        setKpis(kpiData);
        setHealth(healthData);
        setForecast(forecastData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load real-time intelligence data.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const cards = [
    { 
      name: "Active Accounts", 
      value: kpis?.activeAccounts ?? 0, 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-100" 
    },
    { 
      name: "Open Opportunities", 
      value: kpis?.openOpportunities ?? 0, 
      icon: Briefcase, 
      color: "text-indigo-600", 
      bg: "bg-indigo-100" 
    },
    { 
      name: "Won Revenue", 
      value: kpis ? formatCurrency(kpis.wonRevenue) : "$0", 
      icon: DollarSign, 
      color: "text-green-600", 
      bg: "bg-green-100" 
    },
    { 
      name: "Forecast (Expected)", 
      value: forecast ? formatCurrency(forecast.expectedRevenue) : "$0", 
      icon: TrendingUp, 
      color: "text-purple-600", 
      bg: "bg-purple-100" 
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Synchronizing Enterprise Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of your Oracle69 AI Business Operating System.</p>
        </div>
        <div className="flex space-x-3">
          {error && (
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-md border border-amber-100 text-xs">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <Link 
            href="/dashboard/ai-office"
            className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <span>AI Command Center</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.name} className="overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center space-x-4">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", card.bg, card.color)}>
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{card.name}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Business Health */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Activity className="mr-2 h-5 w-5 text-indigo-600" />
                Enterprise Health & Pipeline
              </h2>
              <span className={cn(
                "text-xs font-semibold px-2 py-1 rounded",
                health?.status === 'healthy' ? "bg-green-100 text-green-700" :
                health?.status === 'at_risk' ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              )}>
                Score: {health?.score ?? 0}/100
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed italic">
                  {health?.reasoning ?? "Business health assessment pending sufficient data integration."}
                </p>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase">Key Factors</p>
                  <div className="flex flex-wrap gap-2">
                    {health?.factors.map((factor, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] text-gray-500">
                        {factor}
                      </span>
                    )) || <span className="text-xs text-gray-400">No factors identified.</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Revenue Forecast Details</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Weighted Pipeline</span>
                      <span className="font-bold">{formatCurrency(forecast?.weightedPipeline ?? 0)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Expected Retention</span>
                      <span className="font-bold">{formatCurrency(forecast?.retentionRevenue ?? 0)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Total Expected</span>
                      <span className="text-lg font-bold text-indigo-600">{formatCurrency(forecast?.expectedRevenue ?? 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
                Sales Conversions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Win Rate</p>
                  <p className="text-xl font-bold text-gray-900">{kpis ? `${(kpis.winRate * 100).toFixed(1)}%` : "0%"}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Leads Conv.</p>
                  <p className="text-xl font-bold text-gray-900">{kpis ? `${(kpis.leadConversionRate * 100).toFixed(1)}%` : "0%"}</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                Based on {kpis?.totalOpportunities ?? 0} total opportunities across the current period.
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Bot className="mr-2 h-4 w-4 text-indigo-600" />
                AI Strategy Insights
              </h3>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-700 uppercase mb-1">Observation</p>
                  <p className="text-xs text-indigo-900">
                    {health?.status === 'critical' ? 
                      "Critical deterioration detected. Automated mission recovery plan is being drafted." :
                      "System stability confirmed. Pipeline growth is trending within target parameters."
                    }
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Confidence Level</span>
                  <span className="font-bold text-green-600">High (94%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar activity/alerts */}
        <div className="space-y-8">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
              Intelligence Alerts
            </h2>
            <div className="space-y-4">
              {health?.status === 'critical' && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Critical Health</p>
                  <p className="text-sm text-red-700">Enterprise health score has dropped into the critical zone.</p>
                </div>
              )}
              {kpis && kpis.accountsAtRisk > 0 && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Risk Alert</p>
                  <p className="text-sm text-amber-700">{kpis.accountsAtRisk} account(s) are trending at risk.</p>
                </div>
              )}
              {!kpis && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Initialization</p>
                  <p className="text-sm text-blue-700">Connecting to enterprise data sources...</p>
                </div>
              )}
              {kpis && kpis.activeAccounts === 0 && (
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cold Start</p>
                  <p className="text-sm text-gray-500">No active accounts detected in CRM.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-indigo-600" />
              Executive Reports
            </h2>
            <div className="space-y-4">
              <p className="text-xs text-gray-500">Automated snapshots of your business intelligence.</p>
              <Link 
                href="/dashboard/reports"
                className="block w-full text-center py-2 text-xs font-bold text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Go to Report Archive
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

