import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userAnswer, correctAnswer } = body;

    if (!userAnswer || !correctAnswer) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `http://localhost:9000/accuracy?user_answer=${encodeURIComponent(
        userAnswer
      )}&correct_answer=${encodeURIComponent(correctAnswer)}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Backend error:", data.error);
      throw new Error(data.error || "Failed to get accuracy from backend");
    }

    if (typeof data.score !== "number") {
      console.error("Invalid score format:", data);
      throw new Error("Invalid score format received from backend");
    }

    return NextResponse.json({ score: data.score });
  } catch (error) {
    console.error("Error in accuracy endpoint:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check answer accuracy",
      },
      { status: 500 }
    );
  }
}
