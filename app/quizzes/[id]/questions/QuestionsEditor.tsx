"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Quiz, Question, Option } from "@/types/quiz";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";

interface QuestionFormState {
  questionText: string;
  questionType: "multiple_choice" | "true_false";
  questionImage: string;
  options: {
    id: string;
    optionText: string;
    isCorrect: boolean;
    optionImage: string;
  }[];
}

const createEmptyMultipleChoiceQuestion = (): QuestionFormState => ({
  questionText: "",
  questionType: "multiple_choice",
  questionImage: "",
  options: [
    { id: `mc-1-${Date.now()}-${Math.random()}`, optionText: "", isCorrect: false, optionImage: "" },
    { id: `mc-2-${Date.now()}-${Math.random()}`, optionText: "", isCorrect: false, optionImage: "" },
    { id: `mc-3-${Date.now()}-${Math.random()}`, optionText: "", isCorrect: false, optionImage: "" },
    { id: `mc-4-${Date.now()}-${Math.random()}`, optionText: "", isCorrect: false, optionImage: "" },
  ],
});

const createEmptyTrueFalseQuestion = (): QuestionFormState => ({
  questionText: "",
  questionType: "true_false",
  questionImage: "",
  options: [
    { id: `tf-1-${Date.now()}-${Math.random()}`, optionText: "True", isCorrect: false, optionImage: "" },
    { id: `tf-2-${Date.now()}-${Math.random()}`, optionText: "False", isCorrect: false, optionImage: "" },
  ],
});

