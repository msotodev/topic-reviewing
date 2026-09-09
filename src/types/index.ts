export interface PDFDocument {
  id: number;
  title: string;
  filename: string;
  file_data: ArrayBuffer;
  page_count: number;
  created_at: string;
}

export interface Lesson {
  id: number;
  pdf_id: number;
  title: string;
  page_start: number;
  page_end: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface Quiz {
  id: number;
  lesson_id: number;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  lesson_id: number;
  score: number;
  total_questions: number;
  answers: number[];
  completed_at: string;
}

export interface LessonProgress {
  lesson_id: number;
  lesson_title: string;
  is_completed: boolean;
  quiz_score: number | null;
}
