"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RiskBriefing } from "@/components/cat/RiskBriefing";
import {
  FileText,
  BarChart3,
  FileDown,
  Database,
  Compass,
  Calculator,
  Loader2,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { exportExposurePortfolioPDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: summaryData } = useApi((signal) => api.summary("25y", signal), []);
  const { data: assetsData } = useApi((signal) => api.assets(600, signal), []);
  const [isExportingPortfolioPdf, setIsExportingPortfolioPdf] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const handleExportPortfolio = async () => {
    try {
      setIsExportingPortfolioPdf(true);
      await exportExposurePortfolioPDF(
        {
          totalAssets: assetsData?.total_assets ?? 600,
          totalTIV: summaryData?.total_tiv_kes ?? 63640000000,
          aalKES: summaryData?.annual_average_loss_kes ?? 94200000,
          pml100yKES: summaryData?.loss_100y_kes ?? 842600000,
        },
        assetsData?.assets ?? []
      );
      toast.success("Kenya Re Portfolio Summary PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF summary.");
    } finally {
      setIsExportingPortfolioPdf(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#F8F9FA]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 sm:px-8 py-3.5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#00264D] p-2 text-white shadow-xs">
              <FileText className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-[#00264D]">
                  Executive Reports & Memoranda
                </h1>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  PDF Outputs
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Official Kenya Re catastrophe risk memoranda, solvency briefings, and reinsurance schedules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link href="/console/data">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 cursor-pointer">
                <Database className="size-3.5" />
                <span>Step 1: Data</span>
              </Button>
            </Link>
            <Link href="/console/quotes">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 cursor-pointer">
                <Calculator className="size-3.5" />
                <span>Step 4: Quotes</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column: Quick Reports */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
              <h3 className="text-base font-bold text-[#00264D] mb-3">
                Quick Actuarial Exports
              </h3>
              <div className="space-y-2.5">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 text-xs sm:text-sm cursor-pointer"
                  disabled={isExportingPortfolioPdf}
                  onClick={handleExportPortfolio}
                >
                  {isExportingPortfolioPdf ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <FileDown className="size-4 text-[#D21245]" />
                  )}
                  Export Portfolio Audit (PDF)
                </Button>

                <Link href="/dashboard?tab=loss" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 text-xs sm:text-sm cursor-pointer"
                  >
                    <BarChart3 className="size-4 text-[#00264D]" />
                    View Live EP Curve Engine
                  </Button>
                </Link>

                <Link href="/console/quotes" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 text-xs sm:text-sm cursor-pointer"
                  >
                    <Calculator className="size-4 text-emerald-600" />
                    Generate Single Policy Quote Slip
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-[#00264D] mb-3">Document Standards</h3>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#D21245]" />
                  <span>Official Kenya Re Corporate Branding & Logo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#00264D]" />
                  <span>JRC Depth-Damage Vulnerability Functions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-600" />
                  <span>Groq LLM Executive Synthesis Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-purple-600" />
                  <span>SRTM 30m DEM + OSM Drainage Calibrations</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Risk Briefing Generator */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
              <RiskBriefing scenario="100y" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
