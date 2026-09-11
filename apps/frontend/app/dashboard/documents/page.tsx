"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Download, ExternalLink, Search, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { EmptyState } from "@oracle69/ui";
import { useAuthStore } from "@/store/auth-store";

interface Document {
  id: string;
  title: string;
  category: string;
  ownerId: string;
  version: string;
  storageUrl: string;
  status: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentCenterPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<Document[]>("/documents");
      setDocuments(data);
    } catch {
      setError("Failed to load documents. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = searchQuery
    ? documents.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : documents;

  const formatDate = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const days = Math.floor(diff / 86400000);
      if (days === 0) return "Today";
      if (days === 1) return "Yesterday";
      if (days < 7) return `${days} days ago`;
      if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
      return `${Math.floor(days / 30)} months ago`;
    } catch {
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Center</h1>
          <p className="text-gray-500">
            Manage your tenant-scoped business documents.
            {organizationId && ` Organization: ${organizationId}`}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-center p-6">
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-lg border border-amber-100">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {!error && (
          <>
            {filteredDocuments.length === 0 ? (
              <EmptyState
                title={searchQuery ? "No documents match your search" : "No documents found"}
                description={
                  searchQuery
                    ? "No documents in your tenant match the search criteria."
                    : "No documents have been created in your organization yet."
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-4">Document Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Version</th>
                      <th className="px-6 py-4">Updated</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{doc.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize text-gray-500">
                            {doc.category.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              doc.status === "active" || doc.status === "final"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700",
                            )}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">v{doc.version}</td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(doc.updatedAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" disabled={!doc.storageUrl} title={doc.storageUrl ? "Download" : "Not available"}>
                              <Download className="h-4 w-4" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" disabled title="View not available">
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
