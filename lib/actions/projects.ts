"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redis, projectCacheKey, projectsListCacheKey, invalidateProjectCache, invalidateUserCaches, PROJECT_CACHE_TTL, LIST_CACHE_TTL } from "@/lib/redis";
import { after } from "next/server";

async function getCurrentUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createProject(formData: FormData) {
  const userId = await getCurrentUserId();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const color = (formData.get("color") as string) || "#6366f1";
  const teamId = formData.get("teamId") as string;

  if (!name || !teamId) return { error: "Name and team are required" };

  const project = await prisma.project.create({
    data: {
      name,
      description,
      color,
      teamId,
      creatorId: userId,
      sections: {
        create: [
          { name: "To Do", order: 0 },
          { name: "In Progress", order: 1 },
          { name: "Done", order: 2 },
        ],
      },
    },
  });

  // Bust the sidebar projects list for this user
  after(() => invalidateUserCaches(projectsListCacheKey(userId)));
  revalidatePath("/dashboard");
  return { success: true, projectId: project.id };
}

export async function updateProject(projectId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const color = formData.get("color") as string;

  await prisma.project.update({
    where: { id: projectId },
    data: { name, description, color },
  });

  revalidatePath(`/dashboard/projects/${projectId}`, "page");
  revalidatePath("/dashboard");
  after(() => invalidateProjectCache(projectId));
}

export async function deleteProject(projectId: string) {
  const userId = await getCurrentUserId();
  await prisma.project.delete({ where: { id: projectId } });
  after(() => invalidateUserCaches(projectsListCacheKey(userId)));
  revalidatePath("/dashboard");
}

export async function getProjects() {
  const userId = await getCurrentUserId();
  const cacheKey = projectsListCacheKey(userId);

  const cached = await redis.get<unknown>(cacheKey);
  if (cached) return cached as Awaited<ReturnType<typeof fetchProjects>>;

  const projects = await fetchProjects(userId);

  after(() => redis.setex(cacheKey, LIST_CACHE_TTL, JSON.stringify(projects)));
  return projects;
}

async function fetchProjects(userId: string) {
  // Single query via relation filter — no separate teamMember lookup needed
  return prisma.project.findMany({
    where: { team: { members: { some: { userId } } } },
    include: {
      _count: { select: { tasks: true } },
      creator: { select: { name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProject(projectId: string) {
  const cacheKey = projectCacheKey(projectId);

  // L1: Redis distributed cache — shared across all serverless instances
  const cached = await redis.get<unknown>(cacheKey);
  if (cached) return cached as Awaited<ReturnType<typeof fetchProject>>;

  const project = await fetchProject(projectId);

  // Populate cache in the background so the response isn't blocked
  if (project) {
    after(() => redis.setex(cacheKey, PROJECT_CACHE_TTL, JSON.stringify(project)));
  }

  return project;
}

async function fetchProject(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      sections: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
            include: {
              assignee: { select: { id: true, name: true, avatar: true, email: true } },
              assignees: {
                include: {
                  user: { select: { id: true, name: true, avatar: true, email: true } },
                },
              },
              _count: { select: { comments: true, attachments: true } },
            },
          },
        },
      },
      team: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true } },
            },
          },
        },
      },
    },
  });
}

export async function getProjectOverview(projectId: string) {
  await getCurrentUserId();

  const [activities, portfolioConnections] = await Promise.all([
    prisma.activityLog.findMany({
      where: { task: { projectId } },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.portfolioProject.findMany({
      where: { projectId },
      include: {
        portfolio: { select: { id: true, name: true, color: true } },
      },
    }),
  ]);

  return {
    activities: JSON.parse(JSON.stringify(activities)),
    portfolioConnections: JSON.parse(JSON.stringify(portfolioConnections)),
  };
}

export async function createSection(projectId: string, name: string) {
  const lastSection = await prisma.section.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
  });

  await prisma.section.create({
    data: {
      name,
      projectId,
      order: (lastSection?.order ?? -1) + 1,
    },
  });

  revalidatePath(`/dashboard/projects/${projectId}`, "page");
  after(() => invalidateProjectCache(projectId));
}

export async function deleteSection(sectionId: string, projectId: string) {
  await prisma.section.delete({ where: { id: sectionId } });
  revalidatePath(`/dashboard/projects/${projectId}`, "page");
  after(() => invalidateProjectCache(projectId));
}
