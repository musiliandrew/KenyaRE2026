"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuoteGenerator } from "@/components/cat/QuoteGenerator";
import {
  Calculator,
  ArrowRight,
  Database,
  Compass,
  FileDown,
  CheckCircle2,
} from "lucide-react";

export default function QuotesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex-1 min-h-screen bg-[#F8F9FA]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 sm:px-8 py-3.5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#00264D] p-2 text-white shadow-xs">
              <Calculator className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-[#00264D]">
                  Facultative Underwriting & Quoting
                </h1>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                  Step 4
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Single-risk pure burn rate, deductible retention, and official PDF quote slips
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
            <Link href="/dashboard?tab=hazard">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 cursor-pointer">
                <Compass className="size-3.5" />
                <span>3D Hazard Map</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Step Guide Banner */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                ✓
              </span>
              <span className="font-medium text-slate-700">
                Data Calibrated: 600 Exposure Assets · Nairobi River Basins
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <FileDown className="size-3.5 text-[#D21245]" />
              <span>Exports with Official Kenya Re Logo & Actuarial Endorsement</span>
            </div>
          </div>
        </div>

        {/* The Quote Generator Tool */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
          <QuoteGenerator />
        </div>
      </main>
    </div>
  );
}
