"use client";

// Dashboard showing quiz results and progress
// each day has a quiz
// should show the quiz results for each day
// should show the progress over time
// specifically, each day should have
// - mcq score --> after all attempts
// - mcq score --> only first attempts for each question
// - short answer score --> there is only one attempt per question
// - how long it took to get correct answer for mcq
// - how long it took to submit an answer for short answer
// - how many attempts it took to get correct answer for mcq
// what does this say about the patient
// - insights

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart } from "recharts";
import { useEffect, useState } from "react";

interface QuizResult {
  timestamp: string;
  mcqScore: number;
  shortAnswerScore: number;
  avgTimeTaken: number;
  avgAttempts: number;
}

const chartConfig = {
  mcqScore: {
    label: "Multiple Choice",
    color: "hsl(220 70% 50%)",
  },
  shortAnswerScore: {
    label: "Short Answer",
    color: "hsl(160 60% 45%)",
  },
};

export default function Dashboard() {
  const [quizData, setQuizData] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch("/api/results");
        if (!response.ok) throw new Error("Failed to fetch results");
        const data = await response.json();
        setQuizData(
          data.sort(
            (a: QuizResult, b: QuizResult) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load quiz results"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (quizData.length === 0) return <div>No quiz data available</div>;

  const latestQuiz = quizData[quizData.length - 1];
  const averageScore = Math.round(
    quizData.reduce(
      (acc, curr) => acc + curr.mcqScore + curr.shortAnswerScore,
      0
    ) /
      (quizData.length * 2)
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Your Learning Progress</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Latest Quiz Performance</CardTitle>
            <CardDescription>
              Your most recent quiz score: {latestQuiz.mcqScore}% MCQ,{" "}
              {latestQuiz.shortAnswerScore}% Short Answer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Average time taken: {latestQuiz.avgTimeTaken} seconds</p>
            <p>Average attempts per question: {latestQuiz.avgAttempts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>Average Score: {averageScore}%</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Score Progression</CardTitle>
          <CardDescription>Track your improvement over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
            <LineChart data={quizData}>
              <Line
                dataKey="mcqScore"
                fill="var(--color-mcqScore)"
                stroke="var(--color-mcqScore)"
                strokeWidth={2}
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: "white",
                }}
              />
              <Line
                dataKey="shortAnswerScore"
                fill="var(--color-shortAnswerScore)"
                stroke="var(--color-shortAnswerScore)"
                strokeWidth={2}
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: "white",
                }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Learning Insights</CardTitle>
          <CardDescription>Based on your performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--color-mcqScore)" }}
              ></span>
              <span>
                MCQ Score Change: {latestQuiz.mcqScore - quizData[0].mcqScore}%
                since start
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--color-shortAnswerScore)" }}
              ></span>
              <span>
                Short Answer Score Change:{" "}
                {latestQuiz.shortAnswerScore - quizData[0].shortAnswerScore}%
                since start
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-600"></span>
              <span>
                Average completion time:{" "}
                {Math.round(
                  quizData.reduce((acc, curr) => acc + curr.avgTimeTaken, 0) /
                    quizData.length
                )}{" "}
                seconds
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
