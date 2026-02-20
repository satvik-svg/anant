"use client";

import { useState, useTransition } from "react";
import { createPortfolio, deletePortfolio } from "@/lib/actions/portfolios";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Trash2,
  FolderOpen,
  X,
} from "lucide-react";

interface PortfolioProject {
  project: {
    id: string;
    name: string;
    color: string;
    _count: { tasks: number };
  };
}

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  color: string;
  team: { name: string };
  projects: PortfolioProject[];
}

interface Team {
  id: string;
  name: string;
}

export function PortfoliosList({
  portfolios: initial,
  teams,
}: {
  portfolios: Portfolio[];
  teams: Team[];
}) {
  const [portfolios, setPortfolios] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState(teams[0]?.id || "");
  const [color, setColor] = useState("#6366f1");

  const COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"];

  function handleCreate() {
    if (!name.trim() || !teamId) return;
    startTransition(async () => {
      const result = await createPortfolio({ name, description, teamId, color });
      if (result.success) {
        setShowCreate(false);
        setName("");
        setDescription("");
        // Refresh by adding to local state
        window.location.reload();
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this portfolio?")) return;
    startTransition(async () => {
      await deletePortfolio(id);
      setPortfolios((prev) => prev.filter((p) => p.id !== id));
    });
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition"
        >
          <Plus className="w-4 h-4" />
          New Portfolio
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Portfolio</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Portfolio name"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                autoFocus
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition ${color === c ? "ring-2 ring-offset-2 ring-indigo-500" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || isPending}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                >
                  Create
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Grid */}
      {portfolios.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No portfolios yet. Group your projects together!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600"
          >
            <Plus className="w-4 h-4" />
            Create Portfolio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="bg-white rounded-xl border border-gray-200 p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: portfolio.color }}
                  >
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{portfolio.name}</h3>
                    {portfolio.description && <p className="text-sm text-gray-500 mt-0.5">{portfolio.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">{portfolio.team.name} · {portfolio.projects.length} projects</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(portfolio.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {portfolio.projects.length > 0 ? (
                <div className="space-y-2">
                  {portfolio.projects.map((pp) => (
                    <Link
                      key={pp.project.id}
                      href={`/dashboard/projects/${pp.project.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: pp.project.color }}>
                        {pp.project.name[0]}
                      </div>
                      <span className="text-sm text-gray-700 flex-1">{pp.project.name}</span>
                      <span className="text-xs text-gray-400">{pp.project._count.tasks} tasks</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-gray-400 bg-gray-50 rounded-lg">
                  <FolderOpen className="w-5 h-5 mx-auto mb-1 text-gray-300" />
                  No projects added yet
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
