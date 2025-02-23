export interface BaseQuestion {
  id: string;
  questionType: "mcq" | "short";
  question: string;
  attempts: number;
  maxAttempts: number;
  hasTimeLimit: boolean;
  proofLocation: string;
}

export interface MCQQuestion extends BaseQuestion {
  questionType: "mcq";
  options: string[];
  correctAnswer: string;
}

export interface ShortAnswerQuestion extends BaseQuestion {
  questionType: "short";
  sampleAnswer: string;
  minLength: number;
  maxLength: number;
}

export type Question = MCQQuestion | ShortAnswerQuestion;

export interface Answer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  score?: number;
}
