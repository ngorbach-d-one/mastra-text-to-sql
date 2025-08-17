"use client";

import type { ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";

let client: Client | null = null;
async function getClient() {
  if (!client) {
    client = new Client({ name: "sql-ui", version: "1.0.0" });
    const url =
      typeof window !== "undefined"
        ? `ws://${window.location.hostname}:3030`
        : "ws://localhost:3030";
    const transport = new WebSocketClientTransport(new URL(url));
    await client.connect(transport);
  }
  return client;
}

const MastraModelAdapter: ChatModelAdapter = {
  async *run({ messages }) {
    const client = await getClient();
    const last = messages[messages.length - 1];
    const question = last.content
      .map((c) => ("text" in c ? c.text : ""))
      .join("");

    const queue: string[] = [];
    let accumulated = "";
    let done = false;

    const resultPromise = client
      .callTool(
        { name: "ask-sql", arguments: { question } },
        undefined,
        {
          onprogress: ({ message }: { message?: string }) => {
            if (typeof message === "string") {
              queue.push(message);
              accumulated += message;
            }
          },
        },
      )
      .then((res) => {
        done = true;
        return res;
      });

    while (!done || queue.length > 0) {
      if (queue.length > 0) {
        yield { content: [{ type: "text", text: queue.shift()! }] };
      } else {
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    const result = await resultPromise;
    const finalText = Array.isArray(result.content)
      ? result.content.map((c) => ("text" in c ? c.text : "")).join("")
      : "";
    if (finalText.length > accumulated.length) {
      yield {
        content: [{ type: "text", text: finalText.slice(accumulated.length) }],
      };
    }
  },
};

export function MastraRuntimeProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const runtime = useLocalRuntime(MastraModelAdapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
