"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function CreateBrainBeePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
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
        throw new Error("BrainBee name is required");
      }

      if (!passcode.trim()) {
        throw new Error("Passcode is required");
      }

      if (!availableFrom || !availableTo) {
        throw new Error("Availability time range is required");
      }

      if (new Date(availableFrom) >= new Date(availableTo)) {
        throw new Error("End time must be after start time");
      }

      // Insert BrainBee into Supabase
      const { data, error: supabaseError } = await supabase
        .from("quizzes")
        .insert([{ 
          name, 
          passcode, 
          quiz_type: 'brainbee',
          available_from: availableFrom,
          available_to: availableTo
        }])
        .select()
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Redirect to questions page after successful creation
      router.push(`/brainbee/${data.id}/questions`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-8 max-w-lg mx-auto w-full bg-black text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New BrainBee</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white">BrainBee Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter BrainBee name"
            required
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passcode" className="text-white">BrainBee Passcode</Label>
          <Input
            id="passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter passcode for BrainBee access"
            required
            className="bg-gray-900 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-400">
            This passcode will be used by participants to access the BrainBee
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-white">Availability Time Range</h3>
          
          <div className="space-y-2">
            <Label htmlFor="available-from" className="text-white">Available From</Label>
            <Input
              id="available-from"
              type="datetime-local"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              required
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="available-to" className="text-white">Available To</Label>
            <Input
              id="available-to"
              type="datetime-local"
              value={availableTo}
              onChange={(e) => setAvailableTo(e.target.value)}
              required
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
          
          <p className="text-xs text-gray-400">
            The BrainBee will only be accessible to participants during this time range
          </p>
        </div>

        <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <h3 className="font-semibold text-blue-400 mb-2">About BrainBee</h3>
          <p className="text-sm text-gray-300">
            A BrainBee consists of 15 multiple choice questions that participants must complete within 20 minutes. 
            Unlike standard quizzes, there's no time limit per question.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-4 justify-end">
          <Link href="/brainbee">
            <Button type="button" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-white text-black hover:bg-gray-200"
          >
            {isLoading ? "Creating..." : "Create BrainBee"}
          </Button>
        </div>
      </form>
    </div>
  );
} 