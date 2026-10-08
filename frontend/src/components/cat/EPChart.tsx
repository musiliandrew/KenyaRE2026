"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import type { ReturnPeriodMetric, RP } from "@/lib/api";

interface Point {
  name: string;
  rp: RP;
  years: number;
  prob: number; // percent
  baseline: number; // KES millions
  ai: number | null; // KES millions
}

export function EPChart({
  metrics = [],
  compare = true,
  rp = "25y",
}: {
  metrics?: ReturnPeriodMetric[];
  compare?: boolean;
  rp?: RP;
}) {
  const data: Point[] = (metrics || []).map((m) => ({
    name: `${m.years}-Yr`,
    rp: m.return_period,
    years: m.years,
    prob: m.annual_prob * 100,
    baseline: m.portfolio_loss_kes / 1e6,
    ai: m.ai_adjusted_loss != null ? m.ai_adjusted_loss / 1e6 : null,
  }));
  const hasAI = data.some((d) => d.ai != null);
  const primary: "ai" | "baseline" = hasAI ? "ai" : "baseline";
  const selected = data.find((d) => d.rp === rp);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 24, right: 24, left: 8, bottom: 8 }}>
        <defs>
          <linearGradient id="gAi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D21245" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#D21245" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gDem" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00264D" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#00264D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#E5E7EB" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => `${Number(v).toFixed(0)}M`} tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} width={52} />
        {selected && <ReferenceLine x={selected.name} stroke="#A6A7AB" strokeDasharray="3 3" />}
        <Tooltip
          cursor={{ stroke: "#00264D", strokeWidth: 1 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as Point;
            const top = p[primary] ?? p.baseline;
            return (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                <div className="font-semibold text-slate-800">1-in-{p.years} Year · {p.prob.toFixed(0)}% Annual Exceedance</div>
                {hasAI && (
                  <div className="mt-1 flex justify-between gap-6 font-mono text-slate-600">
                    <span className="text-red-700 font-medium">AI-Augmented:</span>
                    <span className="font-semibold text-slate-900">KES {(p.ai ?? 0).toFixed(1)}M</span>
                  </div>
                )}
                {(compare || !hasAI) && (
                  <div className="flex justify-between gap-6 font-mono text-slate-600">
                    <span className="text-slate-500">Baseline (raster):</span>
                    <span>KES {p.baseline.toFixed(1)}M</span>
                  </div>
                )}
                <div className="flex justify-between gap-6 font-mono text-slate-600 pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Solvency Buffer (×1.3):</span>
                  <span>KES {(top * 1.3).toFixed(0)}M</span>
                </div>
              </div>
            );
          }}
        />
        {(compare || !hasAI) && (
          <Area type="monotone" dataKey="baseline" name="Baseline" stroke="#00264D" strokeWidth={1.5}
            strokeDasharray={hasAI ? "4 4" : undefined} fill="url(#gDem)" />
        )}
        {hasAI && (
          <Area type="monotone" dataKey="ai" name="AI-Augmented" stroke="#D21245" strokeWidth={2.5}
            fill="url(#gAi)" dot={{ r: 3.5, fill: "#D21245" }} activeDot={{ r: 6 }} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
