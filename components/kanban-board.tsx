"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { TaskCard } from "./task-card";
import { moveTask } from "@/lib/actions/tasks";
import { createSection } from "@/lib/actions/projects";
import { Plus } from "lucide-react";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  order: number;
  completed: boolean;
  sectionId: string;
  projectId: string;
  assignee: { id: string; name: string; avatar: string | null; email: string } | null;
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
  onAddTask: (sectionId: string) => void;
}

const SECTION_COLORS: Record<string, string> = {
  "To Do": "bg-gray-400",
  "In Progress": "bg-blue-500",
  "Done": "bg-green-500",
};

export function KanbanBoard({ sections, projectId, teamMembers, onTaskClick, onAddTask }: Props) {
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newSectionId = result.destination.droppableId;
    const newOrder = result.destination.index;

    await moveTask(taskId, newSectionId, newOrder);
  }

  async function handleAddSection() {
    if (!newSectionName.trim()) return;
    await createSection(projectId, newSectionName.trim());
    setNewSectionName("");
    setAddingSection(false);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-6 h-full overflow-x-auto">
        {sections.map((section) => (
          <div
            key={section.id}
            className="flex flex-col bg-gray-100/80 rounded-xl w-80 shrink-0"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    SECTION_COLORS[section.name] || "bg-indigo-500"
                  }`}
                />
                <h3 className="text-sm font-semibold text-gray-700">
                  {section.name}
                </h3>
                <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">
                  {section.tasks.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onAddTask(section.id)}
                  className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tasks list */}
            <Droppable droppableId={section.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 px-3 pb-3 space-y-2 overflow-y-auto min-h-[100px] transition ${
                    snapshot.isDraggingOver ? "bg-indigo-50/50 rounded-lg" : ""
                  }`}
                >
                  {section.tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`${snapshot.isDragging ? "rotate-2 shadow-lg" : ""}`}
                        >
                          <TaskCard
                            task={task}
                            onClick={() => onTaskClick(task.id)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Add task button at bottom */}
            <button
              onClick={() => onAddTask(section.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 transition rounded-b-xl"
            >
              <Plus className="w-4 h-4" />
              Add task
            </button>
          </div>
        ))}

        {/* Add section */}
        <div className="shrink-0 w-80">
          {addingSection ? (
            <div className="bg-gray-100/80 rounded-xl p-3">
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Section name"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSection();
                  if (e.key === "Escape") setAddingSection(false);
                }}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAddSection}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600"
                >
                  Add
                </button>
                <button
                  onClick={() => setAddingSection(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingSection(true)}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-400 hover:text-gray-600 bg-gray-100/50 hover:bg-gray-100 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Add section
            </button>
          )}
        </div>
      </div>
    </DragDropContext>
  );
}
