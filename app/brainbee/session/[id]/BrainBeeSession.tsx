"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Quiz, Question, Option } from "@/types/quiz";
import Image from "next/image";

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
  const [userName, setUserName] = useState<string | null>(null);
  const [userContact, setUserContact] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const supabase = createClient();

  // Get user info from localStorage
  useEffect(() => {
    const storedUserName = localStorage.getItem("quiz_user_name");
    const storedUserContact = localStorage.getItem("quiz_user_contact");
    setUserName(storedUserName);
    setUserContact(storedUserContact);
  }, []);

  // Fetch brainbee and questions
  useEffect(() => {
    if (!brainbeeId) return;
    
    const fetchBrainBeeData = async () => {
      setLoading(true);
      try {
        // Fetch brainbee details
        const { data: brainbeeData, error: brainbeeError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", brainbeeId)
          .eq("quiz_type", "brainbee")
          .single();

        if (brainbeeError) {
          throw new Error("Error fetching BrainBee");
        }

        setBrainbee(brainbeeData);

        // Fetch questions with options
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*, options(*)")
          .eq("quiz_id", brainbeeId);

        if (questionsError) {
          throw new Error("Error fetching questions");
        }

        if (!questionsData || questionsData.length === 0) {
          throw new Error("No questions found for this BrainBee");
        }

        if (questionsData.length !== 15) {
          throw new Error("This BrainBee is not complete. It should have exactly 15 questions.");
        }

        setQuestions(questionsData);
        // Initialize userAnswers array with nulls
        setUserAnswers(questionsData.map(q => ({ questionId: q.id, optionId: null })));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchBrainBeeData();
  }, [brainbeeId, supabase]);

  // Timer effect for 20 minute time limit
  useEffect(() => {
    if (!questions.length || quizComplete) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questions, quizComplete]);

  const handleTimeUp = () => {
    // Time's up, submit all answers
    submitAllAnswers();
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    
    // Update userAnswers for the current question
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestionIndex] = {
      questionId: questions[currentQuestionIndex].id,
      optionId: optionId
    };
    setUserAnswers(updatedAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(userAnswers[currentQuestionIndex + 1]?.optionId || null);
    } else {
      // Last question, submit all answers
      submitAllAnswers();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedOption(userAnswers[currentQuestionIndex - 1]?.optionId || null);
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
          user_name: userName,
          contact_info: userContact,
        });
      }
      
      // Record final score
      await supabase.from("user_quiz_scores").insert({
        quiz_id: brainbeeId,
        score: correctCount,
        user_name: userName,
        contact_info: userContact,
      });
      
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
      <div className="flex-1 flex flex-col items-center justify-center px-4 bg-black text-white">
        <div className="max-w-md w-full p-6 border border-gray-700 rounded-lg">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="mb-6">{error}</p>
          <Link href="/">
            <Button className="bg-white text-black hover:bg-gray-200">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-black text-white">
        <div className="max-w-md w-full p-8 border border-gray-700 rounded-lg bg-black">
          <h1 className="text-2xl font-bold mb-4 text-center">BrainBee Complete!</h1>
          
          <div className="text-center mb-8">
            <p className="text-xl mb-2">Your Score</p>
            <p className="text-4xl font-bold">{score} / 15</p>
            <p className="text-sm text-gray-400 mt-2">
              {score === 15 
                ? "Perfect score! Congratulations!" 
                : score >= 12 
                  ? "Great job!" 
                  : score >= 8
                    ? "Good effort!"
                    : "Keep practicing!"}
            </p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = userAnswers[currentQuestionIndex];
  
  return (
    <div className="flex-1 flex flex-col items-center px-4 py-8 bg-black text-white">
      {brainbee && (
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">{brainbee.name}</h1>
            <p className="text-gray-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          
          <div className="mb-4 flex justify-between items-center">
            <div>
              <span className="text-sm font-medium">Time Remaining</span>
              <div className={`font-bold text-xl ${timeLeft < 300 ? 'text-red-500' : ''}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium">Progress</span>
              <div className="font-bold text-xl">
                {userAnswers.filter(a => a.optionId !== null).length} / 15 answered
              </div>
            </div>
          </div>
          
          <div className="border border-gray-700 rounded-lg p-6 mb-6 bg-black">
            <h2 className="text-xl font-bold mb-6 text-white">{currentQuestion?.question_text}</h2>
            
            {currentQuestion?.image_url && (
              <div className="mb-6 relative h-52 rounded overflow-hidden bg-gray-900">
                <Image 
                  src={currentQuestion.image_url} 
                  alt="Question image" 
                  fill
                  style={{objectFit: "contain"}} 
                />
              </div>
            )}
            
            <div className="space-y-3">
              {currentQuestion?.options?.map((option) => (
                <button
                  key={option.id}
                  className={`w-full p-4 text-left rounded-lg border ${
                    selectedOption === option.id
                      ? 'bg-blue-900 border-blue-700 text-white'
                      : 'bg-gray-900 border-gray-700 text-white hover:bg-gray-800'
                  }`}
                  onClick={() => handleOptionSelect(option.id)}
                >
                  <div className="flex items-center gap-3">
                    {option.image_url && (
                      <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-black">
                        <Image 
                          src={option.image_url} 
                          alt="Option image" 
                          fill
                          style={{objectFit: "cover"}} 
                        />
                      </div>
                    )}
                    <span>{option.option_text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button 
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              Previous
            </Button>

            <Button 
              onClick={submitAllAnswers}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Submit All
            </Button>
            
            <Button 
              onClick={handleNextQuestion}
              className="bg-white text-black hover:bg-gray-200"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-5 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                className={`w-full p-2 text-center rounded ${
                  index === currentQuestionIndex
                    ? 'bg-blue-900 text-white'
                    : userAnswers[index]?.optionId
                      ? 'bg-green-900 text-white'
                      : 'bg-gray-900 text-white'
                }`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 