import { createAzure } from "@ai-sdk/azure";
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import * as tools from "../tools/population-info";
import { Client } from "pg";
import type { LanguageModelV1 } from "ai";

const TABLES = ["customers", "employees", "order_items", "orders", "products"];

const FALLBACK_SCHEMA = `customers (
      customer_id BIGINT,
      email TEXT,
      full_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE
    );
    employees (
      employee_id BIGINT,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      hire_date TIMESTAMP WITH TIME ZONE,
      salary NUMERIC
    );
    order_items (
      order_id BIGINT,
      product_id BIGINT,
      qty INTEGER,
      unit_price NUMERIC
    );
    orders (
      order_id BIGINT,
      customer_id BIGINT,
      order_date TIMESTAMP WITH TIME ZONE,
      status TEXT
    );
    products (
      product_id BIGINT,
      name TEXT,
      price NUMERIC,
      created_at TIMESTAMP WITH TIME ZONE
    );`;

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
      `SELECT table_name, column_name, data_type, character_maximum_length, numeric_precision, numeric_scale
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ANY($1::text[])
       ORDER BY table_name, ordinal_position;`,
      [TABLES]
    );

    const schemaByTable = rows.reduce<Record<string, string[]>>((acc, row) => {
      let type = row.data_type.toUpperCase();
      if (row.character_maximum_length) {
        type += `(${row.character_maximum_length})`;
      } else if (row.numeric_precision) {
        type += `(${row.numeric_precision}${row.numeric_scale !== null ? `, ${row.numeric_scale}` : ""})`;
      }
      if (!acc[row.table_name]) {
        acc[row.table_name] = [];
      }
      acc[row.table_name].push(`      ${row.column_name} ${type}`);
      return acc;
    }, {});

    return (
      TABLES.map(
        (table) =>
          `${table} (\n${(schemaByTable[table] || []).join(",\n")}\n    )`
      ).join(";\n") + ";"
    );
  } catch (err) {
    console.error("Failed to fetch database schema:", err);
    return FALLBACK_SCHEMA;
  } finally {
    await client.end();
  }
};

let sqlAgent: Agent | undefined;

async function createAgent() {
  const schema = await getDatabaseSchema();

  return new Agent({
    name: "SQL Agent",
    instructions: `You are a SQL (PostgreSQL) expert for a customer orders database. Generate and execute queries that answer user questions about customers, employees, orders, order items, and products.

    DATABASE SCHEMA:
${schema}

    QUERY GUIDELINES:
    - Only retrieval queries are allowed
    - For string comparisons, use: LOWER(field) ILIKE LOWER('%term%')
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
    1. Analyze the user's question about the data
    2. Generate an appropriate SQL query
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
    model: (function getModel(): LanguageModelV1 {
      if (
        process.env.AZURE_API_KEY &&
        process.env.AZURE_RESOURCE_NAME
      ) {
        const provider = createAzure({
          apiKey: process.env.AZURE_API_KEY,
          resourceName: process.env.AZURE_RESOURCE_NAME,
        });
        return provider(
          process.env.AZURE_DEPLOYMENT_NAME || "gpt-4o",
        );
      }
      if (process.env.OPENAI_API_KEY) {
        return openai(process.env.OPENAI_MODEL || "gpt-4o");
      }
      throw new Error(
        "Missing Azure or OpenAI credentials. Set AZURE_API_KEY and AZURE_RESOURCE_NAME, or OPENAI_API_KEY.",
      );
    })(),
    tools: {
      executeSQLQuery: tools.populationInfo,
    },
  });
}

export async function getSqlAgent(): Promise<Agent> {
  if (!sqlAgent) {
    sqlAgent = await createAgent();
  }
  return sqlAgent;
}
