"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function PasscodePage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
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

      // Find the quiz with this passcode
      const { data: quizzes, error: quizError } = await supabase
        .from("quizzes")
        .select("id")
        .eq("passcode", passcode.trim());

      if (quizError) {
        throw new Error("Error checking passcode");
      }

      if (!quizzes || quizzes.length === 0) {
        throw new Error("Invalid passcode. Please try again");
      }

      // Redirect to the quiz session
      router.push(`/quiz/${quizzes[0].id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-black text-white">
      <div className="w-full max-w-md p-8 border border-gray-700 rounded-lg bg-black shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Enter Quiz Passcode</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="passcode" className="text-white">Quiz Passcode</Label>
            <Input
              id="passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter the quiz passcode"
              required
              className="bg-gray-900 border-gray-700 text-white"
            />
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
              {isLoading ? "Checking..." : "Start Quiz"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 