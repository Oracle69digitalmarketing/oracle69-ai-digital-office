"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  FileText,
  Search,
  Archive,
  TrendingUp,
  Clock,
  Lightbulb,
  Plus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { knowledgeClient } from "./client";
import { KnowledgeArticle, KnowledgeKpis } from "@oracle69/knowledge-intelligence";

export default function KnowledgePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [kpis, setKpis] = useState<KnowledgeKpis | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  useEffect(() => {
    async function fetchData() {
      if (!organizationId) return;
      try {
        setLoading(true);
        const [articleData, kpiData] = await Promise.all([
          knowledgeClient.listArticles(organizationId),
          knowledgeClient.getKpis(organizationId),
        ]);
        setArticles(articleData);
        setKpis(kpiData);
      } catch (err) {
        console.error("Failed to fetch knowledge data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [organizationId]);

  const stats = [
    { name: "Total Articles", value: kpis?.totalArticles ?? 0, change: "Current state", icon: FileText, color: "text-indigo-600", bg: "bg-indigo-100" },
    { name: "Published", value: kpis?.publishedCount ?? 0, change: `${kpis?.indexCoverage ?? 0}% indexed`, icon: BookOpen, color: "text-green-600", bg: "bg-green-100" },
    { name: "In Review", value: kpis?.draftCount ?? 0, change: "draft backlog", icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { name: "Categories", value: kpis?.categories.length ?? 0, change: "active areas", icon: Archive, color: "text-blue-600", bg: "bg-blue-100" },
  ];

  const filtered = articles.filter((a) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Hub</h1>
          <p className="text-gray-500">
            Centralized institutional knowledge, policies, and playbooks.
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <Lightbulb className="h-4 w-4" />
            <span>Insights</span>
          </button>
          <button className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            <span>New Article</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  stat.bg,
                  stat.color,
                )}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <span className="flex items-center text-xs font-medium text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="font-bold text-gray-900">Recent Articles</h2>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search knowledge..."
                className="w-56 rounded-lg border border-gray-300 bg-gray-50 pl-9 pr-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">Article</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Version</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{a.title}</span>
                        <span className="text-xs text-gray-500">{a.summary}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {a.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">v{a.version}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          a.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(a.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No articles match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
