"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Home,
  Activity,
  Shield,
  Building2,
  BarChart3,
  Cpu,
  Database,
  Settings,
  Menu,
  X,
  Play,
  Download,
  HelpCircle,
  AlertTriangle,
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/cat/AnimatedNumber";
import { EPChart } from "@/components/cat/EPChart";
import { VulnerabilityCurves } from "@/components/cat/VulnerabilityCurves";
import { MapProviderSwitcher, type MapProvider } from "@/components/cat/MapProviderSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import {
  AAL,
  BUILDINGS,
  SCENARIOS,
  TIV_TOTAL,
  EP_CURVE,
  type ReturnPeriod,
  type HousingClass,
} from "@/lib/cat-model";

// Dynamically import map components to avoid SSR issues
const RiskMapMapbox = dynamic(
  () => import("@/components/cat/RiskMap").then((mod) => mod.RiskMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading map...
      </div>
    ),
  }
);

const RiskMapDeckGL = dynamic(
  () => import("@/components/cat/RiskMapDeckGL").then((mod) => mod.RiskMapDeckGL),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading map...
      </div>
    ),
  }
);

type PanelType = "overview" | "hazard" | "vulnerability" | "exposure" | "loss" | "ai" | "assumptions";

const sidebarItems = [
  { id: "overview" as PanelType, label: "Overview", icon: Home },
  { id: "hazard" as PanelType, label: "Hazard", icon: Activity },
  { id: "vulnerability" as PanelType, label: "Vulnerability", icon: Shield },
  { id: "exposure" as PanelType, label: "Exposure", icon: Building2 },
  { id: "loss" as PanelType, label: "Loss & EP", icon: BarChart3 },
  { id: "ai" as PanelType, label: "AI Insights", icon: Cpu },
  { id: "assumptions" as PanelType, label: "Data & Assumptions", icon: Database },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activePanel, setActivePanel] = useState<PanelType>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scenario, setScenario] = useState<ReturnPeriod>(25);
  const [isRunning, setIsRunning] = useState(false);

  const currentScenario = SCENARIOS.find((s) => s.rp === scenario)!;
  const currentEP = EP_CURVE.find((p) => p.rp === scenario)!;

  const handleRunModel = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 sm:px-6">
          {/* Left: Logo + Title + Synthetic Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img src="image.png" alt="Kenya Re" className="h-8 w-8 rounded" />
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-[#00264D]">Kenya Re CAT Risk Intelligence</div>
              </div>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">
              <AlertTriangle className="size-3" />
              Synthetic Data
            </span>
          </div>

          {/* Center: Scenario Selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={scenario}
                onChange={(e) => setScenario(Number(e.target.value) as ReturnPeriod)}
                className="appearance-none rounded-lg border border-slate-300 bg-white px-4 py-2 pr-8 text-sm font-medium text-slate-700 hover:border-slate-400 focus:border-[#00264D] focus:outline-none focus:ring-2 focus:ring-[#00264D]/20"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.rp} value={s.rp}>
                    {s.label} ({s.short})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            </div>
            <Button
              onClick={handleRunModel}
              disabled={isRunning}
              className="bg-[#D21245] text-white hover:bg-[#B50F3B]"
            >
              <Play className="mr-2 size-4" />
              {isRunning ? "Running..." : "Run Model"}
            </Button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setActivePanel("ai")}>
              <Cpu className="mr-2 size-4" />
              AI Briefing
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 size-4" />
              Export
            </Button>
            <Button variant="ghost" size="sm">
              <HelpCircle className="size-4" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-2">
              <span className="text-xs text-slate-600">Guest mode</span>
              <User className="size-4 text-slate-500" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-slate-600 hover:text-red-600"
              title="Logout"
            >
              <LogOut className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform lg:relative lg:transform-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <nav className="flex h-full flex-col p-4">
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePanel(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    activePanel === item.id
                      ? "bg-[#00264D] text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-auto pt-4 border-t border-slate-200">
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <Settings className="size-5" />
                Settings
              </button>
            </div>
          </nav>
        </aside>

        {/* MOBILE OVERLAY */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* PANEL CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activePanel === "overview" && <OverviewPanel scenario={scenario} />}
          {activePanel === "hazard" && <HazardPanel scenario={scenario} />}
          {activePanel === "vulnerability" && <VulnerabilityPanel />}
          {activePanel === "exposure" && <ExposurePanel />}
          {activePanel === "loss" && <LossPanel scenario={scenario} />}
          {activePanel === "ai" && <AIPanel />}
          {activePanel === "assumptions" && <AssumptionsPanel />}
        </main>
      </div>
    </div>
  );
}

