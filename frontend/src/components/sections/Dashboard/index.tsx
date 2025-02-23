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

// This would come from your backend/database
const mockQuizData = [
  {
    quizNumber: 1,
    mcqScore: 85,
    shortAnswerScore: 70,
    timestamp: "2024-03-01",
  },
  {
    quizNumber: 2,
    mcqScore: 90,
    shortAnswerScore: 75,
    timestamp: "2024-03-08",
  },
  {
    quizNumber: 3,
    mcqScore: 95,
    shortAnswerScore: 85,
    timestamp: "2024-03-15",
  },
  {
    quizNumber: 4,
    mcqScore: 100,
    shortAnswerScore: 90,
    timestamp: "2024-03-22",
  },
];

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
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Your Learning Progress</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Latest Quiz Performance</CardTitle>
            <CardDescription>
              Your most recent quiz score:{" "}
              {mockQuizData[mockQuizData.length - 1].mcqScore}% MCQ,{" "}
              {mockQuizData[mockQuizData.length - 1].shortAnswerScore}% Short
              Answer
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>
              Average Score:{" "}
              {Math.round(
                mockQuizData.reduce(
                  (acc, curr) => acc + curr.mcqScore + curr.shortAnswerScore,
                  0
                ) /
                  (mockQuizData.length * 2)
              )}
              %
            </CardDescription>
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
            <LineChart data={mockQuizData}>
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
                Your MCQ performance has improved by{" "}
                {mockQuizData[mockQuizData.length - 1].mcqScore -
                  mockQuizData[0].mcqScore}
                % since you started
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full bg-green-500"
                style={{ backgroundColor: "var(--color-shortAnswerScore)" }}
              ></span>
              <span>Short answer responses show consistent improvement</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-600"></span>
              <span>You&apos;re performing better than 75% of your peers</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
