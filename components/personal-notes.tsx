"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { format } from "date-fns";
import {
  createNote,
  updateNote,
  deleteNote,
  togglePinNote,
} from "@/lib/actions/notes";
import {
  Plus,
  X,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Loader2,
  StickyNote,
  Search,
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  notes: Note[];
}

const COLORS: { value: string; label: string; bg: string; border: string; card: string }[] = [
  { value: "default", label: "Default", bg: "bg-white", border: "border-gray-200", card: "bg-white" },
  { value: "yellow", label: "Yellow", bg: "bg-yellow-50", border: "border-yellow-200", card: "bg-yellow-50" },
  { value: "green", label: "Green", bg: "bg-emerald-50", border: "border-emerald-200", card: "bg-emerald-50" },
  { value: "blue", label: "Blue", bg: "bg-blue-50", border: "border-blue-200", card: "bg-blue-50" },
  { value: "olive", label: "Olive", bg: "bg-[#EEF0E0]", border: "border-[#B8C87A]", card: "bg-[#EEF0E0]" },
  { value: "pink", label: "Pink", bg: "bg-pink-50", border: "border-pink-200", card: "bg-pink-50" },
  { value: "orange", label: "Orange", bg: "bg-orange-50", border: "border-orange-200", card: "bg-orange-50" },
];

function getColor(value: string) {
  return COLORS.find((c) => c.value === value) || COLORS[0];
}

export function PersonalNotes({ notes }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B7C42]"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <CreateNoteDialog onClose={() => setShowCreate(false)} />
      )}

      {/* Empty state */}
      {notes.length === 0 && (
        <div className="text-center py-16">
          <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600">No notes yet</h3>
          <p className="text-sm text-gray-400 mt-1">Create a personal note to get started</p>
        </div>
      )}

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Pin className="w-3 h-3" /> Pinned
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinned.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* Others */}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Others
            </h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpinned.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && notes.length > 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No notes match your search.</p>
      )}
    </div>
  );
}

/* ─── Note Card ─── */

function NoteCard({ note }: { note: Note }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [color, setColor] = useState(note.color);
  const [isPending, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && titleRef.current) titleRef.current.focus();
  }, [isEditing]);

  const colorInfo = getColor(note.color);
  const editColorInfo = getColor(color);

  function handleSave() {
    startTransition(async () => {
      await updateNote(note.id, { title: title.trim() || "Untitled", content, color });
      setIsEditing(false);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this note?")) return;
    startTransition(async () => {
      await deleteNote(note.id);
    });
  }

  function handlePin() {
    startTransition(async () => {
      await togglePinNote(note.id);
    });
  }

  if (isEditing) {
    return (
      <div className={`rounded-xl border-2 ${editColorInfo.border} ${editColorInfo.card} p-4 shadow-sm`}>
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-sm font-semibold text-gray-900 bg-transparent border-none outline-none mb-2 placeholder-gray-400"
          placeholder="Note title"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full text-sm text-gray-700 bg-transparent border-none outline-none resize-none mb-3 placeholder-gray-400"
          placeholder="Write your note..."
        />

        {/* Color picker */}
        <div className="flex items-center gap-1.5 mb-3">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`w-6 h-6 rounded-full border-2 transition ${
                c.value === "default" ? "bg-white" : c.bg
              } ${color === c.value ? "border-gray-800 scale-110" : "border-gray-300"}`}
              title={c.label}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => {
              setIsEditing(false);
              setTitle(note.title);
              setContent(note.content);
              setColor(note.color);
            }}
            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-3 py-1.5 text-xs bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group rounded-xl border ${colorInfo.border} ${colorInfo.card} p-4 shadow-sm hover:shadow-md transition cursor-pointer relative`}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* Actions */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={handlePin}
          disabled={isPending}
          className="p-1.5 rounded-md hover:bg-black/5 text-gray-400 hover:text-gray-600 transition"
          title={note.pinned ? "Unpin" : "Pin"}
        >
          {note.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 rounded-md hover:bg-black/5 text-gray-400 hover:text-gray-600 transition"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="p-1.5 rounded-md hover:bg-black/5 text-gray-400 hover:text-red-500 transition"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <h3 className="text-sm font-semibold text-gray-900 mb-1.5 pr-16 line-clamp-1">{note.title}</h3>
      {note.content && (
        <p className="text-xs text-gray-600 line-clamp-6 whitespace-pre-wrap leading-relaxed">
          {note.content}
        </p>
      )}
      <p className="text-[10px] text-gray-400 mt-3">
        {format(new Date(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}
      </p>
    </div>
  );
}

/* ─── Create Dialog ─── */

function CreateNoteDialog({ onClose }: { onClose: () => void }) {
  const [color, setColor] = useState("default");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    formData.set("color", color);
    startTransition(async () => {
      await createNote(formData);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">New Note</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form ref={formRef} action={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input
              name="title"
              required
              autoFocus
              placeholder="Note title"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B7C42]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
            <textarea
              name="content"
              rows={6}
              placeholder="Write something..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B7C42] resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    c.value === "default" ? "bg-white" : c.bg
                  } ${color === c.value ? "border-gray-800 scale-110" : "border-gray-300"}`}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition inline-flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
