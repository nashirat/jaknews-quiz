"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Quiz, Question } from "@/types/quiz";
import Image from "next/image";

export default function BrainBeePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const [brainbeeId, setBrainbeeId] = useState<string>("");
  const [brainbee, setBrainbee] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Unwrap params promise
  useEffect(() => {
    const unwrapParams = async () => {
      try {
        const resolvedParams = await params;
        setBrainbeeId(resolvedParams.id);
      } catch (err) {
        setError("Failed to load BrainBee parameters");
      }
    };
    
    unwrapParams();
  }, [params]);

  // Fetch BrainBee and questions
  useEffect(() => {
    if (!brainbeeId) return;
    
    const fetchBrainBeeData = async () => {
      setIsLoading(true);
      try {
        const { data: brainbeeData, error: brainbeeError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", brainbeeId)
          .eq("quiz_type", "brainbee")
          .single();

        if (brainbeeError) {
          throw new Error(brainbeeError.message);
        }

        setBrainbee(brainbeeData);

        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*, options(*)")
          .eq("quiz_id", brainbeeId);

        if (questionsError) {
          throw new Error(questionsError.message);
        }

        setQuestions(questionsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load BrainBee");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrainBeeData();
  }, [brainbeeId, supabase]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this BrainBee?")) return;
    
    try {
      setIsLoading(true);
      const { error: deleteError } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", brainbeeId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      router.push("/brainbee");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete BrainBee");
      setIsLoading(false);
    }
  };

  if (isLoading && !brainbee) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-lg">Loading BrainBee...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 bg-black text-white">
        <div className="max-w-md w-full p-6 border border-gray-700 rounded-lg">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="mb-6">{error}</p>
          <Link href="/brainbee">
            <Button className="bg-white text-black hover:bg-gray-200">
              Back to BrainBees
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-8 max-w-2xl mx-auto w-full bg-black text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{brainbee?.name}</h1>
        <div className="flex gap-2">
          <Link href={`/brainbee/${brainbeeId}/edit`}>
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Edit
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="border-red-700 text-red-400 hover:bg-red-950"
            onClick={handleDelete}
            disabled={isLoading}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
          <h2 className="text-lg font-medium mb-2">BrainBee Details</h2>
          <p className="text-gray-300">
            <span className="text-gray-500">Passcode:</span> {brainbee?.passcode}
          </p>
          <p className="text-gray-300">
            <span className="text-gray-500">Questions:</span> {questions.length}/15
          </p>
          <p className="text-gray-300">
            <span className="text-gray-500">Time Limit:</span> 20 minutes
          </p>
          {brainbee?.available_from && brainbee?.available_to && (
            <>
              <p className="text-gray-300 pt-2">
                <span className="text-gray-500">Available From:</span>{' '}
                {new Date(brainbee.available_from).toLocaleString()}
              </p>
              <p className="text-gray-300">
                <span className="text-gray-500">Available To:</span>{' '}
                {new Date(brainbee.available_to).toLocaleString()}
              </p>
            </>
          )}
          
          {questions.length < 15 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <Link href={`/brainbee/${brainbeeId}/questions`}>
                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                  Add Questions ({questions.length}/15)
                </Button>
              </Link>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <Link href={`/brainbee/${brainbeeId}/leaderboard`}>
              <Button className="w-full bg-purple-600 text-white hover:bg-purple-700">
                View Leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="border border-gray-700 rounded-lg p-4 mt-4">
          <h2 className="text-xl font-semibold mb-4">BrainBee Questions</h2>
          <div className="space-y-3">
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-700 rounded p-3 bg-gray-900/30">
                <p className="font-medium">
                  {index + 1}. {question.question_text}
                </p>
                {question.image_url && (
                  <div className="mt-2 mb-3 relative h-40 rounded overflow-hidden bg-black">
                    <Image 
                      src={question.image_url} 
                      alt="Question image" 
                      fill
                      style={{objectFit: "contain"}} 
                    />
                  </div>
                )}
                <div className="mt-2 ml-4 space-y-1 text-sm">
                  {question.options?.map(option => (
                    <div key={option.id} className="flex items-center gap-2">
                      <p className={option.is_correct ? "text-green-400" : "text-gray-400"}>
                        {option.is_correct ? "✓ " : "• "}{option.option_text}
                      </p>
                      {option.image_url && (
                        <div className="relative w-8 h-8 rounded overflow-hidden bg-gray-800">
                          <Image 
                            src={option.image_url} 
                            alt="Option image" 
                            fill
                            style={{objectFit: "cover"}} 
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 