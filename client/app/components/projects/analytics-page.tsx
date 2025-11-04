"use client";

import { Activity, Clock, Database } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "~/components/ui/chart";

interface Props {
  data: {
    query_type: string;
    total_unique_queries: string;
    total_calls: string;
    avg_exec_time_ms: string;
    total_exec_time_ms: string;
  }[];
}

export function DatabaseAnalytics({ data }: Props) {
  // Convert string numbers to actual numbers and ensure minimum value for log scale
  const chartData = data.map(item => {
    const totalCalls = parseInt(item.total_calls);
    return {
      ...item,
      total_calls: Math.max(totalCalls, 1), // Ensure minimum 1 for log scale
      total_calls_original: totalCalls, // Keep original for tooltip
      total_unique_queries: parseInt(item.total_unique_queries),
      avg_exec_time_ms: parseFloat(item.avg_exec_time_ms),
      total_exec_time_ms: parseFloat(item.total_exec_time_ms),
    };
  });

  const analyticsConfig = {
    total_calls: {
      label: "Total Calls",
    },
    SELECT: {
      label: "SELECT",
      color: "hsl(220, 70%, 50%)",
    },
    INSERT: {
      label: "INSERT", 
      color: "hsl(160, 60%, 45%)",
    },
    UPDATE: {
      label: "UPDATE",
      color: "hsl(30, 80%, 55%)",
    },
    DELETE: {
      label: "DELETE",
      color: "hsl(280, 65%, 60%)",
    },
    ALTER: {
      label: "ALTER",
      color: "hsl(340, 75%, 55%)",
    },
    DROP: {
      label: "DROP",
      color: "hsl(0, 75%, 55%)",
    },
    CREATE: {
      label: "CREATE",
      color: "hsl(120, 60%, 50%)",
    },
  } satisfies ChartConfig;

  // Function to get color for a query type
  const getColorForQueryType = (queryType: string) => {
    return (analyticsConfig[queryType as keyof typeof analyticsConfig] as any)?.color || "hsl(215, 20%, 65%)";
  };

  // Calculate totals for the summary using original values
  const totalCalls = chartData.reduce((sum, item) => sum + item.total_calls_original, 0);
  const totalUniqueQueries = chartData.reduce((sum, item) => sum + item.total_unique_queries, 0);
  const avgResponseTime = chartData.length > 0 
    ? (chartData.reduce((sum, item) => sum + item.avg_exec_time_ms, 0) / chartData.length).toFixed(2)
    : "0";

  // Find the most used query type
  const mostUsedQuery = chartData.reduce((prev, current) => 
    (prev.total_calls_original > current.total_calls_original) ? prev : current
  );

  // Custom tooltip to show all relevant information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <div className="grid gap-2">
            <div className="font-medium text-foreground">{label} Queries</div>
            <div className="grid gap-1 text-sm">
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-blue-500" />
                <span>Total Calls: <strong>{data.total_calls_original.toLocaleString()}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3 text-green-500" />
                <span>Unique Queries: <strong>{data.total_unique_queries}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-orange-500" />
                <span>Avg Time: <strong>{data.avg_exec_time_ms}ms</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-red-500" />
                <span>Total Time: <strong>{data.total_exec_time_ms}ms</strong></span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Y-axis tick formatter for logarithmic scale
  const formatLogTick = (value: number) => {
    if (value < 10) return value.toString();
    if (value < 100) return value.toString();
    if (value < 1000) return value.toString();
    if (value < 10000) return `${(value / 1000).toFixed(1)}k`;
    return `${Math.floor(value / 1000)}k`;
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Database Query Analytics
          </CardTitle>
          <CardDescription>No query data available</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Database className="mx-auto h-8 w-8 mb-2" />
            <p>No queries executed yet</p>
            <p className="text-xs mt-1">Execute some queries to see analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Database Query Analytics
        </CardTitle>
        <CardDescription>
          Query performance breakdown by type (Logarithmic scale for better visualization)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={analyticsConfig}>
          <BarChart 
            accessibilityLayer 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="query_type"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) =>
                analyticsConfig[value as keyof typeof analyticsConfig]?.label || value
              }
            />
            <YAxis
              scale="log"
              domain={[1, 'dataMax']}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={formatLogTick}
              label={{ 
                value: 'Total Calls (log scale)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: '12px' }
              }}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.05)", radius: 4 }}
              content={<CustomTooltip />}
            />
            <Bar 
              dataKey="total_calls" 
              strokeWidth={1} 
              radius={[4, 4, 0, 0]}
              stroke="rgba(255, 255, 255, 0.1)"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColorForQueryType(entry.query_type)}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Enhanced Summary Statistics */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="font-semibold text-lg text-foreground">
                {totalCalls.toLocaleString()}
              </div>
              <div className="text-muted-foreground">Total Calls</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="font-semibold text-lg text-foreground">{totalUniqueQueries}</div>
              <div className="text-muted-foreground">Unique Queries</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="font-semibold text-lg text-foreground">{avgResponseTime}ms</div>
              <div className="text-muted-foreground">Avg Response</div>
            </div>
          </div>
          
          {/* Most Used Query Type Highlight */}
          {totalCalls > 0 && (
            <div className="text-center p-2 bg-primary/10 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                Most used query type: <span className="font-medium text-foreground">{mostUsedQuery.query_type}</span> 
                {" "}({mostUsedQuery.total_calls_original.toLocaleString()} calls)
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}