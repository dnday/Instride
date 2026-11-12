"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { moodColor } from "@/lib/mood";

type Point = { date: string; label: string; mood: number | null };

/** Grafik tren mood (dipisah agar Recharts dimuat belakangan lewat next/dynamic). */
export default function MoodTrendChart({ series, range }: { series: Point[]; range: 7 | 30 }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={series} margin={{ top: 8, right: 24, bottom: 0, left: -24 }}>
        <CartesianGrid stroke="#E6F2F1" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#56625F" }} tickLine={false} axisLine={false}
          interval={range === 7 ? 0 : "preserveStartEnd"} />
        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12, fill: "#56625F" }} tickLine={false} axisLine={false} />
        <Tooltip formatter={(v) => [`${v} / 5`, "Mood"]} contentStyle={{ borderRadius: 12, borderColor: "#CFE9E6" }} />
        <Line type="monotone" dataKey="mood" stroke="#2A7470" strokeWidth={2.5}
          dot={(p: { cx?: number; cy?: number; payload?: Point }) =>
            p.payload?.mood == null || p.cx == null || p.cy == null ? <g key={p.payload?.date} /> : (
              <circle key={p.payload.date} cx={p.cx} cy={p.cy} r={5} fill={moodColor(p.payload.mood).fill} stroke="#fff" strokeWidth={2} />
            )}
          activeDot={{ r: 6 }} connectNulls isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
