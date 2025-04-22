import { Suspense } from "react";
import QuestionsEditor from "@/app/quizzes/[id]/questions/QuestionsEditor";

export default async function QuestionsPage({params}: {params: Promise<{ id: string }>}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <QuestionsEditor quizId={id} />
    </Suspense>
  );
} 