import { azure } from "@ai-sdk/azure";
import { Agent } from "@mastra/core/agent";
import * as tools from "../tools/population-info";

import { readFileSync } from "fs";
import path from "path";
import type { LanguageModelV1 } from "ai";

const schema = readFileSync(
  path.join(process.cwd(), "src/mastra/agents/fallback-schema.sql"),
  "utf8"
);

export const sqlAgent = new Agent({
  name: "SQL Agent",
  instructions: `You are a SQL (PostgreSQL) expert for a asset-backed securities database. Generate and execute queries that answer user
 questions about asset-backed securities.

    DATABASE SCHEMA:
${schema}

    QUERY GUIDELINES:
    - Only retrieval queries are allowed
    - For string comparisons, use: LOWER(field) ILIKE LOWER('%term%')
    - Always return at least two columns for visualization purposes
    - If a user asks for a single column, include a count of that column
    - Format rates as decimals (e.g., 0.1 for 10%)

    Key SQL formatting tips:
    - Use a single line
    - Indent subqueries and complex conditions
    - Align related items (like column lists) for readability
    - Put each JOIN on a new line
    - Use consistent capitalization for SQL keywords

    WORKFLOW:
    1. Analyze the user's question about the data
    2. Generate an appropriate SQL query.
    3. Execute the query using the executeSQLQuery tool
    4. Return results in markdown format with these sections:

       ### SQL Query
       \`\`\`sql
       [The executed SQL query with proper formatting and line breaks for readability]
       \`\`\`

       ### Explanation
       [Clear explanation of what the query does]

       ### Results
       [Query results in table format]
    `,
  model: azure(
    process.env.AZURE_DEPLOYMENT_NAME || "gpt-4o"
  ) as LanguageModelV1,
  tools: {
    executeSQLQuery: tools.populationInfo,
  },
});
