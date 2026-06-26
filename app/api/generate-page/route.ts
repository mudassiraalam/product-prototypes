import { NextResponse } from "next/server";
import { generatePageConfig } from "@/lib/page-agent";

export async function POST(req: Request) {
  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const result = await generatePageConfig(body.prompt);

  // outOfScope → 200 so the client shows the amber callout (not an error)
  if ("outOfScope" in result) {
    return NextResponse.json(result);
  }

  if (!result.ok) {
    if (result.reason === "rate_limited") {
      return NextResponse.json(
        { error: "The AI is temporarily at capacity. Try again in a bit, or set up manually." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Couldn't read the AI's response — try rephrasing, or set up manually." },
      { status: 500 }
    );
  }

  return NextResponse.json(result);
}
