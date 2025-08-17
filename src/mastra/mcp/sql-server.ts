import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebSocketServer } from "ws";
import { z } from "zod";
import { sqlAgent } from "../agents/sql";

interface Transport {
  start(): Promise<void>;
  send(message: unknown): Promise<void>;
  close(): Promise<void>;
  onmessage?: (message: unknown) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;
}

function createServer() {
  const server = new McpServer({
    name: "sql-agent-server",
    version: "1.0.0",
  });

  server.registerTool(
    "ask-sql",
    {
      title: "SQL Agent",
      description: "Ask questions against the customer orders database",
      inputSchema: {
        question: z.string(),
      },
    },
    async ({ question }, extra) => {
      const stream = await sqlAgent.stream([
        { role: "user", content: question },
      ]);

      let text = "";
      let progress = 0;
      const progressToken = extra.requestId;

      for await (const chunk of stream.textStream) {
        progress += chunk.length;
        text += chunk;
        await extra.sendNotification({
          method: "notifications/progress",
          params: {
            progressToken,
            progress,
            message: chunk,
          },
        });
      }

      return {
        content: [{ type: "text", text }],
      };
    },
  );

  return server;
}

async function main() {
  const wss = new WebSocketServer({ port: 3030 });

  wss.on("connection", (socket) => {
    console.log("MCP client connected");
    const server = createServer();

    const transport: Transport = {
      async start() {
        // no-op: connection already established
      },
      async send(message) {
        socket.send(JSON.stringify(message));
      },
      async close() {
        socket.close();
      },
    };

    socket.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        transport.onmessage?.(msg);
      } catch (err) {
        transport.onerror?.(err as Error);
      }
    });

    socket.on("close", () => {
      transport.onclose?.();
    });

    socket.on("error", (err) => {
      transport.onerror?.(err as Error);
    });

    server.connect(transport).catch((err) => {
      console.error("MCP connection error", err);
    });
  });

  console.log("MCP server listening on ws://localhost:3030");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
