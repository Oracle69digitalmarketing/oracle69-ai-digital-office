"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAuthenticated } from "@/lib/api-client";
import { Button, LoadingSkeleton, EmptyState } from "@oracle69/ui";

interface Project {
  id: string;
  title: string;
  status: "planning" | "in_progress" | "review" | "completed";
  priority: "low" | "medium" | "high";
  progress: number;
  deadline?: string;
  updatedAt: string;
}

const statusColors = {
  planning: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  review: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await fetchAuthenticated("/projects");
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-500">Track milestones, deliverables, and team progress.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <LoadingSkeleton key={i} className="h-48" />
            ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Create your first project to get started."
          action={<Button>Create Project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                    statusColors[project.status],
                  )}
                >
                  {project.status.replace("_", " ")}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{project.title}</h3>

              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">Progress</span>
                  <span className="text-gray-900">{project.progress}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      project.progress === 100 ? "bg-green-500" : "bg-indigo-600",
                    )}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
