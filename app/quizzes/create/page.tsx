"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function CreateQuizPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate form fields
      if (!name.trim()) {
        throw new Error("Quiz name is required");
      }

      if (!passcode.trim()) {
        throw new Error("Passcode is required");
      }

      // Insert quiz into Supabase
      const { data, error: supabaseError } = await supabase
        .from("quizzes")
        .insert([{ name, passcode }])
        .select()
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Redirect to questions page after successful creation
      router.push(`/quizzes/${data.id}/questions`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-8 max-w-lg mx-auto w-full bg-black text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New Quiz</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white">Quiz Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter quiz name"
            required
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passcode" className="text-white">Quiz Passcode</Label>
          <Input
            id="passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter passcode for quiz access"
            required
            className="bg-gray-900 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-400">
            This passcode will be used by participants to access the quiz
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-4 justify-end">
          <Link href="/quizzes">
            <Button type="button" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-white text-black hover:bg-gray-200"
          >
            {isLoading ? "Creating..." : "Create Quiz"}
          </Button>
        </div>
      </form>
    </div>
  );
} 