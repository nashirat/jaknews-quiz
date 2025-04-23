"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Quiz, Question, Option } from "@/types/quiz";
import Image from "next/image";

type TeamInfo = {
  leader: {
    name: string;
    email: string;
  };
  members: {
    name: string;
    email: string | null;
  }[];
};

export default function BrainBeeSession({ brainbeeId }: { brainbeeId: string }) {
  const router = useRouter();
  
  const [brainbee, setBrainbee] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes = 1200 seconds
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ questionId: string, optionId: string | null }[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [score, setScore] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [quizScoreId, setQuizScoreId] = useState<string | null>(null);

  const supabase = createClient();

  // Get team info from localStorage
  useEffect(() => {
    try {
      const storedTeamInfo = localStorage.getItem("quiz_team_info");
      if (storedTeamInfo) {
        const parsedTeamInfo = JSON.parse(storedTeamInfo) as TeamInfo;
        setTeamInfo(parsedTeamInfo);
        setTeamName(parsedTeamInfo.leader.name);
      } else {
        // Fallback to old format for backward compatibility
        const storedUserName = localStorage.getItem("quiz_user_name");
        setTeamName(storedUserName);
      }
    } catch (err) {
      console.error("Error parsing team info:", err);
      // Fallback to old format
      const storedUserName = localStorage.getItem("quiz_user_name");
      setTeamName(storedUserName);
    }
  }, []);

  // Fetch BrainBee and questions
  useEffect(() => {
    if (!brainbeeId) return;
    
    const fetchBrainBeeData = async () => {
      try {
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

        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*, options(*)")
          .eq("quiz_id", brainbeeId);

        if (questionsError) {
          throw new Error(questionsError.message);
        }

        setQuestions(questionsData || []);
        
        // Initialize user answers
        setUserAnswers(questionsData.map((q: Question) => ({
          questionId: q.id,
          optionId: null
        })));
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load BrainBee");
        setLoading(false);
      }
    };

    fetchBrainBeeData();
  }, [brainbeeId, supabase]);

  // Save team info when session starts
  useEffect(() => {
    const saveInitialTeamInfo = async () => {
      if (!brainbeeId || !teamName || sessionStarted || loading) return;
      
      try {
        // Prepare team metadata
        const teamMetadata = teamInfo 
          ? {
              team_info: JSON.stringify({
                leader: teamInfo.leader,
                members: teamInfo.members
              })
            }
          : {};
          
        // Insert initial record with score of 0
        const { data, error } = await supabase.from("user_quiz_scores").insert({
          quiz_id: brainbeeId,
          score: 0,
          user_name: teamName,
          contact_info: teamInfo?.leader.email || localStorage.getItem("quiz_user_contact"),
          ...teamMetadata
        }).select();
        
        if (error) {
          console.error("Error saving initial team info:", error);
        } else if (data && data.length > 0) {
          setQuizScoreId(data[0].id); // Store the ID for later update
          setSessionStarted(true);
        }
      } catch (err) {
        console.error("Error saving initial team info:", err);
      }
    };

    if (brainbee && teamName && !loading && !sessionStarted) {
      saveInitialTeamInfo();
    }
  }, [brainbeeId, teamName, teamInfo, brainbee, loading, sessionStarted, supabase]);

  // Timer effect
  useEffect(() => {
    if (loading || quizComplete) return;
    
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          if (!quizComplete) {
            submitAllAnswers();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [loading, quizComplete]);

  const handleSelectOption = (optionId: string) => {
    setSelectedOption(optionId);
    
    // Update user answers
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      const currentQuestionId = questions[currentQuestionIndex].id;
      const answerIndex = newAnswers.findIndex(a => a.questionId === currentQuestionId);
      
      if (answerIndex !== -1) {
        newAnswers[answerIndex].optionId = optionId;
      }
      
      return newAnswers;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedOption(userAnswers.find(a => a.questionId === questions[currentQuestionIndex - 1].id)?.optionId || null);
    }
  };

  const handleFinish = () => {
    if (window.confirm("Are you sure you want to submit all answers? You won't be able to change them afterwards.")) {
      submitAllAnswers();
    }
  };

  const submitAllAnswers = async () => {
    setLoading(true);
    
    try {
      // Filter answers that have been answered
      const answeredQuestions = userAnswers.filter(a => a.optionId !== null);
      
      // Record all responses in database
      let correctCount = 0;
      
      for (const answer of answeredQuestions) {
        const question = questions.find(q => q.id === answer.questionId);
        const option = question?.options?.find(o => o.id === answer.optionId);
        const isCorrect = option?.is_correct || false;
        
        if (isCorrect) {
          correctCount++;
        }
        
        await supabase.from("user_responses").insert({
          question_id: answer.questionId,
          selected_option_id: answer.optionId,
          is_correct: isCorrect,
          user_name: teamName,
          contact_info: teamInfo?.leader.email || localStorage.getItem("quiz_user_contact"),
        });
      }
      
      // Update the existing score record rather than creating a new one
      if (quizScoreId) {
        await supabase.from("user_quiz_scores")
          .update({ 
            score: correctCount,
            completed_at: new Date().toISOString() 
          })
          .eq("id", quizScoreId);
      } else {
        // Fallback to creating a new record if no initial record was created
        const teamMetadata = teamInfo 
          ? {
              team_info: JSON.stringify({
                leader: teamInfo.leader,
                members: teamInfo.members
              })
            }
          : {};
          
        await supabase.from("user_quiz_scores").insert({
          quiz_id: brainbeeId,
          score: correctCount,
          user_name: teamName,
          contact_info: teamInfo?.leader.email || localStorage.getItem("quiz_user_contact"),
          ...teamMetadata
        });
      }
      
      setScore(correctCount);
      setQuizComplete(true);
    } catch (err) {
      console.error("Error submitting answers:", err);
      setError("Failed to submit your answers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (loading && !brainbee) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-lg">Loading BrainBee...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black text-white">
        <div className="text-center max-w-md mx-auto p-6 border border-red-700 bg-red-900/20 rounded-lg">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <Link href="/">
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-black text-white">
        <div className="max-w-lg w-full p-6 border border-green-700 bg-green-900/20 rounded-lg">
          <h2 className="text-2xl font-bold text-center mb-6">BrainBee Complete!</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-green-400 mb-2">Team Results</h3>
            <p className="text-xl mb-4">Team: <span className="font-bold">{teamName}</span></p>
            <p className="text-xl">Score: <span className="font-bold text-green-400">{score}</span> out of {questions.length}</p>
          </div>

          {teamInfo && (
            <div className="mb-6 p-4 border border-gray-700 rounded-lg bg-gray-900/30">
              <h3 className="text-lg font-semibold mb-2">Team Members</h3>
              <p className="text-sm mb-2">
                <span className="text-gray-400">Team Leader:</span> {teamInfo.leader.name}
              </p>
              <div className="text-sm">
                <span className="text-gray-400">Team Members:</span>
                <ul className="pl-4 mt-1 space-y-1">
                  {teamInfo.members.map((member, idx) => (
                    <li key={idx}>{member.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-400 mb-4">Thank you for participating in the BrainBee!</p>
            <Link href="/">
              <Button className="bg-white text-black hover:bg-gray-200">
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = userAnswers.find(a => a.questionId === currentQuestion?.id);
  
  return (
    <div className="flex-1 flex flex-col bg-black text-white min-h-screen">
      {/* Header */}
      <div className="py-4 px-6 border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{brainbee?.name}</h1>
            <p className="text-sm text-gray-400">Team: {teamName}</p>
          </div>
          <div className="text-right">
            <p className={`text-xl font-mono ${timeLeft < 300 ? 'text-red-400' : 'text-white'}`}>
              Time Left: {formatTime(timeLeft)}
            </p>
            <p className="text-sm text-gray-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Question */}
          <div className="mb-8 p-6 border border-gray-700 rounded-lg bg-gray-900/30">
            <h2 className="text-xl font-semibold mb-4">
              {currentQuestionIndex + 1}. {currentQuestion?.question_text}
            </h2>
            
            {currentQuestion?.image_url && (
              <div className="mt-2 mb-6 relative h-64 rounded overflow-hidden bg-black">
                <Image 
                  src={currentQuestion.image_url} 
                  alt="Question image" 
                  fill 
                  style={{objectFit: "contain"}} 
                />
              </div>
            )}
            
            {/* Options */}
            <div className="space-y-3 mt-6">
              {currentQuestion?.options?.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`w-full p-4 text-left rounded-lg flex items-start border ${
                    option.id === selectedOption || option.id === currentAnswer?.optionId
                      ? 'border-blue-600 bg-blue-900/30'
                      : 'border-gray-700 hover:border-gray-500 bg-gray-900/50'
                  }`}
                >
                  <div className={`h-5 w-5 rounded-full mr-3 mt-0.5 border ${
                    option.id === selectedOption || option.id === currentAnswer?.optionId
                      ? 'border-blue-400 bg-blue-400/30'
                      : 'border-gray-500'
                  }`} />
                  <div className="flex-1">
                    <span>{option.option_text}</span>
                    {option.image_url && (
                      <div className="mt-2 relative h-32 w-32 rounded overflow-hidden bg-black">
                        <Image 
                          src={option.image_url} 
                          alt="Option image" 
                          fill 
                          style={{objectFit: "contain"}} 
                        />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={handleFinish}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Finish BrainBee
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  Next Question
                </Button>
              )}
            </div>
          </div>
          
          {/* Question Navigator */}
          <div className="mt-8">
            <p className="text-sm text-gray-400 mb-2">Question Navigator:</p>
            <div className="flex flex-wrap gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`h-10 w-10 flex items-center justify-center rounded-full border ${
                    idx === currentQuestionIndex
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : userAnswers[idx]?.optionId
                        ? 'bg-green-900/30 border-green-700 text-white'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 