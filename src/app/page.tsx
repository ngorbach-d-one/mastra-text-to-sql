"use client";

import { useState } from "react";

type TableData = {
  headers: string[];
  rows: string[][];
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [tableData, setTableData] = useState<TableData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSqlQuery("");
    setResult("");
    setTableData(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred");
      }

      setResult(data.result);
      setSqlQuery(data.sqlQuery || "");
      setTableData(data.tableData || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl bg-gray-900 min-h-screen text-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-center text-white pt-4">
        Natural Language to SQL Query Generator
      </h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label htmlFor="query" className="block text-sm font-medium mb-2 text-gray-200">
            Enter your query in natural language:
          </label>
          <textarea
            id="query"
            rows={3}
            className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., What are the top 5 most populated cities in Europe?"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-300"
        >
          {loading ? "Generating..." : "Generate SQL Query"}
        </button>
      </form>

      {error && (
        <div className="p-4 mb-6 bg-red-900 border border-red-700 text-red-100 rounded-md">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {sqlQuery && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-200">Generated SQL Query:</h2>
          <div className="bg-gray-800 p-4 rounded-md overflow-x-auto border border-gray-700">
            <pre className="text-sm text-green-400">{sqlQuery}</pre>
          </div>
        </div>
      )}

      {tableData && tableData.headers.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-200">Results Table:</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800 border border-gray-700 rounded-md">
              <thead>
                <tr className="bg-gray-700">
                  {tableData.headers.map((header, index) => (
                    <th key={index} className="px-4 py-2 text-left text-gray-200 font-semibold border-b border-gray-600">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-gray-800" : "bg-gray-750"}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 border-b border-gray-700 text-gray-300">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div>
          <h2 className="text-xl font-semibold mb-2 text-gray-200">Agent Response:</h2>
          <div className="bg-gray-800 p-4 rounded-md whitespace-pre-wrap border border-gray-700 text-gray-300">
            {result}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-800 rounded-md border border-gray-700">
        <h3 className="text-lg font-semibold mb-2 text-gray-200">Example Queries:</h3>
        <ul className="space-y-2 text-gray-300">
          {[
            "What are the top 10 most populated cities in the world?",
            "Show me cities in Europe with population over 5 million",
            "What is the average city population by continent?",
            "List cities in Asia sorted by population",
            "Compare the population of cities in North America and Europe"
          ].map((exampleQuery, index) => (
            <li key={index} className="flex items-center">
              <button
                onClick={() => setQuery(exampleQuery)}
                className="text-left hover:text-blue-400 hover:underline focus:outline-none focus:text-blue-400 transition-colors cursor-pointer"
                aria-label={`Use example query: ${exampleQuery}`}
              >
                <span className="mr-2">•</span>
                {exampleQuery}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
