export interface Quiz {
  id: string;
  name: string;
  passcode: string;
  quiz_type: 'standard' | 'brainbee';
  created_at: string;
  updated_at: string;
  available_from?: string;
  available_to?: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  time_limit: number;
  created_at: string;
  updated_at: string;
  image_url?: string;
  options?: Option[];
}

export interface Option {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  created_at: string;
  updated_at: string;
  image_url?: string;
}

export interface UserResponse {
  id: string;
  user_id?: string;
  question_id: string;
  selected_option_id?: string;
  is_correct: boolean;
  response_time?: number;
  created_at: string;
}

export interface UserQuizScore {
  id: string;
  user_id?: string;
  quiz_id: string;
  score: number;
  completed_at: string;
} 