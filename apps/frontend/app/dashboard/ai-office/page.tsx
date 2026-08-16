"use client";

import { useEffect, useState } from "react";
import { Bot, Activity, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { Card, Badge, LoadingSkeleton } from "@oracle69/ui";

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

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await apiClient<Agent[]>("/agents");
        setAgents(data);
      } catch (error) {
        console.error("Failed to fetch agents:", error);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Command Center</h1>
          <p className="text-gray-500">Real-time oversight of your living AI organization.</p>
        </div>
        <Badge variant="success">System Online</Badge>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-900">
                <Bot className="mr-2 h-5 w-5 text-indigo-600" />
                Active Agents
              </h2>
              <span className="text-xs text-gray-500">{agents.length} Agents Registered</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {loading
                ? Array(4)
                    .fill(0)
                    .map((_, i) => <LoadingSkeleton key={i} className="h-32" />)
                : agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="group relative rounded-lg border border-gray-100 bg-gray-50 p-4 transition-all hover:border-indigo-200 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full text-white",
                              agent.healthStatus === "busy" ? "bg-amber-500" : "bg-indigo-600",
                            )}
                          >
                            <Cpu className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{agent.name}</h3>
                            <p className="text-xs text-gray-500">{agent.role}</p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            agent.healthStatus === "busy"
                              ? "bg-amber-500 animate-pulse"
                              : "bg-green-500",
                          )}
                        ></div>
                      </div>
                    </div>
                  ))}
            </div>
          </Card>
        </div>

        {/* Activity Feed Column - keeping simple for now */}
        <Card className="h-full">
          <h2 className="mb-6 flex items-center text-lg font-semibold text-gray-900">
            <Activity className="mr-2 h-5 w-5 text-indigo-600" />
            Live Activity
          </h2>
          <p className="text-sm text-gray-500 italic">No recent activity.</p>
        </Card>
      </div>
    </div>
  );
}
