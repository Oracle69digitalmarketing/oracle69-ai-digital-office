"use client";

import { useEffect, useState } from "react";
import { 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Building,
  Target,
  TrendingUp,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  industry: string;
  status: string;
  lastActivity: string;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  lead: "bg-blue-100 text-blue-700",
  opportunity: "bg-purple-100 text-purple-700",
  inactive: "bg-gray-100 text-gray-700",
};

export default function CRMPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for CRM
    const mockClients: Client[] = [
      { id: "1", name: "Acme Corp", contactPerson: "John Doe", email: "john@acme.com", industry: "Manufacturing", status: "active", lastActivity: "2 hours ago" },
      { id: "2", name: "Global Tech", contactPerson: "Jane Smith", email: "jane@globaltech.io", industry: "Technology", status: "opportunity", lastActivity: "1 day ago" },
      { id: "3", name: "Future Retail", contactPerson: "Mike Ross", email: "mike@future.com", industry: "Retail", status: "lead", lastActivity: "3 days ago" },
      { id: "4", name: "Eco Systems", contactPerson: "Sarah Connor", email: "sarah@eco.net", industry: "Energy", status: "active", lastActivity: "5 hours ago" },
    ];
    setClients(mockClients);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM</h1>
          <p className="text-gray-500">Manage your clients, leads, and business opportunities.</p>
        </div>
        <button className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
          <UserPlus className="h-4 w-4" />
          <span>Add Client</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Target className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">Lead Pipeline</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">12 Active Leads</p>
          <p className="text-sm text-gray-500 mt-1">Potential value: $45,000</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">Opportunities</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">5 High Value</p>
          <p className="text-sm text-gray-500 mt-1">Weighted forecast: $120,000</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <Clock className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Retention</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">98% Satisfied</p>
          <p className="text-sm text-gray-500 mt-1">Churn rate: 2%</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Industry</th>
                <th className="px-6 py-4">Last Activity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 w-8 bg-gray-100 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                          <Building className="h-4 w-4" />
                        </div>
                        <span>{client.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-medium">{client.contactPerson}</span>
                        <span className="text-xs text-gray-500">{client.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        statusColors[client.status]
                      )}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{client.industry}</td>
                    <td className="px-6 py-4 text-gray-500">{client.lastActivity}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
