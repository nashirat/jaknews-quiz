"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { PlusCircle, XCircle } from "lucide-react";

type TeamMember = {
  name: string;
  email: string;
};

export default function BrainBeePasscodePage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleAddTeamMember = () => {
    if (teamMembers.length < 5) {
      setTeamMembers([...teamMembers, { name: "", email: "" }]);
    }
  };

  const handleRemoveTeamMember = (index: number) => {
    const newMembers = [...teamMembers];
    newMembers.splice(index, 1);
    setTeamMembers(newMembers);
  };

  const handleTeamMemberChange = (index: number, field: 'name' | 'email', value: string) => {
    const newMembers = [...teamMembers];
    newMembers[index][field] = value;
    setTeamMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!passcode.trim()) {
        throw new Error("Please enter a passcode");
      }

      if (!leaderName.trim()) {
        throw new Error("Please enter team leader's name");
      }

      if (!leaderEmail.trim()) {
        throw new Error("Please enter team leader's email");
      }

      // Find the BrainBee with this passcode
      const { data: quizzes, error: quizError } = await supabase
        .from("quizzes")
        .select("id, available_from, available_to")
        .eq("passcode", passcode.trim())
        .eq("quiz_type", "brainbee");

      if (quizError) {
        throw new Error("Error checking passcode");
      }

      if (!quizzes || quizzes.length === 0) {
        throw new Error("Invalid passcode. Please try again");
      }
      
      const brainbee = quizzes[0];
      
      // Check if the BrainBee is currently available based on time range
      const now = new Date();
      
      if (brainbee.available_from && brainbee.available_to) {
        // Create dates without timezone conversion by parsing the ISO strings directly
        // This maintains the UTC time as stored in the database
        const availableFromParts = brainbee.available_from.split(/[^0-9]/);
        const availableToParts = brainbee.available_to.split(/[^0-9]/);
        
        // Create UTC date objects (avoiding automatic timezone conversion)
        const availableFrom = new Date(Date.UTC(
          parseInt(availableFromParts[0]), // year
          parseInt(availableFromParts[1]) - 1, // month (0-based)
          parseInt(availableFromParts[2]), // day
          parseInt(availableFromParts[3]), // hour
          parseInt(availableFromParts[4]), // minute
          parseInt(availableFromParts[5] || '0') // second
        ));
        
        const availableTo = new Date(Date.UTC(
          parseInt(availableToParts[0]), // year
          parseInt(availableToParts[1]) - 1, // month (0-based)
          parseInt(availableToParts[2]), // day
          parseInt(availableToParts[3]), // hour
          parseInt(availableToParts[4]), // minute
          parseInt(availableToParts[5] || '0') // second
        ));
        
        // Convert current time to UTC for comparison
        const nowUTC = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours(),
          now.getUTCMinutes(),
          now.getUTCSeconds()
        ));
        
        if (nowUTC < availableFrom) {
          throw new Error(`This BrainBee is not yet available. It will be available from ${availableFrom.toUTCString()}`);
        }
        
        if (nowUTC > availableTo) {
          throw new Error(`This BrainBee is no longer available. It was available until ${availableTo.toUTCString()}`);
        }
      }

      // Check if leader email has already participated in this BrainBee
      const { data: existingLeaderScores, error: leaderScoresError } = await supabase
        .from("user_quiz_scores")
        .select("id")
        .eq("quiz_id", brainbee.id)
        .eq("contact_info", leaderEmail.trim());

      if (leaderScoresError) {
        throw new Error("Error checking previous attempts");
      }

      if (existingLeaderScores && existingLeaderScores.length > 0) {
        throw new Error("Team leader has already participated in this BrainBee. Each participant may only attempt the BrainBee once.");
      }

      // Check if any team member email has already participated
      const validTeamEmails = teamMembers
        .filter(member => member.email.trim())
        .map(member => member.email.trim());
      
      if (validTeamEmails.length > 0) {
        const { data: existingMemberScores, error: memberScoresError } = await supabase
          .from("user_quiz_scores")
          .select("id, contact_info")
          .eq("quiz_id", brainbee.id)
          .in("contact_info", validTeamEmails);

        if (memberScoresError) {
          throw new Error("Error checking team members' previous attempts");
        }

        if (existingMemberScores && existingMemberScores.length > 0) {
          // Find which team member has already participated
          const existingMemberEmail = existingMemberScores[0].contact_info;
          const existingMember = teamMembers.find(m => m.email.trim() === existingMemberEmail);
          throw new Error(`Team member ${existingMember?.name || ''} has already participated in this BrainBee. Each participant may only attempt the BrainBee once.`);
        }
      }

      // Format team information
      const teamInfo = {
        leader: {
          name: leaderName.trim(),
          email: leaderEmail.trim()
        },
        members: teamMembers.filter(m => m.name.trim()).map(m => ({
          name: m.name.trim(),
          email: m.email.trim() || null
        }))
      };

      // Save team info to localStorage
      localStorage.setItem("quiz_team_info", JSON.stringify(teamInfo));
      localStorage.setItem("quiz_user_name", leaderName.trim()); // Use leader name as team name
      localStorage.setItem("quiz_user_contact", leaderEmail.trim()); // Use leader email as contact

      // Redirect to the BrainBee session
      router.push(`/brainbee/session/${brainbee.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-black text-white">
      <div className="w-full max-w-2xl p-8 border border-gray-700 rounded-lg bg-black shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Start BrainBee</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="passcode" className="text-white">BrainBee Passcode</Label>
            <Input
              id="passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter the BrainBee passcode"
              required
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>

          <div className="border border-gray-700 rounded-lg p-4 mt-6 bg-gray-900/30">
            <h3 className="font-medium text-white mb-4">Team Leader Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leaderName" className="text-white">Leader Name</Label>
                <Input
                  id="leaderName"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  placeholder="Enter team leader's name"
                  required
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaderEmail" className="text-white">Leader Email</Label>
                <Input
                  id="leaderEmail"
                  value={leaderEmail}
                  onChange={(e) => setLeaderEmail(e.target.value)}
                  placeholder="Enter team leader's email"
                  type="email"
                  required
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-white">Team Members (Optional)</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleAddTeamMember}
                disabled={teamMembers.length >= 5}
                className="border-blue-700 text-blue-400 hover:bg-blue-900/30 text-xs"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Add Member
              </Button>
            </div>
            
            {teamMembers.length === 0 ? (
              <p className="text-sm text-gray-400 mb-3">
                You can participate individually or add team members if you're working as a team.
              </p>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 relative border border-gray-800 rounded p-3">
                    <div className="space-y-2">
                      <Label htmlFor={`memberName${index}`} className="text-white">
                        Member {index + 1} Name
                      </Label>
                      <Input
                        id={`memberName${index}`}
                        value={member.name}
                        onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                        placeholder="Enter team member's name"
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`memberEmail${index}`} className="text-white">
                        Member {index + 1} Email
                      </Label>
                      <Input
                        id={`memberEmail${index}`}
                        value={member.email}
                        onChange={(e) => handleTeamMemberChange(index, 'email', e.target.value)}
                        placeholder="Enter team member's email"
                        type="email"
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTeamMember(index)}
                      className="absolute top-3 right-3 text-red-400 hover:text-red-300 hover:bg-transparent"
                    >
                      <XCircle className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-3">
              Team members' emails are optional but help prevent duplicate participation
            </p>
          </div>

          <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-2">About BrainBee</h3>
            <p className="text-sm text-gray-300">
              Your team will have 20 minutes to collaborate and answer 15 multiple choice questions. Good luck!
            </p>
            <p className="text-sm text-gray-300 mt-2">
              Note: BrainBees are only accessible during their scheduled time window.
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-gray-200"
          >
            {isLoading ? "Checking..." : "Start BrainBee"}
          </Button>
          
          <div className="text-center text-sm text-gray-500">
            <Link href="/" className="text-blue-400 hover:underline">
              Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 