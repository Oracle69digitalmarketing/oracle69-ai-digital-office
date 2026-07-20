"use client";

import { useState } from "react";
import { 
  Bot, 
  CheckSquare, 
  Activity, 
  ArrowRight,
  Briefcase,
  Users,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  FileText
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [stats] = useState({
    activeClients: 42,
    activeProjects: 8,
    pendingTasks: 15,
    revenue: "$124,500",
    approvals: 3,
    aiActivity: "High",
    health: "Excellent"
  });

  const cards = [
    { name: "Active Clients", value: stats.activeClients, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Active Projects", value: stats.activeProjects, icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-100" },
    { name: "Pending Tasks", value: stats.pendingTasks, icon: CheckSquare, color: "text-amber-600", bg: "bg-amber-100" },
    { name: "Monthly Revenue", value: stats.revenue, icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
  ];

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 text-black">Executive Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of your Oracle69 AI Business Operating System.</p>
        </div>
        <div className="flex space-x-3">
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
                <p className="text-2xl font-bold text-gray-900 text-black">{card.value}</p>
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
              <h2 className="text-xl font-bold text-gray-900 text-black flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-indigo-600" />
                Business Performance
              </h2>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700">Live Health: {stats.health}</span>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm italic">Analytics Visualization Placeholder</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 text-black mb-4 flex items-center">
                <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
                Pending Approvals
              </h3>
              <div className="space-y-3">
                {[
                  { title: "Contract: Acme Corp", type: "Legal", date: "Today" },
                  { title: "Budget: Marketing Q3", type: "Finance", date: "Yesterday" },
                  { title: "Project: Cloud Migration", type: "Operations", date: "2 days ago" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900 text-black">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.type} • {item.date}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 text-black mb-4 flex items-center">
                <Bot className="mr-2 h-4 w-4 text-indigo-600" />
                AI Agent Activity
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Processing Load</span>
                  <span className="text-sm font-bold text-indigo-600">High</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="p-2 rounded bg-gray-50 text-center">
                    <p className="text-xs text-gray-500">Tokens/min</p>
                    <p className="text-sm font-bold text-black">1.2M</p>
                  </div>
                  <div className="p-2 rounded bg-gray-50 text-center">
                    <p className="text-xs text-gray-500">Tasks/hr</p>
                    <p className="text-sm font-bold text-black">450</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar activity/alerts */}
        <div className="space-y-8">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 text-black mb-6 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
              Critical Alerts
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Overdue Task</p>
                <p className="text-sm text-red-700">Financial Audit for Q2 is 3 days late.</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Budget Alert</p>
                <p className="text-sm text-amber-700">Marketing spend is at 92% of Q3 limit.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 text-black mb-6 flex items-center">
              <Activity className="mr-2 h-5 w-5 text-indigo-600" />
              Live Activity
            </h2>
            <div className="space-y-4">
              {[
                { text: "Contract generated for Acme Corp", icon: FileText, time: "2 min ago" },
                { text: "Lead converted to Opportunity: Global Tech", icon: TrendingUp, time: "15 min ago" },
                { text: "Invoice #124 paid via Stripe", icon: DollarSign, time: "1 hour ago" },
                { text: "Operations Agent Elena completed logistics plan", icon: Bot, time: "2 hours ago" },
              ].map((item, i) => (
                <div key={i} className="flex space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <item.icon className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 text-black font-medium leading-tight">{item.text}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 text-xs font-bold text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors">
              View Full Activity Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