// PANEL COMPONENTS

function OverviewPanel({ scenario }: { scenario: ReturnPeriod }) {
  const currentEP = EP_CURVE.find((p) => p.rp === scenario)!;
  const currentLoss = currentEP.ai * 1e6;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00264D]">Portfolio Overview</h1>
        <p className="text-sm text-slate-600">
          Nairobi Flood CAT Model · {SCENARIOS.find((s) => s.rp === scenario)?.label} Scenario
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total TIV"
          value={<AnimatedNumber value={TIV_TOTAL} format={(v) => `KES ${(v / 1e9).toFixed(2)}B`} />}
          detail="600 properties"
        />
        <KPICard
          label={`Loss @ 1-in-${scenario}`}
          value={<AnimatedNumber value={currentLoss} format={(v) => `KES ${(v / 1e6).toFixed(1)}M`} />}
          detail={`${((currentLoss / TIV_TOTAL) * 100).toFixed(1)}% portfolio`}
          danger
        />
        <KPICard
          label="Buildings Exposed"
          value={BUILDINGS.length.toString()}
          detail="Synthetic portfolio"
        />
        <KPICard
          label="AAL"
          value={<AnimatedNumber value={AAL} format={(v) => `KES ${(v / 1e6).toFixed(1)}M`} />}
          detail="Annual expected loss"
        />
      </div>

      {/* Mini EP Curve */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">Exceedance Probability Curve</h3>
        <div className="h-64">
          <EPChart compare={false} rp={scenario} />
        </div>
      </div>

      {/* Top Exposed Locations */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">Top 5 Exposed Locations</h3>
        <div className="space-y-2">
          {BUILDINGS.slice(0, 5).map((b) => (
            <div key={b.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <div className="font-medium text-slate-900">{b.ward}</div>
                <div className="text-xs text-slate-500">{b.id}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-medium text-slate-900">
                  KES {(b.tiv / 1e6).toFixed(2)}M
                </div>
                <div className="text-xs text-slate-500">{b.cls.replace(/_/g, " ")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HazardPanel({ scenario }: { scenario: ReturnPeriod }) {
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [mapProvider, setMapProvider] = useState<MapProvider>("mapbox");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00264D]">Hazard Analysis</h1>
        <p className="text-sm text-slate-600">
          Flood susceptibility layers · {SCENARIOS.find((s) => s.rp === scenario)?.label} tier
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Switch between Mapbox GL and MapLibre GL + deck.gl to compare performance
        </div>
        <MapProviderSwitcher
          currentProvider={mapProvider}
          onProviderChange={setMapProvider}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-[500px]">
          {mapProvider === "mapbox" ? (
            <RiskMapMapbox
              rp={scenario}
              filter="all"
              showHotspots={true}
              selectedBuilding={selectedBuilding}
              selectedHotspot={null}
              onSelectBuilding={setSelectedBuilding}
              onSelectHotspot={() => {}}
            />
          ) : (
            <RiskMapDeckGL
              rp={scenario}
              filter="all"
              showHotspots={true}
              selectedBuilding={selectedBuilding}
              selectedHotspot={null}
              onSelectBuilding={setSelectedBuilding}
              onSelectHotspot={() => {}}
            />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900">Important Note</h4>
            <p className="text-sm text-amber-800">
              The hazard score is a constructed susceptibility proxy (0–1), not measured flood depth in metres.
              Do not interpret as physical water depth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VulnerabilityPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00264D]">Vulnerability Functions</h1>
        <p className="text-sm text-slate-600">Depth-damage curves by housing class</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">Damage Ratio vs Flood Depth</h3>
        <VulnerabilityCurves />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">Damage Parameters</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-semibold text-slate-900">Housing Class</th>
                <th className="text-left py-2 font-semibold text-slate-900">Damage Cap</th>
                <th className="text-left py-2 font-semibold text-slate-900">Steepness (k)</th>
                <th className="text-left py-2 font-semibold text-slate-900">Midpoint</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-700">Informal Iron Sheet</td>
                <td className="py-2 font-mono text-slate-900">90%</td>
                <td className="py-2 font-mono text-slate-900">3.2</td>
                <td className="py-2 font-mono text-slate-900">0.75</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-700">Semi-Permanent</td>
                <td className="py-2 font-mono text-slate-900">88%</td>
                <td className="py-2 font-mono text-slate-900">2.5</td>
                <td className="py-2 font-mono text-slate-900">1.15</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-700">Permanent Masonry</td>
                <td className="py-2 font-mono text-slate-900">85%</td>
                <td className="py-2 font-mono text-slate-900">2.0</td>
                <td className="py-2 font-mono text-slate-900">1.85</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ExposurePanel() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(BUILDINGS.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBuildings = BUILDINGS.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00264D]">Exposure Portfolio</h1>
        <p className="text-sm text-slate-600">600 synthetic buildings · Nairobi County</p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Download className="mr-2 size-4" />
          Download Template
        </Button>
        <Button variant="outline" size="sm">
          Upload CSV
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-[400px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-900">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-900">Ward</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-900">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-900">Area (m²)</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-900">TIV (KES)</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-900">Synthetic</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBuildings.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-slate-700">{b.id}</td>
                  <td className="px-4 py-2 text-slate-900">{b.ward}</td>
                  <td className="px-4 py-2 text-slate-700">{b.cls.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2 font-mono text-slate-900">{b.area}</td>
                  <td className="px-4 py-2 font-mono text-slate-900">{b.tiv.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      Yes
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, BUILDINGS.length)} of {BUILDINGS.length} buildings
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  className={currentPage === pageNum ? "bg-[#00264D] hover:bg-[#00264D]/90" : ""}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function LossPanel({ scenario }: { scenario: ReturnPeriod }) {
  const currentEP = EP_CURVE.find((p) => p.rp === scenario)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00264D]">Loss & Exceedance Probability</h1>
        <p className="text-sm text-slate-600">Financial engine output · {SCENARIOS.find((s) => s.rp === scenario)?.label}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">EP Curve</h3>
        <div className="h-80">
          <EPChart compare={true} rp={scenario} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">Loss Table by Return Period</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-semibold text-slate-900">Return Period</th>
                <th className="text-left py-2 font-semibold text-slate-900">Loss (KES M)</th>
                <th className="text-left py-2 font-semibold text-slate-900">Damage Ratio</th>
                <th className="text-left py-2 font-semibold text-slate-900">Exceedance Prob</th>
              </tr>
            </thead>
            <tbody>
              {EP_CURVE.map((ep) => (
                <tr key={ep.rp} className="border-b border-slate-100">
                  <td className="py-2 font-mono text-slate-900">1-in-{ep.rp} Year</td>
                  <td className="py-2 font-mono text-slate-900">{ep.ai.toFixed(1)}</td>
                  <td className="py-2 font-mono text-slate-900">{((ep.ai * 1e6) / TIV_TOTAL * 100).toFixed(2)}%</td>
                  <td className="py-2 font-mono text-slate-900">{ep.prob}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AIPanel() {
  const [briefing, setBriefing] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBriefing = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setBriefing(
        "Based on the current Nairobi flood model analysis, the portfolio shows moderate to high flood risk concentration in informal settlements along river corridors. The AI-augmented model identifies +KES 115M additional exposure from drainage gaps not captured by terrain-only analysis. Key hotspots include Kibera, Mathare, and Dandora where impervious surface runoff creates localized flooding. Recommended actions: prioritize drainage infrastructure in identified AI-detected hotspots and consider risk-based pricing for properties in high-risk zones."
      );
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00264D]">AI Insights</h1>
        <p className="text-sm text-slate-600">Natural-language risk briefing & exposure parser</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">AI Risk Briefing</h3>
        <Button onClick={generateBriefing} disabled={isGenerating} className="mb-4">
          <Cpu className="mr-2 size-4" />
          #{isGenerating ? "Generating..." : "Generate Briefing"}
        </Button>
        {briefing && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {briefing}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">Free-Text Exposure Parser</h3>
        <textarea
          placeholder="Describe a portfolio in natural language, e.g., '12 iron-sheet shops near the river in Dandora plus 5 permanent masonry offices in Westlands'"
          className="w-full h-32 rounded-lg border border-slate-300 p-3 text-sm focus:border-[#00264D] focus:outline-none focus:ring-2 focus:ring-[#00264D]/20"
        />
        <Button className="mt-2">
          Parse to Portfolio
        </Button>
      </div>
    </div>
  );
}

function AssumptionsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00264D]">Data & Assumptions</h1>
        <p className="text-sm text-slate-600">Provenance, methodology, and limitations</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">Data Provenance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-semibold text-slate-900">Data Source</th>
                <th className="text-left py-2 font-semibold text-slate-900">Type</th>
                <th className="text-left py-2 font-semibold text-slate-900">Source</th>
                <th className="text-left py-2 font-semibold text-slate-900">Limitations</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-900">Exposure Portfolio</td>
                <td className="py-2">
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    Synthetic
                  </span>
                </td>
                <td className="py-2 text-slate-700">Generated for hackathon</td>
                <td className="py-2 text-slate-600">Not real client data</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-900">Hazard Layer</td>
                <td className="py-2">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                    Proxy
                  </span>
                </td>
                <td className="py-2 text-slate-700">Terrain + river signals</td>
                <td className="py-2 text-slate-600">Misses drainage-driven flooding</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-900">Vulnerability Curves</td>
                <td className="py-2">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                    Adapted
                  </span>
                </td>
                <td className="py-2 text-slate-700">JRC/Huizinga curves</td>
                <td className="py-2 text-slate-600">Adapted for Nairobi context</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">Tier-to-Return-Period Mapping</h3>
        <div className="space-y-2">
          {SCENARIOS.map((s) => (
            <div key={s.rp} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-slate-900">{s.label}</span>
              <span className="font-mono text-slate-700">1-in-{s.rp} Year</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900">Key Limitations</h4>
            <ul className="mt-2 space-y-1 text-sm text-amber-800 list-disc list-inside">
              <li>Proxy hazard misses drainage-driven flooding patterns</li>
              <li>925m vs 31m cell size resolution differences</li>
              <li>Synthetic exposure does not represent real insured portfolio</li>
              <li>AI layer adds +KES 115M modeled correction based on drainage gaps</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  detail,
  danger = false,
}: {
  label: string;
  value: React.ReactNode;
  detail: string;
  danger?: boolean;
}) {
  return (
    <div className={`rounded-xl border ${danger ? "border-red-200 bg-red-50/20" : "border-slate-200 bg-white"} p-4 shadow-sm`}>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-2 font-mono text-2xl font-bold ${danger ? "text-red-700" : "text-slate-900"}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-600">{detail}</div>
    </div>
  );
}
