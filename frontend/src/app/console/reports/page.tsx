"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RiskBriefing } from "@/components/cat/RiskBriefing";
import { ArrowLeft, FileText, BarChart3, Download } from "lucide-react";

export default function ReportsPage() {
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
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/console")}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <div className="text-sm font-bold tracking-tight text-[#00264D]">
                Reports & Briefings
              </div>
              <div className="text-xs text-slate-500">Generate risk summaries and reports</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/console")}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Quick Report Options */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-bold text-[#00264D] mb-4">Quick Reports</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => router.push("/console")}
                >
                  <BarChart3 className="size-4" />
                  View EP Curve
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => router.push("/console")}
                >
                  <FileText className="size-4" />
                  Portfolio Summary
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                >
                  <Download className="size-4" />
                  Export All Data
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-bold text-[#00264D] mb-4">Report Types</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-[#D21245]" />
                  <span>Executive Risk Briefing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-[#00264D]" />
                  <span>Loss Probability Curve</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-600" />
                  <span>Portfolio Accumulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-amber-600" />
                  <span>Vulnerability Analysis</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: AI Risk Briefing Generator */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <RiskBriefing />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
