"use client";

import { useState, useTransition } from "react";
import { markAsRead, markAllAsRead, deleteNotification } from "@/lib/actions/notifications";
import { format } from "date-fns";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  MessageSquare,
  UserPlus,
  AlertCircle,
  Trash2,
  CheckCheck,
  Inbox,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  assigned: UserPlus,
  commented: MessageSquare,
  completed: CheckCircle2,
  mentioned: AlertCircle,
  due_soon: AlertCircle,
};

const TYPE_COLORS: Record<string, string> = {
  assigned: "bg-blue-50 text-blue-600",
  commented: "bg-purple-50 text-purple-600",
  completed: "bg-green-50 text-green-600",
  mentioned: "bg-orange-50 text-orange-600",
  due_soon: "bg-red-50 text-red-600",
};

export function InboxList({ notifications }: { notifications: Notification[] }) {
  const [items, setItems] = useState(notifications);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = filter === "unread" ? items.filter((n) => !n.read) : items;
  const unreadCount = items.filter((n) => !n.read).length;

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markAsRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteNotification(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    });
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              filter === "all" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              filter === "unread" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((notification) => {
            const Icon = TYPE_ICONS[notification.type] || Bell;
            const colorClass = TYPE_COLORS[notification.type] || "bg-gray-50 text-gray-600";

            const content = (
              <div
                className={`flex items-start gap-3 p-4 rounded-xl border transition group ${
                  notification.read
                    ? "bg-white border-gray-100"
                    : "bg-indigo-50/30 border-indigo-100"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.read ? "text-gray-600" : "text-gray-900 font-medium"}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkRead(notification.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-white transition"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );

            return notification.link ? (
              <Link key={notification.id} href={notification.link} onClick={() => !notification.read && handleMarkRead(notification.id)}>
                {content}
              </Link>
            ) : (
              <div key={notification.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
