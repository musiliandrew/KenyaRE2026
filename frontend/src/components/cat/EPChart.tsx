"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { EP_CURVE, type ReturnPeriod } from "@/lib/cat-model";

export function EPChart({ compare, rp }: { compare: boolean; rp: ReturnPeriod }) {
  const data = EP_CURVE.map((d) => ({ ...d, name: `${d.rp}-Yr` }));
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
        <YAxis tickFormatter={(v) => `${v}M`} tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} width={52} />
        <ReferenceLine x={`${rp}-Yr`} stroke="#A6A7AB" strokeDasharray="3 3" />
        <Tooltip
          cursor={{ stroke: "#00264D", strokeWidth: 1 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as (typeof data)[number];
            return (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                <div className="font-semibold text-slate-800">1-in-{p.rp} Year · {p.prob}% Annual Exceedance</div>
                <div className="mt-1 flex justify-between gap-6 font-mono text-slate-600">
                  <span className="text-red-700 font-medium">AI-Augmented:</span>
                  <span className="font-semibold text-slate-900">KES {p.ai.toFixed(1)}M</span>
                </div>
                {compare && (
                  <div className="flex justify-between gap-6 font-mono text-slate-600">
                    <span className="text-slate-500">DEM Baseline:</span>
                    <span>KES {p.dem.toFixed(1)}M</span>
                  </div>
                )}
                <div className="flex justify-between gap-6 font-mono text-slate-600 pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Solvency Buffer (×1.3):</span>
                  <span>KES {(p.ai * 1.3).toFixed(0)}M</span>
                </div>
              </div>
            );
          }}
        />
        {compare && (
          <Area
            type="monotone"
            dataKey="dem"
            name="DEM Baseline"
            stroke="#00264D"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#gDem)"
          />
        )}
        <Area
          type="monotone"
          dataKey="ai"
          name="AI-Augmented"
          stroke="#D21245"
          strokeWidth={2.5}
          fill="url(#gAi)"
          dot={{ r: 3.5, fill: "#D21245" }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

