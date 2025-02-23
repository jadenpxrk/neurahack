import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("http://localhost:9000/questions");
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
