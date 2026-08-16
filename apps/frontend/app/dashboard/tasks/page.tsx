"use client";

import { useEffect, useState } from "react";
import { MoreVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { Button, LoadingSkeleton, EmptyState } from "@oracle69/ui";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  updatedAt: string;
  assignedAgent?: {
    name: string;
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  assigned: "bg-blue-100 text-blue-600",
  in_progress: "bg-amber-100 text-amber-600",
  review: "bg-purple-100 text-purple-600",
  completed: "bg-green-100 text-green-600",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await apiClient<Task[]>("/tasks");
        setTasks(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500">Manage and track your AI-driven task lifecycle.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          <span>New Task</span>
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton className="h-64" />
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <EmptyState
              title="Failed to load tasks"
              description={error}
              action={<Button onClick={() => window.location.reload()}>Retry</Button>}
            />
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              title="No tasks found"
              description="Create your first task to get started."
              action={<Button>Create Task</Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">Task Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Assigned Agent</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{task.title}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          statusColors[task.status] || "bg-gray-100 text-gray-600",
                        )}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 uppercase">{task.priority}</td>
                    <td className="px-6 py-4 text-gray-900">
                      {task.assignedAgent?.name || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(task.updatedAt).toLocaleDateString()}
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
        )}
      </div>
    </div>
  );
}
