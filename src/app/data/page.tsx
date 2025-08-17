"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BarChart from "@/components/bar-chart";
import { Navbar } from "@/components/navbar";

type TableData = {
  headers: string[];
  rows: string[][];
};

export default function DataPage() {
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    if (!tableData?.rows.length) {
      setChartData([]);
      return;
    }

    const rows = tableData.rows;
    const numColIndex = tableData.headers.findIndex((_, idx) =>
      rows.some((row) => !isNaN(Number(row[idx].replace(/,/g, ""))))
    );

    if (numColIndex === -1) {
      setChartData([]);
      return;
    }

    const labelIndex = numColIndex === 0 ? 1 : 0;
    const data = rows.slice(0, 10).map((row) => ({
      label: row[labelIndex],
      value: Number(row[numColIndex].replace(/,/g, "")),
    }));
    setChartData(data);
  }, [tableData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/data");
        const data = await response.json();

        if (data.success) {
          setTableData(data.tableData);
          setError(null);
        } else {
          setError(data.error || "Failed to fetch data");
          setTableData(null);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setError("An error occurred while fetching data");
        setTableData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatHeaderName = (header: string) => {
    return header
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatNumber = (value: string) => {
    const num = Number(value.replace(/,/g, ""));
    if (isNaN(num)) return value;

    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      {/* Header with subtle border */}
      <header className="relative py-8 mb-8 border-b border-border">
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-primary">
            ABS Data Overview
          </h1>
          <p className="text-center text-muted-foreground mt-2 max-w-2xl mx-auto">
            Complete database of ABS information
          </p>
          <div className="mt-6 text-center">
            <Link href="/" className="text-primary hover:underline">
              ← Back to Chat
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-7xl pb-16">
        <section>
          <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-4 text-muted-foreground">
                  Loading database...
                </p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                  <svg
                    className="w-8 h-8 text-destructive"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-destructive mb-2">
                  Error
                </h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
            ) : tableData && tableData.headers.length > 0 ? (
              <div className="overflow-x-auto p-4">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted">
                      {tableData.headers.map((header, index) => (
                        <th
                          key={index}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                          {formatHeaderName(header)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {tableData.rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={rowIndex % 2 === 0 ? "bg-card" : "bg-muted"}
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                          >
                            {!isNaN(Number(cell.replace(/,/g, ""))) ? (
                              <span
                                className={`font-medium ${cellIndex === 1 ? "text-primary" : "text-foreground"}`}
                              >
                                {formatNumber(cell)}
                              </span>
                            ) : (
                              cell
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {chartData.length > 0 && (
                  <div className="mt-8">
                    <BarChart data={chartData} />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
