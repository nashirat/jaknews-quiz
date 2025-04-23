import { Suspense } from "react";
import BrainBeeSession from "./BrainBeeSession";

export default async function BrainBeeSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <BrainBeeSession brainbeeId={id} />
    </Suspense>
  );
} 