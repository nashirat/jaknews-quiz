import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Option } from "@/types/quiz";
import LeaderboardTable from "@/app/components/LeaderboardTable";

export const revalidate = 0;

export default async function QuizDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  
  if (!id) {
    return notFound();
  }
  
  const supabase = await createClient();

  // Fetch quiz details
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .single();

  if (quizError || !quiz) {
    return notFound();
  }

  // Fetch questions with options
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*, options(*)")
    .eq("quiz_id", id);

  if (questionsError) {
    console.error("Error fetching questions:", questionsError);
  }

  // Fetch leaderboard data
  const { data: leaderboardData, error: leaderboardError } = await supabase
    .from("user_quiz_scores")
    .select("*")
    .eq("quiz_id", id)
    .order("score", { ascending: false })
    .order("completed_at", { ascending: true });

  if (leaderboardError) {
    console.error("Error fetching leaderboard data:", leaderboardError);
  }

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-8 max-w-4xl mx-auto w-full bg-black text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{quiz.name}</h1>
          <p className="text-gray-400">
            Passcode: <span className="font-mono">{quiz.passcode}</span>
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Created: {format(new Date(quiz.created_at), "MMM d, yyyy, h:mm a")}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link href={`/quizzes/${id}/edit`}>
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">Edit Quiz</Button>
          </Link>
          <Link href={`/quizzes/${id}/questions`}>
            <Button className="bg-white text-black hover:bg-gray-200">
              {questions && questions.length === 3
                ? "Edit Questions"
                : "Add Questions"}
            </Button>
          </Link>
        </div>
      </div>

      <div className="border border-gray-700 rounded-lg p-6 bg-black">
        <h2 className="text-xl font-medium mb-4 text-white">Questions</h2>
        {questions && questions.length > 0 ? (
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-700 rounded-lg p-4 bg-black">
                <h3 className="font-medium text-white">
                  {index + 1}. {question.question_text}
                </h3>
                <p className="text-sm text-gray-400 mt-1 mb-3">
                  Type: {question.question_type === "multiple_choice" ? "Multiple Choice" : "True/False"}
                </p>
                <div className="space-y-2">
                  {question.options?.map((option: Option) => (
                    <div
                      key={option.id}
                      className={`p-2 rounded ${
                        option.is_correct
                          ? "bg-green-100 border border-green-300 text-green-800"
                          : "bg-white border border-gray-300 text-gray-800"
                      }`}
                    >
                      {option.option_text}
                      {option.is_correct && (
                        <span className="ml-2 text-green-600">✓ Correct</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-dashed border-2 border-gray-700 rounded-lg">
            <p className="text-gray-400 mb-4">
              No questions added to this quiz yet.
            </p>
            <Link href={`/quizzes/${id}/questions`}>
              <Button className="bg-white text-black hover:bg-gray-200">Add Questions</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Leaderboard Section */}
      <div className="border border-gray-700 rounded-lg p-6 bg-black mt-6">
        <h2 className="text-xl font-medium mb-4 text-white">Leaderboard</h2>
        {leaderboardData && leaderboardData.length > 0 ? (
          <LeaderboardTable data={leaderboardData} />
        ) : (
          <div className="text-center py-8 border-dashed border-2 border-gray-700 rounded-lg">
            <p className="text-gray-400">
              No quiz attempts yet.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link href="/quizzes">
          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">Back to Quizzes</Button>
        </Link>
      </div>
    </div>
  );
} 