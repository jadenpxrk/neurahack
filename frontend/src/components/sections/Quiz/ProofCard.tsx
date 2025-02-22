import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Answer, Question, VectorReference } from "@/models/quiz";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import React from "react";
import { format } from "date-fns";

interface ProofCardProps {
  question: Question;
  answer?: Answer;
  currentIndex: number;
  isLast: boolean;
  onNext: () => void;
}

const renderSourceReference = (ref: VectorReference, recordedDate: Date) => (
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
    <div className="text-sm text-slate-600 mt-1">
      Recorded: {format(recordedDate, "PPP")}
    </div>
  </div>
);

export const ProofCard: React.FC<ProofCardProps> = ({
  question,
  answer,
  currentIndex,
  isLast,
  onNext,
}) => {
  const isCorrect =
    question.type === "mcq"
      ? answer?.isCorrect
      : answer?.score && answer.score > 0.8; // 80% threshold for short answers

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

        {question.type === "mcq" && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTitle>Expected Answer</AlertTitle>
            <AlertDescription>{question.correctAnswer}</AlertDescription>
          </Alert>
        )}

        {question.type === "short" && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTitle>Sample Answer</AlertTitle>
            <AlertDescription>{question.sampleAnswer}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold">Source References</h3>
          {question.proof.vectorReferences.map((ref) =>
            renderSourceReference(ref, question.proof.recordedDate)
          )}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Explanation</h3>
            <p className="text-sm text-slate-600">
              {question.proof.explanation}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Source Text</h3>
            <p className="text-sm text-slate-600">
              {question.proof.sourceText}
            </p>
          </div>
          {question.type === "short" && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Key Points Coverage</h3>
              <ul className="list-disc list-inside text-sm text-slate-600">
                {question.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}
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
