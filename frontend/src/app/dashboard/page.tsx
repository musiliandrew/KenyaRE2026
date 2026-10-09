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
  RefreshCw,
  Sparkles,
  FileText,
  FileDown,
  Loader2,
  Layers,
  PlusCircle,
  CheckCircle,
  RotateCcw,
  Trash2,
  FolderArchive,
  Edit3,
  Check,
  Globe,
  FileSpreadsheet,
  UploadCloud,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/cat/AnimatedNumber";
import { EPChart } from "@/components/cat/EPChart";
import { VulnerabilityCurves } from "@/components/cat/VulnerabilityCurves";
import { PropertyTable } from "@/components/cat/PropertyTable";
import { RiskBriefing } from "@/components/cat/RiskBriefing";
import { AIExposureForm } from "@/components/cat/AIExposureForm";
import { QuoteGenerator } from "@/components/cat/QuoteGenerator";
import { MapProviderSwitcher, type MapProvider } from "@/components/cat/MapProviderSwitcher";
import { IngestTestDataModal, type DatasetRun } from "@/components/cat/IngestTestDataModal";
import { AssetDetailModal } from "@/components/cat/AssetDetailModal";
import { exportExposurePortfolioPDF } from "@/lib/pdfGenerator";
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

type PanelType = "overview" | "hazard" | "vulnerability" | "exposure" | "loss" | "ai" | "reports" | "repo" | "assumptions";

