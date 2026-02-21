"use client";

import { useState, useTransition } from "react";
import { inviteToTeam, removeFromTeam, createTeam } from "@/lib/actions/teams";
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  User,
  Trash2,
  Loader2,
  Mail,
  Plus,
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
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await createTeam(newTeamName.trim());
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(`Team "${newTeamName}" created successfully`);
        setNewTeamName("");
        setShowCreateTeam(false);
      }
    });
  }

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
      {/* Create Team */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#6B7C42]" />
            Teams
          </h2>
          <button
            onClick={() => setShowCreateTeam(!showCreateTeam)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>
        </div>

        {showCreateTeam && (
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Enter team name"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B7C42] focus:border-transparent outline-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateTeam();
                if (e.key === "Escape") setShowCreateTeam(false);
              }}
              autoFocus
            />
            <button
              onClick={handleCreateTeam}
              disabled={!newTeamName.trim() || isPending}
              className="px-4 py-2.5 text-sm font-medium text-white bg-black rounded-xl hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </button>
            <button
              onClick={() => { setShowCreateTeam(false); setNewTeamName(""); }}
              className="px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Invite */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#6B7C42]" />
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
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6B7C42] focus:border-transparent outline-none text-sm"
            />
          </div>
          <select
            value={inviteTeamId}
            onChange={(e) => setInviteTeamId(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6B7C42] outline-none"
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
            className="px-4 py-2.5 text-sm font-medium text-white bg-black rounded-xl hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
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
              <div className="w-10 h-10 rounded-lg bg-[#6B7C42] flex items-center justify-center text-white font-bold text-sm">
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
                    <div className="w-8 h-8 rounded-full bg-[#6B7C42] flex items-center justify-center text-white text-xs font-medium">
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
