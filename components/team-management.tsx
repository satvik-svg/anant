"use client";

import { useState, useTransition } from "react";
import { inviteToTeam, removeFromTeam } from "@/lib/actions/teams";
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  User,
  Trash2,
  Loader2,
  Mail,
} from "lucide-react";

interface TeamMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  _count: { projects: number };
}

interface Props {
  teams: Team[];
  currentUserId: string;
}

const ROLE_ICONS: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: User,
};

export function TeamManagement({ teams, currentUserId }: Props) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteTeamId, setInviteTeamId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleInvite() {
    if (!inviteEmail.trim() || !inviteTeamId) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await inviteToTeam(inviteTeamId, inviteEmail.trim());
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(`Successfully invited ${inviteEmail}`);
        setInviteEmail("");
      }
    });
  }

  async function handleRemove(teamId: string, userId: string) {
    if (!confirm("Remove this member from the team?")) return;
    startTransition(async () => {
      await removeFromTeam(teamId, userId);
    });
  }

  return (
    <div className="space-y-6">
      {/* Invite */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-500" />
          Invite Team Member
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4 border border-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 text-sm rounded-lg p-3 mb-4 border border-green-100">
            {success}
          </div>
        )}

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <select
            value={inviteTeamId}
            onChange={(e) => setInviteTeamId(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Select team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleInvite}
            disabled={!inviteEmail.trim() || !inviteTeamId || isPending}
            className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}
          </button>
        </div>
      </div>

      {/* Teams list */}
      {teams.map((team) => (
        <div key={team.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {team.name[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{team.name}</h3>
                <p className="text-sm text-gray-500">
                  {team.members.length} members · {team._count.projects} projects
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {team.members.map((member) => {
              const RoleIcon = ROLE_ICONS[member.role] || User;
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-6 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                      {member.user.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.user.name}
                        {member.user.id === currentUserId && (
                          <span className="text-xs text-gray-400 ml-1">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full capitalize">
                      <RoleIcon className="w-3 h-3" />
                      {member.role}
                    </span>
                    {member.role !== "owner" && member.user.id !== currentUserId && (
                      <button
                        onClick={() => handleRemove(team.id, member.user.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
