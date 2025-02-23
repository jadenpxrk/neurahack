import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // console.log(searchParams);
    const questionId = searchParams.get("question_id");

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `http://localhost:9000/proof?question_id=${questionId}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch video");
    }

    const videoBlob = await response.blob();
    return new NextResponse(videoBlob, {
      headers: {
        "Content-Type": "video/mp4",
      },
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    );
  }
}
