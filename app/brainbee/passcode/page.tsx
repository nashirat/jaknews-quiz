"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function BrainBeePasscodePage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [userName, setUserName] = useState("");
  const [userContact, setUserContact] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!passcode.trim()) {
        throw new Error("Please enter a passcode");
      }

      if (!userName.trim()) {
        throw new Error("Please enter your name");
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
        const availableFrom = new Date(brainbee.available_from);
        const availableTo = new Date(brainbee.available_to);
        
        if (now < availableFrom) {
          throw new Error(`This BrainBee is not yet available. It will be available from ${availableFrom.toLocaleString()}`);
        }
        
        if (now > availableTo) {
          throw new Error(`This BrainBee is no longer available. It was available until ${availableTo.toLocaleString()}`);
        }
      }

      // Save user info to localStorage
      localStorage.setItem("quiz_user_name", userName);
      localStorage.setItem("quiz_user_contact", userContact);

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
      <div className="w-full max-w-md p-8 border border-gray-700 rounded-lg bg-black shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Enter BrainBee Passcode</h1>
        
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

          <div className="space-y-2">
            <Label htmlFor="userName" className="text-white">Your Name</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              required
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userContact" className="text-white">Your Email/Phone (Optional)</Label>
            <Input
              id="userContact"
              value={userContact}
              onChange={(e) => setUserContact(e.target.value)}
              placeholder="Enter your email or phone"
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>

          <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-2">About BrainBee</h3>
            <p className="text-sm text-gray-300">
              You'll have 20 minutes to answer 15 multiple choice questions. Good luck!
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

          <div className="flex justify-between items-center">
            <Link href="/">
              <Button type="button" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">Back</Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-white text-black hover:bg-gray-200"
            >
              {isLoading ? "Checking..." : "Start BrainBee"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 