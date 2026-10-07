"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Plus,
  Sparkles,
  SlidersHorizontal,
  FileText,
  Map as MapIcon,
  TrendingUp,
  CheckCircle2,
  Activity,
  Layers,
  ChevronRight,
  Home,
  UserCheck,
  BarChart3,
  Building,
  Landmark,
  Briefcase,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  Sliders,
  DollarSign,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/cat/AnimatedNumber";
import { EPChart } from "@/components/cat/EPChart";
import {
  AssetSheet,
  BriefDialog,
  DrainageModal,
  GovernanceSheet,
  HotspotSheet,
  PolicyModal,
  VulnLab,
} from "@/components/cat/Overlays";
import {
  AAL,
  BUILDINGS,
  CLASS_LABEL,
  EP_CURVE,
  HOTSPOTS,
  SCENARIOS,
  TIV_TOTAL,
  type Building as BuildingType,
  type Hotspot,
  type HousingClass,
  type ReturnPeriod,
} from "@/lib/cat-model";

// Dynamically import Leaflet/Mapbox RiskMap on client-side only
const RiskMap = dynamic(
  () => import("@/components/cat/RiskMap").then((mod) => mod.RiskMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading Nairobi 3D GIS Risk Map...
      </div>
    ),
  }
);

const FILTERS: { key: HousingClass | "all"; label: string }[] = [
  { key: "all", label: "All Portfolio (600)" },
  { key: "informal_iron_sheet", label: "Informal Iron Sheet" },
  { key: "semi_permanent", label: "Semi-Permanent" },
  { key: "permanent_masonry", label: "Permanent Masonry" },
];

