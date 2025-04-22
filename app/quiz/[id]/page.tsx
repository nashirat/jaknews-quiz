import { Suspense } from "react";
import QuizSession from "./QuizSession";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <QuizSession quizId={id} />
    </Suspense>
  );
} 
