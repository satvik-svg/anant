"use client";

import { useState } from "react";
import { createProject } from "@/lib/actions/projects";
import { Plus, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#0ea5e9", "#6b7280",
];

interface Props {
  teams: Array<{ id: string; name: string }>;
}

export function CreateProjectDialog({ teams }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    formData.set("color", selectedColor);
    const result = await createProject(formData);
    setLoading(false);
    if (result?.projectId) {
      setOpen(false);
      router.push(`/dashboard/projects/${result.projectId}`);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#4A5628] bg-[#EEF0E0] rounded-lg hover:bg-[#E4E8CC] transition"
      >
        <Plus className="w-4 h-4" />
        New Project
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">New Project</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project name
            </label>
            <input
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B7C42] focus:border-transparent outline-none text-sm"
              placeholder="e.g., Website Redesign"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B7C42] focus:border-transparent outline-none text-sm resize-none"
              placeholder="What's this project about?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team
            </label>
            <select
              name="teamId"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B7C42] focus:border-transparent outline-none text-sm"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-lg transition ring-2 ring-offset-2 ${
                    selectedColor === color ? "ring-[#6B7C42]" : "ring-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 text-sm font-medium text-white bg-black rounded-xl hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
