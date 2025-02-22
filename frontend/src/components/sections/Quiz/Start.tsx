// Start page for the quiz
// User can start the quiz by clicking a button

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

interface StartProps {
  onStart: () => void;
}

export default function Start({ onStart }: StartProps) {
  return (
    <Card className="w-[90%] max-w-[500px]">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Mnemos</CardTitle>
        <CardDescription className="text-center">
          Practice your memory retention by answering questions about your life.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button size="lg" onClick={onStart} className="font-semibold">
          Start Quiz
        </Button>
      </CardContent>
    </Card>
  );
}
