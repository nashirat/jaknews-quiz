"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Quiz, Question, Option } from "@/types/quiz";

export default function QuizSession({ quizId }: { quizId: string }) {
  const router = useRouter();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userContact, setUserContact] = useState<string | null>(null);

  const supabase = createClient();

  // Get user info from localStorage
  useEffect(() => {
    const storedUserName = localStorage.getItem("quiz_user_name");
    const storedUserContact = localStorage.getItem("quiz_user_contact");
    setUserName(storedUserName);
    setUserContact(storedUserContact);
  }, []);

  // Handler functions
  const recordAnswer = async (optionId: string | null) => {
    if (!questions.length) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const correctOption = currentQuestion.options?.find(o => o.is_correct);
    const isCorrect = optionId === correctOption?.id;
    
    // Update score
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    // Record response in database
    try {
      await supabase.from("user_responses").insert({
        question_id: currentQuestion.id,
        selected_option_id: optionId,
        is_correct: isCorrect,
        response_time: 40 - timeLeft,
        user_name: userName,
        contact_info: userContact,
      });
    } catch (err) {
      console.error("Error recording response:", err);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleNextQuestion = () => {
    // Record the selected answer (or null if none selected)
    recordAnswer(selectedOption);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const handleTimeUp = () => {
    // Record answer on time up
    recordAnswer(selectedOption);
    
    // Automatically move to the next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setQuizComplete(true);
    
    // Record final score
    try {
      await supabase.from("user_quiz_scores").insert({
        quiz_id: quizId,
        score,
        user_name: userName,
        contact_info: userContact,
      });
    } catch (err) {
      console.error("Error recording score:", err);
    }
  };

  // Fetch quiz and questions
  useEffect(() => {
    if (!quizId) return;
    
    const fetchQuizData = async () => {
      setLoading(true);
      try {
        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", quizId)
          .single();

        if (quizError) {
          throw new Error("Error fetching quiz");
        }

        setQuiz(quizData);

        // Fetch questions with options
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*, options(*)")
          .eq("quiz_id", quizId);

        if (questionsError) {
          throw new Error("Error fetching questions");
        }

        if (!questionsData || questionsData.length === 0) {
          throw new Error("No questions found for this quiz");
        }

        setQuestions(questionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId, supabase]);

  // Timer effect
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
  }, [questions, currentQuestionIndex, quizComplete]);

  // Reset timer when moving to next question
  useEffect(() => {
    if (!questions.length) return;
    
    // Get the time limit from the current question or default to 40
    const timeLimit = questions[currentQuestionIndex]?.time_limit || 40;
    setTimeLeft(timeLimit);
    setSelectedOption(null);
  }, [currentQuestionIndex, questions]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-lg">Loading quiz...</p>
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
          <h1 className="text-2xl font-bold mb-4 text-center">Quiz Complete!</h1>
          
          <div className="text-center mb-8">
            <p className="text-xl mb-2">Your Score</p>
            <p className="text-4xl font-bold">{score} / 3</p>
            <p className="text-sm text-gray-400 mt-2">
              {score === 3 
                ? "Perfect score! Great job!" 
                : score > 1 
                  ? "Good job!" 
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
  
  return (
    <div className="flex-1 flex flex-col items-center px-4 py-8 bg-black text-white">
      {quiz && (
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">{quiz.name}</h1>
            <p className="text-gray-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          
          <div className="mb-4 flex justify-between items-center">
            <div>
              <span className="text-sm font-medium">Time Left</span>
              <div className={`font-bold text-xl ${timeLeft < 10 ? 'text-red-500' : ''}`}>
                {timeLeft} seconds
              </div>
            </div>
            <div>
              <span className="text-sm font-medium">Question</span>
              <div className="font-bold text-xl">{currentQuestionIndex + 1} of 3</div>
            </div>
          </div>
          
          <div className="border border-gray-700 rounded-lg p-6 mb-6 bg-black">
            <h2 className="text-xl font-bold mb-6 text-white">{currentQuestion?.question_text}</h2>
            
            {currentQuestion?.image_url && (
              <div className="relative h-48 mb-6 bg-gray-800 rounded overflow-hidden">
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
                      <div className="relative w-10 h-10 flex-shrink-0 bg-gray-800 rounded overflow-hidden">
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
            {!selectedOption && (
              <div className="text-gray-400 text-sm mt-2">
                Select an answer before continuing to the next question
              </div>
            )}
            
            <Button 
              onClick={handleNextQuestion}
              className="bg-white text-black hover:bg-gray-200 ml-auto"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 