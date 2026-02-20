import { getProject } from "@/lib/actions/projects";
import { notFound } from "next/navigation";
import { ProjectView } from "@/components/project-view";
import { auth } from "@/lib/auth";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params;
  const [project, session] = await Promise.all([
    getProject(projectId),
    auth(),
  ]);

  if (!project || !session?.user?.id) notFound();

  const teamMembers = project.team.members.map((m: { user: { id: string; name: string; email: string; avatar: string | null } }) => m.user);

  // JSON round-trip to serialize Dates to strings for client components
  const serializedProject = JSON.parse(JSON.stringify(project));

  return (
    <ProjectView
      project={serializedProject}
      teamMembers={teamMembers}
      currentUserId={session.user.id}
    />
  );
}
