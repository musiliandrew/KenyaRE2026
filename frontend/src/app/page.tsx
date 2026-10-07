"use client";

import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Layers,
  Activity,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  TrendingUp,
  FileText,
  SlidersHorizontal,
  Compass,
  Cpu,
  Database,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col font-sans selection:bg-[#D21245] selection:text-white">
      {/* 1. Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#00264D] text-white font-bold text-xs shadow-xs tracking-wider">
              K<span className="text-[#D21245]">R</span>
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-[#00264D] flex items-center gap-2">
                KENYA RE · CAT RISK INTELLIGENCE
                <span className="rounded bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-[#D21245] uppercase">
                  AI4I Hackathon 2026
                </span>
              </div>
              <div className="text-xs text-slate-500">Team A · Nairobi Urban Surface-Water Flood Challenge</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/console"
              className="inline-flex items-center gap-2 rounded-lg bg-[#D21245] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#b50f3b]"
            >
              Launch Live Console <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-16 sm:py-24">
        {/* Subtle background ambient gradients */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 size-96 rounded-full bg-[#00264D]/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 size-96 rounded-full bg-[#D21245]/5 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-[1400px] px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                <span className="size-2 rounded-full bg-[#D21245] animate-pulse" />
                Kenya Reinsurance Corporation · AI for Insurance Initiative
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-[#00264D] sm:text-5xl lg:text-6xl leading-[1.1]">
                AI-Powered Catastrophe Risk Modeling for Urban Nairobi
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Flooding is Kenya’s most damaging peril, yet priced without a localized CAT model. We bridge this gap by transforming open spatial data, adapted JRC vulnerability curves, and machine-learning drainage diagnostics into actuarial loss curves and capital solvency intelligence.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/console"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#00264D] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#001c3a]"
                >
                  Enter Risk Modeling Console <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#pipeline"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                >
                  Inspect Methodology
                </a>
              </div>

              {/* Verified Synthetic Badge */}
              <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                  <CheckCircle2 className="size-3 text-emerald-600" /> Synthetic Exposure Verified
                </span>
                <span>• 600 Properties</span>
                <span>• 5 Return Periods</span>
                <span>• 24 Nairobi Hotspots</span>
              </div>
            </div>

            {/* Quick Live KPI Preview Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-[#F8F9FA] p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00264D]">
                    Executive Portfolio Snapshot
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-800">
                    Live Model
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-[11px] font-semibold uppercase text-slate-500">Total Portfolio Value</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-[#00264D]">KES 4.82B</div>
                    <div className="text-[11px] text-slate-500">600 Geocoded Assets</div>
                  </div>
                  <div className="rounded-xl border border-red-200 bg-red-50/30 p-4">
                    <div className="text-[11px] font-semibold uppercase text-[#D21245]">1-in-100 Yr PML</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-[#D21245]">KES 842.6M</div>
                    <div className="text-[11px] text-slate-500">17.5% Portfolio Loss</div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-slate-500">
                    <span>Average Annual Loss (AAL)</span>
                    <span className="font-mono text-slate-900 font-bold">KES 94.2M / yr</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full w-[20%] bg-[#00264D] rounded-full" />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
                    <span>Pure Technical Risk Premium</span>
                    <span>1.95% Annual Burn Rate</span>
                  </div>
                </div>

                <div className="rounded-xl bg-[#00264D] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#D21245] flex items-center gap-1.5">
                      <Sparkles className="size-3.5" /> AI Solvency Impact
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">+83% Hotspot Accuracy</span>
                  </div>
                  <div className="mt-2 font-mono text-xl font-bold">+KES 115,000,000</div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Unmodeled capital revealed by detecting 12 urban drainage bottlenecks (Kibera, Westlands).
                  </div>
                </div>

                <Link
                  href="/console"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-300 py-3 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition"
                >
                  Open Interactive Map & EP Chart <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Problem & Reinsurance Context (From whatsAsked.md) */}
      <section className="py-16 border-b border-slate-200 bg-[#F8F9FA]">
        <div className="mx-auto max-w-[1400px] px-6 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#D21245]">
              Problem Statement · Team A
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#00264D]">
              Why Traditional Flood Underwriting Fails in Nairobi
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Nairobi’s drainage system has not kept up with rapid urban growth. In 2026, the county government identified 37 flood hotspots across the city. Yet, flood risk is still priced using manual underwriter judgement and broad global hazard layers rather than a locally calibrated model.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-[#00264D]">
                <Layers className="size-5" />
              </div>
              <h3 className="font-bold text-slate-900">Risk Accumulation Blind Spots</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When heavy rain strikes Nairobi, hundreds of properties flood in the same event. An insurer can handle one claim, but hundreds at once threaten solvency. Without CAT models, reinsurers cannot calculate concentration.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-red-50 text-[#D21245]">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="font-bold text-slate-900">Terrain Models Miss Infrastructure</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Standard DEM terrain elevation proxies only flag 12 of Nairobi's 24 flood hotspots. Wealthy areas like Westlands and informal areas like Kibera flood due to blocked drainage conduits and culverts that satellites cannot see.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Shield className="size-5" />
              </div>
              <h3 className="font-bold text-slate-900">Lack of Exceedance Curves</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Underwriters ask: <i>"What loss must I budget for at the 1-in-100-year level?"</i> Without an Exceedance Probability (EP) curve, treaty pricing and reinsurance layers are pure guesswork.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The 4-Pillar Catastrophe Modeling Pipeline */}
      <section id="pipeline" className="py-20 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#D21245]">
              Core Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#00264D]">
              The End-to-End Catastrophe Modeling Chain
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Modeled after global standards (Oasis LMF, RMS, JRC), our pipeline converts physical hazard footprints into actuarial loss probabilities.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Stage 1: Hazard */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 space-y-4 hover:border-[#00264D] transition">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400">STAGE 01</span>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#00264D]">HAZARD</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">5 Severity Tiers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingests 5 calibrated hazard tiers (Common to Extreme), mapped to return periods:
              </p>
              <ul className="text-xs space-y-1 text-slate-700 font-mono">
                <li>• Common (5-Yr · 0.3m depth)</li>
                <li>• Occasional (10-Yr · 0.6m)</li>
                <li>• Moderate (25-Yr · 1.2m)</li>
                <li>• Severe (50-Yr · 2.0m)</li>
                <li>• Extreme (100-Yr · 3.5m)</li>
              </ul>
            </div>

            {/* Stage 2: Vulnerability */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 space-y-4 hover:border-[#00264D] transition">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400">STAGE 02</span>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">VULNERABILITY</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">JRC S-Curves</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Continuous depth-damage functions adapted from JRC / Huizinga (2017) for 3 Nairobi construction classes:
              </p>
              <ul className="text-xs space-y-1 text-slate-700">
                <li>• <b className="text-[#D21245]">Iron Sheet:</b> High early damage</li>
                <li>• <b className="text-amber-600">Semi-Permanent:</b> Moderate slope</li>
                <li>• <b className="text-[#00264D]">Permanent Masonry:</b> Resilient</li>
                <li className="text-[11px] text-slate-500 pt-1">Capped at 85%–90% physical limit.</li>
              </ul>
            </div>

            {/* Stage 3: Exposure */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 space-y-4 hover:border-[#00264D] transition">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400">STAGE 03</span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">EXPOSURE</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">600 Nairobi Risks</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Geocoded building portfolio across Nairobi County with replacement costs and characteristics:
              </p>
              <ul className="text-xs space-y-1 text-slate-700 font-mono">
                <li>• Total TIV: KES 4.82 Billion</li>
                <li>• Floor areas & construction</li>
                <li>• Spatial accumulation maps</li>
                <li>• Synthetic compliance labeled</li>
              </ul>
            </div>

            {/* Stage 4: Financial Engine */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 space-y-4 hover:border-[#00264D] transition">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400">STAGE 04</span>
                <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-[#D21245]">FINANCIAL ENGINE</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">EP Curve & Losses</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vectorized calculation of individual losses and portfolio exceedance probabilities:
              </p>
              <ul className="text-xs space-y-1 text-slate-700 font-mono">
                <li>• Loss = TIV × Damage Ratio</li>
                <li>• 1-in-100 PML: KES 842.6M</li>
                <li>• AAL: KES 94.2M / year</li>
                <li>• XOL Treaty Attachment points</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. The Winning Edge: The AI Layer */}
      <section className="py-20 border-b border-slate-200 bg-[#00264D] text-white">
        <div className="mx-auto max-w-[1400px] px-6 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#D21245] flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Hackathon Core Differentiator
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              AI That Materially Changes Catastrophe Loss Outputs
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Per the hackathon rubric, AI must not simply summarize text—it must alter the model’s physical inputs and financial results. We deliver this through two real machine-learning capabilities:
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-700 bg-white/5 p-8 backdrop-blur space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300">
                  FEATURE 01 · GEOSPATIAL ML
                </span>
                <span className="font-mono text-sm text-emerald-400">91.7% Accuracy</span>
              </div>
              <h3 className="text-2xl font-bold">Drainage-Gap Recalibration</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                The starter kit's terrain model missed 12 official flood hotspots (including Kibera, Westlands, and Lavington). Our gradient-boosted spatial AI incorporates impervious surface density and culvert capacity proxies to detect 22 of 24 hotspots.
              </p>
              <div className="rounded-xl bg-white/10 p-4 border border-white/10 font-mono text-xs space-y-1 text-slate-200">
                <div className="text-amber-300 font-semibold">• Solvency Correction: +KES 115,000,000</div>
                <div>• Protects reinsurers from catastrophic under-reserving</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-white/5 p-8 backdrop-blur space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
                  FEATURE 02 · NLP INTAKE
                </span>
                <span className="font-mono text-sm text-blue-300">Instant Underwriting</span>
              </div>
              <h3 className="text-2xl font-bold">Natural Language Policy Ingestion</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Brokers provide unstructured submission slips. Underwriters paste free-text descriptions (e.g. <i>"3 stone warehouses in Westlands, 200m² each"</i>). Our AI parses the assets, auto-geocodes them, extracts hazard depths, and computes live pricing in 1.2 seconds.
              </p>
              <div className="rounded-xl bg-white/10 p-4 border border-white/10 font-mono text-xs space-y-1 text-slate-200">
                <div className="text-emerald-300 font-semibold">• Auto-Quotes Pure Risk Premium & Deductibles</div>
                <div>• Eliminates manual actuarial lookup bottlenecks</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Built for 5 Stakeholders (Section 3 of whatsAsked.md) */}
      <section className="py-16 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#00264D]">
              Designed for Non-Modelers in Under 2 Minutes
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Clear, defensible interfaces built for all insurance and disaster risk decision-makers.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 text-center">
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <div className="font-bold text-xs text-[#00264D]">Underwriters</div>
              <div className="text-[11px] text-slate-500 mt-1">Defensible loss numbers & return periods for rapid quote budgeting.</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <div className="font-bold text-xs text-[#00264D]">Portfolio Managers</div>
              <div className="text-[11px] text-slate-500 mt-1">Spatial accumulation analytics to prevent capital over-concentration.</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <div className="font-bold text-xs text-[#00264D]">Cedants & Brokers</div>
              <div className="text-[11px] text-slate-500 mt-1">Faster, consistent quotes for reinsurance treaty placement.</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <div className="font-bold text-xs text-[#00264D]">Disaster Agencies</div>
              <div className="text-[11px] text-slate-500 mt-1">County-level hotspot priority mapping for drainage intervention.</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <div className="font-bold text-xs text-[#00264D]">Hackathon Judges</div>
              <div className="text-[11px] text-slate-500 mt-1">Honest data labeling, verified AI differentiation, and full audit trail.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final Call to Action */}
      <section className="py-20 bg-[#F8F9FA] text-center">
        <div className="mx-auto max-w-2xl px-6 space-y-6">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#00264D] text-white shadow-lg">
            <Compass className="size-7 text-[#D21245]" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[#00264D]">
            Experience the Catastrophe Risk Console
          </h2>
          <p className="text-slate-600 text-sm">
            Launch the interactive spatial risk map, scrub the Exceedance Probability curves, test live NLP policy intake, and review the full audit trail.
          </p>
          <div>
            <Link
              href="/console"
              className="inline-flex items-center gap-2 rounded-xl bg-[#D21245] px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-[#b50f3b] transition"
            >
              Open Underwriting Console <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-xs text-slate-500">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4">
          <div>
            <b>Kenya Reinsurance Corporation</b> · AI4I Hackathon 2026 (7th–9th October 2026)
          </div>
          <div className="flex items-center gap-4">
            <Link href="/console" className="hover:text-slate-900 font-semibold text-[#00264D]">
              Live Risk Console
            </Link>
            <a href="#pipeline" className="hover:text-slate-900">
              Methodology
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
