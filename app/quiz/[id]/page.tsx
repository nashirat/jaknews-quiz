import { Suspense } from "react";
import QuizSession from "./QuizSession";

export default function QuizPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <QuizSession quizId={params.id} />
    </Suspense>
  );
} 