export default function ConsolePage() {
  const [rp, setRp] = useState<ReturnPeriod>(100);
  const [view, setView] = useState<"map" | "ep">("map");
  const [filter, setFilter] = useState<HousingClass | "all">("all");
  const [showHotspots, setShowHotspots] = useState(true);
  const [compare, setCompare] = useState(true);
  const [aiApplied, setAiApplied] = useState(true);

  // Active Stakeholder Filter Tag
  const [activeRole, setActiveRole] = useState<string>("all");

  // Modal / Drawer states (Progressive Disclosure)
  const [asset, setAsset] = useState<BuildingType | null>(null);
  const [hotspot, setHotspot] = useState<Hotspot | null>(null);
  const [policy, setPolicy] = useState(false);
  const [drainage, setDrainage] = useState(false);
  const [vuln, setVuln] = useState(false);
  const [gov, setGov] = useState(false);
  const [brief, setBrief] = useState(false);

  const point = EP_CURVE.find((p) => p.rp === rp)!;
  const currentLoss = (aiApplied ? point.ai : point.dem) * 1e6;
  const scen = SCENARIOS.find((s) => s.rp === rp)!;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col font-sans">
      {/* 1. Calm Top Navigation (Minimalist Institutional Header) */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-3">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex size-9 items-center justify-center rounded-lg bg-[#00264D] text-white font-bold text-xs shadow-xs tracking-wider hover:opacity-90 transition"
            >
              K<span className="text-[#D21245]">R</span>
            </Link>
            <div>
              <div className="text-sm font-bold tracking-tight text-[#00264D] flex items-center gap-2">
                <Link href="/" className="hover:underline">KENYA RE</Link> · CAT RISK CONSOLE
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
                  Nairobi Pluvial
                </span>
              </div>
              <div className="text-xs text-slate-500">Live Multi-Stakeholder Catastrophe Modeling Platform</div>
            </div>
          </div>

          {/* Nav Links & Segmented Scenario Selector Pills */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition"
            >
              <Home className="size-3.5" /> Overview & Docs
            </Link>

            <div className="inline-flex rounded-full border border-slate-200 bg-slate-100/80 p-1 shadow-inner">
              {SCENARIOS.map((s) => (
                <button
                  key={s.rp}
                  onClick={() => setRp(s.rp)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                    rp === s.rp
                      ? "bg-[#00264D] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {s.short}
                  <span className="hidden md:inline text-[11px] opacity-75">
                    {s.rp === 5 ? " · Common" : s.rp === 100 ? " · Extreme" : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDrainage(true)}
              className="border-red-200 bg-red-50/50 text-[#D21245] hover:bg-red-50 hover:text-[#b50f3b] cursor-pointer"
            >
              <Sparkles className="size-3.5" /> AI Drainage Audit
            </Button>
            <Button
              size="sm"
              onClick={() => setPolicy(true)}
              className="bg-[#D21245] text-white hover:bg-[#b50f3b] shadow-xs cursor-pointer"
            >
              <Plus className="size-3.5" /> Price New Policy
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Model Assumptions & Audit Trail"
              onClick={() => setGov(true)}
              className="text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <SlidersHorizontal className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Main Multi-Stakeholder Workspace */}
      <div className="mx-auto w-full max-w-[1500px] flex-1 px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* ========================================================= */}
        {/* LEFT SIDEBAR: STAKEHOLDER WORKFLOW ENTRIES (WITH LINE BREAKS) */}
        {/* ========================================================= */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00264D]">
                Stakeholder Portals
              </span>
              <span className="text-[10px] font-semibold text-slate-400">5 Roles</span>
            </div>

            <div className="space-y-4 text-xs">
              {/* ROLE 1: UNDERWRITERS */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <UserCheck className="size-3.5 text-[#00264D]" />
                  <span>Underwriters</span>
                </div>
                <div className="space-y-1 pl-4">
                  <button
                    onClick={() => setPolicy(true)}
                    className="w-full text-left py-1 px-2 rounded text-slate-600 hover:text-[#D21245] hover:bg-slate-50 transition flex items-center justify-between group cursor-pointer"
                  >
                    <span>• Price Policy (AI NLP)</span>
                    <Sparkles className="size-3 text-[#D21245] opacity-0 group-hover:opacity-100" />
                  </button>
                  <button
                    onClick={() => {
                      setView("map");
                      if (BUILDINGS[0]) setAsset(BUILDINGS[0]);
                    }}
                    className="w-full text-left py-1 px-2 rounded text-slate-600 hover:text-[#00264D] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>• Single Risk Lookup</span>
                  </button>
                  <button
                    onClick={() => setPolicy(true)}
                    className="w-full text-left py-1 px-2 rounded text-slate-600 hover:text-[#00264D] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>• Rate & Deductible Calc</span>
                  </button>
                </div>
              </div>

              {/* LINE BREAK 1 */}
              <hr className="border-slate-200" />

              {/* ROLE 2: RISK ANALYSTS */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <BarChart3 className="size-3.5 text-[#00264D]" />
                  <span>Risk Analysts</span>
                </div>
                <div className="space-y-1 pl-4">
                  <button
                    onClick={() => setView("ep")}
                    className={`w-full text-left py-1 px-2 rounded transition cursor-pointer ${
                      view === "ep" ? "bg-slate-100 font-bold text-[#00264D]" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>• Exceedance Curve (EP)</span>
                  </button>
                  <button
                    onClick={() => setVuln(true)}
                    className="w-full text-left py-1 px-2 rounded text-slate-600 hover:text-[#00264D] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>• JRC Vulnerability S-Curves</span>
                  </button>
                  <button
                    onClick={() => setGov(true)}
                    className="w-full text-left py-1 px-2 rounded text-slate-600 hover:text-[#00264D] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>• AAL & Model Parameters</span>
                  </button>
                  <button
                    onClick={() => {
                      setView("ep");
                      setCompare(!compare);
                    }}
                    className="w-full text-left py-1 px-2 rounded text-slate-600 hover:text-[#D21245] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>• DEM vs AI Model Variance</span>
                  </button>
                </div>
              </div>

              {/* LINE BREAK 2 */}
              <hr className="border-slate-200" />

              {/* ROLE 3: PORTFOLIO / EXPOSURE MANAGERS */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Building className="size-3.5 text-[#00264D]" />
                  <span>Portfolio / Exposure Managers</span>
                </div>
                <div className="space-y-1 pl-4">
                  <button
                    onClick={() => {
                      setView("map");
                      setFilter("all");
                    }}
                    className={`w-full text-left py-1 px-2 rounded transition cursor-pointer ${
                      view === "map" && filter === "all" ? "bg-slate-100 font-bold text-[#00264D]" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>• 3D Spatial Accumulation</span>
                  </button>
                  <button
                    onClick={() => {
                      setRp(100);
                      setView("ep");
                    }}
                    className="w-full text-left py-1 px-2 rounded text-slate-600 hover:text-[#D21245] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>• 1-in-100 Yr PML Stress Test</span>
                  </button>
                  <button
                    onClick={() => {
                      setView("map");
                      setFilter("informal_iron_sheet");
                    }}
                    className={`w-full text-left py-1 px-2 rounded transition cursor-pointer ${
                      filter === "informal_iron_sheet" ? "bg-red-50 text-[#D21245] font-bold" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>• Informal Stock Sub-Limits</span>
                  </button>
                  <button
                    onClick={() => {
                      setView("map");
                      setFilter("permanent_masonry");
                    }}
                    className={`w-full text-left py-1 px-2 rounded transition cursor-pointer ${
                      filter === "permanent_masonry" ? "bg-slate-100 font-bold text-[#00264D]" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>• Permanent Masonry Assets</span>
                  </button>
                </div>
              </div>

              {/* LINE BREAK 3 */}
              <hr className="border-slate-200" />

              {/* ROLE 4: COUNTY & DISASTER MANAGEMENT BODIES */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Landmark className="size-3.5 text-[#00264D]" />
                  <span>County & Disaster Bodies</span>
                </div>
                <div className="space-y-1 pl-4">
                  <button
                    onClick={() => {
                      setView("map");
                      setShowHotspots(true);
                      if (HOTSPOTS[0]) setHotspot(HOTSPOTS[0]);
                    }}
                    className="w-full text-left py-1 px-2 rounded text-slate-600 hover:text-[#00264D] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>• 24 Official Hotspots Map</span>
                  </button>
                  <button
                    onClick={() => setDrainage(true)}
                    className="w-full text-left py-1 px-2 rounded text-slate-600 hover:text-[#D21245] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>• Drainage Bottleneck Audit</span>
                  </button>
                  <button
                    onClick={() => {
                      setView("map");
                      setFilter("informal_iron_sheet");
                      setShowHotspots(true);
                    }}
                    className="w-full text-left py-1 px-2 rounded text-slate-600 hover:text-[#00264D] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>• Informal Riverway Zones</span>
                  </button>
                </div>
              </div>

              {/* LINE BREAK 4 */}
              <hr className="border-slate-200" />

              {/* ROLE 5: CEDANTS & BROKERS */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Briefcase className="size-3.5 text-[#00264D]" />
                  <span>Cedants & Brokers</span>
                </div>
                <div className="space-y-1 pl-4">
                  <button
                    onClick={() => {
                      setRp(10);
                      setView("ep");
                    }}
                    className="w-full text-left py-1 px-2 rounded text-slate-600 hover:text-[#00264D] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>• XOL Treaty Attachment (1-in-10y)</span>
                  </button>
                  <button
                    onClick={() => setBrief(true)}
                    className="w-full text-left py-1 px-2 rounded text-slate-600 hover:text-[#00264D] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>• Reinsurance Placement Brief</span>
                  </button>
                  <button
                    onClick={() => setDrainage(true)}
                    className="w-full text-left py-1 px-2 rounded text-slate-600 hover:text-[#D21245] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>• Solvency Buffer (+KES 115M)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Link to User Flows Doc */}
            <div className="pt-2 border-t border-slate-100">
              <a
                href="/STAKEHOLDER_USER_FLOWS.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#00264D]"
              >
                <span>View User Flow Diagrams</span>
                <ChevronRight className="size-3" />
              </a>
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* RIGHT WORKSPACE: METRICS + MAP / EP CANVAS */}
        {/* ========================================================= */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Context Bar */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Portfolio Overview · {scen.label} Disaster Scenario (1-in-{rp} Year)
              </div>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-[#00264D]">
                Nairobi Urban Flood Accumulation & Loss
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800">
                <CheckCircle2 className="size-3.5 text-emerald-600" /> Synthetic Portfolio Verified
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBrief(true)}
                className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <FileText className="size-3.5" /> Export Underwriting Brief
              </Button>
            </div>
          </div>

          {/* 3 Glanceable Executive KPI Cards */}
          <section className="grid gap-4 sm:grid-cols-3">
            {/* Card 1: Total Exposure */}
            <div
              onClick={() => {
                setView("map");
                setFilter("all");
              }}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-[#00264D]/50 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>Total Insured Value (TIV)</span>
                <Layers className="size-4 text-slate-400 group-hover:text-[#00264D]" />
              </div>
              <div className="mt-2 font-mono text-3xl font-bold text-[#00264D]">
                <AnimatedNumber value={TIV_TOTAL} format={(v) => `KES ${(v / 1e9).toFixed(2)}B`} />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>600 properties · Nairobi County</span>
                <span className="font-medium text-[#00264D] opacity-0 transition group-hover:opacity-100 flex items-center">
                  Explore map <ChevronRight className="size-3 ml-0.5" />
                </span>
              </div>
            </div>

            {/* Card 2: 1-in-RP PML */}
            <div
              onClick={() => setView("ep")}
              className="group rounded-xl border border-red-200 bg-red-50/20 p-5 shadow-xs transition hover:border-[#D21245] hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#D21245]">
                <span>1-in-{rp} Year PML Loss</span>
                <TrendingUp className="size-4 text-[#D21245]" />
              </div>
              <div className="mt-2 font-mono text-3xl font-bold text-[#D21245]">
                <AnimatedNumber value={currentLoss} format={(v) => `KES ${(v / 1e6).toFixed(1)}M`} />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                <span>
                  {((currentLoss / TIV_TOTAL) * 100).toFixed(1)}% portfolio loss · {scen.label} tier
                </span>
                <span className="font-medium text-[#D21245] opacity-0 transition group-hover:opacity-100 flex items-center">
                  Inspect curve <ChevronRight className="size-3 ml-0.5" />
                </span>
              </div>
            </div>

            {/* Card 3: AAL */}
            <div
              onClick={() => setGov(true)}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-[#00264D]/50 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>Average Annual Loss (AAL)</span>
                <Activity className="size-4 text-slate-400 group-hover:text-[#00264D]" />
              </div>
              <div className="mt-2 font-mono text-3xl font-bold text-slate-900">
                <AnimatedNumber value={AAL} format={(v) => `KES ${(v / 1e6).toFixed(1)}M/yr`} />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Pure annual risk premium</span>
                <span className="font-medium text-slate-700 opacity-0 transition group-hover:opacity-100 flex items-center">
                  Audit parameters <ChevronRight className="size-3 ml-0.5" />
                </span>
              </div>
            </div>
          </section>

          {/* Focused Hero Canvas (Spatial Map vs EP Curve Toggle) */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* Canvas Header & Filter Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 bg-slate-50/50">
              {/* View Switcher Pill */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
                <button
                  onClick={() => setView("map")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                    view === "map"
                      ? "bg-[#00264D] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <MapIcon className="size-3.5" /> 3D Spatial Risk Map
                </button>
                <button
                  onClick={() => setView("ep")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                    view === "ep"
                      ? "bg-[#00264D] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <TrendingUp className="size-3.5" /> Exceedance Probability (EP)
                </button>
              </div>

              {/* Context Controls depending on active view */}
              {view === "map" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1">
                    {FILTERS.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                          filter === f.key
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowHotspots(!showHotspots)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                      showHotspots
                        ? "border-[#00264D] bg-[#00264D]/10 text-[#00264D]"
                        : "border-slate-300 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {showHotspots ? "✓ 24 Hotspots Active" : "+ Show Hotspots"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCompare(!compare)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                      compare
                        ? "border-[#D21245] bg-red-50 text-[#D21245]"
                        : "border-slate-300 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {compare ? "✓ Overlay DEM Baseline" : "+ Compare DEM Baseline"}
                  </button>
                  <button
                    onClick={() => setVuln(true)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
                  >
                    Inspect JRC Vulnerability Curves →
                  </button>
                </div>
              )}
            </div>

            {/* Canvas Body (Map or Chart) */}
            <div className="h-[520px] w-full relative">
              {view === "map" ? (
                <RiskMap
                  rp={rp}
                  filter={filter}
                  showHotspots={showHotspots}
                  selectedBuilding={asset}
                  selectedHotspot={hotspot}
                  onSelectBuilding={(b) => setAsset(b)}
                  onSelectHotspot={(h) => setHotspot(h)}
                />
              ) : (
                <div className="h-full p-4">
                  <EPChart compare={compare} rp={rp} />
                </div>
              )}
            </div>

            {/* Canvas Footer Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-5 py-3 text-xs bg-slate-50/50">
              {view === "map" ? (
                <>
                  <div className="flex items-center gap-4 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-emerald-600" /> Low Risk (&lt; 8% damage)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-amber-500" /> Moderate (8% - 35%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-[#D21245]" /> Severe (&gt; 35% damage)
                    </span>
                  </div>
                  <div className="text-slate-500 hidden sm:block">
                    Click any marker to zoom in 3D and inspect asset risk dossier
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium text-[#D21245]">
                      <span className="h-0.5 w-4 bg-[#D21245]" /> AI-Augmented Model
                    </span>
                    {compare && (
                      <span className="flex items-center gap-1.5 font-medium text-[#00264D]">
                        <span className="h-0.5 w-4 border-t border-dashed border-[#00264D]" /> DEM Terrain Baseline
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500">
                    Calculated from vectorized asset-level loss across 5 return period tiers
                  </div>
                </>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* 3. Minimalist Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Kenya Re AI4I Hackathon 2026</span> · Team A Nairobi Urban Flood CAT Model
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-900">
              Overview & Documentation
            </Link>
            <button
              onClick={() => setGov(true)}
              className="hover:text-slate-900 cursor-pointer"
            >
              Methodology & Assumptions
            </button>
            <button
              onClick={() => setVuln(true)}
              className="hover:text-slate-900 cursor-pointer"
            >
              Vulnerability Functions
            </button>
            <button
              onClick={() => setBrief(true)}
              className="hover:text-slate-900 cursor-pointer"
            >
              Export Report
            </button>
          </div>
        </div>
      </footer>

      {/* 4. On-Demand Modals and Slide-Over Drawers (Progressive Disclosure) */}
      <AssetSheet b={asset} rp={rp} onClose={() => setAsset(null)} />
      <HotspotSheet h={hotspot} rp={rp} onClose={() => setHotspot(null)} />
      <PolicyModal open={policy} onOpenChange={setPolicy} />
      <DrainageModal
        open={drainage}
        onOpenChange={setDrainage}
        applied={aiApplied}
        setApplied={setAiApplied}
      />
      <VulnLab open={vuln} onOpenChange={setVuln} />
      <GovernanceSheet open={gov} onOpenChange={setGov} />
      <BriefDialog open={brief} onOpenChange={setBrief} applied={aiApplied} />
    </div>
  );
}
