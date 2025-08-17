"use client";

import type { ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MastraModelAdapter: ChatModelAdapter = {
  async *run({ messages }) {
    const last = messages[messages.length - 1];
    const firstPart = last?.content?.[0];
    const query =
      firstPart && firstPart.type === "text" ? firstPart.text : "";

    const client = new Client({ name: "web-ui", version: "1.0.0" });
    const baseUrl = process.env.NEXT_PUBLIC_MCP_URL || "/mcp";
    const transport = new StreamableHTTPClientTransport(
      new URL(baseUrl, window.location.origin)
    );
    await client.connect(transport);

    try {
      const result = await client.callTool({ name: "sqlChat", arguments: { query } });
      const content = (
        result as { content?: Array<{ type: string; text?: string }> }
      ).content;
      const text =
        content
          ?.filter(
            (c): c is { type: "text"; text: string } => c.type === "text"
          )
          .map((c) => c.text)
          .join("") || "";

      yield { content: [{ type: "text", text }] };
    } finally {
      await client.close();
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
