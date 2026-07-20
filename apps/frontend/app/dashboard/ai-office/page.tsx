"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { ActivityFeed } from "@/components/ai/activity-feed";
import { Bot, Activity, Layers, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  role: string;
  healthStatus: string;
  capabilities: string[];
}

export default function AIOfficePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/agents`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAgents(data);
        } else {
          // Fallback to mock agents
          setAgents([
            { id: "1", name: "Elena", role: "Operations Lead", healthStatus: "active", capabilities: ["Logistics", "Scheduling", "Process Optimization"] },
            { id: "2", name: "Owen", role: "Marketing strategist", healthStatus: "busy", capabilities: ["Content Creation", "SEO", "Market Analysis"] },
            { id: "3", name: "Paul", role: "Technical Architect", healthStatus: "active", capabilities: ["Code Review", "System Design", "Security Audit"] },
            { id: "4", name: "Mia", role: "Financial Analyst", healthStatus: "active", capabilities: ["Budgeting", "Forecasting", "Risk Assessment"] },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch agents, using mock data:", error);
        setAgents([
          { id: "1", name: "Elena", role: "Operations Lead", healthStatus: "active", capabilities: ["Logistics", "Scheduling", "Process Optimization"] },
          { id: "2", name: "Owen", role: "Marketing strategist", healthStatus: "busy", capabilities: ["Content Creation", "SEO", "Market Analysis"] },
          { id: "3", name: "Paul", role: "Technical Architect", healthStatus: "active", capabilities: ["Code Review", "System Design", "Security Audit"] },
          { id: "4", name: "Mia", role: "Financial Analyst", healthStatus: "active", capabilities: ["Budgeting", "Forecasting", "Risk Assessment"] },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [token]);

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Office Workspace</h1>
          <p className="text-gray-500">Real-time overview of your living AI organization.</p>
        </div>
        <div className="flex space-x-2">
          <div className="flex items-center space-x-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span>System Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Active Agents Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-900">
                <Bot className="mr-2 h-5 w-5 text-indigo-600" />
                Active Agents
              </h2>
              <span className="text-xs text-gray-500">{agents.length} Agents Registered</span>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-50"></div>
                ))
              ) : (
                agents.map((agent) => (
                  <div key={agent.id} className="group relative rounded-lg border border-gray-100 bg-gray-50 p-4 transition-all hover:border-indigo-200 hover:bg-white hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-white",
                          agent.healthStatus === 'busy' ? "bg-amber-500" : "bg-indigo-600"
                        )}>
                          <Cpu className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{agent.name}</h3>
                          <p className="text-xs text-gray-500">{agent.role}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        agent.healthStatus === 'busy' ? "bg-amber-500 animate-pulse" : "bg-green-500"
                      )}></div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 3).map((cap) => (
                        <span key={cap} className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600 border border-gray-100">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center text-lg font-semibold text-gray-900">
              <Layers className="mr-2 h-5 w-5 text-indigo-600" />
              Organizational Hierarchy
            </h2>
            <div className="flex flex-col items-center space-y-4 py-8 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex flex-col items-center">
                <div className="rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-bold shadow-sm">CEO (You)</div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="rounded-lg bg-indigo-100 border border-indigo-200 px-4 py-2 text-indigo-700 text-sm font-semibold shadow-sm">Chief of Staff</div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="rounded-lg bg-indigo-100 border border-indigo-200 px-4 py-2 text-indigo-700 text-sm font-semibold shadow-sm">Project Manager</div>
              </div>
              <div className="flex space-x-8">
                <div className="flex flex-col items-center">
                  <div className="h-4 w-px bg-gray-300"></div>
                  <div className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 text-xs font-medium">Marketing</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-4 w-px bg-gray-300"></div>
                  <div className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 text-xs font-medium">Finance</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-4 w-px bg-gray-300"></div>
                  <div className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 text-xs font-medium">Operations</div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="rounded-lg bg-green-100 border border-green-200 px-4 py-2 text-green-700 text-xs font-semibold shadow-sm">Knowledge Hub</div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed Column */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm h-full max-h-[800px] overflow-hidden flex flex-col">
            <h2 className="mb-6 flex items-center text-lg font-semibold text-gray-900">
              <Activity className="mr-2 h-5 w-5 text-indigo-600" />
              Live Activity Feed
            </h2>
            <div className="flex-1 overflow-y-auto pr-2">
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
