"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function deleteProject(projectId: string) {
  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/dashboard");
}

export async function getProjects() {
  const userId = await getCurrentUserId();
  const teams = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  const teamIds = teams.map((t: { teamId: string }) => t.teamId);

  return prisma.project.findMany({
    where: { teamId: { in: teamIds } },
    include: {
      _count: { select: { tasks: true } },
      creator: { select: { name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProject(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
            include: {
              assignee: { select: { id: true, name: true, avatar: true, email: true } },
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

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteSection(sectionId: string, projectId: string) {
  await prisma.section.delete({ where: { id: sectionId } });
  revalidatePath(`/dashboard/projects/${projectId}`);
}
