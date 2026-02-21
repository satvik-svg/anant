import { auth } from "@/lib/auth";
import { getProjects } from "@/lib/actions/projects";
import { getTeams } from "@/lib/actions/teams";
import Link from "next/link";
import {
  FolderOpen,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { CreateProjectDialog } from "@/components/create-project-dialog";

export default async function DashboardPage() {
  const session = await auth();
  const [projects, teams] = await Promise.all([getProjects(), getTeams()]);

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getTimeOfDay()}, {session?.user?.name?.split(" ")[0]}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s what&apos;s happening across your projects
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              <p className="text-sm text-gray-500">Active projects</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {projects.reduce((acc: number, p: { _count: { tasks: number } }) => acc + p._count.tasks, 0)}
              </p>
              <p className="text-sm text-gray-500">Total tasks</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EEF0E0] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#4A5628]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
              <p className="text-sm text-gray-500">Teams</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
        {teams.length > 0 && (
          <CreateProjectDialog teams={teams} />
        )}
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No projects yet. Create your first project to get started.</p>
          {teams.length > 0 && (
            <CreateProjectDialog teams={teams} />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: { id: string; name: string; description: string | null; color: string; _count: { tasks: number }; creator: { name: string; avatar: string | null } }) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition group"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: project.color }}
                >
                  {project.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#4A5628] transition truncate">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {project.description || "No description"}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {project._count.tasks} tasks · by {project.creator.name}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
