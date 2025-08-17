import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/mcp",
        destination: process.env.MCP_SERVER_URL || "http://localhost:3001/mcp",
      },
    ];
  },
};

export default nextConfig;
