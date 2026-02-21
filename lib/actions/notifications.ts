"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redis, unreadCountCacheKey, invalidateUserCaches, UNREAD_CACHE_TTL } from "@/lib/redis";
import { after } from "next/server";

async function getCurrentUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createNotification(userId: string, type: string, message: string, link?: string) {
  await prisma.notification.create({
    data: { type, message, link, userId },
  });
}

export async function getNotifications() {
  const userId = await getCurrentUserId();
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getUnreadCount() {
  const userId = await getCurrentUserId();
  const cacheKey = unreadCountCacheKey(userId);

  const cached = await redis.get<number>(cacheKey);
  if (cached !== null) return cached;

  const count = await prisma.notification.count({
    where: { userId, read: false },
  });

  after(() => redis.setex(cacheKey, UNREAD_CACHE_TTL, count));
  return count;
}

export async function markAsRead(notificationId: string) {
  const userId = await getCurrentUserId();
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
  after(() => invalidateUserCaches(unreadCountCacheKey(userId)));
  revalidatePath("/dashboard/inbox");
}

export async function markAllAsRead() {
  const userId = await getCurrentUserId();
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  after(() => invalidateUserCaches(unreadCountCacheKey(userId)));
  revalidatePath("/dashboard/inbox");
}

export async function deleteNotification(notificationId: string) {
  await prisma.notification.delete({ where: { id: notificationId } });
  revalidatePath("/dashboard/inbox");
}

// Helper: notify user when assigned to a task
export async function notifyAssignment(assigneeId: string, taskTitle: string, projectId: string) {
  await createNotification(
    assigneeId,
    "assigned",
    `You were assigned to "${taskTitle}"`,
    `/dashboard/projects/${projectId}`
  );
}

// Helper: notify task creator when someone comments
export async function notifyComment(taskCreatorId: string, commenterName: string, taskTitle: string, projectId: string) {
  await createNotification(
    taskCreatorId,
    "commented",
    `${commenterName} commented on "${taskTitle}"`,
    `/dashboard/projects/${projectId}`
  );
}

// Helper: notify when task is completed
export async function notifyCompletion(taskCreatorId: string, completerName: string, taskTitle: string, projectId: string) {
  await createNotification(
    taskCreatorId,
    "completed",
    `${completerName} completed "${taskTitle}"`,
    `/dashboard/projects/${projectId}`
  );
}
