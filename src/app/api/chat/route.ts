import { NextResponse } from "next/server";
import type { CoreMessage } from "@mastra/core";

type ChatMessage = Extract<CoreMessage, { role: "user" | "assistant" | "system" }>;
import { sqlAgent } from "../../../mastra/agents/sql";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const { messages } = await request.json();

  try {
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          error:
            "Invalid request. Please provide a conversation as an array of messages.",
        },
        { status: 400 }
      );
    }

    const thread: ChatMessage[] = messages
      .map((m: { role: string; content: { text: string }[] }) => ({
        role: m.role as ChatMessage["role"],
        content: m.content
          .map((c) => c.text)
          .filter((t): t is string => typeof t === "string" && t.trim() !== "")
          .join(" "),
      }))
      .filter((m) => m.content && m.content.length > 0);

    if (thread.length === 0) {
      return NextResponse.json(
        {
          error:
            "Invalid request. Please provide at least one message with text content.",
        },
        { status: 400 }
      );
    }

    const stream = await sqlAgent.stream(thread);

    const encoder = new TextEncoder();
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();

    (async () => {
      try {
        for await (const part of stream.fullStream) {
          if (part.type === "text-delta") {
            try {
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", value: part.textDelta })}\n\n`
                )
              );
            } catch (writeError) {
              console.log(
                "Write error (client likely disconnected):",
                writeError
              );
              break;
            }
          } else if (part.type === "error") {
            try {
              const errorMessage =
                part.error &&
                typeof part.error === "object" &&
                "message" in part.error
                  ? (part.error as { message: string }).message
                  : "Unknown error";
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "error", value: errorMessage })}\n\n`
                )
              );
            } catch (writeError) {
              console.log("Error writing error message:", writeError);
            }
          }
          // ignore other chunk types such as stream-start
        }

        try {
          await writer.write(encoder.encode("data: [DONE]\n\n"));
        } catch (closeError) {
          console.log("Error writing close event:", closeError);
        }
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message.includes("ResponseAborted")
        ) {
          console.log("Client disconnected:", error);
        } else if (
          error instanceof Error &&
          error.message.startsWith("Unhandled chunk type:")
        ) {
          console.warn("Ignoring unhandled chunk:", error.message);
        } else {
          console.error("Stream processing error:", error);
          try {
            const message =
              error instanceof Error ? error.message : String(error);
            await writer.write(
              encoder.encode(
                `data: ${JSON.stringify({ type: "error", value: message })}\n\n`
              )
            );
          } catch (writeError) {
            console.log("Error writing error message:", writeError);
          }
        }
      } finally {
        try {
          if (writer.desiredSize !== null) {
            await writer.close();
          }
        } catch (e) {
          console.log("Error closing writer:", e);
        }
      }
    })();

    return new Response(responseStream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: `An error occurred while processing your query: ${errorMessage}`,
        success: false,
      },
      { status: 500 }
    );
  }
}
