"use client";

import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Quiz } from "@/types/quiz";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("*")
          .eq("quiz_type", "standard");

        if (error) {
          throw new Error(error.message);
        }

        setQuizzes(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching quizzes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzes();
  }, [supabase]);

  const handleDelete = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    
    try {
      setIsLoading(true);
      const { error: deleteError } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Update local state to remove the deleted quiz
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete quiz");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-lg">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-8 max-w-6xl mx-auto w-full bg-black text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quizzes</h1>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Back to Home
            </Button>
          </Link>
        <Link href="/quizzes/create">
            <Button className="bg-white text-black hover:bg-gray-200">Add New</Button>
        </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {quizzes && quizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz: Quiz) => (
            <div 
              key={quiz.id} 
              className="border border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow bg-black"
            >
              <h2 className="text-xl font-medium mb-2">{quiz.name}</h2>
              <div className="text-sm text-gray-400 mb-4">
                Passcode: <span className="font-mono bg-gray-900 p-1 rounded">{quiz.passcode}</span>
              </div>
              <div className="text-sm text-gray-400 mb-6">
                Created: {format(new Date(quiz.created_at), "MMM d, yyyy")}
              </div>
              <div className="flex justify-between gap-2">
                <Link href={`/quizzes/${quiz.id}`}>
                  <Button variant="outline" size="sm" className="border-gray-700 text-white hover:bg-gray-800">View</Button>
                </Link>
                <Link href={`/quizzes/${quiz.id}/edit`}>
                  <Button variant="outline" size="sm" className="border-gray-700 text-white hover:bg-gray-800">Edit</Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-red-700 text-red-400 hover:bg-red-950"
                  onClick={() => handleDelete(quiz.id)}
                  disabled={isLoading}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-gray-700 rounded-lg p-8 text-center bg-gray-900">
          <h3 className="text-xl font-medium mb-2">No quizzes found</h3>
          <p className="text-gray-400 mb-6">Create your first quiz to get started.</p>
          <Link href="/quizzes/create">
            <Button className="bg-white text-black hover:bg-gray-200">Create Quiz</Button>
          </Link>
        </div>
      )}
    </div>
  );
} 