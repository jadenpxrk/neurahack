import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("http://localhost:9000/results");
    if (!response.ok) {
      throw new Error("Failed to fetch results");
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
