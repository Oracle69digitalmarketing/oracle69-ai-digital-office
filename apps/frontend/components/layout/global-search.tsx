"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Users, Briefcase, FileText, CheckSquare, BookOpen, Bot, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: 'client' | 'project' | 'document' | 'task' | 'knowledge' | 'agent';
  title: string;
  subtitle: string;
  href: string;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const mockData: SearchResult[] = [
    { id: "1", type: "client", title: "Acme Corp", subtitle: "Active Manufacturing Client", href: "/dashboard/crm" },
    { id: "2", type: "project", title: "Q3 Marketing Campaign", subtitle: "In Progress • 65%", href: "/dashboard/projects" },
    { id: "3", type: "document", title: "Master Service Agreement", subtitle: "Final • v4.0.0", href: "/dashboard/documents" },
    { id: "4", type: "task", title: "Financial Audit Q2", subtitle: "Overdue • Finance", href: "/dashboard/tasks" },
    { id: "5", type: "knowledge", title: "AI Ethics SOP", subtitle: "Internal Policy", href: "/dashboard/knowledge" },
    { id: "6", type: "agent", title: "Elena", subtitle: "Chief of Staff Agent", href: "/dashboard/ai-office" },
  ];

  useEffect(() => {
    if (query.length > 1) {
      const filtered = mockData.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.subtitle.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'client': return <Users className="h-4 w-4" />;
      case 'project': return <Briefcase className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'task': return <CheckSquare className="h-4 w-4" />;
      case 'knowledge': return <BookOpen className="h-4 w-4" />;
      case 'agent': return <Bot className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const handleSelect = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative w-96" ref={containerRef}>
      <div className="flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-500 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
        <Search className="mr-2 h-4 w-4" />
        <input
          type="text"
          placeholder="Search everything..."
          className="w-full bg-transparent outline-none text-gray-900"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => setQuery("")}>
            <X className="h-4 w-4 hover:text-gray-900" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase px-3 tracking-wider">Search Results ({results.length})</span>
          </div>
          <div className="max-h-96 overflow-y-auto py-2">
            {results.length > 0 ? (
              results.map((result) => (
                <div 
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result.href)}
                  className="flex items-center px-4 py-3 hover:bg-indigo-50 cursor-pointer group transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors mr-3">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{result.title}</p>
                    <p className="text-xs text-gray-500 truncate capitalize">{result.type} • {result.subtitle}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm italic">No matches found for "{query}"</p>
              </div>
            )}
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[10px] text-gray-400 font-medium">Tip: Use type filters for faster searching</span>
            <button className="text-[10px] font-bold text-indigo-600 hover:underline">Advanced Search</button>
          </div>
        </div>
      )}
    </div>
  );
}
