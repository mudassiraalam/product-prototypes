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
  if (result === null) {
    return NextResponse.json({ error: "Failed to generate page config — model returned unparseable output" }, { status: 500 });
  }

  return NextResponse.json(result);
}

