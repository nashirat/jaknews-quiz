"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function DoQuizPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  
  // Load saved user info from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("quiz_user_name");
    const savedContact = localStorage.getItem("quiz_user_contact");
    
    if (savedName) setName(savedName);
    if (savedContact) setContactInfo(savedContact);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate form fields
      if (!name.trim()) {
        throw new Error("Your name is required");
      }

      if (!contactInfo.trim()) {
        throw new Error("Your email or phone number is required");
      }

      if (!passcode.trim()) {
        throw new Error("Quiz passcode is required");
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

      // Check if user has already taken this quiz
      const { data: existingScores, error: scoresError } = await supabase
        .from("user_quiz_scores")
        .select("id")
        .eq("quiz_id", quizzes[0].id)
        .eq("contact_info", contactInfo.trim());

      if (scoresError) {
        throw new Error("Error checking previous attempts");
      }

      if (existingScores && existingScores.length > 0) {
        throw new Error("You have already taken this quiz. Each participant may only attempt the quiz once.");
      }

      // Store the user's information in localStorage for later use
      localStorage.setItem("quiz_user_name", name.trim());
      localStorage.setItem("quiz_user_contact", contactInfo.trim());

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
        <h1 className="text-2xl font-bold mb-6 text-center">Take a Quiz</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo" className="text-white">Email or Phone Number</Label>
            <Input
              id="contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Enter your email or phone"
              required
              className="bg-gray-900 border-gray-700 text-white"
            />
            <p className="text-xs text-gray-400">Used to prevent multiple attempts</p>
          </div>

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