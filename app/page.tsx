import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 md:gap-8 px-2 py-6 md:py-16 text-center bg-black text-white">
      <h1 className="text-3xl md:text-4xl font-bold">Jaknews 12 Quiz and BrainBee</h1>
      <p className="text-lg md:text-xl max-w-full md:max-w-2xl">
        Create and participate in quizzes and BrainBees for symposium sessions.
      </p>
      
      <div className="mt-4 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-full md:max-w-2xl">
        <div className="border border-gray-700 rounded-lg p-4 md:p-6 bg-black hover:bg-gray-900 transition-colors flex flex-col h-full">
          <div>
            <h2 className="text-xl font-bold mb-3">Add & Manage Quizzes</h2>
            <p className="mb-4 text-gray-300">
              Create new quizzes and manage existing ones. Each quiz has 3 questions with a 40-second time limit per question.
            </p>
          </div>
          <div className="mt-auto pt-4">
            <Link href="/quizzes">
              <Button className="bg-white text-black hover:bg-gray-200">Manage Quizzes</Button>
            </Link>
          </div>
        </div>
        
        <div className="border border-gray-700 rounded-lg p-4 md:p-6 bg-black hover:bg-gray-900 transition-colors flex flex-col h-full">
          <div>
            <h2 className="text-xl font-bold mb-3">Take a Quiz</h2>
            <p className="mb-4 text-gray-300">
              Enter your name and passcode to participate in a quiz session.
            </p>
          </div>
          <div className="mt-auto pt-4">
            <Link href="/quiz/passcode">
              <Button className="bg-white text-black hover:bg-gray-200">Enter Quiz</Button>
            </Link>
          </div>
        </div>

        <div className="border border-gray-700 rounded-lg p-4 md:p-6 bg-blue-950/30 hover:bg-blue-950/40 transition-colors flex flex-col h-full">
          <div>
            <h2 className="text-xl font-bold mb-3 text-blue-300">Add & Manage BrainBees</h2>
            <p className="mb-4 text-gray-300">
              Create new BrainBees with 15 multiple choice questions that participants must complete within 20 minutes.
            </p>
          </div>
          <div className="mt-auto pt-4">
            <Link href="/brainbee">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">Manage BrainBees</Button>
            </Link>
          </div>
        </div>
        
        <div className="border border-gray-700 rounded-lg p-4 md:p-6 bg-blue-950/30 hover:bg-blue-950/40 transition-colors flex flex-col h-full">
          <div>
            <h2 className="text-xl font-bold mb-3 text-blue-300">Take a BrainBee</h2>
            <p className="mb-4 text-gray-300">
              Enter your name and passcode to participate in a BrainBee session. You'll have 20 minutes to answer 15 questions.
            </p>
          </div>
          <div className="mt-auto pt-4">
            <Link href="/brainbee/passcode">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">Enter BrainBee</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
