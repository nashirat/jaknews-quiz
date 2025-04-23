"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "./textarea";
import Link from "next/link";
import { Question } from "@/types/quiz";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";

export default function BrainBeeQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [quizId, setQuizId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [questionImage, setQuestionImage] = useState("");
  const [options, setOptions] = useState<{ optionText: string; isCorrect: boolean; optionImage: string }[]>([
    { optionText: "", isCorrect: false, optionImage: "" },
    { optionText: "", isCorrect: false, optionImage: "" },
    { optionText: "", isCorrect: false, optionImage: "" },
    { optionText: "", isCorrect: false, optionImage: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  // Unwrap params promise
  useEffect(() => {
    const unwrapParams = async () => {
      try {
        const resolvedParams = await params;
        setQuizId(resolvedParams.id);
      } catch (err) {
        setError("Failed to load BrainBee parameters");
      }
    };
    unwrapParams();
  }, [params]);
  // Fetch existing questions
  useEffect(() => {
    if (!quizId) return;
    const fetchQuestions = async () => {
      setIsFetching(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("questions")
          .select("*, options(*)")
          .eq("quiz_id", quizId);
        if (fetchError) {
          throw new Error(fetchError.message);
        }
        setQuestions(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load questions");
      } finally {
        setIsFetching(false);
      }
    };
    fetchQuestions();
  }, [quizId, supabase]);
  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      optionText: value,
    };
    setOptions(updatedOptions);
  };
  const handleCorrectOptionChange = (index: number) => {
    const updatedOptions = options.map((option, i) => ({
      ...option,
      isCorrect: i === index,
    }));
    setOptions(updatedOptions);
  };

  const handleQuestionImageChange = (url: string) => {
    setQuestionImage(url);
  };

  const handleOptionImageChange = (index: number, url: string) => {
    const updatedOptions = [...options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      optionImage: url,
    };
    setOptions(updatedOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Validate form fields
      if (!questionText.trim()) {
        throw new Error("Question text is required");
      }
      const validOptions = options.filter(opt => opt.optionText.trim());
      if (validOptions.length < 2) {
        throw new Error("At least two options are required");
      }
      if (!options.some(opt => opt.isCorrect)) {
        throw new Error("You must select a correct answer");
      }
      // Check if we already have 15 questions
      if (questions.length >= 15) {
        throw new Error("BrainBee can have a maximum of 15 questions");
      }
      // Insert question
      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .insert([{
          quiz_id: quizId,
          question_text: questionText,
          question_type: "multiple_choice", // BrainBee only uses multiple choice
          time_limit: 0, // No time limit per question for BrainBee
          image_url: questionImage || null,
        }])
        .select()
        .single();
      if (questionError) {
        throw new Error(questionError.message);
      }
      // Insert options
      const optionsToInsert = options
        .filter(opt => opt.optionText.trim())
        .map(opt => ({
          question_id: questionData.id,
          option_text: opt.optionText.trim(),
          is_correct: opt.isCorrect,
          image_url: opt.optionImage || null,
        }));
      const { error: optionsError } = await supabase
        .from("options")
        .insert(optionsToInsert);
      if (optionsError) {
        throw new Error(optionsError.message);
      }
      // Reset form
      setQuestionText("");
      setQuestionImage("");
      setOptions([
        { optionText: "", isCorrect: false, optionImage: "" },
        { optionText: "", isCorrect: false, optionImage: "" },
        { optionText: "", isCorrect: false, optionImage: "" },
        { optionText: "", isCorrect: false, optionImage: "" },
      ]);
      // Refresh questions
      const { data: refreshedQuestions } = await supabase
        .from("questions")
        .select("*, options(*)")
        .eq("quiz_id", quizId);
      setQuestions(refreshedQuestions || []);
      // If we've added all 15 questions, redirect to the BrainBee page
      if (refreshedQuestions && refreshedQuestions.length >= 15) {
        router.push(`/brainbee/${quizId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-8 max-w-lg mx-auto w-full bg-black text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Add BrainBee Questions</h1>
      </div>
      {isFetching ? (
        <div className="flex justify-center py-8">
          <p className="text-gray-400">Loading questions...</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Questions ({questions.length}/15)</h2>
            {questions.length >= 15 && (
              <div className="text-green-500 font-medium">
                All questions added!
              </div>
            )}
          </div>
          {questions.length < 15 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="questionText" className="text-white">Question Text</Label>
                <Textarea
                  id="questionText"
                  value={questionText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestionText(e.target.value)}
                  placeholder="Enter your question"
                  required
                  className="bg-gray-900 border-gray-700 text-white min-h-[100px] resize-y"
                />
              </div>

              <div className="space-y-2">
                <ImageUpload 
                  onImageUploaded={handleQuestionImageChange}
                  existingImageUrl={questionImage}
                  label="Question Image (Optional)"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-white">Options</Label>
                {options.map((option, index) => (
                  <div key={index} className="flex flex-col gap-3 border border-gray-700 p-3 rounded-md">
                    <div className="flex gap-2 items-center">
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
                        className="bg-gray-900 border-gray-700 text-white flex-1"
                      />
                    </div>
                    <div className="ml-7">
                      <ImageUpload 
                        onImageUploaded={(url) => handleOptionImageChange(index, url)}
                        existingImageUrl={option.optionImage}
                        label={`Option ${index + 1} Image (Optional)`}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 italic">
                  Check the correct answer
                </p>
              </div>
              {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div className="flex gap-4 justify-end">
                <Link href={`/brainbee/${quizId}`}>
                  <Button type="button" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  {isLoading ? "Adding..." : "Add Question"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex justify-center mt-4">
              <Link href={`/brainbee/${quizId}`}>
                <Button className="bg-white text-black hover:bg-gray-200">
                  Go to BrainBee
                </Button>
              </Link>
            </div>
          )}
          {questions.length > 0 && (
            <div className="border border-gray-700 rounded-lg p-4 mt-6 bg-gray-900/50">
              <h3 className="text-lg font-medium mb-3">Added Questions</h3>
              <ul className="space-y-4">
                {questions.map((question, index) => (
                  <li key={question.id} className="border-b border-gray-700 pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="mr-2">
                        <div className="font-medium mb-1">{index + 1}. {question.question_text}</div>
                        {question.image_url && (
                          <div className="mt-2 mb-2 relative h-24 w-36 bg-gray-800 rounded overflow-hidden">
                            <Image 
                              src={question.image_url} 
                              alt="Question image" 
                              fill
                              style={{objectFit: "contain"}} 
                            />
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {question.options?.length} options • {question.options?.filter(o => o.is_correct).length} correct
                        </div>
                      </div>
                      <div className="text-green-500 flex-shrink-0">✓</div>
                    </div>
                    <div className="mt-2 ml-4 text-sm">
                      {question.options?.map((option, optIndex) => (
                        <div key={option.id} className={`mt-1 flex items-center ${option.is_correct ? 'text-green-400' : 'text-gray-400'}`}>
                          <span className="mr-1">{optIndex + 1}.</span>
                          <div className="flex items-center">
                            {option.image_url && (
                              <div className="mr-2 relative w-6 h-6 bg-gray-800 rounded overflow-hidden">
                                <Image 
                                  src={option.image_url} 
                                  alt="Option image" 
                                  fill
                                  style={{objectFit: "cover"}} 
                                />
                              </div>
                            )}
                            <span>
                              {option.option_text} {option.is_correct && "✓"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
} 