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
  FileText
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
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs sm:text-sm text-slate-500">
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
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs sm:text-sm text-slate-500">
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
    { id: "Reports" as PanelType, label: "Reports", icon: FileText },

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
      {/* RESPONSIVE TOP BAR */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-xs">
        {/* Main Bar */}
        <div className="flex items-center justify-between px-3 py-2 sm:px-6 sm:py-2.5">
          {/* Left: Logo + Title + Synthetic/Live Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <img src="/image.png" alt="Kenya Re" className="h-7 w-7 sm:h-8 sm:w-8 rounded" />
              <div>
                <div className="text-xs sm:text-sm font-bold text-[#00264D] truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
                  Kenya Re CAT
                </div>
                <div className="hidden sm:block text-[10px] text-slate-500 font-medium leading-none">
                  Nairobi Urban Pluvial Model
                </div>
              </div>
            </Link>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-emerald-800 shrink-0">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live API
            </span>
          </div>

          {/* Center (Desktop): Scenario Selector & AI Toggle & Run Button */}
          <div className="hidden md:flex items-center gap-2">
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

          {/* Right: Header Actions & Drawer Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden size-8 sm:size-9 text-slate-700 cursor-pointer"
              title="Toggle Menu"
            >
              {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Quick Action Toolbar (< md screens) */}
        <div className="md:hidden flex items-center justify-between gap-1.5 px-3 py-2 bg-slate-50/95 border-t border-slate-200/80">
          <div className="relative flex-1 min-w-0">
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value as RP)}
              className="w-full appearance-none rounded-md border border-slate-300 bg-white px-2.5 py-1.5 pr-6 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00264D] truncate cursor-pointer"
            >
              {RP_LIST.map((s) => (
                <option key={s.rp} value={s.rp}>
                  {s.short} ({s.label})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setApplyAI(!applyAI)}
            className={`h-8 px-2 text-[11px] shrink-0 cursor-pointer ${
              applyAI
                ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold"
                : "text-slate-600"
            }`}
          >
            <Sparkles className="mr-1 size-3 text-emerald-600" />
            AI: {applyAI ? "ON" : "OFF"}
          </Button>

          <Button
            onClick={handleRunModel}
            disabled={isRunning}
            className="h-8 px-2.5 bg-[#D21245] text-white hover:bg-[#B50F3B] text-[11px] font-semibold shrink-0 cursor-pointer shadow-xs"
          >
            {isRunning ? (
              <RefreshCw className="size-3 animate-spin" />
            ) : (
              <>
                <Play className="mr-1 size-3 fill-current" />
                Run
              </>
            )}
          </Button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* RESPONSIVE SIDEBAR / MOBILE DRAWER */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-in-out lg:relative lg:transform-none lg:shadow-none lg:w-64 flex flex-col ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
            <div className="flex items-center gap-2">
              <img src="/image.png" alt="Kenya Re" className="size-6 rounded" />
              <span className="font-bold text-sm text-[#00264D]">CAT Intelligence</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePanel(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    activePanel === item.id
                      ? "bg-[#00264D] text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="size-4 sm:size-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Sub-navigation shortcuts */}
            <div className="mt-5 pt-4 border-t border-slate-200 space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Risk Platform Tools
              </div>
              <Link
                href="/console/data"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <span>1. Data Ingestion</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Step 1</span>
              </Link>
              <Link
                href="/console/quotes"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <span>4. Facultative Quotes</span>
                <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">PDF Slip</span>
              </Link>
              <Link
                href="/console/reports"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <span>Executive Dossiers</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">PDF</span>
              </Link>
            </div>
          </nav>

          <div className="p-3.5 border-t border-slate-200 bg-slate-50">
            <div className="rounded-md p-2 bg-white border border-slate-200 text-[11px] text-slate-600">
              <div className="font-semibold text-slate-800">JRC Vulnerability Curves</div>
              <div className="text-[10px] text-slate-500">4 Nairobi Housing Classes</div>
            </div>
          </div>
        </aside>

        {/* MOBILE BACKDROP OVERLAY */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* PANEL CONTENT WITH MOBILE PADDING FOR BOTTOM BAR */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-24 lg:pb-6">
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

      {/* MOBILE STICKY THUMB-BAR (< lg screens) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 border-t border-slate-200/90 backdrop-blur-md px-1 py-1 flex items-center justify-around shadow-lg">
        {sidebarItems.slice(0, 5).map((item) => {
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-md transition-colors cursor-pointer ${
                isActive ? "text-[#00264D]" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <item.icon className={`size-4 sm:size-5 ${isActive ? "text-[#00264D] stroke-[2.5]" : ""}`} />
              <span className={`text-[10px] mt-0.5 leading-tight ${isActive ? "font-bold text-[#00264D]" : "font-normal"}`}>
                {item.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => setActivePanel("ai")}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-md transition-colors cursor-pointer ${
            activePanel === "ai" ? "text-[#D21245]" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Cpu className={`size-4 sm:size-5 ${activePanel === "ai" ? "text-[#D21245] stroke-[2.5]" : ""}`} />
          <span className={`text-[10px] mt-0.5 leading-tight ${activePanel === "ai" ? "font-bold text-[#D21245]" : "font-normal"}`}>
            AI
          </span>
        </button>
      </nav>
    </div>
  );
}

// ==========================================
// PANEL COMPONENTS (MOBILE RESPONSIVE & LIVE API)
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#00264D]">Portfolio Overview</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Nairobi Urban Flood Model · {scenarioMeta.label} ({scenarioMeta.short}) Return Period
          </p>
        </div>
        {summary?.synthetic_notice && (
          <div className="text-[10px] sm:text-[11px] text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 self-start sm:self-auto">
            {summary.synthetic_notice}
          </div>
        )}
      </div>

      {/* KPI Cards: 2 cols on mobile, 4 on desktop */}
      <div className="grid gap-2.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Insured Value (TIV)"
          value={<AnimatedNumber value={tiv} format={(v) => formatKES(v)} />}
          detail={`${assetCount} geocoded properties`}
        />
        <KPICard
          label={`Event Loss @ ${scenarioMeta.short}`}
          value={<AnimatedNumber value={eventLoss} format={(v) => formatKES(v)} />}
          detail={`${lossRatio.toFixed(3)}% of TIV`}
          danger={lossRatio > 0.05}
        />
        <KPICard
          label="Annual Average Loss (AAL)"
          value={<AnimatedNumber value={aal} format={(v) => formatKES(v)} />}
          detail="Trapezoidal integral"
        />
        <KPICard
          label="100-Yr PML"
          value={<AnimatedNumber value={summary?.pml_100y_kes ?? 0} format={(v) => formatKES(v)} />}
          detail="Probable Maximum Loss"
        />
      </div>

      {/* Mini EP Curve */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#00264D]">Exceedance Probability Curve</h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Baseline vs AI-augmented drainage loss side-by-side
            </p>
          </div>
          {epData?.baseline_aal_kes && epData.aal_kes && (
            <div className="text-[11px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 self-start sm:self-auto">
              AI Delta: +{formatKES(epData.aal_kes - epData.baseline_aal_kes)} AAL
            </div>
          )}
        </div>
        <div className="h-56 sm:h-64">
          <EPChart compare={false} rp={scenario} metrics={epData?.metrics ?? []} />
        </div>
      </div>

      {/* Top Exposed Locations */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs">
        <h3 className="text-base sm:text-lg font-bold text-[#00264D] mb-3">Top Exposed Locations</h3>
        <div className="divide-y divide-slate-100">
          {assets && assets.length > 0 ? (
            assets.slice(0, 5).map((b) => (
              <div key={b.loc_id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                    {b.name || b.ward}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-mono truncate">
                    {b.loc_id} · {b.ward}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-xs sm:text-sm font-semibold text-slate-900">
                    {formatKES(b.tiv_kes)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500">
                    {CLASS_LABEL[b.housing_class] || b.housing_class}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-xs sm:text-sm text-slate-500">
              Loading top exposed assets...
            </div>
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#00264D]">Hazard Analysis</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Nairobi raster flood susceptibility layer · {RP_LIST.find((s) => s.rp === scenario)?.label} ({scenario})
          </p>
        </div>
        <MapProviderSwitcher
          currentProvider={mapProvider}
          onProviderChange={setMapProvider}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="h-[380px] sm:h-[540px]">
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
        <div className="rounded-xl border border-[#00264D]/20 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#D21245]">Selected Asset</div>
            <div className="text-base sm:text-lg font-bold text-[#00264D] truncate">
              {selectedBuilding.name || selectedBuilding.loc_id}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
              Ward: {selectedBuilding.ward} · {CLASS_LABEL[selectedBuilding.housing_class]} · Hazard: {selectedBuilding.hazard_score.toFixed(3)}
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">TIV Exposure</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">{formatKES(selectedBuilding.tiv_kes)}</div>
            <div className="text-xs text-red-600 font-semibold">Loss: {formatKES(selectedBuilding.loss_kes)}</div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="size-4 sm:size-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-900 text-xs sm:text-sm">Actuarial Interpretation Note</h4>
            <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5 leading-relaxed">
              Hazard scores combine terrain slope, NASA DEM relative elevation to Nairobi river corridors, and runoff indices.
              The AI layer highlights drainage blockage hotspots along informal and commercial river settlements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VulnerabilityPanel() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#00264D]">Vulnerability Functions</h1>
        <p className="text-xs sm:text-sm text-slate-600">
          JRC / Huizinga Depth-Damage Curves adapted for Nairobi construction types
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs">
        <h3 className="text-base sm:text-lg font-bold text-[#00264D] mb-3">Damage Ratio vs Inundation Depth (m)</h3>
        <VulnerabilityCurves />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs">
        <h3 className="text-base sm:text-lg font-bold text-[#00264D] mb-3">Calibrated Curve Parameters</h3>
        <div className="overflow-x-auto -mx-3.5 sm:mx-0 px-3.5 sm:px-0">
          <table className="w-full text-xs sm:text-sm min-w-[500px]">
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
                <td className="py-2.5 text-[11px] text-slate-500">High count, low TIV</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 text-slate-800 font-medium">Semi-Permanent</td>
                <td className="py-2.5 font-mono text-slate-900">88%</td>
                <td className="py-2.5 font-mono text-slate-900">2.5</td>
                <td className="py-2.5 font-mono text-slate-900">1.15m</td>
                <td className="py-2.5 text-[11px] text-slate-500">Medium density</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 text-slate-800 font-medium">Permanent Masonry</td>
                <td className="py-2.5 font-mono text-slate-900">85%</td>
                <td className="py-2.5 font-mono text-slate-900">2.0</td>
                <td className="py-2.5 font-mono text-slate-900">1.85m</td>
                <td className="py-2.5 text-[11px] text-slate-500">Suburban residential</td>
              </tr>
              <tr>
                <td className="py-2.5 text-slate-800 font-medium">Concrete RCC</td>
                <td className="py-2.5 font-mono text-slate-900">70%</td>
                <td className="py-2.5 font-mono text-slate-900">1.6</td>
                <td className="py-2.5 font-mono text-slate-900">2.20m</td>
                <td className="py-2.5 text-[11px] font-semibold text-[#00264D]">85.4% of Capital</td>
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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#00264D]">Exposure Portfolio</h1>
        <p className="text-xs sm:text-sm text-slate-600">
          600 geocoded baseline assets · Nairobi County · Searchable & Filterable
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs">
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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#00264D]">Loss & Exceedance Probability</h1>
        <p className="text-xs sm:text-sm text-slate-600">Actuarial financial engine outputs · Return periods 5y to 100y</p>
      </div>

      {lastRun && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <div className="text-[10px] font-bold uppercase text-emerald-800">Latest Model Run</div>
              <div className="text-xs sm:text-sm text-emerald-950 font-medium">
                Scenario: 1-in-{lastRun.scenario.replace("y", "")} Year ({lastRun.scenario}) · Loss: {formatKES(lastRun.portfolio_loss_kes)}
              </div>
            </div>
            {lastRun.aal_ai_delta_kes != null && lastRun.aal_ai_delta_kes !== 0 && (
              <div className="text-xs font-semibold text-emerald-800 self-start sm:self-auto">
                AI Delta: +{formatKES(lastRun.aal_ai_delta_kes)} AAL
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs">
        <h3 className="text-base sm:text-lg font-bold text-[#00264D] mb-3">EP Curve (Baseline vs AI Drainage Adjusted)</h3>
        <div className="h-60 sm:h-80">
          <EPChart compare={true} rp={scenario} metrics={metrics} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs">
        <h3 className="text-base sm:text-lg font-bold text-[#00264D] mb-3">Loss Metrics by Return Period</h3>
        <div className="overflow-x-auto -mx-3.5 sm:mx-0 px-3.5 sm:px-0">
          <table className="w-full text-xs sm:text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-semibold text-slate-900">Return Period</th>
                <th className="text-left py-2 font-semibold text-slate-900">Annual Prob</th>
                <th className="text-left py-2 font-semibold text-slate-900">Portfolio Loss</th>
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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#00264D]">AI Risk Intelligence</h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Powered by Groq (<code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded">openai/gpt-oss-120b</code>) · Executive briefing & slip parsing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs">
          <RiskBriefing scenario={scenario} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs">
          <AIExposureForm />
        </div>
      </div>
    </div>
  );
}

function AssumptionsPanel() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#00264D]">Data & Model Assumptions</h1>
        <p className="text-xs sm:text-sm text-slate-600">Actuarial methodology, hazard rasters, and vulnerability parameters</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs">
        <h3 className="text-base sm:text-lg font-bold text-[#00264D] mb-3">Data Provenance</h3>
        <div className="overflow-x-auto -mx-3.5 sm:mx-0 px-3.5 sm:px-0">
          <table className="w-full text-xs sm:text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-semibold text-slate-900">Module</th>
                <th className="text-left py-2 font-semibold text-slate-900">Source</th>
                <th className="text-left py-2 font-semibold text-slate-900">Method</th>
                <th className="text-left py-2 font-semibold text-slate-900">Role</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 font-medium text-slate-900">Hazard Engine</td>
                <td className="py-2.5 text-slate-700">NASA DEM + Rivers</td>
                <td className="py-2.5 font-mono text-[11px] text-slate-600">925m raster / 31m DEM</td>
                <td className="py-2.5 text-[11px] text-slate-600">Depths 5y to 100y</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 font-medium text-slate-900">Vulnerability</td>
                <td className="py-2.5 text-slate-700">JRC Global Curves</td>
                <td className="py-2.5 font-mono text-[11px] text-slate-600">Sigmoid logistic</td>
                <td className="py-2.5 text-[11px] text-slate-600">4 Nairobi classes</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 font-medium text-slate-900">Exposure</td>
                <td className="py-2.5 text-slate-700">OSM + Valuation</td>
                <td className="py-2.5 font-mono text-[11px] text-slate-600">600 assets · KES 63.6B</td>
                <td className="py-2.5 text-[11px] text-slate-600">Baseline exposure</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-slate-900">Financial Engine</td>
                <td className="py-2.5 text-slate-700">Actuarial Integrator</td>
                <td className="py-2.5 font-mono text-[11px] text-slate-600">Trapezoidal rule</td>
                <td className="py-2.5 text-[11px] text-slate-600">AAL & PML calculation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="size-4 sm:size-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-900 text-xs sm:text-sm">Key Assumptions & Scope</h4>
            <ul className="mt-1.5 space-y-1 text-[11px] sm:text-xs text-amber-800 list-disc list-inside leading-relaxed">
              <li>Flood hazard represents pluvial surface water and localized riverine inundation across Nairobi County.</li>
              <li>Concrete RCC structures account for 85.4% of total capital value in commercial corridors.</li>
              <li>The AI drainage layer adjusts baseline depths upward where artificial drainage blockages prevent infiltration.</li>
              <li>AAL calculations use continuous numerical trapezoidal integration across return periods 5y to 100y.</li>
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
    <div
      className={`rounded-xl border ${
        danger ? "border-red-200 bg-red-50/25" : "border-slate-200 bg-white"
      } p-3 sm:p-4 shadow-xs`}
    >
      <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
        {label}
      </div>
      <div
        className={`mt-1 sm:mt-2 font-mono text-base sm:text-2xl font-bold tracking-tight ${
          danger ? "text-red-700" : "text-slate-900"
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-600 truncate">{detail}</div>
    </div>
  );
}
