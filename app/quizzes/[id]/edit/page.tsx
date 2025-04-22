"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Option, Question } from "@/types/quiz";

interface QuestionFormState {
  id?: string;
  questionText: string;
  questionType: "multiple_choice" | "true_false";
  options: {
    id?: string;
    optionText: string;
    isCorrect: boolean;
  }[];
}

export default function EditQuizPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<QuestionFormState | null>(null);
  const [activeTab, setActiveTab] = useState("quiz");

  const supabase = createClient();

  // Unwrap params promise
  useEffect(() => {
    const unwrapParams = async () => {
      try {
        const resolvedParams = await params;
        setQuizId(resolvedParams.id);
      } catch (err) {
        setError("Failed to load quiz parameters");
      }
    };
    
    unwrapParams();
  }, [params]);

  // Fetch existing quiz data
  useEffect(() => {
    if (!quizId) return;
    
    const fetchQuiz = async () => {
      setIsFetching(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", quizId)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (data) {
          setName(data.name);
          setPasscode(data.passcode);
        }

        // Fetch questions with options
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*, options(*)")
          .eq("quiz_id", quizId);

        if (questionsError) {
          console.error("Error fetching questions:", questionsError);
        } else {
          setQuestions(questionsData || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quiz");
      } finally {
        setIsFetching(false);
      }
    };

    fetchQuiz();
  }, [quizId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate form fields
      if (!name.trim()) {
        throw new Error("Quiz name is required");
      }

      if (!passcode.trim()) {
        throw new Error("Passcode is required");
      }

      // Update quiz in Supabase
      const { error: updateError } = await supabase
        .from("quizzes")
        .update({ name, passcode })
        .eq("id", quizId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Redirect to quiz detail page after successful update
      router.push(`/quizzes/${quizId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditQuestion = (question: Question) => {
    setEditingQuestion({
      id: question.id,
      questionText: question.question_text,
      questionType: question.question_type as "multiple_choice" | "true_false",
      options: (question.options || []).map(option => ({
        id: option.id,
        optionText: option.option_text,
        isCorrect: option.is_correct
      }))
    });
  };

  const cancelEditQuestion = () => {
    setEditingQuestion(null);
  };

  const handleQuestionTextChange = (text: string) => {
    if (!editingQuestion) return;
    setEditingQuestion({
      ...editingQuestion,
      questionText: text
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!editingQuestion) return;
    const updatedOptions = [...editingQuestion.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      optionText: value,
    };
    setEditingQuestion({ ...editingQuestion, options: updatedOptions });
  };

  const handleCorrectOptionChange = (index: number) => {
    if (!editingQuestion) return;
    const updatedOptions = editingQuestion.options.map((option, i) => ({
      ...option,
      isCorrect: i === index
    }));
    setEditingQuestion({ ...editingQuestion, options: updatedOptions });
  };

  const saveQuestion = async () => {
    if (!editingQuestion) return;
    setIsLoading(true);
    
    try {
      // Validate question
      if (!editingQuestion.questionText.trim()) {
        throw new Error("Question text is required");
      }

      if (!editingQuestion.options.some(o => o.isCorrect)) {
        throw new Error("You must select at least one correct answer");
      }

      // Update question
      await supabase
        .from("questions")
        .update({
          question_text: editingQuestion.questionText,
          question_type: editingQuestion.questionType
        })
        .eq("id", editingQuestion.id);

      // Update each option
      for (const option of editingQuestion.options) {
        if (option.id) {
          await supabase
            .from("options")
            .update({
              option_text: option.optionText,
              is_correct: option.isCorrect
            })
            .eq("id", option.id);
        }
      }

      // Refresh questions
      const { data: updatedQuestions } = await supabase
        .from("questions")
        .select("*, options(*)")
        .eq("quiz_id", quizId);
      
      setQuestions(updatedQuestions || []);
      setEditingQuestion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save question");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-8 max-w-lg mx-auto w-full bg-black text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Quiz</h1>
      </div>

      {isFetching || !quizId ? (
        <div className="flex justify-center py-8">
          <p className="text-gray-400">Loading quiz data...</p>
        </div>
      ) : (
        <>
          <div className="flex border-b border-gray-700 mb-4">
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'quiz' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
              onClick={() => setActiveTab('quiz')}
            >
              Quiz Details
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'questions' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
              onClick={() => setActiveTab('questions')}
            >
              Questions ({questions.length}/3)
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {activeTab === 'quiz' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Quiz Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter quiz name"
                  required
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passcode" className="text-white">Quiz Passcode</Label>
                <Input
                  id="passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode for quiz access"
                  required
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-400">
                  This passcode will be used by participants to access the quiz
                </p>
              </div>

              <div className="flex gap-4 justify-end">
                <Link href={`/quizzes/${quizId}`}>
                  <Button type="button" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'questions' && !editingQuestion && (
            <div className="space-y-6">
              {questions.length > 0 ? (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="border border-gray-700 rounded-lg p-4 bg-black">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-white">
                          {index + 1}. {question.question_text}
                        </h3>
                        <Button 
                          variant="outline" 
                          className="border-gray-700 text-white hover:bg-gray-800 ml-2"
                          onClick={() => startEditQuestion(question)}
                        >
                          Edit
                        </Button>
                      </div>
                      <p className="text-sm text-gray-400 mt-1 mb-3">
                        Type: {question.question_type === "multiple_choice" ? "Multiple Choice" : "True/False"}
                      </p>
                      <div className="space-y-2">
                        {question.options?.map((option: Option) => (
                          <div
                            key={option.id}
                            className={`p-2 rounded ${
                              option.is_correct
                                ? "bg-green-100 border border-green-300 text-green-800"
                                : "bg-white border border-gray-300 text-gray-800"
                            }`}
                          >
                            {option.option_text}
                            {option.is_correct && (
                              <span className="ml-2 text-green-600">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-dashed border-2 border-gray-700 rounded-lg">
                  <p className="text-gray-400 mb-4">
                    No questions added to this quiz yet.
                  </p>
                  <Link href={`/quizzes/${quizId}/questions`}>
                    <Button className="bg-white text-black hover:bg-gray-200">Add Questions</Button>
                  </Link>
                </div>
              )}

              <div className="flex justify-end">
                <Link href={`/quizzes/${quizId}`}>
                  <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                    Back to Quiz
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'questions' && editingQuestion && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="questionText" className="text-white">Question Text</Label>
                <Input
                  id="questionText"
                  value={editingQuestion.questionText}
                  onChange={(e) => handleQuestionTextChange(e.target.value)}
                  placeholder="Enter your question"
                  required
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-white">Options</Label>
                {editingQuestion.options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Checkbox
                      id={`option-${index}`}
                      checked={option.isCorrect}
                      onCheckedChange={() => handleCorrectOptionChange(index)}
                      className="border-gray-600"
                    />
                    <Input
                      value={option.optionText}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      required={editingQuestion.questionType === "multiple_choice"}
                      disabled={editingQuestion.questionType === "true_false"}
                      className="bg-gray-900 border-gray-700 text-white flex-1"
                    />
                  </div>
                ))}
                <p className="text-xs text-gray-400 italic">
                  Check the correct answer(s)
                </p>
              </div>

              <div className="flex gap-4 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="border-gray-700 text-white hover:bg-gray-800"
                  onClick={cancelEditQuestion}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  disabled={isLoading}
                  className="bg-white text-black hover:bg-gray-200"
                  onClick={saveQuestion}
                >
                  {isLoading ? "Saving..." : "Save Question"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 