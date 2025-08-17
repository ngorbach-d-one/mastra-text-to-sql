import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { sqlAgent } from "../agents/sql";

// Create MCP server instance
const server = new McpServer({
  name: "sql-agent-server",
  version: "1.0.0",
});

// Register a tool that forwards questions to the SQL agent
server.registerTool(
  "ask-sql",
  {
    title: "SQL Agent",
    description: "Ask questions against the customer orders database",
    inputSchema: {
      question: z.string(),
    },
  },
  async ({ question }) => {
    const result = await sqlAgent.generate([
      { role: "user", content: question },
    ]);

    return {
      content: [{ type: "text", text: result.text }],
    };
  },
);

// Start the server using stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
