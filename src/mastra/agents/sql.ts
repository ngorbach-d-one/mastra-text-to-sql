import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import * as tools from "../tools/population-info";
import { LanguageModelV1 } from "@ai-sdk/provider";
import { Client } from "pg";

const FALLBACK_SCHEMA = `      id SERIAL PRIMARY KEY,
      popularity INTEGER,
      geoname_id INTEGER,
      name_en VARCHAR(255),
      country_code VARCHAR(10),
      population BIGINT,
      latitude DECIMAL(10, 6),
      longitude DECIMAL(10, 6),
      country VARCHAR(255),
      region VARCHAR(255),
      continent VARCHAR(255),
      code2 VARCHAR(10),
      code VARCHAR(10),
      province VARCHAR(255)`;

const getDatabaseSchema = async () => {
  if (!process.env.PGHOST) {
    return FALLBACK_SCHEMA;
  }

  const client = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale
       FROM information_schema.columns
       WHERE table_name = 'cities'
       ORDER BY ordinal_position;`
    );

    return rows
      .map((row) => {
        let type = row.data_type.toUpperCase();
        if (row.character_maximum_length) {
          type += `(${row.character_maximum_length})`;
        } else if (row.numeric_precision) {
          type += `(${row.numeric_precision}${row.numeric_scale !== null ? `, ${row.numeric_scale}` : ""})`;
        }
        return `      ${row.column_name} ${type}`;
      })
      .join(",\n");
  } catch (err) {
    console.error("Failed to fetch database schema:", err);
    return FALLBACK_SCHEMA;
  } finally {
    await client.end();
  }
};

const schema = await getDatabaseSchema();

export const sqlAgent = new Agent({
  name: "SQL Agent",
  instructions: `You are a SQL (PostgreSQL) expert for a city population database. Generate and execute queries that answer user questions about city data.

    DATABASE SCHEMA:
    cities (
${schema}
    );

    QUERY GUIDELINES:
    - Only retrieval queries are allowed
    - For string comparisons, use: LOWER(field) ILIKE LOWER('%term%')
    - Use "United Kingdom" for UK and "United States" for USA
    - This dataset contains only current information, not historical data
    - Always return at least two columns for visualization purposes
    - If a user asks for a single column, include a count of that column
    - Format rates as decimals (e.g., 0.1 for 10%)

    Key SQL formatting tips:
    - Start main clauses (SELECT, FROM, WHERE, etc.) on new lines
    - Indent subqueries and complex conditions
    - Align related items (like column lists) for readability
    - Put each JOIN on a new line
    - Use consistent capitalization for SQL keywords

    WORKFLOW:
    1. Analyze the user's question about city data
    2. Generate an appropriate SQL query
    3. Execute the query using the Execute SQL Query tool
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
  model: openai("gpt-4o") as LanguageModelV1,
  tools: {
    populationInfo: tools.populationInfo,
  },
});
