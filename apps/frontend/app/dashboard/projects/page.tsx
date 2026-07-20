"use client";

import { useEffect, useState } from "react";
import { 
  Plus,
  LayoutGrid,
  List,
  Calendar,
  MoreVertical,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  team: string[];
  deadline: string;
}

const statusColors = {
  planning: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  review: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const mockProjects: Project[] = [
      { id: "1", title: "Q3 Marketing Campaign", status: "in_progress", priority: "high", progress: 65, team: ["Elena", "Mia"], deadline: "2026-08-15" },
      { id: "2", title: "API Infrastructure Upgrade", status: "planning", priority: "medium", progress: 10, team: ["Paul", "Owen"], deadline: "2026-09-01" },
      { id: "3", title: "Client Onboarding: Acme Corp", status: "completed", priority: "high", progress: 100, team: ["Paul", "Mia"], deadline: "2026-07-10" },
      { id: "4", title: "New Feature: AI Analytics", status: "review", priority: "medium", progress: 90, team: ["Elena", "Paul"], deadline: "2026-07-25" },
    ];
    setProjects(mockProjects);
  }, []);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-500">Track milestones, deliverables, and team progress.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center rounded-lg border border-gray-300 bg-white p-1">
            <button 
              onClick={() => setView('grid')}
              className={cn("p-1.5 rounded", view === 'grid' ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn("p-1.5 rounded", view === 'list' ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {projects.map((project) => (
          <div key={project.id} className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <span className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                statusColors[project.status]
              )}>
                {project.status.replace('_', ' ')}
              </span>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{project.title}</h3>
            <div className="flex items-center space-x-4 mb-6 text-xs text-gray-500">
              <div className="flex items-center">
                <Calendar className="mr-1 h-3 w-3" />
                {project.deadline}
              </div>
              <div className="flex items-center">
                <AlertCircle className={cn(
                  "mr-1 h-3 w-3",
                  project.priority === 'high' ? "text-red-500" : project.priority === 'medium' ? "text-amber-500" : "text-blue-500"
                )} />
                <span className="capitalize">{project.priority}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">Progress</span>
                <span className="text-gray-900">{project.progress}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    project.progress === 100 ? "bg-green-500" : "bg-indigo-600"
                  )} 
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex -space-x-2 overflow-hidden">
                {project.team.map((member) => (
                  <div key={member} className="inline-block h-8 w-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600" title={member}>
                    {member[0]}
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer">
                <span>Details</span>
                <ArrowRightIcon className="h-3 w-3" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban Section Placeholder */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <LayoutGrid className="mr-2 h-5 w-5 text-indigo-600" />
          Kanban Board (Alpha)
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {['To Do', 'In Progress', 'In Review', 'Done'].map((col) => (
            <div key={col} className="rounded-xl bg-gray-50 p-4 border border-gray-100 min-h-[300px]">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{col}</h3>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">0</span>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm text-xs text-gray-400 italic text-center py-8">
                  No tasks in this column
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  );
}
