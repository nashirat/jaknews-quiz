import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Quiz } from "@/types/quiz";
import { format } from "date-fns";

export const revalidate = 0;

export default async function QuizzesPage() {
  const supabase = await createClient();
  const { data: quizzes, error } = await supabase.from("quizzes").select("*");

  if (error) {
    console.error("Error fetching quizzes:", error);
  }

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-8 max-w-6xl mx-auto w-full bg-black text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quizzes</h1>
        <Link href="/quizzes/create">
          <Button className="bg-white text-black hover:bg-gray-200">Add Quiz</Button>
        </Link>
      </div>

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
              <div className="flex justify-between">
                <Link href={`/quizzes/${quiz.id}`}>
                  <Button variant="outline" size="sm" className="border-gray-700 text-white hover:bg-gray-800">View Details</Button>
                </Link>
                <Link href={`/quizzes/${quiz.id}/edit`}>
                  <Button variant="outline" size="sm" className="border-gray-700 text-white hover:bg-gray-800">Edit</Button>
                </Link>
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