"use client";

import { format, isPast, isToday } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { useState } from "react";
import { updateTask } from "@/lib/actions/tasks";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  trackingStatus?: string;
  startDate?: string | null;
  dueDate: string | null;
  order: number;
  completed: boolean;
  sectionId: string;
  projectId: string;
  assignee: { id: string; name: string; avatar: string | null; email: string } | null;
  assignees?: Array<{ user: { id: string; name: string; avatar: string | null; email: string } }>;
  _count: { comments: number; attachments: number };
}

interface Section {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
}

interface Props {
  sections: Section[];
  projectId: string;
  teamMembers: Array<{ id: string; name: string; email: string; avatar: string | null }>;
  onTaskClick: (taskId: string) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-500 bg-red-50",
  high: "text-orange-500 bg-orange-50",
  medium: "text-yellow-600 bg-yellow-50",
  low: "text-blue-500 bg-blue-50",
};

const SECTION_COLORS: Record<string, string> = {
  "To Do": "border-l-gray-400",
  "In Progress": "border-l-blue-500",
  "Done": "border-l-green-500",
};

const TRACKING_STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  on_track: { label: "On Track", bg: "bg-green-50", text: "text-green-700" },
  at_risk: { label: "At Risk", bg: "bg-yellow-50", text: "text-yellow-700" },
  off_track: { label: "Off Track", bg: "bg-red-50", text: "text-red-700" },
};

export function ListView({ sections, projectId, teamMembers, onTaskClick }: Props) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  function toggleSection(sectionId: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  async function toggleComplete(taskId: string, completed: boolean) {
    await updateTask(taskId, { completed: !completed });
  }

  return (
    <div className="p-6 max-w-5xl">
      {sections.map((section) => {
        const isCollapsed = collapsedSections.has(section.id);
        return (
          <div key={section.id} className="mb-6">
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center gap-2 mb-2 group"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
              <h3 className="text-sm font-semibold text-gray-700">{section.name}</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {section.tasks.length}
              </span>
            </button>

            {/* Tasks table */}
            {!isCollapsed && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4">Task</div>
                  <div className="col-span-2">Assignee</div>
                  <div className="col-span-2">Dates</div>
                  <div className="col-span-1">Priority</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2 text-right">Activity</div>
                </div>

                {/* Rows */}
                {section.tasks.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    No tasks in this section
                  </div>
                ) : (
                  section.tasks.map((task) => {
                    const hasDueDate = task.dueDate;
                    const isOverdue = hasDueDate && isPast(new Date(task.dueDate!)) && !isToday(new Date(task.dueDate!));
                    const isDueToday = hasDueDate && isToday(new Date(task.dueDate!));

                    return (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick(task.id)}
                        className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition border-l-2 ${
                          SECTION_COLORS[section.name] || "border-l-[#6B7C42]"
                        }`}
                      >
                        {/* Task name */}
                        <div className="col-span-4 flex items-center gap-2 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleComplete(task.id, task.completed);
                            }}
                            className={`shrink-0 ${
                              task.completed ? "text-green-500" : "text-gray-300 hover:text-gray-400"
                            }`}
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <span
                            className={`text-sm truncate ${
                              task.completed
                                ? "line-through text-gray-400"
                                : "text-gray-900"
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        {/* Assignee */}
                        <div className="col-span-2 flex items-center">
                          {(() => {
                            const assigneeList = task.assignees && task.assignees.length > 0
                              ? task.assignees.map((a) => a.user)
                              : task.assignee
                              ? [task.assignee]
                              : [];
                            if (assigneeList.length === 0) return <span className="text-sm text-gray-300">Unassigned</span>;
                            return (
                              <div className="flex items-center gap-1.5">
                                <div className="flex -space-x-1.5">
                                  {assigneeList.slice(0, 2).map((a) => (
                                    <div
                                      key={a.id}
                                      className="w-6 h-6 rounded-full bg-[#6B7C42] flex items-center justify-center text-white text-[10px] font-medium ring-2 ring-white"
                                      title={a.name}
                                    >
                                      {a.name[0].toUpperCase()}
                                    </div>
                                  ))}
                                  {assigneeList.length > 2 && (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600 ring-2 ring-white">
                                      +{assigneeList.length - 2}
                                    </div>
                                  )}
                                </div>
                                {assigneeList.length === 1 && (
                                  <span className="text-sm text-gray-600 truncate">
                                    {assigneeList[0].name.split(" ")[0]}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Date range */}
                        <div className="col-span-2 flex items-center">
                          {(task.startDate || hasDueDate) ? (
                            <span
                              className={`flex items-center gap-1 text-sm ${
                                isOverdue
                                  ? "text-red-500"
                                  : isDueToday
                                  ? "text-orange-500"
                                  : "text-gray-500"
                              }`}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              {task.startDate && !hasDueDate && format(new Date(task.startDate), "MMM d")}
                              {task.startDate && hasDueDate && `${format(new Date(task.startDate), "MMM d")} – `}
                              {hasDueDate && (
                                isOverdue
                                  ? "Overdue"
                                  : isDueToday
                                  ? "Today"
                                  : format(new Date(task.dueDate!), "MMM d")
                              )}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-300">No date</span>
                          )}
                        </div>

                        {/* Priority */}
                        <div className="col-span-1 flex items-center">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                              PRIORITY_COLORS[task.priority] || "text-gray-500 bg-gray-50"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Tracking Status */}
                        <div className="col-span-1 flex items-center">
                          {task.trackingStatus && TRACKING_STATUS_STYLES[task.trackingStatus] ? (
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                TRACKING_STATUS_STYLES[task.trackingStatus].bg
                              } ${
                                TRACKING_STATUS_STYLES[task.trackingStatus].text
                              }`}
                            >
                              {TRACKING_STATUS_STYLES[task.trackingStatus].label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>

                        {/* Activity */}
                        <div className="col-span-2 flex items-center justify-end gap-3">
                          {task._count.comments > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <MessageSquare className="w-3 h-3" />
                              {task._count.comments}
                            </span>
                          )}
                          {task._count.attachments > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Paperclip className="w-3 h-3" />
                              {task._count.attachments}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
