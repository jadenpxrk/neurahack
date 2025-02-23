import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MCQQuestion, Question } from "@/models/quiz";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  currentIndex: number;
  total: number;
  timeLeft: number;
  question: Question;
  currentAnswer?: Answer;
  onMCQAnswer: (id: string, value: string) => void;
  onShortAnswer: (id: string, value: string) => void;
  onSubmit: () => void;
}

interface Answer {
  answer: string;
  isCorrect?: boolean;
  submitted?: boolean;
}

const TimerCircle: React.FC<{ timeLeft: number; totalTime: number }> = ({
  timeLeft,
  totalTime,
}) => {
  const percentage = (timeLeft / totalTime) * 100;
  const isLowTime = timeLeft <= 5;

  return (
    <div className="flex justify-center mb-6">
      <div
        className={cn(
          "relative w-20 h-20 rounded-full flex items-center justify-center border-4",
          isLowTime ? "border-red-500 bg-red-50" : "border-blue-500 bg-blue-50"
        )}
      >
        <div
          className={cn(
            "text-3xl font-bold",
            isLowTime ? "text-red-500" : "text-blue-500"
          )}
        >
          {timeLeft}
        </div>
        <svg
          className="absolute top-0 left-0 w-full h-full -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            className="text-gray-200"
            strokeWidth="4"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
          />
          <circle
            className={cn(
              "transition-all duration-1000",
              isLowTime ? "text-red-500" : "text-blue-500"
            )}
            strokeWidth="4"
            strokeDasharray="283"
            strokeDashoffset={283 - (283 * percentage) / 100}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
          />
        </svg>
      </div>
    </div>
  );
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  currentIndex,
  total,
  timeLeft,
  question,
  currentAnswer,
  onMCQAnswer,
  onShortAnswer,
  onSubmit,
}) => {
  const handleAnswerChange = (questionId: string, value: string) => {
    if (question.questionType === "mcq") {
      onMCQAnswer(questionId, value);
    } else {
      onShortAnswer(questionId, value);
    }
  };

  const maxAttempts =
    question.maxAttempts ?? (question.questionType === "mcq" ? 2 : 1);
  const attemptsLeft =
    maxAttempts === Infinity
      ? "unlimited"
      : maxAttempts - (question.attempts || 0);
  const isDisabled =
    (typeof attemptsLeft === "number" && attemptsLeft <= 0) ||
    currentAnswer?.isCorrect === true;
  const hasAnswer =
    currentAnswer?.answer && currentAnswer.answer !== "NO_ANSWER";

  const minLength = 50;
  const maxLength = 300;

  const isMCQ = question.questionType === "mcq" && "options" in question;

  return (
    <div className="space-y-4">
      {question.hasTimeLimit && timeLeft > 0 && (
        <TimerCircle
          timeLeft={timeLeft}
          totalTime={question.questionType === "mcq" ? 10 : 30}
        />
      )}
      <Card key={question.id}>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Question {currentIndex + 1} of {total}
          </CardTitle>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl mt-4">{question.question}</CardTitle>
          </div>
          <CardDescription>
            {attemptsLeft === "unlimited"
              ? "Unlimited attempts"
              : `${attemptsLeft} ${
                  attemptsLeft === 1 ? "attempt" : "attempts"
                } remaining`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isMCQ ? (
            <>
              <RadioGroup
                disabled={isDisabled}
                value={currentAnswer?.answer || ""}
                onValueChange={(value: string) =>
                  handleAnswerChange(question.id, value)
                }
                className="space-y-2"
              >
                {(question as MCQQuestion).options.map((option) => (
                  <div key={option} className="flex items-center space-x-2 p-2">
                    <RadioGroupItem
                      value={option}
                      id={`${question.id}-${option}`}
                    />
                    <Label
                      className="cursor-pointer flex-grow"
                      htmlFor={`${question.id}-${option}`}
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {currentAnswer?.answer &&
                !currentAnswer.isCorrect &&
                !currentAnswer.submitted && (
                  <Button className="w-full mt-4" onClick={onSubmit}>
                    Submit Answer
                  </Button>
                )}
            </>
          ) : (
            <div>
              <Textarea
                disabled={isDisabled}
                placeholder="Type your answer here..."
                value={currentAnswer?.answer || ""}
                onChange={(e) =>
                  handleAnswerChange(question.id, e.target.value)
                }
                minLength={minLength}
                maxLength={maxLength}
                className="min-h-[150px]"
              />
              <div className="mt-2 text-sm space-y-1">
                <div className="text-slate-600">
                  {`${minLength}-${maxLength} characters required`}
                </div>
                <div
                  className={cn(
                    currentAnswer?.answer &&
                      (currentAnswer.answer.length < minLength ||
                        currentAnswer.answer.length > maxLength)
                      ? "text-red-600"
                      : "text-slate-600"
                  )}
                >
                  {`Current length: ${
                    currentAnswer?.answer?.length || 0
                  } characters`}
                </div>
              </div>
              <Button
                className="w-full mt-4"
                onClick={onSubmit}
                disabled={
                  isDisabled ||
                  !currentAnswer?.answer ||
                  currentAnswer.answer.length < minLength ||
                  currentAnswer.answer.length > maxLength
                }
              >
                Submit Answer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {hasAnswer &&
        question.questionType === "mcq" &&
        currentAnswer?.isCorrect === false &&
        currentAnswer?.submitted && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTitle>Incorrect</AlertTitle>
            <AlertDescription>
              That&apos;s not quite right. You have{" "}
              {attemptsLeft === "unlimited" ? "unlimited" : attemptsLeft}{" "}
              {attemptsLeft === 1 ? "attempt" : "attempts"} remaining.
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
};
