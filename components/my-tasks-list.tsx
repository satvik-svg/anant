"use client";

import { format, isPast, isToday } from "date-fns";
import { updateTask } from "@/lib/actions/tasks";
import {
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  Clock,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  dueDate: string | Date | null;
  completed: boolean;
  project: { id: string; name: string; color: string };
  section: { name: string };
  _count: { comments: number; attachments: number };
}

interface Props {
  tasks: Task[];
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-500 bg-red-50",
  high: "text-orange-500 bg-orange-50",
  medium: "text-yellow-600 bg-yellow-50",
  low: "text-blue-500 bg-blue-50",
};

export function MyTasksList({ tasks }: Props) {
  const [isPending, startTransition] = useTransition();

  async function toggleComplete(taskId: string, completed: boolean) {
    startTransition(async () => {
      await updateTask(taskId, { completed: !completed });
    });
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No tasks assigned to you. Enjoy the free time!</p>
      </div>
    );
  }

  const incomplete = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-6">
      {/* Incomplete tasks */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">
            To complete ({incomplete.length})
          </h2>
        </div>
        {incomplete.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            All caught up!
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {incomplete.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={(completed) => toggleComplete(task.id, completed)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed tasks */}
      {completed.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Completed ({completed.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {completed.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={(completed) => toggleComplete(task.id, completed)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (completed: boolean) => void;
}) {
  const hasDueDate = task.dueDate;
  const dueDate = hasDueDate ? new Date(task.dueDate as string) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !task.completed;

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition">
      <button
        onClick={() => onToggle(task.completed)}
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

      <div className="flex-1 min-w-0">
        <Link
          href={`/dashboard/projects/${task.project.id}`}
          className={`text-sm font-medium hover:text-indigo-600 transition ${
            task.completed ? "line-through text-gray-400" : "text-gray-900"
          }`}
        >
          {task.title}
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="w-2 h-2 rounded-sm shrink-0"
            style={{ backgroundColor: task.project.color }}
          />
          <span className="text-xs text-gray-400 truncate">
            {task.project.name} · {task.section.name}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {hasDueDate && (
          <span
            className={`flex items-center gap-1 text-xs ${
              isOverdue ? "text-red-500" : "text-gray-400"
            }`}
          >
            <Calendar className="w-3 h-3" />
            {isOverdue
              ? "Overdue"
              : isToday(dueDate!)
              ? "Today"
              : format(dueDate!, "MMM d")}
          </span>
        )}
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
            PRIORITY_COLORS[task.priority] || "text-gray-500 bg-gray-50"
          }`}
        >
          {task.priority}
        </span>
        {task._count.comments > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MessageSquare className="w-3 h-3" />
            {task._count.comments}
          </span>
        )}
      </div>
    </div>
  );
}
