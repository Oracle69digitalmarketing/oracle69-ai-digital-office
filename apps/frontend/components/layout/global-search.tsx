"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  X,
  BookOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { knowledgeClient } from "@/app/dashboard/knowledge/client";
import type { KnowledgeSearchResult } from "@oracle69/knowledge-intelligence";

interface SearchResult {
  id: string;
  type: "knowledge";
  title: string;
  subtitle: string;
  href: string;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchUnavailable, setSearchUnavailable] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    if (!organizationId) {
      setSearchUnavailable(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setSearchUnavailable(false);
      const knowledgeResults = await knowledgeClient.search(organizationId, searchQuery);

      const mappedResults: SearchResult[] = knowledgeResults.map((result: KnowledgeSearchResult) => ({
        id: result.articleId,
        type: "knowledge",
        title: result.title,
        subtitle: `${result.category} • Score: ${result.score}`,
        href: `/dashboard/knowledge`,
      }));

      setResults(mappedResults);
      setIsOpen(true);
    } catch {
      setSearchUnavailable(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 1) {
        performSearch(query);
      } else {
        setResults([]);
        setIsOpen(false);
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          placeholder="Search knowledge articles..."
          className="w-full bg-transparent outline-none text-gray-900"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => setQuery("")}>
            <X className="h-4 w-4 hover:text-gray-900" />
          </button>
        )}
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase px-3 tracking-wider">
              {loading ? "Searching..." : `Results (${results.length})`}
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto py-2">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : results.length > 0 ? (
              results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result.href)}
                  className="flex items-center px-4 py-3 hover:bg-indigo-50 cursor-pointer group transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors mr-3">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{result.title}</p>
                    <p className="text-xs text-gray-500 truncate capitalize">
                      knowledge • {result.subtitle}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              ))
            ) : searchUnavailable ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm italic">Search is temporarily unavailable.</p>
              </div>
            ) : query.length > 1 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm italic">No knowledge articles match "{query}"</p>
              </div>
            ) : null}
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[10px] text-gray-400 font-medium">
              Searching knowledge articles
            </span>
          </div>
        </div>
      )}
    </div>
  );
}