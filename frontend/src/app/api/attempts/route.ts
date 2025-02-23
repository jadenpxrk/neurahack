import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const response = await fetch("http://localhost:9000/attempts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to save quiz attempt");
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to save quiz attempt:", error);
    return NextResponse.json(
      { error: "Failed to save quiz attempt" },
      { status: 500 }
    );
  }
}
