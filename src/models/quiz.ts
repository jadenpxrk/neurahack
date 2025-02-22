export interface VectorReference {
  vectorId: string; // ID in Pinecone
  timestamp: string;
  sourceType: "video" | "audio" | "text";
  relevanceScore: number;
}

export interface QuestionProof {
  vectorReferences: VectorReference[];
  explanation: string;
  sourceText: string; // The actual text from the source that proves the answer
  confidence: number; // How confident the system is about this proof (0-1)
  recordedDate: Date; // The date when this content was recorded
}

export interface BaseQuestion {
  id: string;
  type: "mcq" | "short";
  question: string;
  attempts: number;
  maxAttempts: number;
  hasTimeLimit: boolean;
  proof: QuestionProof;
}

export interface MCQQuestion extends BaseQuestion {
  type: "mcq";
  options: string[];
  correctAnswer: string;
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: "short";
  sampleAnswer: string; // A model answer to compare against
  keyPoints: string[]; // Key points that should be mentioned
  minLength: number; // Minimum required length
  maxLength: number; // Maximum allowed length
}

export type Question = MCQQuestion | ShortAnswerQuestion;

export interface QuizAttempt {
  id: string;
  userId: string;
  questionId: string;
  answer: string;
  timestamp: string;
  isCorrect: boolean;
  score: number; // For short answers, this is a similarity score (0-1)
  feedback: string;
}

export interface Answer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  score?: number;
}
