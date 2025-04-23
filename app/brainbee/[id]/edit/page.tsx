"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Question, Option } from "@/types/quiz";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BrainBeeFormState {
  name: string;
  passcode: string;
}

interface QuestionEditState {
  id: string;
  questionText: string;
  questionImage: string;
  options: {
    id: string;
    optionText: string;
    isCorrect: boolean;
    optionImage: string;
  }[];
  isEditing: boolean;
}

export default function EditBrainBeePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brainbeeId, setBrainbeeId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<QuestionEditState | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  const supabase = createClient();

  // Unwrap params promise
  useEffect(() => {
    const unwrapParams = async () => {
      try {
        const resolvedParams = await params;
        setBrainbeeId(resolvedParams.id);
      } catch (err) {
        setError("Failed to load BrainBee parameters");
      }
    };
    
    unwrapParams();
  }, [params]);

  // Fetch existing brainbee data
  useEffect(() => {
    if (!brainbeeId) return;
    
    const fetchBrainBee = async () => {
      setIsFetching(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", brainbeeId)
          .eq("quiz_type", "brainbee")
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (data) {
          setName(data.name);
          setPasscode(data.passcode);
          
          // Format the date-time values for the input fields
          if (data.available_from) {
            setAvailableFrom(new Date(data.available_from).toISOString().slice(0, 16));
          }
          
          if (data.available_to) {
            setAvailableTo(new Date(data.available_to).toISOString().slice(0, 16));
          }
        }

        // Fetch questions with options
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*, options(*)")
          .eq("quiz_id", brainbeeId);

        if (questionsError) {
          console.error("Error fetching questions:", questionsError);
        } else {
          setQuestions(questionsData || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load BrainBee");
      } finally {
        setIsFetching(false);
      }
    };

    fetchBrainBee();
  }, [brainbeeId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate form fields
      if (!name.trim()) {
        throw new Error("BrainBee name is required");
      }

      if (!passcode.trim()) {
        throw new Error("Passcode is required");
      }
      
      if (!availableFrom || !availableTo) {
        throw new Error("Availability time range is required");
      }

      if (new Date(availableFrom) >= new Date(availableTo)) {
        throw new Error("End time must be after start time");
      }

      // Update brainbee in Supabase
      const { error: updateError } = await supabase
        .from("quizzes")
        .update({ 
          name, 
          passcode,
          available_from: availableFrom,
          available_to: availableTo
        })
        .eq("id", brainbeeId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Redirect to brainbee detail page after successful update
      router.push(`/brainbee/${brainbeeId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion({
      id: question.id,
      questionText: question.question_text,
      questionImage: question.image_url || "",
      options: question.options?.map(option => ({
        id: option.id,
        optionText: option.option_text,
        isCorrect: option.is_correct,
        optionImage: option.image_url || ""
      })) || [],
      isEditing: true
    });
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setError(null);
  };

  const handleOptionTextChange = (index: number, value: string) => {
    if (!editingQuestion) return;
    
    const updatedOptions = [...editingQuestion.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      optionText: value
    };
    
    setEditingQuestion({
      ...editingQuestion,
      options: updatedOptions
    });
  };

  const handleOptionCorrectChange = (index: number) => {
    if (!editingQuestion) return;
    
    const updatedOptions = editingQuestion.options.map((option, i) => ({
      ...option,
      isCorrect: i === index
    }));
    
    setEditingQuestion({
      ...editingQuestion,
      options: updatedOptions
    });
  };

  const handleQuestionTextChange = (value: string) => {
    if (!editingQuestion) return;
    
    setEditingQuestion({
      ...editingQuestion,
      questionText: value
    });
  };

  const handleQuestionImageChange = (url: string) => {
    if (!editingQuestion) return;
    
    setEditingQuestion({
      ...editingQuestion,
      questionImage: url
    });
  };

  const handleOptionImageChange = (index: number, url: string) => {
    if (!editingQuestion) return;
    
    const updatedOptions = [...editingQuestion.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      optionImage: url
    };
    
    setEditingQuestion({
      ...editingQuestion,
      options: updatedOptions
    });
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate
      if (!editingQuestion.questionText.trim()) {
        throw new Error("Question text is required");
      }
      
      if (!editingQuestion.options.some(option => option.isCorrect)) {
        throw new Error("You must select a correct answer");
      }
      
      if (editingQuestion.options.some(option => !option.optionText.trim())) {
        throw new Error("All options must have text");
      }
      
      // Update question
      const { error: questionError } = await supabase
        .from("questions")
        .update({
          question_text: editingQuestion.questionText,
          image_url: editingQuestion.questionImage || null
        })
        .eq("id", editingQuestion.id);
      
      if (questionError) {
        throw new Error(questionError.message);
      }
      
      // Update options
      for (const option of editingQuestion.options) {
        const { error: optionError } = await supabase
          .from("options")
          .update({
            option_text: option.optionText,
            is_correct: option.isCorrect,
            image_url: option.optionImage || null
          })
          .eq("id", option.id);
        
        if (optionError) {
          throw new Error(optionError.message);
        }
      }
      
      // Refresh questions data
      const { data: refreshedQuestions, error: refreshError } = await supabase
        .from("questions")
        .select("*, options(*)")
        .eq("quiz_id", brainbeeId);
      
      if (refreshError) {
        throw new Error(refreshError.message);
      }
      
      setQuestions(refreshedQuestions || []);
      setEditingQuestion(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Delete the question (this will cascade delete options due to foreign key constraints)
      const { error: deleteError } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);
      
      if (deleteError) {
        throw new Error(deleteError.message);
      }
      
      // Refresh questions data
      const { data: refreshedQuestions, error: refreshError } = await supabase
        .from("questions")
        .select("*, options(*)")
        .eq("quiz_id", brainbeeId);
      
      if (refreshError) {
        throw new Error(refreshError.message);
      }
      
      setQuestions(refreshedQuestions || []);
      setDeleteConfirmation(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 py-8 max-w-2xl mx-auto w-full bg-black text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit BrainBee</h1>
      </div>

      {isFetching || !brainbeeId ? (
        <div className="flex justify-center py-8">
          <p className="text-gray-400">Loading BrainBee data...</p>
        </div>
      ) : (
        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="details">BrainBee Details</TabsTrigger>
            <TabsTrigger value="questions">Questions ({questions.length}/15)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">BrainBee Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter BrainBee name"
                  required
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passcode" className="text-white">BrainBee Passcode</Label>
                <Input
                  id="passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode for BrainBee access"
                  required
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-400">
                  This passcode will be used by participants to access the BrainBee
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-white">Availability Time Range</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="available-from" className="text-white">Available From</Label>
                  <Input
                    id="available-from"
                    type="datetime-local"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    required
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="available-to" className="text-white">Available To</Label>
                  <Input
                    id="available-to"
                    type="datetime-local"
                    value={availableTo}
                    onChange={(e) => setAvailableTo(e.target.value)}
                    required
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                
                <p className="text-xs text-gray-400">
                  The BrainBee will only be accessible to participants during this time range
                </p>
              </div>

              <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <h3 className="font-semibold text-blue-400 mb-2">BrainBee Summary</h3>
                <p className="text-sm text-gray-300 mb-2">
                  Questions: {questions.length}/15
                </p>
                <p className="text-sm text-gray-300">
                  A BrainBee consists of 15 multiple choice questions that participants must complete within 20 minutes.
                </p>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-4 justify-end">
                <Link href={`/brainbee/${brainbeeId}`}>
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
          </TabsContent>
          
          <TabsContent value="questions">
            {editingQuestion ? (
              <div className="space-y-6 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-medium">Edit Question</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="question-text" className="text-white">Question Text</Label>
                  <Input
                    id="question-text"
                    value={editingQuestion.questionText}
                    onChange={(e) => handleQuestionTextChange(e.target.value)}
                    placeholder="Enter your question"
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <ImageUpload 
                    onImageUploaded={handleQuestionImageChange}
                    existingImageUrl={editingQuestion.questionImage}
                    label="Question Image (Optional)"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-white">Options</Label>
                  {editingQuestion.options.map((option, index) => (
                    <div key={option.id} className="flex flex-col gap-3 border border-gray-700 p-3 rounded-md">
                      <div className="flex gap-2 items-center">
                        <Checkbox
                          id={`option-${index}`}
                          checked={option.isCorrect}
                          onCheckedChange={() => handleOptionCorrectChange(index)}
                          className="border-gray-600"
                        />
                        <Input
                          value={option.optionText}
                          onChange={(e) => handleOptionTextChange(index, e.target.value)}
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
                  <p className="text-xs text-gray-400">
                    Select the correct answer
                  </p>
                </div>
                
                {error && (
                  <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                
                <div className="flex gap-3 justify-end">
                  <Button 
                    type="button" 
                    onClick={handleCancelEdit}
                    variant="outline" 
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleSaveQuestion}
                    disabled={isLoading}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    {isLoading ? "Saving..." : "Save Question"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {questions.length === 0 ? (
                  <div className="text-center p-6 border border-gray-700 rounded-lg">
                    <p className="text-gray-400 mb-4">No questions added yet.</p>
                    <Link href={`/brainbee/${brainbeeId}/questions`}>
                      <Button className="bg-blue-600 text-white hover:bg-blue-700">
                        Add Questions
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-medium">BrainBee Questions</h2>
                      {questions.length < 15 && (
                        <Link href={`/brainbee/${brainbeeId}/questions`}>
                          <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                            Add More Questions
                          </Button>
                        </Link>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {questions.map((question, index) => (
                        <div 
                          key={question.id} 
                          className="border border-gray-700 rounded-lg p-4 bg-gray-900/30"
                        >
                          <div className="flex justify-between mb-2">
                            <h3 className="font-medium">{index + 1}. {question.question_text}</h3>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2 border-blue-700 text-blue-400 hover:bg-blue-900/30"
                                onClick={() => handleEditQuestion(question)}
                              >
                                Edit
                              </Button>
                              {deleteConfirmation === question.id ? (
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 px-2 border-gray-700 text-white hover:bg-gray-800"
                                    onClick={() => setDeleteConfirmation(null)}
                                    disabled={isLoading}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 px-2 border-red-700 text-red-400 hover:bg-red-900/30"
                                    onClick={() => handleDeleteQuestion(question.id)}
                                    disabled={isLoading}
                                  >
                                    {isLoading ? "Deleting..." : "Confirm"}
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 px-2 border-red-700 text-red-400 hover:bg-red-900/30"
                                  onClick={() => setDeleteConfirmation(question.id)}
                                  disabled={isLoading || questions.length <= 2}
                                  title={questions.length <= 2 ? "BrainBee must have at least 2 questions" : ""}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {question.image_url && (
                            <div className="mt-2 mb-3 relative h-32 bg-black rounded overflow-hidden">
                              <Image 
                                src={question.image_url} 
                                alt="Question image" 
                                fill
                                style={{objectFit: "contain"}} 
                              />
                            </div>
                          )}
                          
                          <div className="mt-2 space-y-1.5">
                            {question.options?.map((option) => (
                              <div 
                                key={option.id} 
                                className={`flex items-center gap-2 p-2 rounded text-sm ${
                                  option.is_correct 
                                    ? "bg-green-900/30 border border-green-700" 
                                    : "bg-gray-800 border border-gray-700"
                                }`}
                              >
                                {option.image_url && (
                                  <div className="relative w-6 h-6 flex-shrink-0 rounded overflow-hidden">
                                    <Image 
                                      src={option.image_url} 
                                      alt="Option image" 
                                      fill
                                      style={{objectFit: "cover"}} 
                                    />
                                  </div>
                                )}
                                <span className={option.is_correct ? "text-green-400" : "text-gray-300"}>
                                  {option.option_text} {option.is_correct && "✓"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {error && (
                      <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded">
                        {error}
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Link href={`/brainbee/${brainbeeId}`}>
                        <Button className="bg-white text-black hover:bg-gray-200">
                          Done
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 