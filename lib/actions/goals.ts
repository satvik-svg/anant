"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getCurrentUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createGoal(data: {
  title: string;
  description?: string;
  dueDate?: string;
}) {
  const userId = await getCurrentUserId();

  const goal = await prisma.goal.create({
    data: {
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      ownerId: userId,
    },
  });

  revalidatePath("/dashboard/goals");
  return { success: true, goal };
}

export async function updateGoal(goalId: string, data: {
  title?: string;
  description?: string;
  status?: string;
  progress?: number;
  dueDate?: string | null;
}) {
  await prisma.goal.update({
    where: { id: goalId },
    data: {
      ...data,
      dueDate: data.dueDate !== undefined
        ? (data.dueDate ? new Date(data.dueDate) : null)
        : undefined,
    },
  });

  revalidatePath("/dashboard/goals");
  return { success: true };
}

export async function deleteGoal(goalId: string) {
  await prisma.goal.delete({ where: { id: goalId } });
  revalidatePath("/dashboard/goals");
  return { success: true };
}

export async function getGoals() {
  const userId = await getCurrentUserId();
  return prisma.goal.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
    },
  });
}
