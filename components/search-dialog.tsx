"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { globalSearch } from "@/lib/actions/search";
import Link from "next/link";
import { Search, X, FolderOpen, CheckSquare, Loader2 } from "lucide-react";

interface SearchResult {
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    priority: string;
    completed: boolean;
    project: { id: string; name: string; color: string };
    section: { name: string };
    assignee: { id: string; name: string; avatar: string | null } | null;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
    color: string;
    _count: { tasks: number };
  }>;
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    startTransition(async () => {
      const data = await globalSearch(value.trim());
      setResults(data);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="ml-auto text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">
          Ctrl+K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search tasks & projects..."
            className="flex-1 text-sm outline-none"
          />
          {isPending && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
          <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {results && (
            <div className="p-2">
              {results.projects.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Projects</p>
                  {results.projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: project.color }}>
                        <FolderOpen className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                        <p className="text-xs text-gray-400">{project._count.tasks} tasks</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.tasks.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Tasks</p>
                  {results.tasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/dashboard/projects/${task.project.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      <CheckSquare className={`w-4 h-4 shrink-0 ${task.completed ? "text-green-500" : "text-gray-300"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${task.completed ? "line-through text-gray-400" : "text-gray-900"}`}>{task.title}</p>
                        <p className="text-xs text-gray-400">{task.project.name} · {task.section.name}</p>
                      </div>
                      {task.assignee && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-medium" title={task.assignee.name}>
                          {task.assignee.name[0].toUpperCase()}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {results.tasks.length === 0 && results.projects.length === 0 && (
                <p className="text-center py-8 text-sm text-gray-400">No results found for &quot;{query}&quot;</p>
              )}
            </div>
          )}

          {!results && query.length < 2 && (
            <p className="text-center py-8 text-sm text-gray-400">Type at least 2 characters to search</p>
          )}
        </div>
      </div>
    </div>
  );
}
