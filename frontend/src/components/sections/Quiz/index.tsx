// refactored version of the quiz page
// Quiz page, 3-5 questions about the user's data stored in vector DB
// Videos, and then we ask the user to answer the questions
// A couple multiple choice questions and a short answer question that we
// grade the accuracy of the answer using GPT-4o

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Question, VectorReference } from "@/models/quiz";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import React, { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuiz } from "@/contexts/QuizContext";
import { useRouter } from "next/navigation";

// This would come from your API
const INITIAL_QUESTIONS: Question[] = [
  {
    id: "1",
    type: "mcq",
    question: "Sample Multiple Choice Question 1?",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: "Option A",
    attempts: 0,
    maxAttempts: Infinity,
    hasTimeLimit: false,
    proof: {
      vectorReferences: [
        {
          vectorId: "vec_123",
          timestamp: "00:45",
          sourceType: "video",
          relevanceScore: 0.95,
        },
      ],
      explanation:
        "This answer can be found in the video at timestamp 00:45 where the speaker explicitly states Option A is correct.",
      sourceText: "...and that's why Option A is the correct approach...",
      confidence: 0.98,
    },
  },
  {
    id: "2",
    type: "mcq",
    question: "Sample Multiple Choice Question 2?",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: "Option B",
    attempts: 0,
    maxAttempts: 2,
    hasTimeLimit: true,
    proof: {
      vectorReferences: [
        {
          vectorId: "vec_124",
          timestamp: "01:30",
          sourceType: "video",
          relevanceScore: 0.92,
        },
      ],
      explanation:
        "The speaker demonstrates this concept at 1:30 in the video.",
      sourceText: "Let me show you why Option B is the best choice...",
      confidence: 0.95,
    },
  },
  {
    id: "3",
    type: "short",
    question: "Sample Short Answer Question 1?",
    attempts: 0,
    maxAttempts: 1,
    hasTimeLimit: true,
    sampleAnswer: "A comprehensive answer that covers key points...",
    keyPoints: ["Point 1", "Point 2", "Point 3"],
    minLength: 50,
    maxLength: 500,
    proof: {
      vectorReferences: [
        {
          vectorId: "vec_125",
          timestamp: "02:15",
          sourceType: "video",
          relevanceScore: 0.88,
        },
      ],
      explanation:
        "The answer should incorporate concepts from the 2:15 mark of the video.",
      sourceText: "The key aspects to consider are...",
      confidence: 0.9,
    },
  },
];

interface Answer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  score?: number;
}

type QuizState = "question" | "proof";

