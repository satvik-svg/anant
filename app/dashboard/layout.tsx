import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjects } from "@/lib/actions/projects";
import { getTeams } from "@/lib/actions/teams";
import { getUnreadCount } from "@/lib/actions/notifications";
import Sidebar from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const [projects, teams, unreadCount] = await Promise.all([
    getProjects(),
    getTeams(),
    getUnreadCount(),
  ]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        user={session.user!}
        projects={projects}
        teams={teams}
        unreadCount={unreadCount}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
