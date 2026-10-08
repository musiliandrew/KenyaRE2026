"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PropertyTable } from "@/components/cat/PropertyTable";
import { PropertyForm } from "@/components/cat/PropertyForm";
import { AIExposureForm } from "@/components/cat/AIExposureForm";
import {
  Database,
  Sparkles,
  PlusCircle,
  ArrowRight,
  Compass,
  FileDown,
  CheckCircle2,
  Table,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api, formatKES } from "@/lib/api";
import { exportExposurePortfolioPDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";

export default function DataPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: assetsData, isLoading: assetsLoading, refetch: refetchAssets } = useApi(() => api.assets(600));
  const { data: summaryData } = useApi(() => api.summary());

  // Ingestion Mode: "baseline" | "ai-slip" | "single-form"
  const [ingestionMode, setIngestionMode] = useState<"baseline" | "ai-slip" | "single-form">("baseline");
  const [showTableDetails, setShowTableDetails] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const totalAssets = assetsData?.total_assets ?? 600;
  const totalTIV = summaryData?.total_tiv_kes ?? 63640000000;
  const aalKES = summaryData?.annual_average_loss_kes ?? 94200000;
  const pml100yKES = summaryData?.loss_100y_kes ?? 842600000;

  const handleExportPDF = async () => {
    try {
      setIsExportingPdf(true);
      await exportExposurePortfolioPDF(
        {
          totalAssets,
          totalTIV,
          aalKES,
          pml100yKES,
        },
        assetsData?.assets ?? []
      );
      toast.success("Kenya Re Portfolio Audit PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate portfolio PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#F8F9FA]">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 sm:px-8 py-3.5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#00264D] p-2 text-white shadow-xs">
              <Database className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-[#00264D]">
                  Exposure Data Ingestion & Calibration
                </h1>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Step 1 (Start of Flow)
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Primary pipeline stage: Ingest, validate, and geocode portfolio assets before catastrophe modeling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="text-xs gap-1.5 cursor-pointer"
            >
              {isExportingPdf ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileDown className="size-3.5 text-[#D21245]" />
              )}
              <span>Export PDF Audit</span>
            </Button>
            <Link href="/dashboard?tab=hazard">
              <Button size="sm" className="bg-[#00264D] hover:bg-[#001830] text-xs text-white gap-1.5 cursor-pointer">
                <span>Step 2: 3D Map</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Flow Content */}
      <main className="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* PIPELINE WORKFLOW STEP GUIDE BANNER */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Catastrophe Modeling Pipeline Flow
            </div>
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Step 1 Ingestion Active
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
            <div className="rounded-lg border-2 border-[#00264D] bg-[#00264D]/5 p-2.5">
              <div className="flex items-center justify-between font-bold text-[#00264D]">
                <span>1. Data Ingest</span>
                <span className="text-[10px] bg-[#00264D] text-white px-1.5 py-0.2 rounded">Active</span>
              </div>
              <div className="text-[10px] text-slate-600 mt-1">600 Assets & TIV</div>
            </div>

            <Link href="/dashboard?tab=hazard" className="block group">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 group-hover:border-slate-300 transition">
                <div className="flex items-center justify-between font-semibold text-slate-700 group-hover:text-[#00264D]">
                  <span>2. 3D Hazard Sim</span>
                  <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Nairobi Flood Depths</div>
              </div>
            </Link>

            <Link href="/dashboard?tab=loss" className="block group">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 group-hover:border-slate-300 transition">
                <div className="flex items-center justify-between font-semibold text-slate-700 group-hover:text-[#00264D]">
                  <span>3. EP Loss Engine</span>
                  <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-[10px] text-slate-500 mt-1">PML & AAL Curves</div>
              </div>
            </Link>

            <Link href="/console/quotes" className="block group">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 group-hover:border-slate-300 transition">
                <div className="flex items-center justify-between font-semibold text-slate-700 group-hover:text-[#00264D]">
                  <span>4. Issue Quotes</span>
                  <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Official PDF Slips</div>
              </div>
            </Link>
          </div>
        </div>

        {/* INGESTION ACTION BUTTONS (NO CONFUSING CLUTTER) */}
        <div>
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-900">
              Select Ingestion Method
            </h2>
            <p className="text-xs text-slate-500">
              Choose how you want to bring exposure data into the catastrophe modeling engine:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Button 1: Baseline Portfolio */}
            <button
              onClick={() => setIngestionMode("baseline")}
              className={`flex flex-col text-left p-4 rounded-xl border transition cursor-pointer ${
                ingestionMode === "baseline"
                  ? "border-[#00264D] bg-[#00264D]/5 ring-2 ring-[#00264D]/20 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`p-2 rounded-lg ${ingestionMode === "baseline" ? "bg-[#00264D] text-white" : "bg-slate-100 text-slate-700"}`}>
                  <Database className="size-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Recommended
                </span>
              </div>
              <div className="font-bold text-sm text-[#00264D]">
                Load Nairobi Baseline
              </div>
              <div className="text-xs text-slate-600 mt-1">
                600 synthetic commercial & residential assets across 8 river wards (KES 63.64B TIV).
              </div>
            </button>

            {/* Button 2: AI Slip Ingestion */}
            <button
              onClick={() => setIngestionMode("ai-slip")}
              className={`flex flex-col text-left p-4 rounded-xl border transition cursor-pointer ${
                ingestionMode === "ai-slip"
                  ? "border-[#00264D] bg-[#00264D]/5 ring-2 ring-[#00264D]/20 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`p-2 rounded-lg ${ingestionMode === "ai-slip" ? "bg-[#D21245] text-white" : "bg-slate-100 text-slate-700"}`}>
                  <Sparkles className="size-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Groq LLM
                </span>
              </div>
              <div className="font-bold text-sm text-slate-900">
                AI Broker Slip Ingestion
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Paste unstructured text slips or email schedules to extract and geocode policies.
              </div>
            </button>

            {/* Button 3: Manual Single Entry */}
            <button
              onClick={() => setIngestionMode("single-form")}
              className={`flex flex-col text-left p-4 rounded-xl border transition cursor-pointer ${
                ingestionMode === "single-form"
                  ? "border-[#00264D] bg-[#00264D]/5 ring-2 ring-[#00264D]/20 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`p-2 rounded-lg ${ingestionMode === "single-form" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"}`}>
                  <PlusCircle className="size-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Manual Entry
                </span>
              </div>
              <div className="font-bold text-sm text-slate-900">
                Add Single Property
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Enter building dimensions, typology, and replacement cost for a specific risk.
              </div>
            </button>
          </div>
        </div>

        {/* PRIMARY PIPELINE PROGRESS CTA BANNER */}
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-emerald-950">
                  Exposure Portfolio Calibrated & Ready ({totalAssets} Assets · {formatKES(totalTIV)})
                </div>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Your exposure dataset is prepared. Proceed directly to Step 2 to simulate the pluvial flood layer and view 3D water depths.
                </p>
              </div>
            </div>

            <Link href="/dashboard?tab=hazard">
              <Button className="w-full sm:w-auto bg-[#00264D] hover:bg-[#001830] text-white px-5 py-2.5 text-xs sm:text-sm font-semibold gap-2 shadow-sm cursor-pointer">
                <span>Run Cat Simulation & View 3D Map</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* ACTIVE INGESTION MODE WORKSPACE */}
        {ingestionMode === "baseline" && (
          <div className="space-y-4">
            {/* Quick KPI Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="text-[11px] text-slate-500 font-medium">Ingested Assets</div>
                <div className="text-lg sm:text-xl font-bold font-mono text-[#00264D] mt-1">
                  {totalAssets.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">✓ Geocoded to 30m DEM</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="text-[11px] text-slate-500 font-medium">Total Insured Value</div>
                <div className="text-lg sm:text-xl font-bold font-mono text-[#00264D] mt-1">
                  {formatKES(totalTIV)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Commercial & Residential</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="text-[11px] text-slate-500 font-medium">Annual Average Loss (AAL)</div>
                <div className="text-lg sm:text-xl font-bold font-mono text-[#D21245] mt-1">
                  {formatKES(aalKES)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Modeled Pure Burn Cost</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="text-[11px] text-slate-500 font-medium">1-in-100 Year PML</div>
                <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1">
                  {formatKES(pml100yKES)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Solvency Stress Benchmark</div>
              </div>
            </div>

            {/* Collapsible Inspection Table */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Portfolio Asset Schedule
                  </h3>
                  <p className="text-xs text-slate-500">
                    Individual geocoded structures, housing typology, and replacement values
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTableDetails(!showTableDetails)}
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  <Table className="size-3.5" />
                  <span>{showTableDetails ? "Hide Table Details" : "View / Audit Assets Table"}</span>
                  {showTableDetails ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </Button>
              </div>

              {showTableDetails && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <PropertyTable />
                </div>
              )}
            </div>
          </div>
        )}

        {ingestionMode === "ai-slip" && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#00264D] flex items-center gap-2">
                <Sparkles className="size-5 text-[#D21245]" />
                Unstructured Broker Slip Ingestion (Groq LLM)
              </h3>
              <p className="text-xs text-slate-600">
                Paste broker slips, emails, or policy schedules. The model extracts TIV, building typology, and calculates technical rate.
              </p>
            </div>
            <AIExposureForm />
          </div>
        )}

        {ingestionMode === "single-form" && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs space-y-4 max-w-2xl mx-auto">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#00264D] flex items-center gap-2">
                <PlusCircle className="size-5 text-[#00264D]" />
                Manual Single Property Registration
              </h3>
              <p className="text-xs text-slate-600">
                Add an individual structure directly into Kenya Re's exposure database.
              </p>
            </div>
            <PropertyForm onSuccess={() => {
              refetchAssets();
              setIngestionMode("baseline");
              toast.success("Property added and added to exposure database!");
            }} />
          </div>
        )}
      </main>
    </div>
  );
}
