"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Info, FileText, Database } from "lucide-react";

export function ModelAssumptions() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#00264D] mb-2">Model Assumptions & Audit Trail</h3>
        <p className="text-sm text-slate-600">
          Complete transparency on data sources, assumptions, and model limitations.
        </p>
      </div>

      {/* Data Sources */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Database className="size-4" />
          Data Sources
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-slate-900">Real Terrain & River Data</div>
              <div className="text-slate-600">SRTM 30m DEM + OpenStreetMap river channels</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-slate-900">Government Hotspots</div>
              <div className="text-slate-600">24 of 37 government-identified flood-prone areas (geocoded)</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-slate-900">Synthetic Portfolio</div>
              <div className="text-slate-600">600 synthetic properties (NOT real client data)</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-slate-900">Hazard Proxy Layer</div>
              <div className="text-slate-600">Terrain-based susceptibility scores (not measured flood depth)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Return Period Mapping */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="size-4" />
          Return Period Assumptions
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Common</span>
            <Badge className="bg-blue-100 text-blue-700">1-in-5 Year (20%)</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Occasional</span>
            <Badge className="bg-blue-100 text-blue-700">1-in-10 Year (10%)</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Moderate</span>
            <Badge className="bg-amber-100 text-amber-700">1-in-25 Year (4%)</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Severe</span>
            <Badge className="bg-orange-100 text-orange-700">1-in-50 Year (2%)</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-600">Extreme</span>
            <Badge className="bg-red-100 text-red-700">1-in-100 Year (1%)</Badge>
          </div>
        </div>
      </div>

      {/* Vulnerability Functions */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="size-4" />
          Depth-Damage Functions (JRC Reference)
        </h4>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-900 mb-1">Informal Iron Sheet</div>
            <div className="text-slate-600">Steep damage curve: 85% cap at 0.5m depth</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-900 mb-1">Semi-Permanent</div>
            <div className="text-slate-600">Moderate curve: 80% cap at 1.5m depth</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-900 mb-1">Permanent Masonry</div>
            <div className="text-slate-600">Resilient curve: 75% cap at 2.0m depth</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-900 mb-1">Concrete RCC</div>
            <div className="text-slate-600">Highly resilient: 70% cap at 2.5m depth</div>
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-500">
          Reference: JRC / Huizinga et al. global flood damage framework
        </div>
      </div>

      {/* Model Limitations */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h4 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="size-4" />
          Model Limitations
        </h4>
        <div className="space-y-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <Info className="size-4 shrink-0 mt-0.5" />
            <div>
              <strong>Hotspot Detection:</strong> Terrain proxy captures 12/24 hotspots. Misses 12 due to drainage infrastructure failures (Kibera, Westlands, Lavington).
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Info className="size-4 shrink-0 mt-0.5" />
            <div>
              <strong>Hazard Data:</strong> Proxy susceptibility scores (0-1), not measured flood depth in meters.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Info className="size-4 shrink-0 mt-0.5" />
            <div>
              <strong>Portfolio:</strong> 600 synthetic properties - not real client data.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Info className="size-4 shrink-0 mt-0.5" />
            <div>
              <strong>AI Layer:</strong> AI drainage-gap detection adds +KES 115M modeled exposure.
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h4 className="font-semibold text-slate-900 mb-4">Key Reinsurance Metrics</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-500">Average Annual Loss (AAL)</div>
            <div className="text-lg font-bold text-[#00264D] font-mono">KES 94.2M/yr</div>
          </div>
          <div>
            <div className="text-slate-500">1-in-100 Year PML</div>
            <div className="text-lg font-bold text-red-600 font-mono">KES 842.6M</div>
          </div>
          <div>
            <div className="text-slate-500">1-in-10 Year Loss</div>
            <div className="text-lg font-bold text-slate-900 font-mono">KES 238.9M</div>
          </div>
          <div>
            <div className="text-slate-500">Total Portfolio TIV</div>
            <div className="text-lg font-bold text-[#00264D] font-mono">KES 4.82B</div>
          </div>
        </div>
      </div>
    </div>
  );
}
