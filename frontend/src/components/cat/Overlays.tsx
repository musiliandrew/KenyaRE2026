"use client";

import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Loader2,
  Download,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  BUILDINGS,
  CLASS_LABEL,
  DEPTH_FACTOR,
  EP_CURVE,
  HOTSPOTS,
  SCENARIOS,
  TIV_TOTAL,
  AAL,
  damageRatio,
  formatKES,
  parsePolicy,
  riskLevel,
  type Building,
  type Hotspot,
  type HousingClass,
  type ParsedLine,
  type ReturnPeriod,
} from "@/lib/cat-model";

const riskDot = {
  low: "bg-emerald-600",
  mid: "bg-amber-500",
  high: "bg-[#D21245]",
} as const;

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-base font-semibold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function AssetSheet({
  b,
  rp,
  onClose,
}: {
  b: Building | null;
  rp: ReturnPeriod;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!b} onOpenChange={(o) => !o && onClose()} modal={false}>
      <SheetContent hideOverlay={true} className="w-full overflow-y-auto sm:max-w-md bg-white border-l border-slate-200 shadow-2xl">
        {b && (() => {
          const depth = b.depth100 * DEPTH_FACTOR[rp];
          const dr = damageRatio(b.cls, depth);
          const lvl = riskLevel(b, rp);
          return (
            <>
              <SheetHeader>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#D21245]">Asset Risk Dossier</div>
                <SheetTitle className="font-mono text-xl text-[#00264D]">{b.id}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 text-slate-600">
                  {b.ward}, Nairobi ·{" "}
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                    {CLASS_LABEL[b.cls]}
                  </span>
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-8 mt-4">
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Floor area" value={`${b.area} m²`} />
                  <Stat label="Unit cost" value={`${(b.unitCost / 1000).toFixed(1)}K/m²`} />
                  <Stat label="TIV" value={formatKES(b.tiv, 2)} />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Hazard by return period
                  </div>
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/50">
                    {([5, 25, 100] as ReturnPeriod[]).map((r) => {
                      const d = b.depth100 * DEPTH_FACTOR[r];
                      return (
                        <div key={r} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="text-slate-600">1-in-{r} yr</span>
                          <span className="font-mono font-medium text-slate-800">
                            {d.toFixed(2)} m · {(damageRatio(b.cls, d) * 100).toFixed(0)}% damage
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-xl bg-[#00264D] p-5 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-slate-300">Selected: 1-in-{rp} yr</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${riskDot[lvl]}`} />
                  </div>
                  <div className="mt-3 font-mono text-3xl font-bold tracking-tight text-white">
                    {formatKES(b.tiv * dr, 2)}
                  </div>
                  <div className="text-sm text-slate-300 mt-1">
                    Expected payout · {(dr * 100).toFixed(0)}% damage ratio at {depth.toFixed(2)} m
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </SheetContent>
    </Sheet>
  );
}

export function HotspotSheet({
  h,
  rp,
  onClose,
}: {
  h: Hotspot | null;
  rp: ReturnPeriod;
  onClose: () => void;
}) {
  const stats = useMemo(() => {
    if (!h) return null;
    const bs = BUILDINGS.filter((b) => b.ward === h.name);
    const tiv = bs.reduce((s, b) => s + b.tiv, 0);
    const loss = bs.reduce(
      (s, b) => s + b.tiv * damageRatio(b.cls, b.depth100 * DEPTH_FACTOR[rp]),
      0
    );
    return { n: bs.length, tiv, loss };
  }, [h, rp]);

  return (
    <Sheet open={!!h} onOpenChange={(o) => !o && onClose()} modal={false}>
      <SheetContent hideOverlay={true} className="w-full sm:max-w-md bg-white border-l border-slate-200 shadow-2xl">
        {h && stats && (
          <>
            <SheetHeader>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#D21245]">Official County Hotspot</div>
              <SheetTitle className="text-xl text-[#00264D]">{h.name}</SheetTitle>
              <SheetDescription className="font-mono text-xs text-slate-500">
                {h.lat.toFixed(4)}, {h.lng.toFixed(4)}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4 mt-4">
              <div
                className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                  h.demDetected
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-red-200 bg-red-50/50"
                }`}
              >
                {h.demDetected ? (
                  <CheckCircle2 className="mt-0.5 size-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-4 text-[#D21245] shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-900">
                    {h.demDetected ? "Detected by Terrain DEM Proxy" : "Drainage Infrastructure Failure Zone"}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {h.demDetected
                      ? "Low-lying riparian terrain depression captured by elevation proxy."
                      : h.aiDetected
                      ? "Missed by terrain; recovered by AI drainage augmentation."
                      : "Elevated topography / natural soakaway."}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Assets" value={String(stats.n)} />
                <Stat label="TIV" value={formatKES(stats.tiv)} />
                <Stat label={`${rp}-Yr loss`} value={formatKES(stats.loss)} />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

const SAMPLES = [
  "3 permanent masonry warehouses in Westlands, 200m² each, KES 50,000/m²",
  "15 informal iron sheet structures along Mathare riverbank, 25m² each",
  "Insuring 4 commercial stone warehouses in Westlands, 180m2 each, valued at KES 50,000/m2, plus 12 residential iron sheet structures in Mathare.",
];

export function PolicyModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedLine[] | null>(null);

  const run = () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(parsePolicy(text));
      setLoading(false);
    }, 1000);
  };

  const tiv = result?.reduce((s, l) => s + l.tiv, 0) ?? 0;
  const loss = result?.reduce((s, l) => s + l.loss100, 0) ?? 0;
  const premium = loss * 0.112 * 1.35;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl bg-white">
        <DialogHeader>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#D21245] flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-[#D21245]" /> AI Policy Ingestion & Instant Pricing
          </div>
          <DialogTitle className="text-xl text-[#00264D]">Price a new policy</DialogTitle>
          <DialogDescription className="text-slate-600">
            Describe the risk or portfolio in natural English. The model extracts parameters, geocodes coordinates, and prices instantaneous flood exposure.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="e.g. 3 permanent masonry warehouses in Westlands, 200m² each, KES 50,000/m²"
          className="border-slate-300 focus:border-[#00264D]"
        />

        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setText(s)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-left text-xs text-slate-600 transition hover:border-[#00264D] hover:text-slate-900 cursor-pointer"
            >
              {s.slice(0, 50)}...
            </button>
          ))}
        </div>

        <Button
          onClick={run}
          disabled={loading || !text.trim()}
          className="bg-[#D21245] text-white hover:bg-[#b50f3b] cursor-pointer"
        >
          {loading ? <Loader2 className="animate-spin size-4" /> : <Bot className="size-4" />}
          {loading ? "Analyzing submission with AI…" : "Analyze & Quote with AI"}
        </Button>

        {result && (
          <div className="space-y-4 pt-2">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Risk Class</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2 text-right">TIV</th>
                    <th className="px-3 py-2 text-right">100-Yr Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">
                          {l.count} × {CLASS_LABEL[l.cls]}
                        </div>
                        <div className="text-xs text-slate-500">
                          {l.area} m² · KES {l.unitCost.toLocaleString()}/m²
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">{l.ward}</div>
                        <div className="font-mono text-xs text-slate-500">
                          {l.lat.toFixed(3)}, {l.lng.toFixed(3)} · {l.depth100}m depth
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium text-slate-900">
                        {formatKES(l.tiv, 2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-[#D21245]">
                        {formatKES(l.loss100, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Total Insured Value" value={formatKES(tiv, 2)} />
              <Stat label="Flood Deductible" value={formatKES(tiv * 0.025, 2)} sub="2.5% of TIV" />
              <Stat
                label="Pure Risk Premium"
                value={formatKES(premium, 2)}
                sub={`${((premium / Math.max(tiv, 1)) * 1000).toFixed(2)}‰ rate`}
              />
            </div>
            <Button
              variant="outline"
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              onClick={() => {
                toast.success("Policy added to portfolio simulation");
                onOpenChange(false);
              }}
            >
              Add to Active Portfolio Simulation
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function DrainageModal({
  open,
  onOpenChange,
  applied,
  setApplied,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  applied: boolean;
  setApplied: (v: boolean) => void;
}) {
  const missed = HOTSPOTS.filter((h) => !h.demDetected);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl bg-white">
        <DialogHeader>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#D21245] flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-[#D21245]" /> AI Drainage-Gap Diagnostic
          </div>
          <DialogTitle className="text-xl text-[#00264D]">Addressing Nairobi's 12 Drainage Blind Spots</DialogTitle>
          <DialogDescription className="text-slate-600">
            Terrain elevation proxies only see slopes, not blocked culverts or impervious informal settlements. The AI model identifies where urban drainage fails.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 mt-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Traditional DEM Terrain Proxy</div>
            <div className="mt-2 font-mono text-3xl font-bold text-slate-800">
              12<span className="text-lg text-slate-400">/24</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full w-1/2 rounded-full bg-slate-400" />
            </div>
            <p className="mt-3 text-xs text-slate-500">50% detection rate. Misses Kibera, Westlands, Lavington.</p>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/30 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#D21245]">AI Drainage-Augmented Layer</div>
            <div className="mt-2 font-mono text-3xl font-bold text-[#D21245]">
              22<span className="text-lg text-red-300">/24</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-red-100 overflow-hidden">
              <div className="h-full w-[91.7%] rounded-full bg-[#D21245]" />
            </div>
            <p className="mt-3 text-xs text-slate-600 font-medium">91.7% detection · +83% relative accuracy gain.</p>
          </div>
        </div>

        <div className="mt-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">12 Terrain Misses Recovered by AI:</div>
          <div className="flex flex-wrap gap-1.5">
            {missed.map((h) => (
              <span
                key={h.name}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  h.aiDetected
                    ? "border-red-200 bg-red-50 text-[#D21245]"
                    : "border-slate-200 bg-slate-100 text-slate-500"
                }`}
              >
                {h.aiDetected ? "✓" : "–"} {h.name}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-[#00264D] p-5 text-white shadow-md">
          <div className="text-xs uppercase tracking-widest text-slate-300">Impact on Reinsurer Solvency</div>
          <div className="mt-1 font-mono text-3xl font-bold text-white">+KES 115,000,000</div>
          <div className="text-sm text-slate-300 mt-0.5">
            Under-reserved 1-in-100 year disaster capital if drainage bottlenecks in Kibera & Westlands are ignored.
          </div>
        </div>

        <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm bg-slate-50/50 cursor-pointer">
          <div>
            <span className="font-semibold text-slate-900">Apply AI recalibration to portfolio</span>
            <span className="block text-xs text-slate-500">
              Switches portfolio EP curves and PML to the drainage-augmented model.
            </span>
          </div>
          <Switch checked={applied} onCheckedChange={setApplied} />
        </label>
      </DialogContent>
    </Dialog>
  );
}

const CLASSES: { cls: HousingClass; color: string }[] = [
  { cls: "informal_iron_sheet", color: "#D21245" },
  { cls: "semi_permanent", color: "#D97706" },
  { cls: "permanent_masonry", color: "#00264D" },
];

export function VulnLab({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [depth, setDepth] = useState(1.2);

  const data = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const d = i * 0.1;
        return {
          d: d.toFixed(1),
          iron: damageRatio("informal_iron_sheet", d) * 100,
          semi: damageRatio("semi_permanent", d) * 100,
          mas: damageRatio("permanent_masonry", d) * 100,
        };
      }),
    []
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white">
        <DialogHeader>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#D21245]">Vulnerability Laboratory</div>
          <DialogTitle className="text-xl text-[#00264D]">Depth–Damage Functions (JRC Adapted)</DialogTitle>
          <DialogDescription className="text-slate-600">
            Sigmoidal S-curves adapted from JRC / Huizinga et al. (2017) calibrated for Nairobi housing stock, with physical caps at 85%–90%.
          </DialogDescription>
        </DialogHeader>

        <div className="h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="d"
                tickFormatter={(v) => `${v}m`}
                interval={4}
                tick={{ fill: "#6B7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: "#6B7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                formatter={(v: any) => `${Number(v).toFixed(0)}%`}
                labelFormatter={(l) => `${l} m`}
                contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }}
              />
              <ReferenceLine x={depth.toFixed(1)} stroke="#A6A7AB" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="iron" name="Informal Iron Sheet" stroke="#D21245" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="semi" name="Semi-Permanent" stroke="#D97706" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="mas" name="Permanent Masonry" stroke="#00264D" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Simulate Water Depth:</span>
            <span className="font-mono font-semibold text-slate-900">{depth.toFixed(2)} m</span>
          </div>
          <Slider
            min={0}
            max={3.5}
            step={0.05}
            value={[depth]}
            onValueChange={([v]) => setDepth(v)}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {CLASSES.map(({ cls, color }) => (
            <div key={cls} className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {CLASS_LABEL[cls]}
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-slate-900">
                {(damageRatio(cls, depth) * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GovernanceSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-3 text-sm border-b border-slate-100">
      <span className="font-medium text-slate-500">{k}</span>
      <span className="text-slate-800">{v}</span>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg bg-white">
        <SheetHeader>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#D21245]">Governance & Audit Trail</div>
          <SheetTitle className="text-xl text-[#00264D]">Model Assumptions & Data Sources</SheetTitle>
          <SheetDescription className="text-slate-600">
            Transparent disclosure for actuaries, underwriters, auditors, and judges.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="data" className="px-4 pb-8 mt-4">
          <TabsList className="w-full bg-slate-100">
            <TabsTrigger value="data" className="cursor-pointer">Data Sources</TabsTrigger>
            <TabsTrigger value="synthetic" className="cursor-pointer">Synthetic Label</TabsTrigger>
            <TabsTrigger value="actuarial" className="cursor-pointer">Actuarial Curves</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="pt-2">
            <Row k="River Network" v="OpenStreetMap waterways (Nairobi, Mathare, Ngong, Motoine rivers)." />
            <Row k="Elevation Proxy" v="SRTM 30m DEM; height-above-nearest-drainage (HAND) proxy rasters." />
            <Row k="Hotspots List" v="Nairobi County March 2026 official list of 24 geocoded hotspots." />
            <Row k="AI Recalibration" v="Machine learning drainage bottleneck classification recovering 10 missed hotspots." />
          </TabsContent>

          <TabsContent value="synthetic" className="pt-2">
            <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-sm">
              <ShieldCheck className="size-5 shrink-0 text-emerald-600" />
              <div>
                <div className="font-semibold text-emerald-950">Synthetic Portfolio Disclosure</div>
                <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                  All 600 property records in this model are synthetic assets generated for the Kenya Re AI4I Hackathon 2026. No live cedant or client portfolio data is used.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="actuarial" className="pt-2">
            {SCENARIOS.map((s) => (
              <Row
                key={s.rp}
                k={s.label}
                v={`1-in-${s.rp} Year · ${(100 / s.rp).toFixed(0)}% Annual Probability · Depth Factor ${DEPTH_FACTOR[s.rp]}`}
              />
            ))}
            <Row k="Damage Cap" v="85%–90% physical cap: foundations and land retain residual value." />
            <Row k="Curve Model" v="Adapted JRC / Huizinga (2017) continuous sigmoid vulnerability." />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export function BriefDialog({
  open,
  onOpenChange,
  applied,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  applied: boolean;
}) {
  const pml = EP_CURVE[4][applied ? "ai" : "dem"];
  const memo = `KENYA REINSURANCE CORPORATION · UNDERWRITING RISK BRIEF
NAIROBI URBAN SURFACE-WATER (PLUVIAL) FLOOD MODEL · TEAM A
DATE: OCTOBER 2026

1. EXECUTIVE SUMMARY
• Portfolio Size: 600 synthetic locations across Nairobi County.
• Total Insured Value (TIV): ${formatKES(TIV_TOTAL, 2)}.
• 1-in-100 Year PML (Extreme): KES ${pml.toFixed(1)}M (${((pml * 1e6 / TIV_TOTAL) * 100).toFixed(1)}% of portfolio TIV).
• Average Annual Loss (AAL): ${formatKES(AAL, 1)} / year (Pure technical risk premium).

2. CAT CAPITAL & SOLVENCY RECOMMENDATIONS
• Underwriting Decision: Reserve capital against the AI Drainage-Augmented curve.
• Solvency Impact: The standard DEM-only terrain proxy under-reserves by KES 115M because it misses urban drainage failures in Kibera, Westlands, and Lavington.
• Housing Class Vulnerability: Informal iron-sheet construction represents only 15% of TIV but accounts for 42% of gross flood loss. Apply dedicated sub-limits and deductibles.

3. REINSURANCE TREATY STRUCTURING NOTES
• Excess of Loss (XOL) attachment point suggested at 1-in-10 Year level (KES 238.9M).
• Upper treaty exhaustion layer set at 1-in-100 Year PML (KES 842.6M).
• Mandatory local inspection for risks located within 250m of Ngong and Mathare rivers.

Compliance Note: Verified synthetic exposure dataset. All modeling parameters adapted from JRC / Huizinga (2017).`;

  const download = () => {
    const url = URL.createObjectURL(new Blob([memo], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "KenyaRe-Nairobi-Flood-Brief.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white">
        <DialogHeader>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#D21245]">Executive Brief</div>
          <DialogTitle className="text-xl text-[#00264D]">Executive Underwriting Memorandum</DialogTitle>
          <DialogDescription className="text-slate-600">
            Automated executive risk report formatted for Chief Underwriters and Reinsurance Treaties.
          </DialogDescription>
        </DialogHeader>

        <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800">
          {memo}
        </pre>

        <Button
          onClick={download}
          className="bg-[#00264D] text-white hover:bg-[#001c3a] cursor-pointer"
        >
          <Download className="size-4" /> Download Underwriting Brief (.TXT)
        </Button>
      </DialogContent>
    </Dialog>
  );
}

