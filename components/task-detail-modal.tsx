"use client";

import { useEffect, useState, useTransition } from "react";
import { getTask, updateTask, deleteTask } from "@/lib/actions/tasks";
import { addComment, deleteComment, addAttachment, deleteAttachment } from "@/lib/actions/comments";
import { createSubtask, toggleSubtask, deleteSubtask } from "@/lib/actions/subtasks";
import { getTaskActivities } from "@/lib/actions/activity";
import { addTagToTask, removeTagFromTask, createTag, getTags } from "@/lib/actions/tags";
import { format } from "date-fns";
import {
  X,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Paperclip,
  Trash2,
  Send,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Loader2,
  Edit3,
  ListTodo,
  Activity,
  Plus,
  Upload,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface Props {
  taskId: string;
  teamMembers: TeamMember[];
  currentUserId: string;
  onClose: () => void;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignee: { id: string; name: string; avatar: string | null } | null;
}

interface TagItem {
  id: string;
  name: string;
  color: string;
}

interface ActivityItem {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
}

interface FullTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  assignee: TeamMember | null;
  creator: TeamMember;
  section: { id: string; name: string };
  project: { id: string; name: string };
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: TeamMember;
  }>;
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
    mimeType: string;
    createdAt: string;
    uploadedBy: { id: string; name: string };
  }>;
  subtasks: Subtask[];
  tags: Array<{ tag: TagItem }>;
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "text-red-600 bg-red-50 border-red-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  low: "text-blue-600 bg-blue-50 border-blue-200",
};

const ACTIVITY_LABELS: Record<string, string> = {
  created: "created this task",
  completed: "completed this task",
  uncompleted: "marked as incomplete",
  assigned: "changed the assignee",
  moved: "moved this task",
  updated: "updated this task",
  commented: "added a comment",
  subtask_added: "added a subtask",
  subtask_completed: "completed a subtask",
  subtask_uncompleted: "uncompleted a subtask",
  attachment_added: "added an attachment",
};

