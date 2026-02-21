"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redis, teamsListCacheKey, projectsListCacheKey, invalidateUserCaches, LIST_CACHE_TTL } from "@/lib/redis";
import { after } from "next/server";

async function getCurrentUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createTeam(name: string) {
  const userId = await getCurrentUserId();

  if (!name || !name.trim()) {
    return { error: "Team name is required" };
  }

  const team = await prisma.team.create({
    data: {
      name: name.trim(),
      members: {
        create: {
          userId,
          role: "owner",
        },
      },
    },
  });

  after(() => invalidateUserCaches(teamsListCacheKey(userId), projectsListCacheKey(userId)));
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/team");
  return { success: true, teamId: team.id };
}

export async function getTeams() {
  const userId = await getCurrentUserId();
  const cacheKey = teamsListCacheKey(userId);

  const cached = await redis.get<unknown>(cacheKey);
  if (cached) return cached as Awaited<ReturnType<typeof fetchTeams>>;

  const teams = await fetchTeams(userId);

  after(() => redis.setex(cacheKey, LIST_CACHE_TTL, JSON.stringify(teams)));
  return teams;
}

async function fetchTeams(userId: string) {
  return prisma.team.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
      _count: { select: { projects: true } },
    },
  });
}

export async function inviteToTeam(teamId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "User not found" };

  const existing = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });
  if (existing) return { error: "User already in team" };

  await prisma.teamMember.create({
    data: { userId: user.id, teamId, role: "member" },
  });

  // Bust both users' list caches
  const currentUserId = await getCurrentUserId();
  after(() => invalidateUserCaches(
    teamsListCacheKey(user.id),
    projectsListCacheKey(user.id),
    teamsListCacheKey(currentUserId),
  ));
  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeFromTeam(teamId: string, userId: string) {
  await prisma.teamMember.delete({
    where: { userId_teamId: { userId, teamId } },
  });
  after(() => invalidateUserCaches(teamsListCacheKey(userId), projectsListCacheKey(userId)));
  revalidatePath("/dashboard");
}
