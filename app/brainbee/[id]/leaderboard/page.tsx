"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import BrainBeeLeaderboardTable from "@/app/components/BrainBeeLeaderboardTable";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function BrainBeeLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const brainbeeId = resolvedParams.id;
  const [brainbee, setBrainbee] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(15);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const supabase = createClient();

  // Fetch initial data and set up real-time subscription
  useEffect(() => {
    if (!brainbeeId) return;

    setIsLoading(true);
    
    // Fetch brainbee details
    const fetchBrainbeeData = async () => {
      try {
        // Fetch brainbee details
        const { data: brainbeeData, error: brainbeeError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", brainbeeId)
          .eq("quiz_type", "brainbee")
          .single();

        if (brainbeeError) {
          throw new Error(brainbeeError.message);
        }

        setBrainbee(brainbeeData);

        // Fetch questions count
        const { count, error: questionsCountError } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("quiz_id", brainbeeId);

        if (questionsCountError) {
          console.error("Error fetching questions count:", questionsCountError);
        } else if (count !== null) {
          setTotalQuestions(count);
        }

        // Fetch leaderboard data
        const { data: scoresData, error: scoresError } = await supabase
          .from("user_quiz_scores")
          .select("*, team_info")
          .eq("quiz_id", brainbeeId)
          .order("score", { ascending: false })
          .order("completed_at", { ascending: true });

        if (scoresError) {
          throw new Error(scoresError.message);
        }

        setLeaderboardData(scoresData || []);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load BrainBee data");
        setIsLoading(false);
      }
    };

    fetchBrainbeeData();

    // Debug log for realtime availability 
    console.log("Supabase Realtime capabilities available:", supabase.realtime !== undefined);

    // Set up real-time subscription for new scores
    const channel = supabase
      .channel(`user_quiz_scores:quiz_id:${brainbeeId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'user_quiz_scores',
          filter: `quiz_id=eq.${brainbeeId}` 
        }, 
        (payload) => {
          console.log('INSERT event received:', payload);
          // Add new score to leaderboard
          setLeaderboardData(current => {
            const newData = [...current, payload.new];
            // Sort by score (desc) and then by completed_at (asc)
            return newData.sort((a, b) => {
              if (a.score !== b.score) {
                return b.score - a.score; // Higher score first
              }
              return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime(); // Earlier time first
            });
          });
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'user_quiz_scores',
          filter: `quiz_id=eq.${brainbeeId}` 
        },
        (payload) => {
          console.log('UPDATE event received:', payload);
          // Update existing score
          setLeaderboardData(current => {
            return current.map(item => {
              if (item.id === payload.new.id) {
                return payload.new;
              }
              return item;
            }).sort((a, b) => {
              if (a.score !== b.score) {
                return b.score - a.score;
              }
              return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
            });
          });
        }
      )
      .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'user_quiz_scores',
          filter: `quiz_id=eq.${brainbeeId}` 
        },
        (payload) => {
          console.log('DELETE event received:', payload);
          // Remove score from leaderboard
          setLeaderboardData(current => {
            return current.filter(item => item.id !== payload.old.id);
          });
        }
      );
    
    // Add subscription status handler
    channel.subscribe(status => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        setRealtimeStatus('connected');
      } else if (status === 'CHANNEL_ERROR') {
        setRealtimeStatus('disconnected');
        console.error('Failed to connect to realtime channel');
      } else {
        setRealtimeStatus('connecting');
      }
    });

    // Clean up subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [brainbeeId, supabase]);

  // Poll for data updates every 5 seconds as a fallback in case realtime doesn't work
  useEffect(() => {
    if (!brainbeeId || realtimeStatus === 'connected') return;
    
    const intervalId = setInterval(async () => {
      try {
        // Fetch updated leaderboard data
        const { data: scoresData, error: scoresError } = await supabase
          .from("user_quiz_scores")
          .select("*")
          .eq("quiz_id", brainbeeId)
          .order("score", { ascending: false })
          .order("completed_at", { ascending: true });

        if (scoresError) {
          console.error("Error polling leaderboard data:", scoresError);
          return;
        }

        setLeaderboardData(scoresData || []);
      } catch (err) {
        console.error("Failed to poll for leaderboard updates:", err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [brainbeeId, realtimeStatus, supabase]);

  if (isLoading && !brainbee) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-lg">Loading leaderboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 bg-black text-white">
        <div className="max-w-md w-full p-6 border border-gray-700 rounded-lg">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="mb-6">{error}</p>
          <Link href={`/brainbee/${brainbeeId}`}>
            <Button className="bg-white text-black hover:bg-gray-200">
              Back to BrainBee
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!brainbee) {
    return notFound();
  }

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-8 max-w-4xl mx-auto w-full bg-black text-white">
      <div className="flex items-center gap-4">
        <Link href={`/brainbee/${brainbeeId}`}>
          <Button variant="outline" size="icon" className="border-gray-700 text-white hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{brainbee?.name} - Leaderboard</h1>
      </div>

      <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
        {leaderboardData.length > 0 ? (
          <>
            <div className="mb-4 text-sm flex items-center">
              <span className="relative flex h-3 w-3 mr-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${realtimeStatus === 'connected' ? 'bg-green-400' : realtimeStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${realtimeStatus === 'connected' ? 'bg-green-500' : realtimeStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
              </span>
              <span className={realtimeStatus === 'connected' ? 'text-green-400' : realtimeStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'}>
                {realtimeStatus === 'connected' 
                  ? 'Live updating leaderboard - new scores will appear automatically' 
                  : realtimeStatus === 'connecting' 
                    ? 'Connecting to real-time updates...' 
                    : 'Real-time updates unavailable - polling for updates every 5 seconds'}
              </span>
            </div>
            <BrainBeeLeaderboardTable data={leaderboardData} totalQuestions={totalQuestions} />
          </>
        ) : (
          <div className="text-center py-12 border-dashed border-2 border-gray-700 rounded-lg">
            <p className="text-gray-400 text-lg mb-2">
              No attempts yet
            </p>
            <p className="text-gray-500">
              The leaderboard will be populated once participants complete the BrainBee.
            </p>
            <div className="mt-4 text-sm flex items-center justify-center">
              <span className="relative flex h-3 w-3 mr-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${realtimeStatus === 'connected' ? 'bg-green-400' : realtimeStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${realtimeStatus === 'connected' ? 'bg-green-500' : realtimeStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
              </span>
              <span className={realtimeStatus === 'connected' ? 'text-green-400' : realtimeStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'}>
                {realtimeStatus === 'connected' 
                  ? 'Live updating - scores will appear in real-time' 
                  : realtimeStatus === 'connecting' 
                    ? 'Connecting to real-time updates...' 
                    : 'Real-time updates unavailable - polling for updates every 5 seconds'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2">
        <Link href={`/brainbee/${brainbeeId}`}>
          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
            Back to BrainBee
          </Button>
        </Link>
      </div>
    </div>
  );
} 