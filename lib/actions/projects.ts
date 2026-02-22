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
  const project = await prisma.project.findUnique({
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
              _count: { select: { comments: true, attachments: true, taskProjects: true } },
            },
          },
        },
      },
      linkedTasks: {
        include: {
          task: {
            include: {
              assignee: { select: { id: true, name: true, avatar: true, email: true } },
              assignees: {
                include: {
                  user: { select: { id: true, name: true, avatar: true, email: true } },
                },
              },
              _count: { select: { comments: true, attachments: true, taskProjects: true } },
            },
          },
          section: { select: { id: true } },
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

  if (!project) return null;

  // Merge linked tasks into sections so they appear alongside direct tasks
  const merged = {
    ...project,
    sections: project.sections.map((section) => {
      const linkedInSection = project.linkedTasks
        .filter((lt) => lt.section.id === section.id)
        .map((lt) => ({
          ...lt.task,
          // Mark as linked so the UI can show a badge
          _isLinked: true,
          _linkedFrom: lt.task.projectId,
        }));
      return {
        ...section,
        tasks: [...section.tasks, ...linkedInSection],
      };
    }),
  };

  // Drop the raw linkedTasks array — it's been merged
  const { linkedTasks: _lt, ...result } = merged;
  return result;
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

// ---- Multi-project task actions ----

export async function addTaskToProject(taskId: string, targetProjectId: string, targetSectionId: string) {
  const userId = await getCurrentUserId();

  // Verify task exists and belongs to the same team
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { teamId: true, id: true } } },
  });
  if (!task) return { error: "Task not found" };

  const targetProject = await prisma.project.findUnique({
    where: { id: targetProjectId },
    select: { teamId: true },
  });
  if (!targetProject) return { error: "Project not found" };
  if (task.project.teamId !== targetProject.teamId) return { error: "Projects must be in the same team" };
  if (task.project.id === targetProjectId) return { error: "Task is already in this project" };

  // Check not already linked
  const existing = await prisma.taskProject.findUnique({
    where: { taskId_projectId: { taskId, projectId: targetProjectId } },
  });
  if (existing) return { error: "Task is already in this project" };

  await prisma.taskProject.create({
    data: { taskId, projectId: targetProjectId, sectionId: targetSectionId },
  });

  after(async () => {
    await prisma.activityLog.create({
      data: {
        action: "added_to_project",
        details: JSON.stringify({ projectId: targetProjectId }),
        taskId,
        userId,
      },
    });
  });

  revalidatePath(`/dashboard/projects/${targetProjectId}`, "page");
  revalidatePath(`/dashboard/projects/${task.projectId}`, "page");
  after(() => invalidateProjectCache(targetProjectId));
  after(() => invalidateProjectCache(task.projectId));
  return { success: true };
}

export async function removeTaskFromProject(taskId: string, projectId: string) {
  const userId = await getCurrentUserId();

  const link = await prisma.taskProject.findUnique({
    where: { taskId_projectId: { taskId, projectId } },
  });
  if (!link) return { error: "Task is not linked to this project" };

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
  if (!task) return { error: "Task not found" };

  // Don't allow removing from the origin project via this action
  if (task.projectId === projectId) return { error: "Cannot remove task from its origin project" };

  await prisma.taskProject.delete({ where: { id: link.id } });

  after(async () => {
    await prisma.activityLog.create({
      data: {
        action: "removed_from_project",
        details: JSON.stringify({ projectId }),
        taskId,
        userId,
      },
    });
  });

  revalidatePath(`/dashboard/projects/${projectId}`, "page");
  revalidatePath(`/dashboard/projects/${task.projectId}`, "page");
  after(() => invalidateProjectCache(projectId));
  after(() => invalidateProjectCache(task.projectId));
  return { success: true };
}

export async function getTeamProjectsForTask(taskId: string) {
  await getCurrentUserId();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { teamId: true, id: true, name: true } },
      taskProjects: {
        include: {
          project: { select: { id: true, name: true, color: true } },
          section: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!task) return { error: "Task not found" };

  // All projects in the same team
  const teamProjects = await prisma.project.findMany({
    where: { teamId: task.project.teamId },
    select: {
      id: true,
      name: true,
      color: true,
      sections: { select: { id: true, name: true }, orderBy: { order: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  // Current project links
  const currentProjects = [
    { projectId: task.project.id, projectName: task.project.name, isOrigin: true, sectionId: null, sectionName: null },
    ...task.taskProjects.map((tp) => ({
      projectId: tp.project.id,
      projectName: tp.project.name,
      isOrigin: false,
      sectionId: tp.section.id,
      sectionName: tp.section.name,
    })),
  ];

  return { teamProjects, currentProjects };
}
