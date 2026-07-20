"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Bot, 
  Briefcase, 
  CheckSquare, 
  Building2, 
  BookOpen, 
  FileText, 
  Calendar, 
  BarChart3, 
  Settings,
  Users,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Office", href: "/dashboard/ai-office", icon: Bot },
  { name: "CRM", href: "/dashboard/crm", icon: Users },
  { name: "Projects", href: "/dashboard/projects", icon: Briefcase },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Finance", href: "/dashboard/finance", icon: Wallet },
  { name: "Departments", href: "/dashboard/departments", icon: Building2 },
  { name: "Knowledge", href: "/dashboard/knowledge", icon: BookOpen },
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="text-xl font-bold hover:text-indigo-400 transition-colors">
          Oracle69
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
