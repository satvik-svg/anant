"use client";

import { useMemo, useState } from "react";
import { KanbanBoard } from "./kanban-board";
import { ListView } from "./list-view";
import { TaskDetailModal } from "./task-detail-modal";
import { CreateTaskDialog } from "./create-task-dialog";
import {
  LayoutGrid,
  List,
  Plus,
  Filter,
  X,
  Search,
  UserPlus,
} from "lucide-react";
import { InviteDialog } from "./invite-dialog";

interface Section {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
}

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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  sections: Section[];
  team: {
    members: Array<{ user: TeamMember }>;
  };
}

interface Props {
  project: Project;
  teamMembers: TeamMember[];
  currentUserId: string;
}

export function ProjectView({ project, teamMembers, currentUserId }: Props) {
  const [view, setView] = useState<"board" | "list">("board");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [defaultSectionId, setDefaultSectionId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterAssignee, setFilterAssignee] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterTrackingStatus, setFilterTrackingStatus] = useState<string>("");
  const [filterSearch, setFilterSearch] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const hasActiveFilters = filterPriority || filterAssignee || filterStatus || filterTrackingStatus || filterSearch;

  const filteredSections = useMemo(() => {
    if (!hasActiveFilters) return project.sections;
    return project.sections.map((section) => ({
      ...section,
      tasks: section.tasks.filter((task) => {
        if (filterPriority && task.priority !== filterPriority) return false;
        if (filterAssignee === "unassigned" && (task.assignees?.length || task.assignee)) return false;
        if (filterAssignee && filterAssignee !== "unassigned") {
          const hasAssignee = task.assignees?.some((a) => a.user.id === filterAssignee) || task.assignee?.id === filterAssignee;
          if (!hasAssignee) return false;
        }
        if (filterStatus === "completed" && !task.completed) return false;
        if (filterStatus === "incomplete" && task.completed) return false;
        if (filterTrackingStatus && task.trackingStatus !== filterTrackingStatus) return false;
        if (filterSearch && !task.title.toLowerCase().includes(filterSearch.toLowerCase())) return false;
        return true;
      }),
    }));
  }, [project.sections, filterPriority, filterAssignee, filterStatus, filterTrackingStatus, filterSearch, hasActiveFilters]);

  return (
    <div className="h-full flex flex-col">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: project.color }}
            >
              {project.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-sm text-gray-500">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setView("board")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  view === "board"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Board
              </button>
              <button
                onClick={() => setView("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  view === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
            </div>

            {/* Members indicator */}
            <div className="flex -space-x-2 ml-2">
              {teamMembers.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium ring-2 ring-white"
                  title={m.name}
                >
                  {m.name[0].toUpperCase()}
                </div>
              ))}
              {teamMembers.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 ring-2 ring-white">
                  +{teamMembers.length - 3}
                </div>
              )}
            </div>

            {/* Invite button */}
            <button
              onClick={() => setShowInviteDialog(true)}
              className="ml-1 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
              title="Invite people"
            >
              <UserPlus className="w-4 h-4" />
              Invite
            </button>

            {/* Add task */}
            <button
              onClick={() => {
                setDefaultSectionId(project.sections[0]?.id || null);
                setShowCreateTask(true);
              }}
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
              hasActiveFilters
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
            {hasActiveFilters && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterPriority("");
                  setFilterAssignee("");
                  setFilterStatus("");
                  setFilterTrackingStatus("");
                  setFilterSearch("");
                }}
                className="ml-1 hover:text-indigo-900"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </button>

          {showFilters && (
            <>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none w-40"
                />
              </div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="">All priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="">All assignees</option>
                <option value="unassigned">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="">All statuses</option>
                <option value="incomplete">Incomplete</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={filterTrackingStatus}
                onChange={(e) => setFilterTrackingStatus(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="">All tracking</option>
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="off_track">Off Track</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {view === "board" ? (
          <KanbanBoard
            sections={filteredSections}
            projectId={project.id}
            teamMembers={teamMembers}
            onTaskClick={setSelectedTaskId}
            onAddTask={(sectionId: string) => {
              setDefaultSectionId(sectionId);
              setShowCreateTask(true);
            }}
          />
        ) : (
          <ListView
            sections={filteredSections}
            projectId={project.id}
            teamMembers={teamMembers}
            onTaskClick={setSelectedTaskId}
          />
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          teamMembers={teamMembers}
          currentUserId={currentUserId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {/* Create Task Dialog */}
      {showCreateTask && defaultSectionId && (
        <CreateTaskDialog
          projectId={project.id}
          sectionId={defaultSectionId}
          sections={project.sections}
          teamMembers={teamMembers}
          onClose={() => setShowCreateTask(false)}
        />
      )}

      {/* Invite Dialog */}
      {showInviteDialog && (
        <InviteDialog
          projectId={project.id}
          projectName={project.name}
          onClose={() => setShowInviteDialog(false)}
        />
      )}
    </div>
  );
}
