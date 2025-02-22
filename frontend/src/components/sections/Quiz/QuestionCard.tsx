import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Answer, Question } from "@/models/quiz";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: Question;
  answer?: Answer;
  currentIndex: number;
  total: number;
  timeLeft: number;
  onMCQAnswer: (id: string, value: string) => void;
  onShortAnswer: (id: string, value: string) => void;
  onSubmit: () => void;
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
  question,
  answer,
  currentIndex,
  total,
  timeLeft,
  onMCQAnswer,
  onShortAnswer,
  onSubmit,
}) => {
  const attemptsLeft = question.maxAttempts - question.attempts;
  const isDisabled = attemptsLeft <= 0 || answer?.isCorrect === true;
  const hasAnswer = answer?.answer && answer.answer !== "NO_ANSWER";

  return (
    <div className="space-y-4">
      {question.hasTimeLimit && (
        <TimerCircle
          timeLeft={timeLeft}
          totalTime={question.type === "mcq" ? 10 : 30}
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
                  onMCQAnswer(question.id, value)
                }
              >
                {question.options?.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option}
                      id={`${question.id}-${option}`}
                    />
                    <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
              {answer?.isCorrect && (
                <Button className="w-full" onClick={onSubmit}>
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
                onChange={(e) => onShortAnswer(question.id, e.target.value)}
              />
              <div className="mt-2 text-sm space-y-1">
                <div className="text-slate-600">
                  {`${question.minLength}-${question.maxLength} characters required`}
                </div>
                <div
                  className={cn(
                    answer?.answer &&
                      (answer.answer.length < question.minLength ||
                        answer.answer.length > question.maxLength)
                      ? "text-red-600"
                      : "text-slate-600"
                  )}
                >
                  {`Current length: ${answer?.answer?.length || 0} characters`}
                </div>
              </div>
              <Button
                className="w-full mt-4"
                onClick={onSubmit}
                disabled={
                  isDisabled ||
                  !answer?.answer ||
                  answer.answer.length < question.minLength ||
                  answer.answer.length > question.maxLength
                }
              >
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
