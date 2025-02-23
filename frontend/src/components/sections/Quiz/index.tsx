import type { Answer, Question } from "@/models/quiz";
import React, { useCallback, useEffect, useState } from "react";

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
  testDate: Date;
}

const DEFAULT_SETTINGS: QuizSettings = {
  enableTimer: false,
  mcqTimeLimit: 10,
  shortAnswerTimeLimit: 30,
  unlimitedMCQAttempts: true,
  testDate: new Date(),
};

export default function Quiz() {
  const router = useRouter();
  const { endQuiz } = useQuiz();
  const [quizState, setQuizState] = useState<QuizState>("settings");
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = React.useRef<number | null>(null);
  const lastTickRef = React.useRef<number>(0);
  const answersRef = React.useRef(answers);
  const shouldResetTimer = React.useRef<boolean>(true);

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
      cancelAnimationFrame(timerRef.current);
    }

    // Check if it's an MCQ and update attempts and correctness
    if (currentQuestion?.questionType === "mcq" && currentAnswer?.answer) {
      const isCorrect = currentAnswer.answer === currentQuestion.correctAnswer;
      const maxAttempts = settings.unlimitedMCQAttempts ? Infinity : 2;

      // Update answer with correctness and submission state
      setAnswers((prev) =>
        prev.map((a) =>
          a.questionId === currentQuestion.id
            ? { ...a, isCorrect, submitted: true }
            : a
        )
      );

      // Update question attempts
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id === currentQuestion.id) {
            const newAttempts = (q.attempts || 0) + 1;
            // Move to proof if correct or if max attempts reached (for non-unlimited)
            if (
              isCorrect ||
              (!settings.unlimitedMCQAttempts && newAttempts >= maxAttempts)
            ) {
              setTimeout(() => setQuizState("proof"), 500);
            }
            return { ...q, attempts: newAttempts };
          }
          return q;
        })
      );
    } else {
      setQuizState("proof");
    }
  }, [currentQuestion, currentAnswer, settings.unlimitedMCQAttempts]);

  const handleMCQAnswer = useCallback(
    (questionId: string, answer: string) => {
      const question = questions.find((q) => q.id === questionId);
      if (question?.questionType !== "mcq") return;

      setAnswers((prev) => {
        const existing = prev.find((a) => a.questionId === questionId);
        if (existing) {
          return prev.map((a) =>
            a.questionId === questionId
              ? { ...a, answer, submitted: false, isCorrect: undefined }
              : a
          );
        }
        return [...prev, { questionId, answer, submitted: false }];
      });
    },
    [questions]
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

  // Memoize the timer callback
  const timerCallback = useCallback(() => {
    if (!currentQuestion?.id) return;

    const existingAnswer = answersRef.current.find(
      (a) => a.questionId === currentQuestion.id
    );
    if (!existingAnswer || !existingAnswer.answer) {
      if (currentQuestion.questionType === "mcq") {
        handleMCQAnswer(currentQuestion.id, "NO_ANSWER");
      } else {
        handleShortAnswer(currentQuestion.id, "NO_ANSWER");
      }
    }
    handleSubmit();
  }, [currentQuestion, handleMCQAnswer, handleShortAnswer, handleSubmit]);

  // Setup timer when moving to a new question
  useEffect(() => {
    if (
      settings.enableTimer &&
      quizState === "question" &&
      shouldResetTimer.current
    ) {
      shouldResetTimer.current = false;
      const initialTime =
        currentQuestion?.questionType === "mcq"
          ? settings.mcqTimeLimit
          : settings.shortAnswerTimeLimit;

      setTimeLeft(initialTime);
      lastTickRef.current = Date.now();
    }
  }, [
    currentQuestionIndex,
    quizState,
    settings.enableTimer,
    settings.mcqTimeLimit,
    settings.shortAnswerTimeLimit,
    currentQuestion?.questionType,
  ]);

  // Handle timer countdown using requestAnimationFrame
  useEffect(() => {
    let frameId: number;

    const tick = () => {
      const now = Date.now();
      const delta = now - lastTickRef.current;

      if (delta >= 1000) {
        lastTickRef.current = now;
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            timerCallback();
            return 0;
          }
          return prevTime - 1;
        });
      }

      if (timeLeft > 0) {
        frameId = requestAnimationFrame(tick);
        timerRef.current = frameId;
      }
    };

    if (settings.enableTimer && quizState === "question" && timeLeft > 0) {
      frameId = requestAnimationFrame(tick);
      timerRef.current = frameId;

      return () => {
        if (frameId) {
          cancelAnimationFrame(frameId);
        }
      };
    }
  }, [settings.enableTimer, quizState, timeLeft, timerCallback]);

  const handleNext = () => {
    if (isLastQuestion) {
      endQuiz();
      router.push("/dashboard");
    } else {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
      shouldResetTimer.current = true;
      setCurrentQuestionIndex((prev) => prev + 1);
      setQuizState("question");
    }
  };

  const handleStartQuiz = (newSettings: QuizSettings) => {
    setSettings(newSettings);
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }
    shouldResetTimer.current = true;
    // Update questions with new settings
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        hasTimeLimit: newSettings.enableTimer,
        maxAttempts:
          q.questionType === "mcq"
            ? newSettings.unlimitedMCQAttempts
              ? Infinity
              : 2
            : 1,
      }))
    );
    setQuizState("question");
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("http://localhost:9000/questions");
        if (!response.ok) throw new Error("Failed to fetch questions");
        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error("Failed to fetch questions:", error);
      }
    };
    fetchQuestions();
  }, []);

  return (
    <div className="container mx-auto max-w-3xl p-6">
      {quizState === "settings" && (
        <SettingsCard settings={settings} onStartQuiz={handleStartQuiz} />
      )}
      {quizState === "question" && currentQuestion && (
        <QuestionCard
          currentIndex={currentQuestionIndex}
          total={questions.length}
          timeLeft={timeLeft}
          question={currentQuestion}
          currentAnswer={currentAnswer}
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
