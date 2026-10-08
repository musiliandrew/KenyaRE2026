"use client";

import { useState } from "react";
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
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/cat/AnimatedNumber";
import { EPChart } from "@/components/cat/EPChart";
import { VulnerabilityCurves } from "@/components/cat/VulnerabilityCurves";
import { PropertyTable } from "@/components/cat/PropertyTable";
import { RiskBriefing } from "@/components/cat/RiskBriefing";
import { AIExposureForm } from "@/components/cat/AIExposureForm";
import { MapProviderSwitcher, type MapProvider } from "@/components/cat/MapProviderSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import {
  api,
  formatKES,
  RP_LIST,
  CLASS_LABEL,
  type RP,
  type HousingClass,
  type ReturnPeriodMetric,
  type ExposureAsset,
  type Hotspot,
  type PortfolioSummary,
  type EPCurveResponse,
  type RunModelResponse,
} from "@/lib/api";

// Dynamically import map components to avoid SSR issues
const RiskMapMapbox = dynamic(
  () => import("@/components/cat/RiskMap").then((mod) => mod.RiskMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading 3D Mapbox...
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
        Loading MapLibre GL...
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
  const [scenario, setScenario] = useState<RP>("25y");
  const [applyAI, setApplyAI] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunResult, setLastRunResult] = useState<RunModelResponse | null>(null);

  // Live backend data hooks
  const {
    data: summary,
    loading: summaryLoading,
    refetch: refetchSummary,
  } = useApi(() => api.portfolioSummary(scenario), [scenario]);

  const {
    data: epData,
    loading: epLoading,
    refetch: refetchEP,
  } = useApi(() => api.epCurve(applyAI), [applyAI]);

  const {
    data: assetsData,
    loading: assetsLoading,
    refetch: refetchAssets,
  } = useApi(() => api.exposureAssets(scenario, { limit: 100 }), [scenario]);

  const {
    data: hotspotsData,
    loading: hotspotsLoading,
    refetch: refetchHotspots,
  } = useApi(() => api.hazardHotspots(scenario), [scenario]);

  const handleRunModel = async () => {
    setIsRunning(true);
    try {
      const res = await api.runModel(scenario, applyAI);
      setLastRunResult(res);
      toast.success(
        `CAT Model Run Complete: ${formatKES(res.portfolio_loss_kes)} estimated event loss across ${res.asset_count} exposed buildings.`
      );
      refetchSummary();
      refetchEP();
      refetchAssets();
    } catch (err: any) {
      toast.error(err.message || "Failed to execute model run");
    } finally {
      setIsRunning(false);
    }
  };

  const currentScenarioMeta = RP_LIST.find((s) => s.rp === scenario) || RP_LIST[2];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 sm:px-6">
          {/* Left: Logo + Title + Synthetic Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img src="/image.png" alt="Kenya Re" className="h-8 w-8 rounded" />
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-[#00264D]">Kenya Re CAT Risk Intelligence</div>
                <div className="text-[10px] text-slate-500 font-medium">Nairobi Urban Pluvial Flood Model</div>
              </div>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live API
            </span>
          </div>

          {/* Center: Scenario Selector & AI Toggle & Run Button */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value as RP)}
                className="appearance-none rounded-lg border border-slate-300 bg-white px-3 py-1.5 pr-8 text-xs sm:text-sm font-medium text-slate-700 hover:border-slate-400 focus:border-[#00264D] focus:outline-none focus:ring-2 focus:ring-[#00264D]/20 cursor-pointer"
              >
                {RP_LIST.map((s) => (
                  <option key={s.rp} value={s.rp}>
                    {s.label} ({s.short})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setApplyAI(!applyAI)}
              className={`text-xs ${
                applyAI
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold"
                  : "text-slate-600"
              }`}
              title="Toggle AI Drainage Network Correction"
            >
              <Sparkles className="mr-1 size-3.5 text-emerald-600" />
              AI: {applyAI ? "ON" : "OFF"}
            </Button>

            <Button
              onClick={handleRunModel}
              disabled={isRunning}
              className="bg-[#D21245] text-white hover:bg-[#B50F3B] text-xs sm:text-sm cursor-pointer shadow-xs"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-1.5 size-3.5 fill-current" />
                  Run Model
                </>
              )}
            </Button>
          </div>

          {/* Right: Actions & User */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setActivePanel("ai")}>
              <Cpu className="mr-1.5 size-3.5" />
              AI Briefing
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const csvData = "data:text/csv;charset=utf-8,loc_id,ward,tiv_kes,loss_kes\n";
                const encoded = encodeURI(csvData);
                const link = document.createElement("a");
                link.setAttribute("href", encoded);
                link.setAttribute("download", `kenya_re_cat_${scenario}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Export initiated");
              }}
            >
              <Download className="mr-1.5 size-3.5" />
              Export
            </Button>
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-2">
              <span className="text-xs text-slate-600 font-medium">{user?.name || "Actuary"}</span>
              <User className="size-4 text-slate-500" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-slate-600 hover:text-red-600 cursor-pointer"
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
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
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

            {/* Sub-navigation shortcuts */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tools</div>
              <Link
                href="/console/quotes"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Facultative Underwriter
              </Link>
              <Link
                href="/console/data"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Exposure Data & Slip Parser
              </Link>
              <Link
                href="/console/reports"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Executive Risk Dossiers
              </Link>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-200">
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-[11px] text-slate-600">
                <div className="font-semibold text-slate-800">JRC Vulnerability Curves</div>
                <div>Huizinga Nairobi Adaptation</div>
              </div>
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
          {activePanel === "overview" && (
            <OverviewPanel
              scenario={scenario}
              summary={summary}
              epData={epData}
              assets={assetsData?.assets}
              isLoading={summaryLoading}
            />
          )}
          {activePanel === "hazard" && (
            <HazardPanel
              scenario={scenario}
              assets={assetsData?.assets}
              hotspots={hotspotsData}
            />
          )}
          {activePanel === "vulnerability" && <VulnerabilityPanel />}
          {activePanel === "exposure" && <ExposurePanel rp={scenario} />}
          {activePanel === "loss" && (
            <LossPanel
              scenario={scenario}
              epData={epData}
              summary={summary}
              lastRun={lastRunResult}
            />
          )}
          {activePanel === "ai" && <AIPanel scenario={scenario} />}
          {activePanel === "assumptions" && <AssumptionsPanel />}
        </main>
      </div>
    </div>
  );
}

// ==========================================
// PANEL COMPONENTS (LIVE API DRIVEN)
// ==========================================

function OverviewPanel({
  scenario,
  summary,
  epData,
  assets,
  isLoading,
}: {
  scenario: RP;
  summary: PortfolioSummary | null;
  epData: EPCurveResponse | null;
  assets?: ExposureAsset[];
  isLoading: boolean;
}) {
  const tiv = summary?.tiv_kes ?? 63635340000;
  const eventLoss = summary?.event_loss_kes ?? 0;
  const aal = summary?.aal_kes ?? 14980000;
  const assetCount = summary?.asset_count ?? 600;
  const lossRatio = summary?.loss_ratio ?? (tiv > 0 ? (eventLoss / tiv) * 100 : 0);

  const scenarioMeta = RP_LIST.find((s) => s.rp === scenario) || RP_LIST[2];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[#00264D]">Portfolio Overview</h1>
          <p className="text-sm text-slate-600">
            Nairobi Urban Flood Model · {scenarioMeta.label} ({scenarioMeta.short}) Return Period
          </p>
        </div>
        {summary?.synthetic_notice && (
          <div className="text-[11px] text-slate-500 bg-slate-100 rounded-md px-2.5 py-1">
            {summary.synthetic_notice}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Insured Value (TIV)"
          value={<AnimatedNumber value={tiv} format={(v) => formatKES(v)} />}
          detail={`${assetCount} geocoded properties`}
        />
        <KPICard
          label={`Event Loss @ ${scenarioMeta.short}`}
          value={<AnimatedNumber value={eventLoss} format={(v) => formatKES(v)} />}
          detail={`${lossRatio.toFixed(3)}% of portfolio TIV`}
          danger={lossRatio > 0.05}
        />
        <KPICard
          label="Annual Average Loss (AAL)"
          value={<AnimatedNumber value={aal} format={(v) => formatKES(v)} />}
          detail="Trapezoidal integral across return periods"
        />
        <KPICard
          label="100-Yr PML"
          value={<AnimatedNumber value={summary?.pml_100y_kes ?? 0} format={(v) => formatKES(v)} />}
          detail="Probable Maximum Loss (1-in-100yr)"
        />
      </div>

      {/* Mini EP Curve */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#00264D]">Exceedance Probability Curve</h3>
            <p className="text-xs text-slate-500">Side-by-side comparison of baseline vs AI-augmented drainage loss</p>
          </div>
          {epData?.baseline_aal_kes && epData.aal_kes && (
            <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              AI Delta: +{formatKES(epData.aal_kes - epData.baseline_aal_kes)} AAL
            </div>
          )}
        </div>
        <div className="h-64">
          <EPChart compare={false} rp={scenario} metrics={epData?.metrics ?? []} />
        </div>
      </div>

      {/* Top Exposed Locations */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">Top Exposed Locations</h3>
        <div className="space-y-2">
          {assets && assets.length > 0 ? (
            assets.slice(0, 5).map((b) => (
              <div key={b.loc_id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <div className="font-medium text-slate-900">{b.name || b.ward}</div>
                  <div className="text-xs text-slate-500 font-mono">{b.loc_id} · {b.ward}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold text-slate-900">
                    {formatKES(b.tiv_kes)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {CLASS_LABEL[b.housing_class] || b.housing_class}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-sm text-slate-500">Loading top exposed assets...</div>
          )}
        </div>
      </div>
    </div>
  );
}

function HazardPanel({
  scenario,
  assets,
  hotspots,
}: {
  scenario: RP;
  assets?: ExposureAsset[];
  hotspots?: Hotspot[] | null;
}) {
  const [selectedBuilding, setSelectedBuilding] = useState<ExposureAsset | null>(null);
  const [mapProvider, setMapProvider] = useState<MapProvider>("mapbox");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[#00264D]">Hazard Analysis</h1>
          <p className="text-sm text-slate-600">
            Nairobi raster flood susceptibility layer · {RP_LIST.find((s) => s.rp === scenario)?.label} ({scenario})
          </p>
        </div>
        <MapProviderSwitcher
          currentProvider={mapProvider}
          onProviderChange={setMapProvider}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-[520px]">
          {mapProvider === "mapbox" ? (
            <RiskMapMapbox
              rp={scenario}
              filter="all"
              showHotspots={true}
              assets={assets}
              hotspots={hotspots || undefined}
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
              assets={assets}
              hotspots={hotspots || undefined}
              selectedBuilding={selectedBuilding}
              selectedHotspot={null}
              onSelectBuilding={setSelectedBuilding}
              onSelectHotspot={() => {}}
            />
          )}
        </div>
      </div>

      {selectedBuilding && (
        <div className="rounded-xl border border-[#00264D]/20 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#D21245]">Selected Asset</div>
            <div className="text-lg font-bold text-[#00264D]">{selectedBuilding.name || selectedBuilding.loc_id}</div>
            <div className="text-xs text-slate-600">
              Ward: {selectedBuilding.ward} · Class: {CLASS_LABEL[selectedBuilding.housing_class]} · Hazard Score: {selectedBuilding.hazard_score.toFixed(3)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase font-semibold">TIV Exposure</div>
            <div className="text-xl font-bold font-mono text-slate-900">{formatKES(selectedBuilding.tiv_kes)}</div>
            <div className="text-xs text-red-600 font-medium">Estimated Loss: {formatKES(selectedBuilding.loss_kes)}</div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-900 text-sm">Actuarial Interpretation Note</h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              The hazard score combines terrain slope, elevation relative to Nairobi river corridors, and satellite runoff indices.
              The AI layer enhances drainage blockage hotspots in high-density informal and commercial settlements.
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
        <p className="text-sm text-slate-600">JRC / Huizinga Depth-Damage Curves adapted for Nairobi construction types</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">Damage Ratio vs Inundation Depth (m)</h3>
        <VulnerabilityCurves />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">Calibrated Curve Parameters</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-semibold text-slate-900">Housing Class</th>
                <th className="text-left py-2 font-semibold text-slate-900">Damage Cap</th>
                <th className="text-left py-2 font-semibold text-slate-900">Steepness (k)</th>
                <th className="text-left py-2 font-semibold text-slate-900">Midpoint (x0)</th>
                <th className="text-left py-2 font-semibold text-slate-900">Portfolio Weight</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 text-slate-800 font-medium">Informal Iron Sheet</td>
                <td className="py-2.5 font-mono text-slate-900">90%</td>
                <td className="py-2.5 font-mono text-slate-900">3.2</td>
                <td className="py-2.5 font-mono text-slate-900">0.75m</td>
                <td className="py-2.5 text-xs text-slate-500">High count, low TIV</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 text-slate-800 font-medium">Semi-Permanent</td>
                <td className="py-2.5 font-mono text-slate-900">88%</td>
                <td className="py-2.5 font-mono text-slate-900">2.5</td>
                <td className="py-2.5 font-mono text-slate-900">1.15m</td>
                <td className="py-2.5 text-xs text-slate-500">Medium density</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 text-slate-800 font-medium">Permanent Masonry</td>
                <td className="py-2.5 font-mono text-slate-900">85%</td>
                <td className="py-2.5 font-mono text-slate-900">2.0</td>
                <td className="py-2.5 font-mono text-slate-900">1.85m</td>
                <td className="py-2.5 text-xs text-slate-500">Suburban residential</td>
              </tr>
              <tr>
                <td className="py-2.5 text-slate-800 font-medium">Concrete RCC</td>
                <td className="py-2.5 font-mono text-slate-900">70%</td>
                <td className="py-2.5 font-mono text-slate-900">1.6</td>
                <td className="py-2.5 font-mono text-slate-900">2.20m</td>
                <td className="py-2.5 text-xs font-semibold text-[#00264D]">85.4% of Nairobi Capital</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ExposurePanel({ rp }: { rp: RP }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00264D]">Exposure Portfolio</h1>
        <p className="text-sm text-slate-600">600 geocoded baseline assets · Nairobi County · Searchable & Filterable</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <PropertyTable rp={rp} />
      </div>
    </div>
  );
}

function LossPanel({
  scenario,
  epData,
  summary,
  lastRun,
}: {
  scenario: RP;
  epData: EPCurveResponse | null;
  summary: PortfolioSummary | null;
  lastRun: RunModelResponse | null;
}) {
  const metrics = epData?.metrics || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00264D]">Loss & Exceedance Probability</h1>
        <p className="text-sm text-slate-600">Actuarial financial engine outputs · Return periods 5y to 100y</p>
      </div>

      {lastRun && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase text-emerald-800">Latest Model Run</div>
              <div className="text-sm text-emerald-950 font-medium">
                Scenario: 1-in-{lastRun.scenario.replace("y", "")} Year ({lastRun.scenario}) · Portfolio Event Loss: {formatKES(lastRun.portfolio_loss_kes)}
              </div>
            </div>
            {lastRun.aal_ai_delta_kes != null && lastRun.aal_ai_delta_kes !== 0 && (
              <div className="text-xs font-semibold text-emerald-800">
                AI Drainage Delta: +{formatKES(lastRun.aal_ai_delta_kes)} AAL
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">EP Curve (Baseline vs AI Drainage Adjusted)</h3>
        <div className="h-80">
          <EPChart compare={true} rp={scenario} metrics={metrics} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">Loss Metrics by Return Period</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-semibold text-slate-900">Return Period</th>
                <th className="text-left py-2 font-semibold text-slate-900">Annual Probability</th>
                <th className="text-left py-2 font-semibold text-slate-900">Portfolio Loss (KES)</th>
                <th className="text-left py-2 font-semibold text-slate-900">Damage Ratio</th>
                <th className="text-left py-2 font-semibold text-slate-900">AI Adjusted Loss</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.return_period} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-2.5 font-medium text-slate-900">1-in-{m.years} Year ({m.return_period})</td>
                  <td className="py-2.5 font-mono text-slate-600">{(m.annual_prob * 100).toFixed(1)}%</td>
                  <td className="py-2.5 font-mono font-semibold text-slate-900">{formatKES(m.portfolio_loss_kes)}</td>
                  <td className="py-2.5 font-mono text-slate-700">{(m.loss_ratio * 100).toFixed(3)}%</td>
                  <td className="py-2.5 font-mono text-emerald-700 font-semibold">
                    {m.ai_adjusted_loss ? formatKES(m.ai_adjusted_loss) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AIPanel({ scenario }: { scenario: RP }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00264D]">AI Risk Intelligence</h1>
        <p className="text-sm text-slate-600">
          Powered by Groq (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">openai/gpt-oss-120b</code>) · Executive risk briefing & unstructured slip parsing
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <RiskBriefing scenario={scenario} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <AIExposureForm />
        </div>
      </div>
    </div>
  );
}

function AssumptionsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00264D]">Data & Model Assumptions</h1>
        <p className="text-sm text-slate-600">Actuarial methodology, hazard rasters, and vulnerability parameters</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#00264D] mb-4">Data Provenance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-semibold text-slate-900">Module</th>
                <th className="text-left py-2 font-semibold text-slate-900">Source</th>
                <th className="text-left py-2 font-semibold text-slate-900">Resolution / Method</th>
                <th className="text-left py-2 font-semibold text-slate-900">Actuarial Role</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 font-medium text-slate-900">Hazard Engine</td>
                <td className="py-2.5 text-slate-700">NASA DEM + Nairobi River Buffers</td>
                <td className="py-2.5 font-mono text-xs text-slate-600">925m raster / 31m local DEM</td>
                <td className="py-2.5 text-xs text-slate-600">Footprint inundation depths for 5y to 100y</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 font-medium text-slate-900">Vulnerability</td>
                <td className="py-2.5 text-slate-700">JRC Global Flood Depth-Damage Curves</td>
                <td className="py-2.5 font-mono text-xs text-slate-600">Sigmoid logistic functions</td>
                <td className="py-2.5 text-xs text-slate-600">Calibrated for 4 Nairobi housing classes</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 font-medium text-slate-900">Exposure</td>
                <td className="py-2.5 text-slate-700">OpenStreetMap + Nairobi Valuation</td>
                <td className="py-2.5 font-mono text-xs text-slate-600">600 assets · KES 63.635B TIV</td>
                <td className="py-2.5 text-xs text-slate-600">Baseline exposure baseline for Kenya Re</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-slate-900">Financial Integration</td>
                <td className="py-2.5 text-slate-700">Actuarial Loss Integrator</td>
                <td className="py-2.5 font-mono text-xs text-slate-600">Trapezoidal numerical rule</td>
                <td className="py-2.5 text-xs text-slate-600">Calculates AAL and PML 90/99 percentiles</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-900 text-sm">Key Assumptions & Scope</h4>
            <ul className="mt-2 space-y-1 text-xs text-amber-800 list-disc list-inside leading-relaxed">
              <li>Flood hazard represents pluvial (surface water) and localized riverine inundation across Nairobi County.</li>
              <li>Concrete RCC structures account for 85.4% of total capital value in the commercial corridors (Westlands, Upperhill, CBD).</li>
              <li>The AI drainage layer adjusts baseline depths upward where artificial drainage blockages prevent natural infiltration.</li>
              <li>AAL calculations use continuous numerical trapezoidal integration across the 5 return periods (5y, 10y, 25y, 50y, 100y).</li>
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