export default function QuestionsEditor({ quizId }: { quizId: string }) {
  const router = useRouter();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionFormState>(
    createEmptyMultipleChoiceQuestion()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!quizId) return;
    
    const fetchQuizData = async () => {
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (quizError) {
        console.error("Error fetching quiz:", quizError);
        return;
      }

      setQuiz(quizData);

      // Fetch existing questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*, options(*)")
        .eq("quiz_id", quizId);

      if (questionsError) {
        console.error("Error fetching questions:", questionsError);
        return;
      }

      setQuestions(questionsData);
    };

    fetchQuizData();
  }, [quizId, supabase]);

  const handleQuestionTypeChange = (type: "multiple_choice" | "true_false") => {
    setCurrentQuestion(
      type === "multiple_choice"
        ? createEmptyMultipleChoiceQuestion()
        : createEmptyTrueFalseQuestion()
    );
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      optionText: value,
    };
    setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
  };

  const handleCorrectOptionChange = (index: number, checked: boolean) => {
    const updatedOptions = currentQuestion.options.map((option, i) => ({
      ...option,
      isCorrect: i === index ? checked : false,
    }));
    setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
  };

  const handleQuestionImageChange = (url: string) => {
    setCurrentQuestion({ ...currentQuestion, questionImage: url });
  };

  const handleOptionImageChange = (index: number, url: string) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      optionImage: url,
    };
    setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    
    try {
      setIsLoading(true);
      const { error: deleteError } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      router.push("/quizzes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete quiz");
      setIsLoading(false);
    }
  };

  const addQuestion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate
      if (!currentQuestion.questionText.trim()) {
        throw new Error("Question text is required");
      }

      if (!currentQuestion.options.some((option) => option.isCorrect)) {
        throw new Error("Please select a correct answer");
      }

      if (
        currentQuestion.questionType === "multiple_choice" &&
        currentQuestion.options.some(
          (option) => !option.optionText.trim()
        )
      ) {
        throw new Error("All options must have text");
      }

      // Insert question
      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .insert([
          {
            quiz_id: quizId,
            question_text: currentQuestion.questionText,
            question_type: currentQuestion.questionType,
            image_url: currentQuestion.questionImage || null,
          },
        ])
        .select()
        .single();

      if (questionError) {
        throw new Error(questionError.message);
      }

      // Insert options
      const optionsToInsert = currentQuestion.options.map((option) => ({
        question_id: questionData.id,
        option_text: option.optionText,
        is_correct: option.isCorrect,
        image_url: option.optionImage || null,
      }));

      const { error: optionsError } = await supabase
        .from("options")
        .insert(optionsToInsert);

      if (optionsError) {
        throw new Error(optionsError.message);
      }

      // Reset form and refresh questions
      setCurrentQuestion(
        currentQuestion.questionType === "multiple_choice"
          ? createEmptyMultipleChoiceQuestion()
          : createEmptyTrueFalseQuestion()
      );

      // Add the new question to the list
      const newQuestion = {
        ...questionData,
        options: optionsToInsert,
      };
      setQuestions([...questions, newQuestion as Question]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const finishQuiz = () => {
    router.push(`/quizzes/${quizId}`);
  };

  if (!quiz) {
    return <div className="p-8 text-center">Loading quiz details...</div>;
  }

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-8 max-w-3xl mx-auto w-full bg-black text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{quiz.name}</h1>
          <p className="text-gray-400">
            Add questions to your quiz (Passcode: {quiz.passcode})
          </p>
        </div>
        <Button 
          variant="outline" 
          className="border-red-700 text-red-400 hover:bg-red-950"
          onClick={handleDelete}
          disabled={isLoading}
        >
          Delete
        </Button>
      </div>

      {/* List of existing questions */}
      {questions.length > 0 && (
        <div className="border border-gray-700 rounded-lg p-6 mb-6 bg-black">
          <h2 className="text-xl font-medium mb-4">
            Questions ({questions.length}/3)
          </h2>
          {questions.map((question, index) => (
            <div key={question.id} className="mb-4 last:mb-0 p-4 border border-gray-700 rounded bg-black">
              <h3 className="font-medium">
                {index + 1}. {question.question_text}
              </h3>
              {question.image_url && (
                <div key={`question-img-${question.id}`} className="mt-2 relative h-40 bg-gray-800 rounded overflow-hidden">
                  <Image 
                    src={question.image_url} 
                    alt="Question image" 
                    fill
                    style={{objectFit: "contain"}} 
                  />
                </div>
              )}
              <p className="text-sm text-gray-400 mt-1">
                Type: {question.question_type === "multiple_choice" ? "Multiple Choice" : "True/False"}
              </p>
              <div className="mt-2">
                {question.options?.map((option) => (
                  <div
                    key={option.id}
                    className={`p-2 my-1 rounded text-sm ${
                      option.is_correct
                        ? "bg-green-100 border border-green-300 text-green-800"
                        : "bg-white border border-gray-300 text-gray-800"
                    }`}
                  >
                    <div key={`flex-${option.id}`} className="flex items-center gap-2">
                      {option.image_url && (
                        <div key={`option-img-${option.id}`} className="relative w-10 h-10 bg-gray-100 rounded overflow-hidden">
                          <Image 
                            src={option.image_url} 
                            alt="Option image" 
                            fill
                            style={{objectFit: "cover"}} 
                          />
                        </div>
                      )}
                      <span>{option.option_text} {option.is_correct && "✓"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add question form */}
      {questions.length < 3 ? (
        <div className="border border-gray-700 rounded-lg p-6 bg-black">
          <h2 className="text-xl font-medium mb-4">Add Question</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="questionType" className="text-white">Question Type</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={
                    currentQuestion.questionType === "multiple_choice"
                      ? "default"
                      : "outline"
                  }
                  onClick={() => handleQuestionTypeChange("multiple_choice")}
                  className={
                    currentQuestion.questionType === "multiple_choice"
                      ? "bg-white text-black hover:bg-gray-200"
                      : "border-gray-700 text-white hover:bg-gray-800"
                  }
                >
                  Multiple Choice
                </Button>
                <Button
                  type="button"
                  variant={
                    currentQuestion.questionType === "true_false"
                      ? "default"
                      : "outline"
                  }
                  onClick={() => handleQuestionTypeChange("true_false")}
                  className={
                    currentQuestion.questionType === "true_false"
                      ? "bg-white text-black hover:bg-gray-200"
                      : "border-gray-700 text-white hover:bg-gray-800"
                  }
                >
                  True/False
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionText" className="text-white">Question</Label>
              <Input
                id="questionText"
                value={currentQuestion.questionText}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    questionText: e.target.value,
                  })
                }
                placeholder="Enter your question"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <ImageUpload 
                key={`question-img-upload-${currentQuestion.questionType}`}
                onImageUploaded={handleQuestionImageChange}
                existingImageUrl={currentQuestion.questionImage}
                label="Question Image (Optional)"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-white">Options</Label>
              {currentQuestion.options.map((option, index) => (
                <div
                  key={option.id}
                  className="flex flex-col gap-3 border border-gray-700 p-3 rounded bg-black"
                >
                  <div key={`form-${option.id}`} className="flex items-center gap-3">
                    <Checkbox
                      id={`correct-${index}`}
                      checked={option.isCorrect}
                      onCheckedChange={(checked) =>
                        handleCorrectOptionChange(index, checked === true)
                      }
                      className="border-gray-400"
                    />
                    <Label htmlFor={`correct-${index}`} className="flex-grow text-white">
                      {currentQuestion.questionType === "true_false" ? (
                        <span key={`tf-text-${option.id}`}>{option.optionText}</span>
                      ) : (
                        <Input
                          key={`mc-input-${option.id}`}
                          value={option.optionText}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="bg-white border-gray-300 text-gray-800"
                        />
                      )}
                    </Label>
                  </div>
                  
                  {currentQuestion.questionType === "multiple_choice" && (
                    <div key={`img-upload-${option.id}`} className="ml-7">
                      <ImageUpload 
                        key={`option-img-upload-${option.id}`}
                        onImageUploaded={(url) => handleOptionImageChange(index, url)}
                        existingImageUrl={option.optionImage}
                        label={`Option ${index + 1} Image (Optional)`}
                      />
                    </div>
                  )}
                </div>
              ))}
              <p className="text-xs text-gray-400">Select the correct answer</p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                onClick={addQuestion} 
                disabled={isLoading}
                className="bg-white text-black hover:bg-gray-200"
              >
                {isLoading ? "Adding..." : "Add Question"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-gray-700 rounded-lg p-6 text-center bg-green-900/20">
          <h2 className="text-xl font-medium mb-2">All questions added!</h2>
          <p className="mb-6">
            You have created 3 questions for this quiz. You can now view the quiz.
          </p>
          <Button 
            onClick={finishQuiz}
            className="bg-white text-black hover:bg-gray-200"
          >
            View Quiz
          </Button>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Link href="/quizzes">
          <Button 
            variant="outline"
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            Back to Quizzes
          </Button>
        </Link>
        {questions.length > 0 && (
          <Button 
            onClick={finishQuiz}
            className="bg-white text-black hover:bg-gray-200"
          >
            {questions.length === 3 ? "Finish" : "Save & Continue Later"}
          </Button>
        )}
      </div>
    </div>
  );
} 