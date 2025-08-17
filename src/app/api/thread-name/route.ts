import { NextResponse } from "next/server";
import { azure } from "@ai-sdk/azure";
import { generateText } from "ai";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const { messages } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "No messages provided" },
      { status: 400 },
    );
  }

  const model = azure(process.env.AZURE_DEPLOYMENT_NAME || "gpt-4o");
  const prompt = `Create a short descriptive title for a conversation based on the following messages:\n${messages.join("\n")}`;

  try {
    const { text } = await generateText({ model, prompt });
    return NextResponse.json({ title: text.trim() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
