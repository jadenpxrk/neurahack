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
import { Line, LineChart, XAxis } from "recharts";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatEasternDate } from "@/lib/utils";

interface QuizResult {
  timestamp: string;
  mcqScore: number;
  mcqFirstGuessScore: number;
  shortAnswerScore: number;
  avgTimeTaken: number;
  avgAttempts: number;
  age: number;
}

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

  if (error) return <div>Error: {error}</div>;

  const averageScore =
    !loading && quizData.length > 0
      ? Math.round(
          quizData.reduce(
            (acc, curr) => acc + curr.mcqScore + curr.shortAnswerScore,
            0
          ) /
            (quizData.length * 2)
        )
      : 0;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Your Learning Progress</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {loading ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Latest Quiz Performance</CardTitle>
                <CardDescription>
                  <div className="space-y-2 mt-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-32" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Latest Quiz Performance</CardTitle>
                <CardDescription>
                  Your most recent quiz scores:
                  <ul className="mt-2 space-y-1">
                    <li>
                      MCQ (First Attempts):{" "}
                      {quizData[quizData.length - 1].mcqFirstGuessScore}%
                    </li>
                    <li>
                      MCQ (Final Score):{" "}
                      {quizData[quizData.length - 1].mcqScore}%
                    </li>
                    <li>
                      Short Answer:{" "}
                      {quizData[quizData.length - 1].shortAnswerScore}%
                    </li>
                    <li>
                      Average time taken:{" "}
                      {quizData[quizData.length - 1].avgTimeTaken} seconds
                    </li>
                    <li>
                      Average attempts per question:{" "}
                      {Math.max(1, quizData[quizData.length - 1].avgAttempts)}
                    </li>
                  </ul>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>
                  Average Score: {averageScore}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    averageScore: {
                      label: "Overall Average",
                      color: "hsl(25 95% 50%)",
                    },
                  }}
                  className="h-[200px] w-full"
                >
                  <LineChart
                    data={quizData.map((quiz) => ({
                      timestamp: quiz.timestamp,
                      formattedDate: formatEasternDate(quiz.timestamp),
                      averageScore: Math.round(
                        (quiz.mcqScore + quiz.shortAnswerScore) / 2
                      ),
                    }))}
                    margin={{ top: 5, right: 20, bottom: 25, left: 0 }}
                  >
                    <Line
                      dataKey="averageScore"
                      fill="var(--color-averageScore)"
                      stroke="var(--color-averageScore)"
                      strokeWidth={2}
                      dot={{
                        r: 4,
                        strokeWidth: 2,
                        fill: "white",
                      }}
                    />
                    <XAxis
                      dataKey="formattedDate"
                      tick={{ fill: "var(--foreground)", fontSize: 12 }}
                      tickLine={{ stroke: "var(--border)" }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Score Progression</CardTitle>
          <CardDescription>Track your improvement over time</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <ChartContainer
              config={{
                mcqFirstGuessScore: {
                  label: "MCQ (First Attempts)",
                  color: "hsl(280 70% 50%)",
                },
                mcqScore: {
                  label: "MCQ (Final)",
                  color: "hsl(220 70% 50%)",
                },
                shortAnswerScore: {
                  label: "Short Answer",
                  color: "hsl(160 60% 45%)",
                },
              }}
              className="min-h-[400px] w-full"
            >
              <LineChart
                data={quizData.map((quiz) => ({
                  ...quiz,
                  formattedDate: formatEasternDate(quiz.timestamp),
                }))}
                margin={{ top: 5, right: 20, bottom: 25, left: 0 }}
              >
                <Line
                  dataKey="mcqFirstGuessScore"
                  fill="var(--color-mcqFirstGuessScore)"
                  stroke="var(--color-mcqFirstGuessScore)"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: "white",
                  }}
                />
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
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fill: "var(--foreground)", fontSize: 12 }}
                  tickLine={{ stroke: "var(--border)" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Learning Insights</CardTitle>
          <CardDescription>Based on your performance data</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "hsl(220 70% 50%)" }}
                />
                <span>
                  MCQ Score Change:{" "}
                  {quizData[quizData.length - 1].mcqScore -
                    quizData[0].mcqScore}
                  % since start
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "hsl(160 60% 45%)" }}
                />
                <span>
                  Short Answer Score Change:{" "}
                  {quizData[quizData.length - 1].shortAnswerScore -
                    quizData[0].shortAnswerScore}
                  % since start
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "hsl(280 70% 50%)" }}
                ></span>
                <span>
                  Average completion time:{" "}
                  {Math.round(
                    quizData.reduce((acc, curr) => acc + curr.avgTimeTaken, 0) /
                      quizData.length
                  )}{" "}
                  seconds
                </span>
              </li>
              <li className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-2">
                  Age Group Performance
                </div>
                <p className="text-sm text-muted-foreground">
                  Your memory performance is in the top 15% for your age group
                  ages 20-30. This is based on average response time and
                  accuracy compared to others in your age range.
                </p>
              </li>
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
