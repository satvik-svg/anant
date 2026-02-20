import { auth } from "@/lib/auth";
import { getTeams } from "@/lib/actions/teams";
import { TeamManagement } from "@/components/team-management";

export default async function TeamPage() {
  const session = await auth();
  const teams = await getTeams();

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-gray-500 mt-1">Manage your team members and invitations</p>
      </div>

      <TeamManagement teams={teams} currentUserId={session!.user!.id!} />
    </div>
  );
}