export function TaskDetailModal({ taskId, teamMembers, currentUserId, onClose }: Props) {
  const [task, setTask] = useState<FullTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activeTab, setActiveTab] = useState<"comments" | "subtasks" | "activity" | "attachments">("subtasks");
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  useEffect(() => {
    loadTask();
    loadTags();
  }, [taskId]);

  async function loadTask() {
    setLoading(true);
    const data = await getTask(taskId);
    setTask(data as unknown as FullTask);
    setEditTitle(data?.title || "");
    setEditDescription(data?.description || "");
    setLoading(false);
  }

  async function loadActivities() {
    const data = await getTaskActivities(taskId);
    setActivities(data as unknown as ActivityItem[]);
  }

  async function loadTags() {
    const data = await getTags();
    setAllTags(data as unknown as TagItem[]);
  }

  async function handleToggleComplete() {
    if (!task) return;
    startTransition(async () => {
      await updateTask(task.id, { completed: !task.completed });
      await loadTask();
    });
  }

  async function handleUpdatePriority(priority: string) {
    if (!task) return;
    startTransition(async () => {
      await updateTask(task.id, { priority });
      await loadTask();
    });
  }

  async function handleUpdateAssignee(assigneeId: string) {
    if (!task) return;
    startTransition(async () => {
      await updateTask(task.id, { assigneeId: assigneeId || null });
      await loadTask();
    });
  }

  async function handleUpdateDueDate(dueDate: string) {
    if (!task) return;
    startTransition(async () => {
      await updateTask(task.id, { dueDate: dueDate || null });
      await loadTask();
    });
  }

  async function handleSaveEdit() {
    if (!task) return;
    startTransition(async () => {
      await updateTask(task.id, {
        title: editTitle,
        description: editDescription || undefined,
      });
      setEditing(false);
      await loadTask();
    });
  }

  async function handleAddComment() {
    if (!task || !commentText.trim()) return;
    startTransition(async () => {
      await addComment(task.id, commentText.trim());
      setCommentText("");
      await loadTask();
    });
  }

  async function handleDeleteComment(commentId: string) {
    startTransition(async () => {
      await deleteComment(commentId);
      await loadTask();
    });
  }

  async function handleDeleteTask() {
    if (!task) return;
    if (!confirm("Delete this task? This action cannot be undone.")) return;
    await deleteTask(task.id);
    onClose();
  }

  async function handleAddSubtask() {
    if (!task || !newSubtaskTitle.trim()) return;
    startTransition(async () => {
      await createSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle("");
      setShowAddSubtask(false);
      await loadTask();
    });
  }

  async function handleToggleSubtask(subtaskId: string) {
    startTransition(async () => {
      await toggleSubtask(subtaskId);
      await loadTask();
    });
  }

  async function handleDeleteSubtask(subtaskId: string) {
    startTransition(async () => {
      await deleteSubtask(subtaskId);
      await loadTask();
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !task) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      startTransition(async () => {
        await addAttachment(task.id, {
          filename: file.name,
          url: reader.result as string,
          size: file.size,
          mimeType: file.type,
        });
        await loadTask();
      });
    };
    reader.readAsDataURL(file);
  }

  async function handleDeleteAttachment(attachmentId: string) {
    startTransition(async () => {
      await deleteAttachment(attachmentId);
      await loadTask();
    });
  }

  async function handleAddTag(tagId: string) {
    if (!task) return;
    startTransition(async () => {
      await addTagToTask(task.id, tagId);
      await loadTask();
    });
    setShowTagDropdown(false);
  }

  async function handleCreateAndAddTag() {
    if (!task || !newTagName.trim()) return;
    startTransition(async () => {
      const result = await createTag(newTagName.trim());
      if (result.tag) {
        await addTagToTask(task.id, result.tag.id);
        setAllTags((prev) => [...prev, result.tag!]);
        setNewTagName("");
        await loadTask();
      }
    });
    setShowTagDropdown(false);
  }

  async function handleRemoveTag(tagId: string) {
    if (!task) return;
    startTransition(async () => {
      await removeTagFromTask(task.id, tagId);
      await loadTask();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {task && (
              <>
                <span>{task.project.name}</span>
                <span>/</span>
                <span>{task.section.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteTask}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : task ? (
            <div className="p-6 space-y-6">
              {/* Title & Description */}
              <div>
                {editing ? (
                  <div className="space-y-3">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-xl font-semibold px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      placeholder="Add description..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setEditTitle(task.title);
                          setEditDescription(task.description || "");
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={handleToggleComplete}
                        className={`mt-1 shrink-0 ${
                          task.completed ? "text-green-500" : "text-gray-300 hover:text-gray-400"
                        }`}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h2
                          className={`text-xl font-semibold ${
                            task.completed ? "line-through text-gray-400" : "text-gray-900"
                          }`}
                        >
                          {task.title}
                          <button
                            onClick={() => setEditing(true)}
                            className="ml-2 opacity-0 group-hover:opacity-100 transition"
                          >
                            <Edit3 className="w-4 h-4 text-gray-400 inline" />
                          </button>
                        </h2>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                {(task.tags || []).map((tt) => (
                  <span
                    key={tt.tag.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border"
                    style={{ borderColor: tt.tag.color, color: tt.tag.color, backgroundColor: `${tt.tag.color}10` }}
                  >
                    {tt.tag.name}
                    <button onClick={() => handleRemoveTag(tt.tag.id)} className="hover:opacity-70">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <div className="relative">
                  <button
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded-full hover:border-gray-400 transition"
                  >
                    <Tag className="w-3 h-3" />
                    Add tag
                  </button>
                  {showTagDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48 p-2">
                      {allTags
                        .filter((t) => !(task.tags || []).some((tt) => tt.tag.id === t.id))
                        .map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => handleAddTag(tag.id)}
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                          >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                            {tag.name}
                          </button>
                        ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <div className="flex gap-1">
                          <input
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="New tag..."
                            className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                            onKeyDown={(e) => { if (e.key === "Enter") handleCreateAndAddTag(); }}
                          />
                          <button
                            onClick={handleCreateAndAddTag}
                            disabled={!newTagName.trim()}
                            className="px-2 py-1 text-xs text-white bg-indigo-500 rounded hover:bg-indigo-600 disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Properties */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                {/* Assignee */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                    <User className="w-3.5 h-3.5" />
                    Assignee
                  </label>
                  <select
                    value={task.assignee?.id || ""}
                    onChange={(e) => handleUpdateAssignee(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
                    onChange={(e) => handleUpdateDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Priority
                  </label>
                  <select
                    value={task.priority}
                    onChange={(e) => handleUpdatePriority(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Created */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Created
                  </label>
                  <p className="text-sm text-gray-700 px-2.5 py-1.5">
                    {format(new Date(task.createdAt), "MMM d, yyyy")} by {task.creator.name}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex gap-4">
                  {[
                    { key: "subtasks" as const, label: "Subtasks", icon: ListTodo, count: (task.subtasks || []).length },
                    { key: "comments" as const, label: "Comments", icon: MessageSquare, count: task.comments.length },
                    { key: "attachments" as const, label: "Files", icon: Paperclip, count: task.attachments.length },
                    { key: "activity" as const, label: "Activity", icon: Activity, count: null },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key);
                        if (tab.key === "activity" && activities.length === 0) loadActivities();
                      }}
                      className={`flex items-center gap-1.5 px-1 py-2 text-sm font-medium border-b-2 transition ${
                        activeTab === tab.key
                          ? "border-indigo-500 text-indigo-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                      {tab.count !== null && tab.count > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{tab.count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtasks Tab */}
              {activeTab === "subtasks" && (
                <div>
                  <div className="space-y-1 mb-3">
                    {(task.subtasks || []).length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${((task.subtasks || []).filter((s) => s.completed).length / (task.subtasks || []).length) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {(task.subtasks || []).filter((s) => s.completed).length}/{(task.subtasks || []).length}
                        </span>
                      </div>
                    )}
                    {(task.subtasks || []).map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 group py-1">
                        <button
                          onClick={() => handleToggleSubtask(subtask.id)}
                          className={`shrink-0 ${subtask.completed ? "text-green-500" : "text-gray-300 hover:text-gray-400"}`}
                        >
                          {subtask.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </button>
                        <span className={`flex-1 text-sm ${subtask.completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                          {subtask.title}
                        </span>
                        <button
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {showAddSubtask ? (
                    <div className="flex gap-2">
                      <input
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Subtask title..."
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddSubtask();
                          if (e.key === "Escape") setShowAddSubtask(false);
                        }}
                      />
                      <button
                        onClick={handleAddSubtask}
                        disabled={!newSubtaskTitle.trim()}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddSubtask(true)}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Add subtask
                    </button>
                  )}
                </div>
              )}

              {/* Comments Tab */}
              {activeTab === "comments" && (
                <div>
                  <div className="space-y-3 mb-4">
                    {task.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 group">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-medium shrink-0 mt-0.5">
                          {comment.author.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{comment.author.name}</span>
                            <span className="text-xs text-gray-400">{format(new Date(comment.createdAt), "MMM d, h:mm a")}</span>
                            {comment.author.id === currentUserId && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    {task.comments.length === 0 && (
                      <p className="text-sm text-gray-400">No comments yet. Be the first!</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || isPending}
                      className="p-2 text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Attachments Tab */}
              {activeTab === "attachments" && (
                <div>
                  <div className="space-y-2 mb-4">
                    {task.attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                        <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{att.filename}</p>
                          <p className="text-xs text-gray-400">{(att.size / 1024).toFixed(1)} KB · {att.uploadedBy.name}</p>
                        </div>
                        {att.url.startsWith("data:") && (
                          <a href={att.url} download={att.filename} className="text-xs text-indigo-500 hover:text-indigo-700">Download</a>
                        )}
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {task.attachments.length === 0 && (
                      <p className="text-sm text-gray-400">No files attached yet.</p>
                    )}
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    Upload file
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">Files stored as base64 (max ~2MB recommended)</p>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === "activity" && (
                <div>
                  {activities.length === 0 ? (
                    <p className="text-sm text-gray-400">No activity recorded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-medium shrink-0 mt-0.5">
                            {activity.user.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-gray-900">{activity.user.name}</span>{" "}
                              {ACTIVITY_LABELS[activity.action] || activity.action}
                            </p>
                            <p className="text-xs text-gray-400">{format(new Date(activity.createdAt), "MMM d, h:mm a")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-gray-500">Task not found</div>
          )}
        </div>
      </div>
    </div>
  );
}
