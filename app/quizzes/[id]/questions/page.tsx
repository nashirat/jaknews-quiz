import { Suspense } from "react";
import QuestionsEditor from "@/app/quizzes/[id]/questions/QuestionsEditor";

export default function QuestionsPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <QuestionsEditor quizId={params.id} />
    </Suspense>
  );
} 