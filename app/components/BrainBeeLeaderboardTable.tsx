"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronUp, ChevronDown, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

type TeamMember = {
  name: string;
  email: string | null;
};

type TeamInfo = {
  leader: {
    name: string;
    email: string;
  };
  members?: TeamMember[]; // Make members optional
};

type BrainBeeLeaderboardEntry = {
  id: string;
  user_id?: string;
  user_name?: string;
  contact_info?: string;
  quiz_id: string;
  score: number;
  completed_at: string;
  team_info?: string | object; // Can be JSON string or object
};

type SortField = "rank" | "score" | "completed_at";
type SortDirection = "asc" | "desc";

export default function BrainBeeLeaderboardTable({ 
  data, 
  totalQuestions = 15
}: { 
  data: BrainBeeLeaderboardEntry[],
  totalQuestions?: number
}) {
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default direction
      setSortField(field);
      setSortDirection(field === "completed_at" ? "asc" : "desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return null;
    return sortDirection === "asc" ? 
      <ChevronUp className="inline h-4 w-4" /> : 
      <ChevronDown className="inline h-4 w-4" />;
  };

  const toggleTeamExpand = (id: string) => {
    if (expandedTeamId === id) {
      setExpandedTeamId(null);
    } else {
      setExpandedTeamId(id);
    }
  };

  // Get team info from JSON string
  const getTeamInfo = (entry: BrainBeeLeaderboardEntry): TeamInfo | null => {
    if (!entry.team_info) return null;
    try {
      // Check if team_info is already an object
      if (typeof entry.team_info === 'object') {
        return entry.team_info as unknown as TeamInfo;
      }
      // Otherwise parse it as JSON string
      return JSON.parse(entry.team_info as string) as TeamInfo;
    } catch (err) {
      console.error("Error parsing team info:", err);
      return null;
    }
  };

  // Get display name (leader name for teams, user_name for individuals)
  const getDisplayName = (entry: BrainBeeLeaderboardEntry): string => {
    const teamInfo = getTeamInfo(entry);
    if (teamInfo) {
      return teamInfo.leader.name; // Use leader name as team name
    }
    return entry.user_name || 'Anonymous';
  };

  // Sort the data
  const sortedData = [...data].sort((a, b) => {
    if (sortField === "score") {
      return sortDirection === "asc" 
        ? a.score - b.score 
        : b.score - a.score;
    } else if (sortField === "completed_at") {
      const dateA = new Date(a.completed_at).getTime();
      const dateB = new Date(b.completed_at).getTime();
      return sortDirection === "asc" 
        ? dateA - dateB 
        : dateB - dateA;
    } else {
      // Default sort by rank (original order)
      return 0;
    }
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="py-2 px-4 text-left text-sm text-gray-400">Rank</th>
            <th className="py-2 px-4 text-left text-sm text-gray-400">Team/Participant</th>
            <th className="py-2 px-4 text-left text-sm text-gray-400 cursor-pointer" onClick={() => handleSort("score")}>
              Score {getSortIcon("score")}
            </th>
            <th className="py-2 px-4 text-left text-sm text-gray-400 cursor-pointer" onClick={() => handleSort("completed_at")}>
              Completed At {getSortIcon("completed_at")}
            </th>
            <th className="py-2 px-4 text-center text-sm text-gray-400">Members</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((entry, index) => {
            const teamInfo = getTeamInfo(entry);
            const hasTeamInfo = !!teamInfo;
            const memberCount = teamInfo ? (teamInfo.members?.length || 0) + 1 : 0; // +1 for leader
            const displayName = getDisplayName(entry);
            
            return (
              <React.Fragment key={entry.id}>
                <tr className="border-b border-gray-700 hover:bg-gray-900/30">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {hasTeamInfo ? (
                        <Users className="h-4 w-4 text-blue-400" />
                      ) : (
                        <User className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium">{displayName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">{entry.score}/{totalQuestions}</td>
                  <td className="py-3 px-4">{format(new Date(entry.completed_at), "MMM d, yyyy, h:mm a")}</td>
                  <td className="py-3 px-4 text-center">
                    {hasTeamInfo ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
                        onClick={() => toggleTeamExpand(entry.id)}
                      >
                        {memberCount} members {expandedTeamId === entry.id ? '▲' : '▼'}
                      </Button>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
                
                {/* Team members details row */}
                {hasTeamInfo && expandedTeamId === entry.id && (
                  <tr className="bg-gray-900/50">
                    <td colSpan={5} className="py-2 px-6">
                      <div className="p-3 border-l-2 border-blue-600">
                        <h4 className="text-sm font-medium text-blue-400 mb-2">Team Members</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="p-2 border border-gray-800 rounded bg-gray-950/50">
                            <p className="text-xs text-gray-400">Team Leader</p>
                            <p className="text-sm font-medium">{teamInfo.leader.name}</p>
                            <p className="text-xs text-gray-500">{teamInfo.leader.email}</p>
                          </div>
                          {!teamInfo.members || teamInfo.members.length === 0 ? (
                            <div className="p-2 border border-gray-800 rounded bg-gray-950/50">
                              <p className="text-xs text-gray-400 italic">No additional team members</p>
                            </div>
                          ) : (
                            teamInfo.members.map((member, idx) => (
                              <div key={idx} className="p-2 border border-gray-800 rounded bg-gray-950/50">
                                <p className="text-xs text-gray-400">Team Member</p>
                                <p className="text-sm font-medium">{member.name}</p>
                                {member.email && <p className="text-xs text-gray-500">{member.email}</p>}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 