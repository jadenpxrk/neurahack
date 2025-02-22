"use client";

import { QuizProvider } from "@/contexts/QuizContext";
import { ThemeProvider } from "@/components/theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QuizProvider>{children}</QuizProvider>
    </ThemeProvider>
  );
}
