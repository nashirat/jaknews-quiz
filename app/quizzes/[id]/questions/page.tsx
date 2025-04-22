import { Suspense } from "react";
import QuestionsEditor from "@/app/quizzes/[id]/questions/QuestionsEditor";

export default async function QuestionsPage(props: {params: Promise<{ id: string }>}) {
  const params = await props.params;
  const id = params.id;

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <QuestionsEditor quizId={id} />
    </Suspense>
  );
} 