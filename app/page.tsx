import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4 py-16 text-center bg-black text-white">
      <h1 className="text-4xl font-bold">JAK News Quiz Application</h1>
      <p className="text-xl max-w-2xl">
        Create and participate in quizzes for symposium sessions.
        Each quiz has 3 questions with a 40-second time limit per question.
      </p>
      
      <div className="mt-8 flex gap-4">
        <Link href="/quizzes">
          <Button size="lg" className="border-gray-700 text-white hover:bg-gray-800">Manage Quizzes</Button>
        </Link>
        <Link href="/doquiz">
          <Button size="lg" className="bg-white text-black hover:bg-gray-200">Take a Quiz</Button>
        </Link>
      </div>
      
      <div className="mt-12 grid gap-8 md:grid-cols-2 max-w-4xl w-full">
        <div className="border border-gray-700 rounded-lg p-6 bg-black">
          <h2 className="text-xl font-bold mb-4">Create a Quiz</h2>
          <p className="mb-6">
            Create a new quiz with up to 3 multiple choice or true/false questions.
            Each question has a 40-second time limit.
          </p>
          <Link href="/quizzes/create">
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">Create Quiz</Button>
          </Link>
        </div>
        
        <div className="border border-gray-700 rounded-lg p-6 bg-black">
          <h2 className="text-xl font-bold mb-4">Take a Quiz</h2>
          <p className="mb-6">
            Enter your name and a passcode to participate in a quiz.
            The scores will be accumulated throughout the day.
          </p>
          <Link href="/doquiz">
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">Enter Quiz</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
