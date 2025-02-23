import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Answer, Question } from "@/models/quiz";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

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
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await fetch(`/api/proof?question_id=${question.id}`, {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch video");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
      } catch (err) {
        setError("Failed to load proof video");
        console.error("Error fetching video:", err);
      }
    };

    fetchVideo();

    // Cleanup function to revoke the URL when component unmounts
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [question.id]);

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

        <div className="space-y-4">
          <h3 className="font-semibold">Video Proof</h3>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : videoUrl ? (
            <video
              controls
              className="w-full rounded-lg"
              controlsList="nodownload"
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="h-48 bg-slate-100 rounded-lg flex items-center justify-center">
              <p className="text-slate-500">Loading video...</p>
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
