import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Quiz } from "@/types/quiz";
import { format } from "date-fns";

export const revalidate = 0;

export default async function BrainBeesPage() {
  const supabase = await createClient();
  const { data: brainbees, error } = await supabase
    .from("quizzes")
    .select("*, questions(count)")
    .eq("quiz_type", "brainbee");

  if (error) {
    console.error("Error fetching brainbees:", error);
  }

  // Helper function to check if a BrainBee is currently available
  const getBrainBeeStatus = (brainbee: any) => {
    if (!brainbee.available_from || !brainbee.available_to) {
      return { status: 'unscheduled', message: 'Not scheduled' };
    }
    
    const now = new Date();
    const availableFrom = new Date(brainbee.available_from);
    const availableTo = new Date(brainbee.available_to);
    
    if (now < availableFrom) {
      return { 
        status: 'upcoming', 
        message: `Opens ${format(availableFrom, "MMM d, h:mm a")}` 
      };
    }
    
    if (now > availableTo) {
      return { 
        status: 'expired', 
        message: `Closed ${format(availableTo, "MMM d, h:mm a")}` 
      };
    }
    
    return { 
      status: 'active', 
      message: `Active until ${format(availableTo, "MMM d, h:mm a")}` 
    };
  };

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-8 max-w-6xl mx-auto w-full bg-black text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">BrainBees</h1>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Back to Home
            </Button>
          </Link>
          <Link href="/brainbee/create">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">Add New</Button>
          </Link>
        </div>
      </div>

      {brainbees && brainbees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brainbees.map((brainbee: any) => {
            const status = getBrainBeeStatus(brainbee);
            
            return (
              <div 
                key={brainbee.id} 
                className="border border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow bg-blue-950/20"
              >
                <h2 className="text-xl font-medium mb-2">{brainbee.name}</h2>
                <div className="text-sm text-gray-400 mb-2">
                  Passcode: <span className="font-mono bg-gray-900 p-1 rounded">{brainbee.passcode}</span>
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  Questions: <span className="font-mono bg-gray-900 p-1 rounded">{brainbee.questions?.[0]?.count || 0}/15</span>
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  Created: {format(new Date(brainbee.created_at), "MMM d, yyyy")}
                </div>
                
                {/* Availability status badge */}
                <div className={`text-sm mb-4 px-2 py-1 rounded inline-block 
                  ${status.status === 'active' 
                    ? 'bg-green-900/30 text-green-400 border border-green-700' 
                    : status.status === 'upcoming'
                      ? 'bg-blue-900/30 text-blue-400 border border-blue-700'
                      : status.status === 'expired'
                        ? 'bg-gray-800 text-gray-400 border border-gray-700'
                        : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700'
                  }`}
                >
                  {status.message}
                </div>
                
                {brainbee.available_from && brainbee.available_to && (
                  <div className="text-xs text-gray-500 mb-4">
                    <div>From: {format(new Date(brainbee.available_from), "MMM d, yyyy h:mm a")}</div>
                    <div>To: {format(new Date(brainbee.available_to), "MMM d, yyyy h:mm a")}</div>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <Link href={`/brainbee/${brainbee.id}`}>
                    <Button variant="outline" size="sm" className="border-blue-700 text-blue-400 hover:bg-blue-900/30">View Details</Button>
                  </Link>
                  {brainbee.questions?.[0]?.count < 15 ? (
                    <Link href={`/brainbee/${brainbee.id}/questions`}>
                      <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                        Add Questions
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/brainbee/${brainbee.id}/edit`}>
                      <Button variant="outline" size="sm" className="border-blue-700 text-blue-400 hover:bg-blue-900/30">Edit</Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-gray-700 rounded-lg p-8 text-center bg-blue-950/20">
          <h3 className="text-xl font-medium mb-2">No BrainBees found</h3>
          <p className="text-gray-400 mb-6">Create your first BrainBee to get started.</p>
          <Link href="/brainbee/create">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">Create BrainBee</Button>
          </Link>
        </div>
      )}
    </div>
  );
} 