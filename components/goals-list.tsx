"use client";

import { useState, useTransition } from "react";
import { createGoal, updateGoal, deleteGoal } from "@/lib/actions/goals";
import { format } from "date-fns";
import {
  Target,
  Plus,
  Trash2,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  dueDate: string | null;
  createdAt: string;
  owner: { id: string; name: string; avatar: string | null };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  on_track: { label: "On Track", color: "text-green-600", bg: "bg-green-500" },
  at_risk: { label: "At Risk", color: "text-yellow-600", bg: "bg-yellow-500" },
  off_track: { label: "Off Track", color: "text-red-600", bg: "bg-red-500" },
  completed: { label: "Completed", color: "text-blue-600", bg: "bg-blue-500" },
};

export function GoalsList({ goals: initialGoals }: { goals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  function handleCreate() {
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await createGoal({ title, description, dueDate: dueDate || undefined });
      if (result.success && result.goal) {
        setGoals((prev) => [
          { ...result.goal!, description: result.goal!.description, dueDate: result.goal!.dueDate?.toString() || null, createdAt: new Date().toISOString(), owner: { id: "", name: "You", avatar: null } },
          ...prev,
        ]);
        setTitle("");
        setDescription("");
        setDueDate("");
        setShowCreate(false);
      }
    });
  }

  function handleUpdateProgress(goalId: string, progress: number) {
    startTransition(async () => {
      await updateGoal(goalId, {
        progress,
        status: progress >= 100 ? "completed" : undefined,
      });
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, progress, status: progress >= 100 ? "completed" : g.status }
            : g
        )
      );
    });
  }

  function handleUpdateStatus(goalId: string, status: string) {
    startTransition(async () => {
      await updateGoal(goalId, { status });
      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, status } : g)));
    });
  }

  function handleDelete(goalId: string) {
    if (!confirm("Delete this goal?")) return;
    startTransition(async () => {
      await deleteGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    });
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#6B7A45] rounded-lg hover:bg-[#5a6838] transition"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Create Goal Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#f5f5f5]">New Goal</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#737373] hover:text-[#a3a3a3]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Goal title"
                className="w-full px-3 py-2 text-sm bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] placeholder-[#525252] rounded-lg focus:ring-2 focus:ring-[#6B7A45] outline-none"
                autoFocus
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-3 py-2 text-sm bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] placeholder-[#525252] rounded-lg focus:ring-2 focus:ring-[#6B7A45] outline-none resize-none"
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-lg focus:ring-2 focus:ring-[#6B7A45] outline-none"
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCreate}
                  disabled={!title.trim() || isPending}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#6B7A45] rounded-lg hover:bg-[#5a6838] disabled:opacity-50"
                >
                  Create Goal
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-[#a3a3a3] hover:text-[#f5f5f5]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-16 bg-[#212121] rounded-xl border border-[#2e2e2e]">
          <Target className="w-12 h-12 text-[#525252] mx-auto mb-3" />
          <p className="text-[#a3a3a3] mb-4">No goals yet. Set your first objective!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#6B7A45] rounded-lg hover:bg-[#5a6838]"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const config = STATUS_CONFIG[goal.status] || STATUS_CONFIG.on_track;
            return (
              <div key={goal.id} className="bg-[#212121] rounded-xl border border-[#2e2e2e] p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1f2414] flex items-center justify-center">
                      {goal.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : goal.status === "off_track" ? (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Target className="w-5 h-5 text-[#6B7C42]" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#f5f5f5]">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-sm text-[#a3a3a3] mt-0.5">{goal.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1.5 text-[#737373] hover:text-red-400 rounded-lg hover:bg-red-950/40 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-[#a3a3a3]">Progress</span>
                    <span className="font-medium text-[#d4d4d4]">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-[#2a2a2a] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${config.bg}`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={goal.progress}
                    onChange={(e) => handleUpdateProgress(goal.id, parseInt(e.target.value))}
                    className="w-full mt-1 accent-[#6B7C42]"
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <select
                      value={goal.status}
                      onChange={(e) => handleUpdateStatus(goal.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-lg border ${config.color} bg-[#2a2a2a] border-[#3a3a3a]`}
                    >
                      <option value="on_track">On Track</option>
                      <option value="at_risk">At Risk</option>
                      <option value="off_track">Off Track</option>
                      <option value="completed">Completed</option>
                    </select>
                    {goal.dueDate && (
                      <span className="text-xs text-[#737373]">
                        Due {format(new Date(goal.dueDate), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-[#6B7C42] flex items-center justify-center text-white text-[10px] font-medium">
                      {goal.owner.name[0].toUpperCase()}
                    </div>
                    <span className="text-xs text-[#a3a3a3]">{goal.owner.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
