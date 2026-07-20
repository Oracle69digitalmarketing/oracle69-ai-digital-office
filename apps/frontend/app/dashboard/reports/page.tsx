"use client";

import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  LineChart, 
  Users, 
  Briefcase, 
  DollarSign, 
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const stats = [
    { name: "Total Sales", value: "$154,200", change: "+12.5%", trending: "up", icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
    { name: "Project Success", value: "94%", change: "+2.3%", trending: "up", icon: Briefcase, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "AI Efficiency", value: "88%", change: "+5.1%", trending: "up", icon: Bot, color: "text-purple-600", bg: "bg-purple-100" },
    { name: "Client Growth", value: "+15", change: "-1.2%", trending: "down", icon: Users, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-500">Data-driven performance tracking across your organization.</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            <span>Date Range</span>
          </button>
          <button className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className={cn(
                "flex items-center text-xs font-medium",
                stat.trending === "up" ? "text-green-600" : "text-red-600"
              )}>
                {stat.trending === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-indigo-600" />
            Revenue Growth
          </h2>
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <LineChart className="h-12 w-12 text-gray-200" />
            <p className="ml-3 text-gray-400 text-sm italic">Revenue Chart Placeholder</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-indigo-600" />
            Department Productivity
          </h2>
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <PieChart className="h-12 w-12 text-gray-200" />
            <p className="ml-3 text-gray-400 text-sm italic">Productivity Chart Placeholder</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Sales Pipeline Distribution</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Discovery</span>
                <span className="text-sm font-bold text-gray-900">12 Leads</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Proposal Sent</span>
                <span className="text-sm font-bold text-gray-900">8 Leads</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Negotiation</span>
                <span className="text-sm font-bold text-gray-900">5 Leads</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">AI Utilization</h2>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">GPT-4o</p>
                  <p className="text-xs text-gray-500">85% of requests</p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Claude 3.5</p>
                  <p className="text-xs text-gray-500">12% of requests</p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded bg-gray-50 flex items-center justify-center text-gray-400">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Local Llama</p>
                  <p className="text-xs text-gray-500">3% of requests</p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-400">Standby</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
