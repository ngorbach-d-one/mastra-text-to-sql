import React from "react";

interface BarChartProps {
  data: { label: string; value: number }[];
}

export function BarChart({ data }: BarChartProps) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="w-full space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center">
          <span className="w-32 truncate text-xs mr-2">{d.label}</span>
          <div className="flex-1 h-4 bg-primary/20 rounded">
            <div
              className="h-full bg-primary rounded"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="ml-2 text-xs">{d.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default BarChart;
