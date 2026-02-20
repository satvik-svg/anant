import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MyTasksList } from "@/components/my-tasks-list";

export default async function MyTasksPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const tasks = await prisma.task.findMany({
    where: { assigneeId: userId },
    include: {
      project: { select: { id: true, name: true, color: true } },
      section: { select: { name: true } },
      _count: { select: { comments: true, attachments: true } },
    },
    orderBy: [
      { completed: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-500 mt-1">
          Tasks assigned to you across all projects
        </p>
      </div>

      <MyTasksList tasks={tasks} />
    </div>
  );
}
