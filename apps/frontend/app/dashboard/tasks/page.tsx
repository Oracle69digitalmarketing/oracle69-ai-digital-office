"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { 
  CheckSquare, 
  MoreVertical,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/tasks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [token]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500">Manage and track your AI-driven task lifecycle.</p>
        </div>
        <button className="flex items-center space-x-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
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
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 w-8 bg-gray-100 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{task.title}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        statusColors[task.status] || "bg-gray-100 text-gray-600"
                      )}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 uppercase">{task.priority}</td>
                    <td className="px-6 py-4 text-gray-900">{task.assignedAgent?.name || "Unassigned"}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(task.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
            <CheckSquare className="h-12 w-12 mb-4 opacity-20" />
            <p>No tasks found. Create your first task to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
