"use client";

import { useEffect, useState } from "react";
import { 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  MoreVertical,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  status: string;
  description: string;
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Mock data for Finance
    const mockTransactions: Transaction[] = [
      { id: "1", type: "income", category: "Project Payment", amount: 5000, date: "2026-07-20", status: "completed", description: "Acme Corp - Sprint 04" },
      { id: "2", type: "expense", category: "Software", amount: 299, date: "2026-07-19", status: "completed", description: "Vercel Enterprise Subscription" },
      { id: "3", type: "income", category: "Consulting", amount: 1500, date: "2026-07-18", status: "completed", description: "Strategy Call - Global Tech" },
      { id: "4", type: "expense", category: "Infrastructure", amount: 850, date: "2026-07-17", status: "pending", description: "AWS Monthly Billing" },
    ];
    setTransactions(mockTransactions);
  }, []);

  const stats = [
    { name: "Total Revenue", value: "$45,200", change: "+12.5%", trending: "up", icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
    { name: "Total Expenses", value: "$12,400", change: "-2.3%", trending: "down", icon: Wallet, color: "text-red-600", bg: "bg-red-100" },
    { name: "Net Profit", value: "$32,800", change: "+18.2%", trending: "up", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Pending Invoices", value: "$8,500", change: "+5.1%", trending: "up", icon: Calendar, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-500">Monitor revenue, expenses, and financial health.</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            <PlusIcon className="h-4 w-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Transactions Table */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="font-bold text-gray-900">Recent Transactions</h2>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{t.category}</span>
                        <span className="text-xs text-gray-500">{t.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{t.date}</td>
                    <td className={cn(
                      "px-6 py-4 font-bold",
                      t.type === 'income' ? "text-green-600" : "text-red-600"
                    )}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        t.status === 'completed' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Summary */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-6">Budget Overview</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Marketing</span>
                <span className="text-sm font-bold text-gray-900">75%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">$7,500 of $10,000 used</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Development</span>
                <span className="text-sm font-bold text-gray-900">42%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '42%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">$10,500 of $25,000 used</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Operations</span>
                <span className="text-sm font-bold text-gray-900">90%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '90%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">$4,500 of $5,000 used</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}
