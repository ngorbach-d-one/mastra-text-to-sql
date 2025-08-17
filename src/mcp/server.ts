import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { getSqlAgent } from "../mastra/agents/sql";

async function start() {
  const server = new McpServer({ name: "sql-chat", version: "1.0.0" });

  server.registerTool(
    "sqlChat",
    {
      title: "SQL Chat",
      description: "Ask natural language questions and get SQL query results.",
      inputSchema: { query: z.string() },
    },
    async ({ query }) => {
      const agent = await getSqlAgent();
      const result = (await agent.generate([
        { role: "user", content: query },
      ])) as unknown;
      const text =
        typeof result === "string"
          ? result
          : (result as { content?: Array<{ text?: string }> }).content?.[0]?.text || "";
      return { content: [{ type: "text", text }] };
    }
  );

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  const app = express();
  app.use(express.json());
  app.use(
    cors({
      origin: "*",
      exposedHeaders: ["Mcp-Session-Id"],
      allowedHeaders: ["Content-Type", "mcp-session-id"],
    })
  );

  app.all("/mcp", async (req: Request, res: Response) => {
    try {
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  const PORT = process.env.MCP_PORT || 3001;
  app.listen(PORT, () => {
    console.log(`MCP server listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});

