"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  FilePlus, 
  Search, 
  Filter, 
  Download,
  History,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  title: string;
  category: 'proposal' | 'contract' | 'invoice' | 'report' | 'sop' | 'case_study';
  status: 'draft' | 'final' | 'archived';
  version: string;
  updatedAt: string;
  owner: string;
}

export default function DocumentCenterPage() {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    const mockDocs: Document[] = [
      { id: "1", title: "Acme Corp - Q3 Proposal", category: "proposal", status: "final", version: "2.1.0", updatedAt: "2 hours ago", owner: "Elena" },
      { id: "2", title: "Master Service Agreement v4", category: "contract", status: "draft", version: "4.0.0-beta", updatedAt: "1 day ago", owner: "Paul" },
      { id: "3", title: "Invoice #INV-2026-001", category: "invoice", status: "final", version: "1.0.0", updatedAt: "3 days ago", owner: "System" },
      { id: "4", title: "Internal SOP: AI Ethics", category: "sop", status: "final", version: "1.2.0", updatedAt: "1 week ago", owner: "Owen" },
    ];
    setDocuments(mockDocs);
  }, []);

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Center</h1>
          <p className="text-gray-500">Generate and manage business documents with AI assistance.</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            <FilePlus className="h-4 w-4" />
            <span>Generate Document</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-6">
        {['Proposal', 'Contract', 'Invoice', 'Report', 'SOP', 'Case Study'].map((type) => (
          <button key={type} className="flex flex-col items-center justify-center p-6 rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:border-indigo-200 hover:shadow-md group">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-3 group-hover:bg-indigo-100">
              <FileText className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-gray-700">{type}</span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search documents..." 
              className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-4 text-sm font-medium text-gray-500">
            <button className="flex items-center space-x-1 hover:text-gray-900">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-gray-900">
              <History className="h-4 w-4" />
              <span>History</span>
            </button>
          </div>
        </div>

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
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{doc.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-gray-500">{doc.category.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      doc.status === 'final' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">v{doc.version}</td>
                  <td className="px-6 py-4 text-gray-500">{doc.updatedAt}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
