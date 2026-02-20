"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getCurrentUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return { id: session.user.id, name: session.user.name || "Unknown" };
}

export async function createTask(formData: FormData) {
  const user = await getCurrentUser();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const projectId = formData.get("projectId") as string;
  const sectionId = formData.get("sectionId") as string;
  const assigneeId = formData.get("assigneeId") as string | null;
  const priority = (formData.get("priority") as string) || "medium";
  const dueDate = formData.get("dueDate") as string;

  if (!title || !projectId || !sectionId) {
    return { error: "Title, project, and section are required" };
  }

  const lastTask = await prisma.task.findFirst({
    where: { sectionId },
    orderBy: { order: "desc" },
  });

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      projectId,
      sectionId,
      creatorId: user.id,
      assigneeId: assigneeId || null,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      order: (lastTask?.order ?? -1) + 1,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "created",
      details: JSON.stringify({ title }),
      taskId: task.id,
      userId: user.id,
    },
  });

  // Notify assignee
  if (assigneeId && assigneeId !== user.id) {
    await prisma.notification.create({
      data: {
        type: "assigned",
        message: `${user.name} assigned you to "${title}"`,
        link: `/dashboard/projects/${projectId}`,
        userId: assigneeId,
      },
    });
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

export async function updateTask(taskId: string, data: {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: string | null;
  assigneeId?: string | null;
  sectionId?: string;
  order?: number;
  completed?: boolean;
}) {
  const user = await getCurrentUser();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Task not found" };

  await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      dueDate: data.dueDate !== undefined
        ? (data.dueDate ? new Date(data.dueDate) : null)
        : undefined,
    },
  });

  // Log activity for significant changes
  if (data.completed !== undefined) {
    await prisma.activityLog.create({
      data: {
        action: data.completed ? "completed" : "uncompleted",
        taskId,
        userId: user.id,
      },
    });

    // Notify task creator if someone else completed it
    if (data.completed && task.creatorId !== user.id) {
      await prisma.notification.create({
        data: {
          type: "completed",
          message: `${user.name} completed "${task.title}"`,
          link: `/dashboard/projects/${task.projectId}`,
          userId: task.creatorId,
        },
      });
    }
  }

  if (data.assigneeId !== undefined && data.assigneeId !== task.assigneeId) {
    await prisma.activityLog.create({
      data: {
        action: "assigned",
        details: JSON.stringify({ assigneeId: data.assigneeId }),
        taskId,
        userId: user.id,
      },
    });

    if (data.assigneeId && data.assigneeId !== user.id) {
      await prisma.notification.create({
        data: {
          type: "assigned",
          message: `${user.name} assigned you to "${task.title}"`,
          link: `/dashboard/projects/${task.projectId}`,
          userId: data.assigneeId,
        },
      });
    }
  }

  if (data.priority && data.priority !== task.priority) {
    await prisma.activityLog.create({
      data: {
        action: "updated",
        details: JSON.stringify({ field: "priority", from: task.priority, to: data.priority }),
        taskId,
        userId: user.id,
      },
    });
  }

  revalidatePath(`/dashboard/projects/${task.projectId}`);
  revalidatePath("/dashboard/my-tasks");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Task not found" };

  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/dashboard/projects/${task.projectId}`);
  revalidatePath("/dashboard/my-tasks");
  return { success: true };
}

export async function moveTask(taskId: string, newSectionId: string, newOrder: number) {
  const user = await getCurrentUser();
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { section: true },
  });
  if (!task) return;

  const newSection = await prisma.section.findUnique({ where: { id: newSectionId } });

  await prisma.task.update({
    where: { id: taskId },
    data: { sectionId: newSectionId, order: newOrder },
  });

  if (task.sectionId !== newSectionId && newSection) {
    await prisma.activityLog.create({
      data: {
        action: "moved",
        details: JSON.stringify({ from: task.section.name, to: newSection.name }),
        taskId,
        userId: user.id,
      },
    });
  }

  revalidatePath(`/dashboard/projects/${task.projectId}`);
}

export async function getTask(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
      creator: { select: { id: true, name: true, email: true, avatar: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
      attachments: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      },
      subtasks: {
        orderBy: { order: "asc" },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
        },
      },
      tags: {
        include: { tag: true },
      },
      section: true,
      project: { select: { id: true, name: true } },
    },
  });
}

export async function getFilteredTasks(projectId: string, filters: {
  assigneeId?: string;
  priority?: string;
  completed?: boolean;
  search?: string;
}) {
  const where: Record<string, unknown> = { projectId };

  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.priority) where.priority = filters.priority;
  if (filters.completed !== undefined) where.completed = filters.completed;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, avatar: true, email: true } },
      section: { select: { id: true, name: true } },
      _count: { select: { comments: true, attachments: true, subtasks: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { order: "asc" },
  });
}