export default function Quiz() {
  const router = useRouter();
  const { endQuiz } = useQuiz();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [quizState, setQuizState] = useState<QuizState>("question");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const answersRef = React.useRef(answers);

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
              if (!isCorrect && newAttempts >= q.maxAttempts) {
                setTimeout(() => handleSubmit(), 500);
              }
              return { ...q, attempts: newAttempts };
            }
            return q;
          })
        );
      }
    },
    [questions, handleSubmit]
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
    if (currentQuestion.hasTimeLimit && quizState === "question") {
      const initialTime = currentQuestion.type === "mcq" ? 10 : 30;
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
  }, [currentQuestionIndex, quizState]);

  const handleNext = () => {
    if (isLastQuestion) {
      endQuiz();
      router.push("/dashboard");
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setQuizState("question");
    }
  };

  const renderSourceReference = (ref: VectorReference) => {
    return (
      <div key={ref.vectorId} className="bg-slate-100 p-3 rounded-md mb-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            Source:{" "}
            {ref.sourceType.charAt(0).toUpperCase() + ref.sourceType.slice(1)}
          </span>
          {ref.timestamp && (
            <span className="text-sm text-slate-600">
              Timestamp: {ref.timestamp}
            </span>
          )}
        </div>
        <div className="text-sm text-slate-600 mt-1">
          Relevance Score: {(ref.relevanceScore * 100).toFixed(1)}%
        </div>
      </div>
    );
  };

  const renderQuestion = (question: Question) => {
    const answer = answers.find((a) => a.questionId === question.id);
    const attemptsLeft = question.maxAttempts - question.attempts;
    const isDisabled = attemptsLeft <= 0 || answer?.isCorrect === true;
    const hasAnswer = answer?.answer && answer.answer !== "NO_ANSWER";

    return (
      <div className="space-y-4">
        <Card key={question.id}>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl mt-4">
                {question.question}
              </CardTitle>
              {question.hasTimeLimit && (
                <div className="text-lg font-semibold">
                  Time left: {timeLeft}s
                </div>
              )}
            </div>
            <CardDescription>
              {question.maxAttempts === Infinity
                ? "Unlimited attempts"
                : `${attemptsLeft} ${
                    attemptsLeft === 1 ? "attempt" : "attempts"
                  } remaining`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {question.type === "mcq" ? (
              <>
                <RadioGroup
                  disabled={isDisabled}
                  value={answer?.answer}
                  onValueChange={(value: string) =>
                    handleMCQAnswer(question.id, value)
                  }
                >
                  {question.options?.map((option: string) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option}
                        id={`${question.id}-${option}`}
                      />
                      <Label htmlFor={`${question.id}-${option}`}>
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {answer?.isCorrect && (
                  <Button className="w-full" onClick={handleSubmit}>
                    Submit Answer
                  </Button>
                )}
              </>
            ) : (
              <div>
                <Textarea
                  disabled={isDisabled}
                  placeholder="Type your answer here..."
                  value={answer?.answer || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleShortAnswer(question.id, e.target.value)
                  }
                />
                <div className="mt-2 text-sm text-slate-600">
                  {`Required length: ${question.minLength}-${question.maxLength} characters`}
                </div>
                <Button className="w-full mt-4" onClick={handleSubmit}>
                  Submit Answer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {hasAnswer && question.type === "mcq" && (
          <Alert
            className={
              answer?.isCorrect
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }
          >
            <AlertTitle>
              {answer?.isCorrect ? "Correct!" : "Incorrect"}
            </AlertTitle>
            <AlertDescription>
              {answer?.isCorrect
                ? "Great job! That's the right answer."
                : `That's not quite right. You have ${attemptsLeft} ${
                    attemptsLeft === 1 ? "attempt" : "attempts"
                  } remaining.`}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderProof = () => {
    const isCorrect =
      currentQuestion.type === "mcq"
        ? currentAnswer?.isCorrect
        : currentAnswer?.score && currentAnswer.score > 0.8; // 80% threshold for short answers

    const answerAlertClass = isCorrect
      ? "bg-green-50 border-green-200"
      : "bg-red-50 border-red-200 text-red-800";

    return (
      <Card>
        <CardHeader>
          <CardTitle>Answer Proof</CardTitle>
          <CardDescription>
            Here&apos;s how we validated your answer for question{" "}
            {currentQuestionIndex + 1}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className={answerAlertClass}>
            <AlertTitle>
              {isCorrect
                ? "Correct Answer!"
                : currentAnswer?.answer === "NO_ANSWER"
                ? "No Answer Selected"
                : "Incorrect Answer"}
            </AlertTitle>
            <AlertDescription>
              {currentAnswer?.answer === "NO_ANSWER"
                ? "You did not select an answer before time ran out."
                : currentAnswer?.answer}
            </AlertDescription>
          </Alert>

          {currentQuestion.type === "mcq" && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertTitle>Expected Answer</AlertTitle>
              <AlertDescription>
                {currentQuestion.correctAnswer}
              </AlertDescription>
            </Alert>
          )}

          {currentQuestion.type === "short" && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertTitle>Sample Answer</AlertTitle>
              <AlertDescription>
                {currentQuestion.sampleAnswer}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">Source References</h3>
            {currentQuestion.proof.vectorReferences.map(renderSourceReference)}

            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Explanation</h3>
              <p className="text-sm text-slate-600">
                {currentQuestion.proof.explanation}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Source Text</h3>
              <p className="text-sm text-slate-600">
                {currentQuestion.proof.sourceText}
              </p>
            </div>

            {currentQuestion.type === "short" && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Key Points Coverage</h3>
                <ul className="list-disc list-inside text-sm text-slate-600">
                  {currentQuestion.keyPoints.map(
                    (point: string, index: number) => (
                      <li key={index}>{point}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleNext} size="lg">
              {isLastQuestion ? "Go to Dashboard" : "Next Question"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto max-w-3xl p-6">
      {quizState === "question" && <>{renderQuestion(currentQuestion)}</>}
      {quizState === "proof" && renderProof()}
    </div>
  );
}
