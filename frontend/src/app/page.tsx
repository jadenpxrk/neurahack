"use client";

import Quiz from "@/components/sections/Quiz/indexx";
import Start from "@/components/sections/Quiz/Start";
import { useQuiz } from "@/contexts/QuizContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);
  const { startQuiz, isQuizInProgress } = useQuiz();
  const router = useRouter();

  // If a quiz is already in progress, redirect to dashboard
  if (isQuizInProgress && !hasStarted) {
    router.push("/dashboard");
    return null;
  }

  const handleStart = () => {
    setHasStarted(true);
    startQuiz();
  };

  const handleCancel = () => {
    setHasStarted(false);
  };

  return (
    // header is 64px tall
    <section className="flex flex-col min-h-[calc(100vh-64px)] justify-center items-center">
      {hasStarted ? (
        <Quiz onCancel={handleCancel} />
      ) : (
        <Start onStart={handleStart} />
      )}
    </section>
  );
}
