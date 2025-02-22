"use client";

import React, { createContext, useContext, useState } from "react";

interface QuizContextType {
  isQuizInProgress: boolean;
  startQuiz: () => void;
  endQuiz: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [isQuizInProgress, setIsQuizInProgress] = useState(false);

  const startQuiz = () => setIsQuizInProgress(true);
  const endQuiz = () => setIsQuizInProgress(false);

  return (
    <QuizContext.Provider value={{ isQuizInProgress, startQuiz, endQuiz }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
}
