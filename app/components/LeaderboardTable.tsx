"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

type LeaderboardEntry = {
  id: string;
  user_name: string | null;
  contact_info: string | null;
  score: number;
  completed_at: string;
};

type SortField = "rank" | "score" | "completed_at";
type SortDirection = "asc" | "desc";

export default function LeaderboardTable({ 
  data 
}: { 
  data: LeaderboardEntry[] 
}) {
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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
            <th className="py-2 px-4 text-left text-sm text-gray-400">Name</th>
            <th className="py-2 px-4 text-left text-sm text-gray-400">Contact</th>
            <th className="py-2 px-4 text-left text-sm text-gray-400 cursor-pointer" onClick={() => handleSort("score")}>
              Score {getSortIcon("score")}
            </th>
            <th className="py-2 px-4 text-left text-sm text-gray-400 cursor-pointer" onClick={() => handleSort("completed_at")}>
              Completed At {getSortIcon("completed_at")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((entry, index) => (
            <tr key={entry.id} className="border-b border-gray-700">
              <td className="py-2 px-4">{index + 1}</td>
              <td className="py-2 px-4">{entry.user_name || 'Anonymous'}</td>
              <td className="py-2 px-4">{entry.contact_info || 'Unknown'}</td>
              <td className="py-2 px-4">{entry.score}/3</td>
              <td className="py-2 px-4">{format(new Date(entry.completed_at), "MMM d, yyyy, h:mm a")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 