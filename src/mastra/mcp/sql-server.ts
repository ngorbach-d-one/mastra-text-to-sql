import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import express from "express";
import path from "path";
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
  const port = Number(process.env.PORT) || 3030;

  // Basic HTTP server so platforms like Azure App Service have files to serve
  const app = express();
  const publicPath = path.join(process.cwd(), "public");
  app.use(express.static(publicPath));
  app.get("/", (_req, res) => {
    res.send("MCP server running");
  });

  const httpServer = app.listen(port, () => {
    console.log(`HTTP server listening on http://localhost:${port}`);
  });

  // Attach WebSocket MCP server to the same HTTP server
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (socket) => {
    console.log("MCP client connected");
    const server = createServer();

    const transport: Transport = {
      async start() {
        // connection already established
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

  console.log(`MCP server listening on ws://localhost:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
