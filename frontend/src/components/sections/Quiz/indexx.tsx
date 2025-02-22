import type { Answer, Question } from "@/models/quiz";
import React, { useCallback, useEffect, useState } from "react";

import { INITIAL_QUESTIONS } from "@/data/questions";
import { ProofCard } from "./ProofCard";
import { QuestionCard } from "./QuestionCard";
import { SettingsCard } from "./SettingsCard";
import { useQuiz } from "@/contexts/QuizContext";
import { useRouter } from "next/navigation";

type QuizState = "settings" | "question" | "proof";

interface QuizSettings {
  enableTimer: boolean;
  mcqTimeLimit: number;
  shortAnswerTimeLimit: number;
  unlimitedMCQAttempts: boolean;
}

const DEFAULT_SETTINGS: QuizSettings = {
  enableTimer: false,
  mcqTimeLimit: 10,
  shortAnswerTimeLimit: 30,
  unlimitedMCQAttempts: true,
};

export default function Quiz() {
  const router = useRouter();
  const { endQuiz } = useQuiz();
  const [quizState, setQuizState] = useState<QuizState>("settings");
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const answersRef = React.useRef(answers);
  const hasInitializedTimer = React.useRef<boolean>(false);

  // Keep answersRef in sync
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(
    (a) => a.questionId === currentQuestion?.id
  );
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleSubmit = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setQuizState("proof");
  }, []);

  const handleMCQAnswer = useCallback(
    (questionId: string, answer: string) => {
      const question = questions.find((q) => q.id === questionId);
      if (question?.type !== "mcq") return;
      const isCorrect = answer === question.correctAnswer;

      setAnswers((prev) => {
        const existing = prev.find((a) => a.questionId === questionId);
        if (existing) {
          return prev.map((a) =>
            a.questionId === questionId ? { ...a, answer, isCorrect } : a
          );
        }
        return [...prev, { questionId, answer, isCorrect }];
      });

      if (answer !== "NO_ANSWER") {
        setQuestions((prev) =>
          prev.map((q) => {
            if (q.id === questionId) {
              const newAttempts = q.attempts + 1;
              if (
                !isCorrect &&
                newAttempts >= (settings.unlimitedMCQAttempts ? Infinity : 2)
              ) {
                setTimeout(() => handleSubmit(), 500);
              }
              return { ...q, attempts: newAttempts };
            }
            return q;
          })
        );
      }
    },
    [questions, handleSubmit, settings.unlimitedMCQAttempts]
  );

  const handleShortAnswer = useCallback(
    (questionId: string, answer: string) => {
      setAnswers((prev) => {
        const existing = prev.find((a) => a.questionId === questionId);
        if (existing) {
          return prev.map((a) =>
            a.questionId === questionId ? { ...a, answer } : a
          );
        }
        return [...prev, { questionId, answer }];
      });
    },
    []
  );

  // Initialize timer when question changes
  useEffect(() => {
    if (
      settings.enableTimer &&
      quizState === "question" &&
      !hasInitializedTimer.current
    ) {
      hasInitializedTimer.current = true;
      const initialTime =
        currentQuestion.type === "mcq"
          ? settings.mcqTimeLimit
          : settings.shortAnswerTimeLimit;
      setTimeLeft(initialTime);

      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Start new timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            const existingAnswer = answersRef.current.find(
              (a) => a.questionId === currentQuestion.id
            );
            if (!existingAnswer || !existingAnswer.answer) {
              if (currentQuestion.type === "mcq") {
                handleMCQAnswer(currentQuestion.id, "NO_ANSWER");
              } else {
                handleShortAnswer(currentQuestion.id, "NO_ANSWER");
              }
            }
            handleSubmit();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [
    currentQuestionIndex,
    quizState,
    currentQuestion,
    handleMCQAnswer,
    handleShortAnswer,
    handleSubmit,
    settings,
  ]);

  const handleNext = () => {
    if (isLastQuestion) {
      endQuiz();
      router.push("/dashboard");
    } else {
      hasInitializedTimer.current = false;
      setCurrentQuestionIndex((prev) => prev + 1);
      setQuizState("question");
    }
  };

  const handleStartQuiz = (newSettings: QuizSettings) => {
    setSettings(newSettings);
    // Update questions with new settings
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        hasTimeLimit: newSettings.enableTimer,
        maxAttempts:
          q.type === "mcq"
            ? newSettings.unlimitedMCQAttempts
              ? Infinity
              : 2
            : 1,
      }))
    );
    setQuizState("question");
  };

  return (
    <div className="container mx-auto max-w-3xl p-6">
      {quizState === "settings" && (
        <SettingsCard settings={settings} onStartQuiz={handleStartQuiz} />
      )}
      {quizState === "question" && (
        <QuestionCard
          question={currentQuestion}
          answer={currentAnswer}
          currentIndex={currentQuestionIndex}
          total={questions.length}
          timeLeft={timeLeft}
          onMCQAnswer={handleMCQAnswer}
          onShortAnswer={handleShortAnswer}
          onSubmit={handleSubmit}
        />
      )}
      {quizState === "proof" && (
        <ProofCard
          question={currentQuestion}
          answer={currentAnswer}
          currentIndex={currentQuestionIndex}
          isLast={isLastQuestion}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
