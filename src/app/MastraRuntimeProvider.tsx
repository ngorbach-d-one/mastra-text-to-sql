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
    const transport = new WebSocketClientTransport(new URL("ws://localhost:3030"));
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
    const result = await client.callTool({
      name: "ask-sql",
      arguments: { question },
    });
    const text = Array.isArray(result.content)
      ? result.content.map((c) => ("text" in c ? c.text : "")).join("")
      : "";
    yield { content: [{ type: "text", text }] };
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