const sidebarItems = [
  { id: "overview" as PanelType, label: "Overview", icon: Home },
  { id: "hazard" as PanelType, label: "Hazard & 3D Map", icon: Activity },
  { id: "vulnerability" as PanelType, label: "Vulnerability", icon: Shield },
  { id: "exposure" as PanelType, label: "Exposure Portfolio", icon: Building2 },
  { id: "loss" as PanelType, label: "Loss & EP Curve", icon: BarChart3 },
  { id: "ai" as PanelType, label: "AI Copilot", icon: Cpu },
  { id: "reports" as PanelType, label: "Reports & PDF Slips", icon: FileText },
  { id: "repo" as PanelType, label: "Dataset Repository", icon: FolderArchive },
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

  // Simulation Run Management with LocalStorage Persistence
  const [runs, setRuns] = useState<DatasetRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string>("baseline");
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<ExposureAsset | null>(null);

  // Load saved runs from localStorage and sync with Neon Cloud PostgreSQL + PostGIS
  useEffect(() => {
    if (typeof window === "undefined") return;
    let isMounted = true;
    let localParsed: DatasetRun[] = [];

    // 1. Instant local cache load
    try {
      const saved = localStorage.getItem("kenya_re_dataset_runs");
      if (saved) {
        const parsed: DatasetRun[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localParsed = parsed;
          setRuns(parsed);
        }
      }
      const savedActiveId = localStorage.getItem("kenya_re_active_run_id");
      if (savedActiveId) {
        setActiveRunId(savedActiveId);
      }
    } catch (e) {
      console.error("Failed to load saved dataset runs from localStorage", e);
    }

    // 2. Fetch all persisted portfolios from Neon PostgreSQL
    api.listPortfolios().then(async (dbList) => {
      if (!isMounted || !Array.isArray(dbList)) return;
      if (dbList.length > 0) {
        const fullRuns: DatasetRun[] = [];
        for (const item of dbList) {
          try {
            const full = await api.getPortfolio(item.id);
            if (full && Array.isArray(full.assets)) {
              fullRuns.push(full);
            }
          } catch (err) {
            console.warn(`Could not load full DB portfolio ${item.id}`, err);
          }
        }
        if (fullRuns.length > 0 && isMounted) {
          setRuns(fullRuns);
          try {
            localStorage.setItem("kenya_re_dataset_runs", JSON.stringify(fullRuns));
          } catch (e) {}
        }
      } else if (localParsed.length > 0) {
        // If DB is empty but user had local datasets, sync them up to PostgreSQL
        for (const lr of localParsed) {
          api.savePortfolio(lr).catch(() => {});
        }
      }
    }).catch((err) => {
      console.warn("Could not sync portfolios from Neon PostgreSQL:", err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const persistRuns = (newRuns: DatasetRun[]) => {
    setRuns(newRuns);
    try {
      localStorage.setItem("kenya_re_dataset_runs", JSON.stringify(newRuns));
    } catch (e) {
      console.warn("Storage quota exceeded or error saving runs", e);
    }
  };

  const handleSelectRun = (runId: string) => {
    setActiveRunId(runId);
    try {
      localStorage.setItem("kenya_re_active_run_id", runId);
    } catch (e) {}
  };

  const handleRunCreated = (newRun: DatasetRun) => {
    const filtered = runs.filter((r) => r.id !== newRun.id);
    const updated = [newRun, ...filtered];
    persistRuns(updated);
    handleSelectRun(newRun.id);

    // Persist permanently to Neon Cloud PostgreSQL + PostGIS
    api.savePortfolio(newRun).then(() => {
      toast.success("Dataset permanently stored in Neon Cloud PostgreSQL + PostGIS.");
    }).catch((err) => {
      console.warn("Failed to persist portfolio to database:", err);
      toast.info("Dataset cached locally in browser.");
    });
  };

  const handleRenameRun = (runId: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = runs.map((r) => (r.id === runId ? { ...r, name: newName.trim() } : r));
    persistRuns(updated);
    toast.success("Dataset renamed successfully.");

    // Sync rename to Neon PostgreSQL
    api.renamePortfolio(runId, newName).catch((err) => {
      console.warn("Failed to sync rename to database:", err);
    });
  };

  const handleDownloadRunCSV = (run: DatasetRun) => {
    const headers = ["Asset_ID", "Name", "Ward", "Housing_Class", "TIV_KES", "Floor_Area_M2", "Latitude", "Longitude", "Flood_Depth_M", "Loss_KES", "Risk_Tier"];
    const rows = run.assets.map((a) => [
      a.loc_id,
      `"${a.name || a.loc_id}"`,
      `"${a.ward}"`,
      a.housing_class,
      a.tiv_kes,
      a.floor_area_m2 || 1000,
      a.lat,
      a.lon ?? a.lng ?? 0,
      a.depth_m?.toFixed(2) || "0.00",
      a.loss_kes || 0,
      a.risk_level || "low",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(run.fileName || run.name).replace(/\s+/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteRun = (runId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = runs.filter((r) => r.id !== runId);
    persistRuns(updated);
    if (activeRunId === runId) {
      handleSelectRun(updated.length > 1 ? "all" : updated.length === 1 ? updated[0].id : "baseline");
    }
    toast.success("Dataset removed from saved records.");

    // Sync delete to Neon PostgreSQL (cascade deletes exposure assets)
    api.deletePortfolio(runId).catch((err) => {
      console.warn("Failed to sync delete to database:", err);
    });
  };

  // Live backend data hooks (Baseline)
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

  // Hydrological scaling ratios for uploaded datasets across return periods
  const RP_FACTORS: Record<RP, number> = {
    "5y": 0.65,
    "10y": 0.78,
    "25y": 1.0,
    "50y": 1.25,
    "100y": 1.48,
  };

  const getHydrologicalScale = (rp: RP): number => {
    switch (rp) {
      case "5y": return 0.70;
      case "10y": return 0.84;
      case "25y": return 1.00;
      case "50y": return 1.18;
      case "100y": return 1.38;
      default: return 1.00;
    }
  };

  // Consolidated Multi-Portfolio Calculation across all uploaded runs
  const isConsolidated = activeRunId === "all";
  const activeCustomRun = runs.find((r) => r.id === activeRunId) || null;

  // Reactively scaled assets for custom run when scenario (5y, 10y, 25y, 50y, 100y) changes
  const scaledCustomAssets = useMemo<ExposureAsset[]>(() => {
    if (!activeCustomRun) return [];
    const scale = getHydrologicalScale(scenario);
    return activeCustomRun.assets.map((a) => {
      const depth = Math.max(0, (a.depth_m ?? 0.2) * scale);
      const loss = Math.min(a.tiv_kes, (a.loss_kes ?? a.tiv_kes * 0.05) * scale);
      const damageRatio = a.tiv_kes > 0 ? loss / a.tiv_kes : 0;
      return {
        ...a,
        depth_m: depth,
        loss_kes: loss,
        damage_ratio: damageRatio,
        risk_level: (damageRatio > 0.35 ? "high" : damageRatio > 0.08 ? "mid" : "low") as "low" | "mid" | "high",
        tier_label: depth > 1.0 ? "Extreme Floodway" : depth > 0.4 ? "High Hazard" : "Moderate Pluvial",
      };
    });
  }, [activeCustomRun, scenario]);

  const consolidatedAssets = useMemo<ExposureAsset[]>(() => {
    if (!runs || runs.length === 0) return assetsData?.assets || [];
    const scale = getHydrologicalScale(scenario);
    return runs.flatMap((r) =>
      r.assets.map((a) => {
        const depth = Math.max(0, (a.depth_m ?? 0.2) * scale);
        const loss = Math.min(a.tiv_kes, (a.loss_kes ?? a.tiv_kes * 0.05) * scale);
        const damageRatio = a.tiv_kes > 0 ? loss / a.tiv_kes : 0;
        return {
          ...a,
          depth_m: depth,
          loss_kes: loss,
          damage_ratio: damageRatio,
          risk_level: (damageRatio > 0.35 ? "high" : damageRatio > 0.08 ? "mid" : "low") as "low" | "mid" | "high",
          tier_label: depth > 1.0 ? "Extreme Floodway" : depth > 0.4 ? "High Hazard" : "Moderate Pluvial",
          source_file: a.source_file || r.fileName || r.name,
          dataset_name: r.name,
          dataset_id: r.id,
        };
      })
    );
  }, [runs, assetsData, scenario]);

  // Reactively scaled portfolio summary for custom run
  const activeCustomSummary = useMemo<PortfolioSummary | null>(() => {
    if (!activeCustomRun) return null;
    const tiv = activeCustomRun.totalTivKes || activeCustomRun.summary?.tiv_kes || 0;
    const metric = activeCustomRun.epData?.metrics?.find((m) => m.return_period === scenario);
    const baseLoss = activeCustomRun.summary?.event_loss_kes || 0;
    const baseRp = (activeCustomRun.summary?.active_rp as RP) || "25y";
    const scale = RP_FACTORS[scenario] / (RP_FACTORS[baseRp] || 1.0);
    const eventLoss = metric ? metric.portfolio_loss_kes : baseLoss * scale;
    const lossRatio = tiv > 0 ? (eventLoss / tiv) * 100 : 0;

    return {
      tiv_kes: tiv,
      event_loss_kes: eventLoss,
      aal_kes: activeCustomRun.summary?.aal_kes || 0,
      asset_count: activeCustomRun.assetCount || activeCustomRun.summary?.asset_count || 0,
      active_rp: scenario,
      hotspot_count: Math.min(8, activeCustomRun.assetCount),
      pml_100y_kes:
        activeCustomRun.epData?.metrics?.find((m) => m.return_period === "100y")?.portfolio_loss_kes ||
        eventLoss * 1.35,
      loss_ratio: lossRatio,
      synthetic_notice: `Custom Dataset Run: ${activeCustomRun.name} (${scenario})`,
    };
  }, [activeCustomRun, scenario]);

  const consolidatedSummary = useMemo<PortfolioSummary | null>(() => {
    if (!runs || runs.length === 0) return summary;
    const totalTiv = runs.reduce((acc, r) => acc + (r.summary?.tiv_kes || r.totalTivKes || 0), 0);
    const totalAal = runs.reduce((acc, r) => acc + (r.summary?.aal_kes || 0), 0);
    const totalCount = runs.reduce((acc, r) => acc + (r.summary?.asset_count || r.assetCount || 0), 0);

    const totalEventLoss = runs.reduce((acc, r) => {
      const metric = r.epData?.metrics?.find((m) => m.return_period === scenario);
      if (metric) return acc + metric.portfolio_loss_kes;
      const baseLoss = r.summary?.event_loss_kes || 0;
      const baseRp = (r.summary?.active_rp as RP) || "25y";
      const scale = RP_FACTORS[scenario] / (RP_FACTORS[baseRp] || 1.0);
      return acc + baseLoss * scale;
    }, 0);

    const totalPml100 = runs.reduce((acc, r) => {
      const metric = r.epData?.metrics?.find((m) => m.return_period === "100y");
      return acc + (metric ? metric.portfolio_loss_kes : (r.summary?.pml_100y_kes || (r.summary?.event_loss_kes || 0) * 1.35));
    }, 0);

    const lossRatio = totalTiv > 0 ? (totalEventLoss / totalTiv) * 100 : 0;

    return {
      tiv_kes: totalTiv,
      event_loss_kes: totalEventLoss,
      aal_kes: totalAal,
      asset_count: totalCount,
      active_rp: scenario,
      hotspot_count: Math.min(12, totalCount),
      pml_100y_kes: totalPml100,
      loss_ratio: lossRatio,
      synthetic_notice: `Consolidated Portfolio (${runs.length} Saved Records Active · ${scenario})`,
    };
  }, [runs, summary, scenario]);

  const consolidatedEP = useMemo<EPCurveResponse | null>(() => {
    if (!runs || runs.length === 0) return epData;
    const totalTiv = runs.reduce((acc, r) => acc + (r.summary?.tiv_kes || r.totalTivKes || 0), 0);
    const totalAal = runs.reduce((acc, r) => acc + (r.summary?.aal_kes || 0), 0);

    const rps: RP[] = ["5y", "10y", "25y", "50y", "100y"];
    const metrics: ReturnPeriodMetric[] = rps.map((rpKey) => {
      const losses = runs.map((r) => {
        const found = r.epData?.metrics?.find((m) => m.return_period === rpKey);
        return found ? found.portfolio_loss_kes : 0;
      });
      const summedLoss = losses.reduce((a, b) => a + b, 0);
      const rpNum = parseInt(rpKey);
      const lossRatio = totalTiv > 0 ? summedLoss / totalTiv : 0;
      return {
        return_period: rpKey,
        years: rpNum,
        annual_prob: 1 / rpNum,
        portfolio_loss_kes: summedLoss,
        loss_ratio: lossRatio,
        pml_90: summedLoss * 0.9,
        ai_adjusted_loss: summedLoss * 1.08,
        ai_delta_kes: summedLoss * 0.08,
      };
    });

    return {
      metrics,
      total_tiv_kes: totalTiv,
      aal_kes: totalAal,
      baseline_aal_kes: totalAal * 0.88,
      ai_enabled: applyAI,
    };
  }, [runs, epData, applyAI]);

  // Effective data routed dynamically to all dashboard tabs
  const effectiveAssets = isConsolidated
    ? consolidatedAssets
    : activeCustomRun
    ? scaledCustomAssets
    : assetsData?.assets;

  const effectiveSummary = isConsolidated
    ? consolidatedSummary
    : activeCustomRun
    ? activeCustomSummary
    : summary;

  const effectiveEP = isConsolidated
    ? consolidatedEP
    : activeCustomRun
    ? activeCustomRun.epData
    : epData;

  const effectiveLastRun = activeCustomRun
    ? activeCustomRun.lastRunResult || lastRunResult
    : lastRunResult;
  const effectiveHotspots = hotspotsData;

  // Global listener for asset inspection triggered from Mapbox / DeckGL popups
  useEffect(() => {
    const handleInspectEvent = (e: any) => {
      const assetId = e.detail;
      if (!assetId) return;
      const found = effectiveAssets?.find(
        (a) => (a.loc_id || (a as any).id) === assetId
      );
      if (found) {
        setSelectedAssetForModal(found);
      } else {
        api
          .assetDossier(assetId, scenario)
          .then((res) => {
            setSelectedAssetForModal(res.asset as any);
          })
          .catch(() => {});
      }
    };
    window.addEventListener("kenya_re_inspect_asset", handleInspectEvent);
    return () => window.removeEventListener("kenya_re_inspect_asset", handleInspectEvent);
  }, [effectiveAssets, scenario]);

  const handleRunModel = async () => {
    setIsRunning(true);
    try {
      const customPayload = activeCustomRun ? activeCustomRun.assets.map(a => ({
        id: a.loc_id,
        name: a.name,
        lat: a.lat,
        lng: a.lon,
        housing_class: a.housing_class,
        area_sqm: a.floor_area_m2,
        tiv_kes: a.tiv_kes,
        ward: a.ward
      })) : undefined;

      const res = await api.runModel(scenario, applyAI, customPayload as any);
      setLastRunResult(res);
      toast.success(
        `CAT Model Run Complete: ${formatKES(res.portfolio_loss_kes)} estimated event loss across ${res.asset_count} exposed buildings.`
      );
      if (!activeCustomRun) {
        refetchSummary();
        refetchEP();
        refetchAssets();
      }
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

          {/* Right: Active Run Switcher, Ingest Button & Drawer Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Run Switcher Dropdown (visible whenever a custom run exists) */}
            {runs.length > 0 && (
              <div className="relative hidden sm:block">
                <select
                  value={activeRunId}
                  onChange={(e) => handleSelectRun(e.target.value)}
                  className="appearance-none rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 pr-7 text-xs font-semibold text-slate-800 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00264D] max-w-[210px] truncate cursor-pointer shadow-2xs"
                >
                  <option value="all">🌐 ALL Datasets (Consolidated View)</option>
                  <optgroup label="Saved Uploaded Files">
                    {runs.map((r) => (
                      <option key={r.id} value={r.id}>
                        📄 {r.fileName || r.name} ({r.assetCount})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Standard Baseline">
                    <option value="baseline">📁 Nairobi 600 Baseline</option>
                  </optgroup>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
              </div>
            )}

            {/* Ingest Test Data Modal Trigger */}
            <Button
              onClick={() => setIsIngestModalOpen(true)}
              className="bg-[#00264D] hover:bg-[#001830] text-white text-xs font-semibold px-2.5 sm:px-3 h-8 gap-1.5 shadow-xs cursor-pointer"
              title="Upload file (Word DOCX, PDF, text slip, or dataset) and launch dedicated dashboard run"
            >
              <UploadCloud className="size-3.5 text-white" />
              <span>Upload File</span>
            </Button>

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
            onClick={() => setIsIngestModalOpen(true)}
            size="sm"
            className="h-8 px-2 bg-[#00264D] text-white hover:bg-[#001830] text-[11px] font-semibold shrink-0 cursor-pointer shadow-xs gap-1"
          >
            <PlusCircle className="size-3 text-[#D21245]" />
            <span>Test Data</span>
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
          {/* Active Dataset Run Banner (Consolidated or Dedicated) */}
          {isConsolidated && runs.length > 0 && (
            <div className="mb-4 rounded-xl border border-blue-300 bg-gradient-to-r from-blue-50 via-indigo-50 to-white p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#00264D] text-white font-bold text-xs">
                  🌐
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-[#00264D]">
                      Consolidated Multi-Portfolio View: {runs.length} Saved Records Combined
                    </span>
                    <span className="rounded-full bg-blue-200/80 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                      {consolidatedAssets.length} Total Assets
                    </span>
                  </div>
                  {/* File Badges that user can click to switch */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Active Files:</span>
                    {runs.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectRun(r.id)}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white border border-slate-300 hover:border-[#00264D] text-[#00264D] px-2 py-0.5 rounded shadow-2xs cursor-pointer transition"
                        title={`Click to view only ${r.fileName || r.name}`}
                      >
                        <span>📄 {r.fileName || r.name} ({r.assetCount})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectRun("baseline")}
                  className="h-7 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-300 cursor-pointer"
                >
                  <RotateCcw className="size-3 mr-1" />
                  Return to Baseline
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsIngestModalOpen(true)}
                  className="h-7 text-[11px] font-semibold bg-[#00264D] hover:bg-[#001830] text-white cursor-pointer"
                >
                  <UploadCloud className="size-3 mr-1 text-white" />
                  + Upload Another File
                </Button>
              </div>
            </div>
          )}



          {activePanel === "overview" && (
            <OverviewPanel
              scenario={scenario}
              summary={effectiveSummary}
              epData={effectiveEP}
              assets={effectiveAssets}
              isLoading={summaryLoading}
              onInspectAsset={setSelectedAssetForModal}
            />
          )}
          {activePanel === "hazard" && (
            <HazardPanel
              scenario={scenario}
              assets={effectiveAssets}
              hotspots={effectiveHotspots}
              runs={runs}
              activeRunId={activeRunId}
              onSelectRun={handleSelectRun}
              onInspectAsset={setSelectedAssetForModal}
            />
          )}
          {activePanel === "vulnerability" && <VulnerabilityPanel />}
          {activePanel === "exposure" && (
            <ExposurePanel
              rp={scenario}
              customAssets={effectiveAssets}
              activeRunName={isConsolidated ? `Consolidated (${runs.length} Files)` : activeCustomRun?.fileName || activeCustomRun?.name || "Nairobi Baseline 600"}
              runs={runs}
              isConsolidated={isConsolidated}
              onInspectAsset={setSelectedAssetForModal}
            />
          )}
          {activePanel === "loss" && (
            <LossPanel
              scenario={scenario}
              epData={effectiveEP}
              summary={effectiveSummary}
              lastRun={effectiveLastRun}
            />
          )}
          {activePanel === "ai" && <AIPanel scenario={scenario} summary={effectiveSummary} />}
          {activePanel === "reports" && (
            <ReportsPanel
              scenario={scenario}
              summary={effectiveSummary}
              assets={effectiveAssets}
              activeRunName={activeCustomRun ? activeCustomRun.name : "Nairobi 600 Baseline"}
              runs={runs}
              activeRunId={activeRunId}
              onSelectRun={handleSelectRun}
            />
          )}
          {activePanel === "repo" && (
            <RepositoryPanel
              runs={runs}
              activeRunId={activeRunId}
              scenario={scenario}
              onSelectRun={(id) => {
                handleSelectRun(id);
                setActivePanel("overview");
              }}
              onRenameRun={handleRenameRun}
              onDeleteRun={handleDeleteRun}
              onDownloadCSV={handleDownloadRunCSV}
              onOpenIngestModal={() => setIsIngestModalOpen(true)}
            />
          )}
          {activePanel === "assumptions" && <AssumptionsPanel />}
        </main>

        {/* Modal for Ingesting Test Data and Launching Dedicated Run */}
        <IngestTestDataModal
          isOpen={isIngestModalOpen}
          onClose={() => setIsIngestModalOpen(false)}
          onRunCreated={handleRunCreated}
          activeScenario={scenario}
          applyAI={applyAI}
        />

        {/* Dedicated Single-Asset Risk Dossier & Actuarial Inspection Modal */}
        <AssetDetailModal
          isOpen={!!selectedAssetForModal}
          onClose={() => setSelectedAssetForModal(null)}
          asset={selectedAssetForModal}
          activeScenario={scenario}
          portfolioAssets={effectiveAssets}
          onSelectAsset={(a) => setSelectedAssetForModal(a)}
          onOpenFacultativeQuote={() => {
            setActivePanel("reports");
          }}
        />
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
  onInspectAsset,
}: {
  scenario: RP;
  summary: PortfolioSummary | null;
  epData: EPCurveResponse | null;
  assets?: ExposureAsset[];
  isLoading: boolean;
  onInspectAsset?: (asset: ExposureAsset) => void;
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
              <div
                key={b.loc_id}
                onClick={() => onInspectAsset?.(b)}
                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-2 hover:bg-blue-50/50 cursor-pointer rounded-lg px-2.5 -mx-2.5 transition"
                title={`Click to inspect ${b.loc_id} full dossier`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-xs sm:text-sm text-slate-900 truncate flex items-center gap-2">
                    <span>{b.name || b.ward}</span>
                    <span className="text-[10px] font-mono font-bold text-[#00264D] bg-slate-100 px-1.5 py-0.2 rounded">
                      {b.loc_id}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-mono truncate mt-0.5">
                    {b.ward} · {CLASS_LABEL[b.housing_class] || b.housing_class}
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <div className="font-mono text-xs sm:text-sm font-semibold text-[#00264D]">
                      {formatKES(b.tiv_kes)}
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-500">
                      {CLASS_LABEL[b.housing_class] || b.housing_class}
                    </div>
                  </div>
                  {onInspectAsset && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] text-[#00264D] hover:bg-blue-100/60 px-2 cursor-pointer hidden sm:inline-flex"
                    >
                      Inspect →
                    </Button>
                  )}
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
  runs = [],
  activeRunId = "baseline",
  onSelectRun,
  onInspectAsset,
}: {
  scenario: RP;
  assets?: ExposureAsset[];
  hotspots?: Hotspot[] | null;
  runs?: DatasetRun[];
  activeRunId?: string;
  onSelectRun?: (id: string) => void;
  onInspectAsset?: (asset: ExposureAsset) => void;
}) {
  const [selectedBuilding, setSelectedBuilding] = useState<ExposureAsset | null>(null);
  const [mapProvider, setMapProvider] = useState<MapProvider>("mapbox");
  const [areaFilter, setAreaFilter] = useState<string>(activeRunId || "all");

  useEffect(() => {
    if (activeRunId) {
      setAreaFilter(activeRunId);
    }
  }, [activeRunId]);

  // Extract assets for the chosen file/run to immediately re-render map pinpoints
  const mapAssets = useMemo(() => {
    if (areaFilter === "all") {
      if (runs && runs.length > 0) {
        return runs.flatMap((r) => r.assets);
      }
      return assets || [];
    }
    if (areaFilter === "baseline") {
      return (assets || []).filter((a) => !a.dataset_id);
    }
    const matched = runs.find((r) => r.id === areaFilter);
    if (matched && matched.assets && matched.assets.length > 0) {
      return matched.assets;
    }
    return (assets || []).filter(
      (a) =>
        a.dataset_id === areaFilter ||
        a.source_file === areaFilter ||
        a.dataset_name === areaFilter
    );
  }, [assets, areaFilter, runs]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#00264D]">Hazard & Geospatial Risk Analysis</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Nairobi raster flood susceptibility layer · {RP_LIST.find((s) => s.rp === scenario)?.label} ({scenario})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Dataset Area Filter */}
          {runs.length > 0 && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
              <span className="text-[11px] font-semibold text-slate-500 pl-2">View File:</span>
              <select
                value={areaFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setAreaFilter(val);
                  setSelectedBuilding(null);
                  if (onSelectRun) onSelectRun(val);
                }}
                className="text-xs bg-white border border-slate-200 rounded px-2 py-1 font-semibold text-slate-800 cursor-pointer focus:outline-none max-w-[170px] truncate"
              >
                <option value="all">🌐 All Areas ({assets?.length || 0})</option>
                {runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    📄 {r.fileName || r.name} ({r.assetCount})
                  </option>
                ))}
                <option value="baseline">🏛️ Nairobi 600 Baseline</option>
              </select>
            </div>
          )}

          <MapProviderSwitcher
            currentProvider={mapProvider}
            onProviderChange={setMapProvider}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="h-[380px] sm:h-[540px]">
          {mapProvider === "mapbox" ? (
            <RiskMapMapbox
              rp={scenario}
              filter="all"
              showHotspots={true}
              assets={mapAssets}
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
              assets={mapAssets}
              hotspots={hotspots || undefined}
              selectedBuilding={selectedBuilding}
              selectedHotspot={null}
              onSelectBuilding={setSelectedBuilding}
              onSelectHotspot={() => {}}
            />
          )}
        </div>

        {/* Geospatial Map Legend Bar */}
        <div className="border-t border-slate-200 bg-slate-50/90 px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-[#00264D] uppercase text-[10px] tracking-wider">Legend:</span>
            
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-4 h-1.5 rounded-full bg-[#0ea5e9] inline-block shadow-2xs"></span>
              <span>3D Water Ribbons & Flow Currents</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-3.5 rounded-xs bg-[#ef4444] border border-red-700 inline-block shadow-2xs"></span>
              <span>3D Bottleneck Surge Towers</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="size-2 rounded-full bg-[#D21245] inline-block"></span>
              <span>High Risk Assets</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="size-2 rounded-full bg-[#16A34A] inline-block"></span>
              <span>Low Risk Assets</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="size-2.5 rounded-full border border-blue-400 bg-blue-100/50 inline-block"></span>
              <span>Hotspot Centroids</span>
            </div>
          </div>

          <div className="text-slate-500 font-medium text-[10px] flex items-center gap-1">
            <span>💡 Click any 3D channel or surge tower to fly along corridor & scan 150m portfolio exposure</span>
          </div>
        </div>
      </div>

      {/* Selected Asset Detailed Dossier Card */}
      {selectedBuilding && (
        <div className="rounded-xl border-2 border-[#00264D]/30 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 p-3.5 sm:p-5 shadow-xs relative">
          <button
            onClick={() => setSelectedBuilding(null)}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-md hover:bg-slate-100"
            title="Deselect asset"
          >
            <X className="size-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pr-6">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D21245] bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  Inspected Asset
                </span>
                {selectedBuilding.source_file && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    📄 Source: {selectedBuilding.source_file}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-mono">
                  ID: {selectedBuilding.loc_id || (selectedBuilding as any).id}
                </span>
              </div>

              <div className="text-base sm:text-lg font-bold text-[#00264D] truncate">
                {selectedBuilding.name || selectedBuilding.loc_id}
              </div>

              <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                <span>Locality / Ward: <strong className="text-slate-800">{selectedBuilding.ward}</strong></span>
                <span>Typology: <strong className="text-slate-800 capitalize">{CLASS_LABEL[selectedBuilding.housing_class] || selectedBuilding.housing_class}</strong></span>
                <span>Area: <strong className="text-slate-800">{selectedBuilding.floor_area_m2 ? `${selectedBuilding.floor_area_m2.toLocaleString()} m²` : "N/A"}</strong></span>
                <span>Coordinates: <strong className="font-mono text-slate-700">{selectedBuilding.lat?.toFixed(4)}, {(selectedBuilding.lon ?? (selectedBuilding as any).lng)?.toFixed(4)}</strong></span>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-0 border-slate-200 pt-3 sm:pt-0 shrink-0 gap-1">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">TIV Exposure</span>
                <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">{formatKES(selectedBuilding.tiv_kes)}</div>
              </div>
              <div className="text-right">
                {(selectedBuilding.loss_kes || 0) > 0 ? (
                  <span className="text-xs font-bold text-red-600 block">
                    Loss: {formatKES(selectedBuilding.loss_kes || 0)} ({((selectedBuilding.damage_ratio || 0) * 100).toFixed(1)}%)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 block">
                    Loss: KES 0 (0.0% · Below {selectedBuilding.housing_class === "concrete_rcc" ? "0.30m" : "0.25m"} Threshold)
                  </span>
                )}
                <div className="text-[11px] text-slate-600 font-mono">
                  Water Depth: <strong className={(selectedBuilding.loss_kes || 0) > 0 ? "text-red-700" : "text-slate-800"}>{(selectedBuilding.depth_m || 0).toFixed(2)} m</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs text-slate-500">
              Interactive JRC Vulnerability Curve (0m to 4.5m), Calibrated Parameters & 5y–100y EP Schedule
            </span>
            {onInspectAsset && (
              <Button
                size="sm"
                onClick={() => onInspectAsset(selectedBuilding)}
                className="bg-[#00264D] hover:bg-[#001830] text-white text-xs gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
              >
                <Building2 className="size-3.5" />
                <span>Inspect Full Asset Dossier (EP, Curve & Parameters) →</span>
              </Button>
            )}
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
              Clicking any point on the map retrieves localized flood depth and single-risk estimated damage ratios.
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

function ExposurePanel({
  rp,
  customAssets,
  activeRunName,
  runs = [],
  isConsolidated = false,
  onInspectAsset,
}: {
  rp: RP;
  customAssets?: ExposureAsset[];
  activeRunName?: string;
  runs?: DatasetRun[];
  isConsolidated?: boolean;
  onInspectAsset?: (asset: ExposureAsset) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [fileFilter, setFileFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  if (customAssets && customAssets.length > 0) {
    const filtered = customAssets.filter((a) => {
      const matchSearch =
        searchQuery === "" ||
        a.loc_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.name && a.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchFile =
        fileFilter === "all" ||
        a.source_file === fileFilter ||
        a.dataset_id === fileFilter ||
        a.dataset_name === fileFilter;

      const matchClass = classFilter === "all" || a.housing_class === classFilter;
      const matchTier = tierFilter === "all" || a.risk_level === tierFilter;

      return matchSearch && matchFile && matchClass && matchTier;
    });

    const totalTiv = filtered.reduce((sum, a) => sum + a.tiv_kes, 0);
    const totalLoss = filtered.reduce((sum, a) => sum + (a.loss_kes || 0), 0);

    // Extract unique source files for dropdown
    const availableFiles = Array.from(
      new Set(customAssets.map((a) => a.source_file).filter(Boolean))
    );

    const handleExportCSV = () => {
      const headers = ["Asset_ID", "Name", "Source_File", "Ward", "Housing_Class", "TIV_KES", "Flood_Depth_M", "Loss_KES", "Damage_Ratio", "Risk_Tier"];
      const rows = filtered.map((a) => [
        a.loc_id,
        `"${a.name || a.loc_id}"`,
        `"${a.source_file || activeRunName || "Custom"}"`,
        `"${a.ward}"`,
        a.housing_class,
        a.tiv_kes,
        a.depth_m?.toFixed(2) || "0.00",
        a.loss_kes || 0,
        ((a.damage_ratio || 0) * 100).toFixed(2),
        a.risk_level || "low",
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `kenya-re-exposure-${activeRunName || "portfolio"}-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#00264D] flex items-center gap-2">
              <Building2 className="size-6 text-[#00264D]" />
              <span>Exposure Portfolio</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Showing {filtered.length} of {customAssets.length} assets · <strong>{activeRunName || "Dedicated Run"}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
              TIV: {formatKES(totalTiv)}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-red-100 text-red-800">
              Loss: {formatKES(totalLoss)}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              className="text-xs h-7 gap-1 font-semibold text-slate-700 cursor-pointer"
            >
              <Download className="size-3 text-[#D21245]" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search asset name, ID, or ward..."
            className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00264D]"
          />

          {availableFiles.length > 1 && (
            <select
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 cursor-pointer focus:outline-none"
            >
              <option value="all">📁 All Files ({availableFiles.length})</option>
              {availableFiles.map((file) => (
                <option key={file} value={file}>
                  📄 {file}
                </option>
              ))}
            </select>
          )}

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 cursor-pointer focus:outline-none"
          >
            <option value="all">All Typologies</option>
            <option value="concrete_rcc">Concrete RCC</option>
            <option value="permanent_masonry">Permanent Masonry</option>
            <option value="informal_iron_sheet">Informal Iron Sheet</option>
            <option value="informal_timber">Informal Timber</option>
            <option value="semi_permanent">Semi-Permanent</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 cursor-pointer focus:outline-none"
          >
            <option value="all">All Risk Tiers</option>
            <option value="high">🔴 High Tier</option>
            <option value="mid">🟡 Medium Tier</option>
            <option value="low">🟢 Low Tier</option>
          </select>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700 font-semibold">
                <th className="text-left py-2.5">Asset ID & Name</th>
                <th className="text-left py-2.5">Source / File</th>
                <th className="text-left py-2.5">Locality</th>
                <th className="text-left py-2.5">Typology</th>
                <th className="text-right py-2.5">TIV Exposure</th>
                <th className="text-right py-2.5">Water Depth</th>
                <th className="text-right py-2.5">Damage %</th>
                <th className="text-right py-2.5">Modeled Loss</th>
                <th className="text-center py-2.5">Risk Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((asset) => (
                <tr
                  key={asset.loc_id}
                  onClick={() => onInspectAsset?.(asset)}
                  className="hover:bg-blue-50/50 cursor-pointer transition"
                  title={`Click to inspect ${asset.loc_id} full dossier`}
                >
                  <td className="py-2.5 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{asset.name || asset.loc_id}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{asset.loc_id}</div>
                  </td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                      📄 {asset.source_file || activeRunName || "Custom"}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-600">{asset.ward}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                      {CLASS_LABEL[asset.housing_class] || asset.housing_class}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-right font-semibold text-[#00264D]">
                    {formatKES(asset.tiv_kes)}
                  </td>
                  <td className="py-2.5 font-mono text-right font-bold text-red-600">
                    {asset.depth_m?.toFixed(2) || "0.00"} m
                  </td>
                  <td className="py-2.5 font-mono text-right text-slate-700">
                    {((asset.damage_ratio || 0) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 font-mono text-right font-bold text-slate-900">
                    {formatKES(asset.loss_kes || 0)}
                  </td>
                  <td className="py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          asset.risk_level === "high"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : asset.risk_level === "mid"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {asset.risk_level === "high" ? "High" : asset.risk_level === "mid" ? "Medium" : "Low"}
                      </span>
                      {onInspectAsset && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectAsset(asset);
                          }}
                          className="h-6 text-[10px] text-[#00264D] hover:bg-white px-1.5 cursor-pointer hidden sm:inline-flex"
                        >
                          Inspect →
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#00264D]">Exposure Portfolio</h1>
        <p className="text-xs sm:text-sm text-slate-600">
          600 geocoded baseline assets · Nairobi County · Searchable & Filterable · Click any asset to inspect
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs">
        <PropertyTable rp={rp} onSelectAsset={onInspectAsset} />
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

function AIPanel({
  scenario,
  summary,
}: {
  scenario: RP;
  summary?: PortfolioSummary | null;
}) {
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
          <RiskBriefing
            scenario={scenario}
            portfolioLossKes={summary?.event_loss_kes}
            lossRatio={summary?.loss_ratio}
          />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#00264D]">Data & Model Assumptions</h1>
          <p className="text-xs sm:text-sm text-slate-600">Actuarial methodology, hazard rasters, and vulnerability parameters</p>
        </div>
        <a
          href="/CAT_MODEL_ARCHITECTURE.pdf"
          target="_blank"
          rel="noopener noreferrer"
          download="KenyaRe_CAT_Model_Architecture_Blueprint.pdf"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00264D] hover:bg-[#001830] text-white text-xs font-semibold transition shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Download className="size-3.5" />
          <span>Download Architecture Blueprint (PDF)</span>
        </a>
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

function ReportsPanel({
  scenario,
  summary,
  assets,
  activeRunName,
  runs = [],
  activeRunId = "baseline",
  onSelectRun,
}: {
  scenario: RP;
  summary: PortfolioSummary | null;
  assets?: ExposureAsset[];
  activeRunName: string;
  runs?: DatasetRun[];
  activeRunId?: string;
  onSelectRun?: (id: string) => void;
}) {
  const [reportTab, setReportTab] = useState<"memorandum" | "quote" | "portfolio" | "blueprint">("memorandum");
  const [isExportingPortfolio, setIsExportingPortfolio] = useState(false);
  const [reportScope, setReportScope] = useState<string>(activeRunId || "all");

  useEffect(() => {
    if (activeRunId) setReportScope(activeRunId);
  }, [activeRunId]);

  const currentScopeRun = runs.find((r) => r.id === reportScope);
  const isScopeConsolidated = reportScope === "all";

  const scopedAssets = useMemo(() => {
    if (isScopeConsolidated) {
      if (runs.length > 0) return runs.flatMap((r) => r.assets);
      return assets || [];
    }
    if (reportScope === "baseline") {
      return (assets || []).filter((a) => !a.dataset_id);
    }
    if (currentScopeRun) {
      return currentScopeRun.assets;
    }
    return assets || [];
  }, [reportScope, isScopeConsolidated, currentScopeRun, runs, assets]);

  const scopedTiv = useMemo(() => {
    if (isScopeConsolidated) {
      return runs.length > 0
        ? runs.reduce((acc, r) => acc + (r.summary?.tiv_kes || r.totalTivKes || 0), 0)
        : summary?.tiv_kes ?? 0;
    }
    if (currentScopeRun) {
      return currentScopeRun.summary?.tiv_kes || currentScopeRun.totalTivKes || 0;
    }
    return summary?.tiv_kes ?? 0;
  }, [isScopeConsolidated, currentScopeRun, runs, summary]);

  const scopedLoss = useMemo(() => {
    if (isScopeConsolidated) {
      return runs.length > 0
        ? runs.reduce((acc, r) => acc + (r.summary?.event_loss_kes || 0), 0)
        : summary?.event_loss_kes ?? 0;
    }
    if (currentScopeRun) {
      return currentScopeRun.summary?.event_loss_kes ?? 0;
    }
    return summary?.event_loss_kes ?? 0;
  }, [isScopeConsolidated, currentScopeRun, runs, summary]);

  const scopedLossRatio = scopedTiv > 0 ? (scopedLoss / scopedTiv) * 100 : 0;

  const scopeTitle = isScopeConsolidated
    ? `Consolidated Portfolio (${runs.length} Records)`
    : currentScopeRun
    ? currentScopeRun.name
    : "Nairobi Baseline 600";

  const handleExportPortfolio = async () => {
    if (!scopedAssets || scopedAssets.length === 0) {
      toast.error("No asset data available to export");
      return;
    }
    setIsExportingPortfolio(true);
    try {
      await exportExposurePortfolioPDF(scopedAssets, scopeTitle, scopedTiv);
      toast.success("Portfolio Exposure Schedule PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate portfolio PDF");
    } finally {
      setIsExportingPortfolio(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#00264D] flex items-center gap-2">
            <FileText className="size-6 text-[#D21245]" />
            Official Kenya Re Reports & Slips
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Export legally compliant underwriting memoranda, facultative pricing slips, and portfolio schedules with official Kenya Re letterhead.
          </p>
        </div>

        {/* Dataset Scope Selector */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 shadow-2xs self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-slate-500 pl-1.5">Scope:</span>
          <select
            value={reportScope}
            onChange={(e) => {
              const val = e.target.value;
              setReportScope(val);
              if (onSelectRun) onSelectRun(val);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1 font-semibold text-[#00264D] cursor-pointer focus:outline-none max-w-[210px] truncate"
          >
            {runs.length > 1 && (
              <option value="all">🌐 Consolidated ({runs.length} Files)</option>
            )}
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                📄 {r.fileName || r.name} ({r.assetCount})
              </option>
            ))}
            <option value="baseline">🏛️ Nairobi 600 Baseline</option>
          </select>
        </div>
      </div>

      {/* Report Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
        <button
          onClick={() => setReportTab("memorandum")}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            reportTab === "memorandum"
              ? "border-[#D21245] text-[#D21245]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          1. Executive Memorandum (AI)
        </button>
        <button
          onClick={() => setReportTab("quote")}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            reportTab === "quote"
              ? "border-[#D21245] text-[#D21245]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          2. Facultative Quote Slip
        </button>
        <button
          onClick={() => setReportTab("portfolio")}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            reportTab === "portfolio"
              ? "border-[#D21245] text-[#D21245]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          3. Portfolio Schedule PDF
        </button>
        <button
          onClick={() => setReportTab("blueprint")}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            reportTab === "blueprint"
              ? "border-[#D21245] text-[#D21245]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          4. Architecture Blueprint PDF
        </button>
      </div>

      {/* Tab 1: Executive Memorandum */}
      {reportTab === "memorandum" && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs">
          <RiskBriefing
            scenario={scenario}
            portfolioLossKes={scopedLoss}
            lossRatio={scopedLossRatio}
            datasetId={reportScope}
            datasetName={scopeTitle}
          />
        </div>
      )}

      {/* Tab 2: Facultative Quote Slip */}
      {reportTab === "quote" && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs">
          <QuoteGenerator />
        </div>
      )}

      {/* Tab 3: Portfolio Exposure Schedule */}
      {reportTab === "portfolio" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#00264D]">Active Portfolio Asset Schedule</h3>
              <p className="text-xs text-slate-600">
                Detailed listing of {scopedAssets?.length ?? 0} assets for {scopeTitle} with geolocations, TIV valuations, and housing classifications.
              </p>
            </div>
            <Button
              onClick={handleExportPortfolio}
              disabled={isExportingPortfolio || !scopedAssets || scopedAssets.length === 0}
              className="bg-[#00264D] hover:bg-[#001c38] text-white gap-2 font-medium self-start sm:self-auto cursor-pointer"
            >
              {isExportingPortfolio ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileDown className="size-4 text-[#D21245]" />
                  Download Schedule PDF
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Dataset Scope</span>
              <div className="text-sm font-bold text-slate-900 truncate">{scopeTitle}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Asset Count</span>
              <div className="text-sm font-bold text-slate-900">{scopedAssets?.length ?? 0}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Total Insured Value</span>
              <div className="text-sm font-bold text-slate-900">{formatKES(scopedTiv)}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Average Asset TIV</span>
              <div className="text-sm font-bold text-slate-900">
                {scopedAssets && scopedAssets.length > 0
                  ? formatKES(scopedTiv / scopedAssets.length)
                  : "KES 0"}
              </div>
            </div>
          </div>

          {/* Quick preview table */}
          <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="p-2.5">Asset ID</th>
                  <th className="p-2.5">Housing Class</th>
                  <th className="p-2.5 text-right">TIV (KES)</th>
                  <th className="p-2.5">Latitude</th>
                  <th className="p-2.5">Longitude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(scopedAssets || []).slice(0, 30).map((a, idx) => (
                  <tr key={a.loc_id || (a as any).id || idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono text-slate-800">{a.loc_id || (a as any).id || `Asset-${idx + 1}`}</td>
                    <td className="p-2.5 capitalize">{a.housing_class.replace(/_/g, " ")}</td>
                    <td className="p-2.5 text-right font-medium text-slate-900">{formatKES(a.tiv_kes)}</td>
                    <td className="p-2.5 font-mono text-slate-600">{a.lat.toFixed(4)}</td>
                    <td className="p-2.5 font-mono text-slate-600">{(a.lon ?? a.lng ?? 0).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {scopedAssets && scopedAssets.length > 30 && (
            <p className="text-[11px] text-slate-500 text-center">
              Showing first 30 of {scopedAssets.length} assets. Full schedule available in PDF export.
            </p>
          )}
        </div>
      )}

      {/* Tab 4: Architecture Blueprint PDF */}
      {reportTab === "blueprint" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#00264D] flex items-center gap-2">
                <span>Kenya Re CAT Modeling Engineering Blueprint</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  Official 6-Page Specification
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Full technical specification: 4 CAT Pillars (Hazard, JRC Sigmoids, OED Exposure, Financial AAL/EP), AI Layer, and Test Case verification.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
              <a
                href="/CAT_MODEL_ARCHITECTURE.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs"
              >
                <ExternalLink className="size-3.5 text-[#00264D]" />
                <span>Open in New Tab</span>
              </a>
              <a
                href="/CAT_MODEL_ARCHITECTURE.pdf"
                download="KenyaRe_CAT_Model_Architecture_Blueprint.pdf"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00264D] hover:bg-[#001830] text-white text-xs font-semibold shadow-xs"
              >
                <Download className="size-3.5 text-[#D21245]" />
                <span>Download PDF Document</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-2 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Analytical Framework
              </span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                4-Pillar Oasis OED & JRC
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Grounded on Huizinga et al. (2017) & CLIMADA
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Geospatial Resolution
              </span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                NASA DEM Nairobi Catchment
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                5 Return Periods (5y to 100y) & 24 Validation Hotspots
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                AI Intelligence Layer
              </span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                Groq Llama-3 NLP + Drainage ML
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Unstructured document ingestion + solvency buffer
              </span>
            </div>
          </div>

          {/* Embedded PDF Viewer */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
            <iframe
              src="/CAT_MODEL_ARCHITECTURE.pdf#toolbar=1"
              title="Kenya Re CAT Model Architecture Blueprint"
              className="w-full h-[620px] border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RepositoryPanel({
  runs,
  activeRunId,
  scenario,
  onSelectRun,
  onRenameRun,
  onDeleteRun,
  onDownloadCSV,
  onOpenIngestModal,
}: {
  runs: DatasetRun[];
  activeRunId: string;
  scenario: RP;
  onSelectRun: (id: string) => void;
  onRenameRun: (id: string, name: string) => void;
  onDeleteRun: (id: string) => void;
  onDownloadCSV: (run: DatasetRun) => void;
  onOpenIngestModal: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [search, setSearch] = useState("");

  const handleStartEdit = (run: DatasetRun) => {
    setEditingId(run.id);
    setEditName(run.name);
  };

  const handleSaveEdit = (runId: string) => {
    if (editName.trim()) {
      onRenameRun(runId, editName.trim());
    }
    setEditingId(null);
  };

  const filtered = runs.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.fileName && r.fileName.toLowerCase().includes(search.toLowerCase()))
  );

  const totalAssets = runs.reduce((acc, r) => acc + r.assetCount, 0);
  const totalTiv = runs.reduce((acc, r) => acc + r.totalTivKes, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#00264D] flex items-center gap-2">
            <FolderArchive className="size-6 text-[#00264D]" />
            <span>Dataset Repository & File Manager</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            View stored exposure files, inspect upload timestamps, rename datasets, download CSV schedules, and toggle active simulation scopes.
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
              <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Neon Cloud PostgreSQL + PostGIS (Active & Persistent)
            </span>
          </div>
        </div>
        <Button
          onClick={onOpenIngestModal}
          className="bg-[#00264D] hover:bg-[#001830] text-white text-xs font-semibold gap-2 self-start sm:self-auto cursor-pointer"
        >
          <UploadCloud className="size-4 text-white" />
          Upload File
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[10px] font-semibold uppercase text-slate-500">Datasets Saved</div>
          <div className="mt-1 text-xl font-bold font-mono text-[#00264D]">{runs.length + 1} Records</div>
          <div className="text-[11px] text-slate-500">{runs.length} Custom + 1 Baseline</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[10px] font-semibold uppercase text-slate-500">Total Uploaded Assets</div>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900">{totalAssets.toLocaleString()} Units</div>
          <div className="text-[11px] text-slate-500">Across {runs.length} custom files</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[10px] font-semibold uppercase text-slate-500">Consolidated Upload TIV</div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-700">{formatKES(totalTiv)}</div>
          <div className="text-[11px] text-slate-500">Total Insured Value</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[10px] font-semibold uppercase text-slate-500">Active Scope</div>
          <div className="mt-1 text-sm font-bold truncate text-[#D21245]">
            {activeRunId === "all"
              ? "🌐 Consolidated (All Files)"
              : activeRunId === "baseline"
              ? "📁 Nairobi 600 Baseline"
              : runs.find((r) => r.id === activeRunId)?.name || activeRunId}
          </div>
          <div className="text-[11px] text-slate-500">Driving current dashboard</div>
        </div>
      </div>

      {/* Repository Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Saved Exposure Files</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              {runs.length + 1}
            </span>
          </div>
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search datasets..."
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00264D]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[800px]">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="p-3">Status</th>
                <th className="p-3">Dataset Name & File</th>
                <th className="p-3">Upload Time</th>
                <th className="p-3">Source Engine</th>
                <th className="p-3 text-right">Assets</th>
                <th className="p-3 text-right">Total TIV</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Baseline Row */}
              <tr className={`hover:bg-slate-50 transition ${activeRunId === "baseline" ? "bg-blue-50/40" : ""}`}>
                <td className="p-3">
                  {activeRunId === "baseline" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Check className="size-3" /> Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Inactive</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="font-bold text-slate-900">Nairobi 600 Baseline Exposure</div>
                  <div className="text-[11px] text-slate-500 font-mono">nairobi_baseline_600.oed.csv</div>
                </td>
                <td className="p-3 text-slate-500">System Built-In</td>
                <td className="p-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                    Oasis OED / OSM
                  </span>
                </td>
                <td className="p-3 text-right font-mono font-semibold text-slate-800">600</td>
                <td className="p-3 text-right font-mono font-semibold text-[#00264D]">KES 63.64B</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {activeRunId !== "baseline" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectRun("baseline")}
                        className="h-7 text-[11px] px-2.5 font-semibold text-[#00264D] hover:bg-slate-100 cursor-pointer"
                      >
                        Activate & View
                      </Button>
                    )}
                  </div>
                </td>
              </tr>

              {/* Consolidated Multi-file Row if > 1 runs */}
              {runs.length > 1 && (
                <tr className={`hover:bg-slate-50 transition ${activeRunId === "all" ? "bg-blue-50/40" : ""}`}>
                  <td className="p-3">
                    {activeRunId === "all" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check className="size-3" /> Active
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Inactive</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-[#00264D] flex items-center gap-1.5">
                      <Globe className="size-3.5 text-blue-600" />
                      Consolidated Portfolio (All {runs.length} Uploads)
                    </div>
                    <div className="text-[11px] text-slate-500">Multi-region combined aggregation</div>
                  </td>
                  <td className="p-3 text-slate-500">Dynamic Live</td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                      Consolidated
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-semibold text-slate-800">{totalAssets}</td>
                  <td className="p-3 text-right font-mono font-semibold text-[#00264D]">{formatKES(totalTiv)}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {activeRunId !== "all" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectRun("all")}
                          className="h-7 text-[11px] px-2.5 font-semibold text-[#00264D] hover:bg-slate-100 cursor-pointer"
                        >
                          Activate & View
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Uploaded Runs */}
              {filtered.map((run) => (
                <tr
                  key={run.id}
                  className={`hover:bg-slate-50 transition ${activeRunId === run.id ? "bg-emerald-50/30" : ""}`}
                >
                  <td className="p-3">
                    {activeRunId === run.id ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check className="size-3" /> Active
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Inactive</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingId === run.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-xs border border-[#00264D] rounded px-2 py-1 font-semibold text-slate-900 focus:outline-none w-48"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(run.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveEdit(run.id)}
                          className="p-1 rounded text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                          title="Save Name"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded text-slate-400 hover:bg-slate-200 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 group">
                        <span className="font-bold text-slate-900">{run.name}</span>
                        <button
                          onClick={() => handleStartEdit(run)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-700 cursor-pointer transition"
                          title="Rename dataset"
                        >
                          <Edit3 className="size-3" />
                        </button>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 font-mono">{run.fileName || "custom_upload.csv"}</div>
                  </td>
                  <td className="p-3 text-slate-600 font-mono text-[11px]">{run.timestamp || "Recent"}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        run.source === "file_upload"
                          ? "bg-indigo-100 text-indigo-800"
                          : run.source === "csv_upload"
                          ? "bg-blue-100 text-blue-800"
                          : run.source === "ai_slip"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {run.source === "file_upload"
                        ? "Document Ingest (AI)"
                        : run.source === "csv_upload"
                        ? "CSV Dataset"
                        : run.source === "ai_slip"
                        ? "AI Policy Slip"
                        : "Preset Batch"}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-semibold text-slate-800">{run.assetCount}</td>
                  <td className="p-3 text-right font-mono font-semibold text-[#00264D]">{formatKES(run.totalTivKes)}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {activeRunId !== run.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectRun(run.id)}
                          className="h-7 text-[11px] px-2.5 font-semibold text-[#00264D] hover:bg-slate-100 cursor-pointer"
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownloadCSV(run)}
                        className="h-7 text-[11px] px-2 text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Download CSV"
                      >
                        <Download className="size-3 text-[#D21245]" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteRun(run.id)}
                        className="h-7 text-[11px] px-2 text-red-600 hover:bg-red-50 hover:border-red-200 cursor-pointer"
                        title="Delete dataset"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
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
