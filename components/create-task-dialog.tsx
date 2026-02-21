"use client";

import { useState, useRef, useEffect } from "react";
import { createTask } from "@/lib/actions/tasks";
import { X, Loader2, ChevronDown, Check, Users } from "lucide-react";

interface Props {
  projectId: string;
  sectionId: string;
  sections: Array<{ id: string; name: string }>;
  teamMembers: Array<{ id: string; name: string; email: string }>;
  onClose: () => void;
}

export function CreateTaskDialog({
  projectId,
  sectionId,
  sections,
  teamMembers,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAssigneeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleAssignee(id: string) {
    setSelectedAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  const filteredMembers = teamMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    formData.set("projectId", projectId);
    // Remove default assigneeId and add all selected
    formData.delete("assigneeId");
    for (const id of selectedAssignees) {
      formData.append("assigneeId", id);
    }
    const result = await createTask(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Create Task</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              name="title"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B7C42] focus:border-transparent outline-none text-sm"
              placeholder="Task title"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B7C42] focus:border-transparent outline-none text-sm resize-none"
              placeholder="Add details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <select
                name="sectionId"
                defaultValue={sectionId}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B7C42] focus:border-transparent outline-none text-sm"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignees
              </label>
              <button
                type="button"
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B7C42] focus:border-transparent outline-none text-sm text-left flex items-center justify-between"
              >
                <span className={selectedAssignees.length === 0 ? "text-gray-400" : "text-gray-900"}>
                  {selectedAssignees.length === 0
                    ? "Unassigned"
                    : selectedAssignees.length === 1
                    ? teamMembers.find((m) => m.id === selectedAssignees[0])?.name
                    : `${selectedAssignees.length} people`}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showAssigneeDropdown && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      type="text"
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      placeholder="Name or email"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#6B7C42] outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto max-h-44">
                    {filteredMembers.map((m) => {
                      const isSelected = selectedAssignees.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleAssignee(m.id)}
                          className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-50 transition"
                        >
                          <div className="w-7 h-7 rounded-full bg-[#6B7C42] flex items-center justify-center text-white text-[10px] font-medium shrink-0">
                            {m.name[0].toUpperCase()}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                            <p className="text-xs text-gray-400 truncate">{m.email}</p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#6B7C42] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                    {filteredMembers.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-3">No matches</p>
                    )}
                  </div>
                  {selectedAssignees.length > 0 && (
                    <div className="border-t border-gray-100 px-3 py-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Users className="w-3.5 h-3.5 text-gray-400 mr-1" />
                        {selectedAssignees.map((id) => {
                          const member = teamMembers.find((m) => m.id === id);
                          return member ? (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[#EEF0E0] text-[#4A5628] rounded-full"
                            >
                              {member.name.split(" ")[0]}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAssignee(id);
                                }}
                                className="hover:text-black"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                defaultValue="medium"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B7C42] focus:border-transparent outline-none text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tracking Status
              </label>
              <select
                name="trackingStatus"
                defaultValue="on_track"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B7C42] focus:border-transparent outline-none text-sm"
              >
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="off_track">Off Track</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                name="startDate"
                type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B7C42] focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                name="dueDate"
                type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B7C42] focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 text-sm font-medium text-white bg-black rounded-xl hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
