import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Answer, Question } from "@/models/quiz";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import React from "react";

interface ProofCardProps {
  question: Question;
  answer?: Answer;
  currentIndex: number;
  isLast: boolean;
  onNext: () => void;
}

export const ProofCard: React.FC<ProofCardProps> = ({
  question,
  answer,
  currentIndex,
  isLast,
  onNext,
}) => {
  const isCorrect =
    question.questionType === "mcq"
      ? answer?.isCorrect
      : answer?.score && answer.score > 80;

  const answerAlertClass = isCorrect
    ? "bg-green-50 border-green-200"
    : "bg-red-50 border-red-200 text-red-800";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Answer Proof</CardTitle>
        <CardDescription>
          Here&apos;s how we validated your answer for question{" "}
          {currentIndex + 1}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className={answerAlertClass}>
          <AlertTitle>
            {answer?.answer === "NO_ANSWER"
              ? "No Answer Selected"
              : isCorrect
              ? "Correct Answer!"
              : "Incorrect Answer"}
          </AlertTitle>
          <AlertDescription>{answer?.answer}</AlertDescription>
        </Alert>

        {question.questionType === "mcq" && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTitle>Expected Answer</AlertTitle>
            <AlertDescription>{question.correctAnswer}</AlertDescription>
          </Alert>
        )}

        {question.questionType === "short" && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTitle>Sample Answer</AlertTitle>
            <AlertDescription>{question.sampleAnswer}</AlertDescription>
          </Alert>
        )}

        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Proof Location</h3>
          <p className="text-sm text-slate-600">{question.proofLocation}</p>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onNext} size="lg">
            {isLast ? "Go to Dashboard" : "Next Question"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
