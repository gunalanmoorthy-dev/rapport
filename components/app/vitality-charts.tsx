"use client";

/**
 * Recharts wrappers for the Vitality screen: the book-wide sentiment-vs-market
 * overview chart and the small per-client trend sparklines. Presentational;
 * currently fed mock time-series data (no sentiment-history table yet).
 *
 * @module components/app/vitality-charts
 */
import {
  Area,
  Line,
  ComposedChart,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type OverviewPoint = { month: string; sentiment: number; volatility: number };

export function VitalityOverview({ data }: { data: OverviewPoint[] }) {
  return (
    <ChartContainer
      config={{
        sentiment: { label: "Book sentiment", color: "#eca8d6" },
        volatility: { label: "Market volatility", color: "#d4a23c" },
      }}
      className="h-[360px] w-full"
    >
      <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sentimentFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-sentiment)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-sentiment)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="oklch(1 0 0 / 0.06)" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          stroke="oklch(1 0 0 / 0.4)"
          fontSize={11}
        />
        <YAxis
          yAxisId="left"
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          width={32}
          stroke="oklch(1 0 0 / 0.4)"
          fontSize={11}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 40]}
          tickLine={false}
          axisLine={false}
          width={32}
          stroke="oklch(1 0 0 / 0.4)"
          fontSize={11}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="sentiment"
          stroke="var(--color-sentiment)"
          strokeWidth={2}
          fill="url(#sentimentFill)"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="volatility"
          stroke="var(--color-volatility)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

export function ClientTrend({
  data,
  color,
}: {
  data: { month: string; score: number }[];
  color: string;
}) {
  return (
    <ChartContainer
      config={{ score: { label: "Sentiment", color } }}
      className="h-16 w-full"
    >
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <YAxis domain={[20, 100]} hide />
        <ChartTooltip
          content={<ChartTooltipContent hideLabel />}
          cursor={false}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="var(--color-score)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
