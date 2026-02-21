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
  const priority = (formData.get("priority") as string) || "medium";
  const dueDate = formData.get("dueDate") as string;
  const startDate = formData.get("startDate") as string;
  const trackingStatus = (formData.get("trackingStatus") as string) || "on_track";

  // Support multiple assignees
  const assigneeIds = formData.getAll("assigneeId") as string[];
  const validAssigneeIds = assigneeIds.filter((id) => id && id.trim() !== "");
  const primaryAssigneeId = validAssigneeIds[0] || null;

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
      assigneeId: primaryAssigneeId,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      startDate: startDate ? new Date(startDate) : null,
      trackingStatus,
      order: (lastTask?.order ?? -1) + 1,
      assignees: validAssigneeIds.length > 0 ? {
        create: validAssigneeIds.map((userId) => ({ userId })),
      } : undefined,
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

  // Notify assignees
  for (const assigneeId of validAssigneeIds) {
    if (assigneeId !== user.id) {
      await prisma.notification.create({
        data: {
          type: "assigned",
          message: `${user.name} assigned you to "${title}"`,
          link: `/dashboard/projects/${projectId}`,
          userId: assigneeId,
        },
      });
    }
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
  startDate?: string | null;
  trackingStatus?: string;
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
      startDate: data.startDate !== undefined
        ? (data.startDate ? new Date(data.startDate) : null)
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
      assignees: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
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
      assignees: {
        include: {
          user: { select: { id: true, name: true, avatar: true, email: true } },
        },
      },
      section: { select: { id: true, name: true } },
      _count: { select: { comments: true, attachments: true, subtasks: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { order: "asc" },
  });
}

export async function addTaskAssignee(taskId: string, userId: string) {
  const user = await getCurrentUser();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Task not found" };

  // Check if already assigned
  const existing = await prisma.taskAssignee.findUnique({
    where: { taskId_userId: { taskId, userId } },
  });
  if (existing) return { error: "User already assigned" };

  await prisma.taskAssignee.create({
    data: { taskId, userId },
  });

  // If no primary assignee, set this one
  if (!task.assigneeId) {
    await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId: userId },
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "assigned",
      details: JSON.stringify({ assigneeId: userId }),
      taskId,
      userId: user.id,
    },
  });

  // Notify
  if (userId !== user.id) {
    await prisma.notification.create({
      data: {
        type: "assigned",
        message: `${user.name} assigned you to "${task.title}"`,
        link: `/dashboard/projects/${task.projectId}`,
        userId,
      },
    });
  }

  revalidatePath(`/dashboard/projects/${task.projectId}`);
  revalidatePath("/dashboard/my-tasks");
  return { success: true };
}

export async function removeTaskAssignee(taskId: string, userId: string) {
  const user = await getCurrentUser();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Task not found" };

  await prisma.taskAssignee.deleteMany({
    where: { taskId, userId },
  });

  // If removing the primary assignee, update to next assignee or null
  if (task.assigneeId === userId) {
    const nextAssignee = await prisma.taskAssignee.findFirst({
      where: { taskId },
    });
    await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId: nextAssignee?.userId || null },
    });
  }

  await prisma.activityLog.create({
    data: {
      action: "assigned",
      details: JSON.stringify({ removed: userId }),
      taskId,
      userId: user.id,
    },
  });

  revalidatePath(`/dashboard/projects/${task.projectId}`);
  revalidatePath("/dashboard/my-tasks");
  return { success: true };
}

export async function updateTaskAssignees(taskId: string, userIds: string[]) {
  const user = await getCurrentUser();
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignees: true },
  });
  if (!task) return { error: "Task not found" };

  const currentIds = task.assignees.map((a) => a.userId);
  const toAdd = userIds.filter((id) => !currentIds.includes(id));
  const toRemove = currentIds.filter((id) => !userIds.includes(id));

  // Remove
  if (toRemove.length > 0) {
    await prisma.taskAssignee.deleteMany({
      where: { taskId, userId: { in: toRemove } },
    });
  }

  // Add
  if (toAdd.length > 0) {
    await prisma.taskAssignee.createMany({
      data: toAdd.map((userId) => ({ taskId, userId })),
    });
  }

  // Update primary assignee
  const primaryAssignee = userIds[0] || null;
  await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId: primaryAssignee },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "assigned",
      details: JSON.stringify({ assignees: userIds }),
      taskId,
      userId: user.id,
    },
  });

  // Notify new assignees
  for (const userId of toAdd) {
    if (userId !== user.id) {
      await prisma.notification.create({
        data: {
          type: "assigned",
          message: `${user.name} assigned you to "${task.title}"`,
          link: `/dashboard/projects/${task.projectId}`,
          userId,
        },
      });
    }
  }

  revalidatePath(`/dashboard/projects/${task.projectId}`);
  revalidatePath("/dashboard/my-tasks");
  return { success: true };
}

export async function getMyTasks() {
  const userId = await getCurrentUserId();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { assigneeId: userId },
        { assignees: { some: { userId } } },
      ],
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const upcoming = tasks.filter(
    (t) => !t.completed && (!t.dueDate || t.dueDate >= now)
  );
  const overdue = tasks.filter(
    (t) => !t.completed && t.dueDate && t.dueDate < now
  );
  const completed = tasks.filter((t) => t.completed);
  const completedThisWeek = tasks.filter(
    (t) => t.completed && t.updatedAt >= startOfWeek && t.updatedAt <= endOfWeek
  );

  return { upcoming, overdue, completed, completedThisWeek, total: tasks.length };
}
