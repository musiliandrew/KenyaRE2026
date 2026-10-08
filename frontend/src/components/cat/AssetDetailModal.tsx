"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  TrendingDown,
  Layers,
  MapPin,
  Sparkles,
  Download,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Loader2,
  X,
  Compass,
  FileText,
  Activity,
  Calculator,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
  ReferenceLine,
} from "recharts";
import {
  api,
  formatKES,
  CLASS_LABEL,
  type ExposureAsset,
  type HousingClass,
  type RP,
  type AssetDossierResponse,
} from "@/lib/api";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: ExposureAsset | null;
  activeScenario?: RP;
  portfolioAssets?: ExposureAsset[];
  onSelectAsset?: (asset: ExposureAsset) => void;
  onOpenFacultativeQuote?: (asset: ExposureAsset) => void;
}

const CLASS_COLORS: Record<HousingClass, string> = {
  informal_iron_sheet: "#D21245",
  semi_permanent: "#D97706",
  permanent_masonry: "#16A34A",
  concrete_rcc: "#00264D",
};

export function AssetDetailModal({
  isOpen,
  onClose,
  asset,
  activeScenario = "100y",
  portfolioAssets = [],
  onSelectAsset,
  onOpenFacultativeQuote,
}: AssetDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"ep" | "vuln" | "context">("vuln");
  const [dossier, setDossier] = useState<AssetDossierResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Load dossier whenever asset or activeScenario changes
  useEffect(() => {
    if (!asset || !isOpen) {
      setDossier(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const assetId = asset.loc_id || (asset as any).id || "ASSET-001";

    api
      .assetDossier(assetId, activeScenario)
      .then((res) => {
        if (isMounted) setDossier(res);
      })
      .catch((err) => {
        // Fallback: request via POST payload
        return api
          .calculateAssetDossier({
            asset: {
              ...asset,
              active_rp: activeScenario,
            },
            return_period: activeScenario,
            portfolio_assets: portfolioAssets.slice(0, 50),
          })
          .then((res) => {
            if (isMounted) setDossier(res);
          })
          .catch((calcErr) => {
            console.error("Failed to load asset dossier", calcErr);
          });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [asset, activeScenario, isOpen, portfolioAssets]);

  if (!asset) return null;

  const housingClass = (asset.housing_class as HousingClass) || "concrete_rcc";
  const classLabel = CLASS_LABEL[housingClass] || housingClass;
  const activeDepth = dossier?.asset.depth_m ?? asset.depth_m ?? 0;
  const activeLoss = dossier?.asset.loss_kes ?? asset.loss_kes ?? 0;
  const damageRatioPct =
    dossier?.asset.damage_ratio_pct ?? (asset.damage_ratio ? asset.damage_ratio * 100 : 0);
  const tivKes = dossier?.asset.tiv_kes ?? asset.tiv_kes ?? 0;
  const riskLevel = dossier?.asset.risk_level ?? asset.risk_level ?? "low";

  // Vulnerability curve data for recharts
  const vulnPoints = useMemo(() => {
    if (!dossier?.vulnerability_curve?.points) return [];
    return dossier.vulnerability_curve.points.map((pt) => ({
      depth_m: pt.depth_m,
      damage_ratio_pct: pt.damage_ratio_pct,
    }));
  }, [dossier]);

  // EP curve data for recharts
  const epPoints = useMemo(() => {
    if (!dossier?.exceedance_probability_curve) return [];
    return dossier.exceedance_probability_curve.map((ep) => ({
      return_period: ep.return_period,
      years: `${ep.years}y`,
      loss_millions: ep.loss_kes / 1_000_000,
      loss_kes: ep.loss_kes,
      depth_m: ep.depth_m,
      prob_pct: (ep.annual_exceedance_prob * 100).toFixed(0) + "%",
    }));
  }, [dossier]);

  // Generate single-asset PDF Report
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(0, 38, 77); // Kenya Re Deep Navy #00264D
      doc.rect(0, 0, pageWidth, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("KENYA REINSURANCE CORPORATION", 14, 12);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("SINGLE PROPERTY CATASTROPHE RISK DOSSIER · NAIROBI FLOOD MODEL", 14, 18);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-KE")}`, pageWidth - 14, 18, { align: "right" });

      // Asset Identity Card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 34, pageWidth - 28, 40, 2, 2, "FD");

      doc.setTextColor(0, 38, 77);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(asset.name || asset.loc_id, 18, 43);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Asset ID: ${asset.loc_id}`, 18, 50);
      doc.text(`Administrative Ward: ${asset.ward}`, 18, 56);
      doc.text(`Coordinates: ${asset.lat.toFixed(5)}, ${(asset.lon ?? (asset as any).lng)?.toFixed(5)}`, 18, 62);
      doc.text(`Typology: ${classLabel}`, 18, 68);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 38, 77);
      doc.text(`TIV: ${formatKES(tivKes)}`, pageWidth - 20, 50, { align: "right" });
      doc.setTextColor(210, 18, 69);
      doc.text(`Modeled Loss (${activeScenario}): ${formatKES(activeLoss)}`, pageWidth - 20, 56, { align: "right" });
      doc.setTextColor(15, 23, 42);
      doc.text(`Water Depth: ${activeDepth.toFixed(2)} m (${damageRatioPct.toFixed(1)}% Damage)`, pageWidth - 20, 62, { align: "right" });
      doc.text(`Risk Tier: ${riskLevel.toUpperCase()}`, pageWidth - 20, 68, { align: "right" });

      // Actuarial EP Table
      doc.setTextColor(0, 38, 77);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("1. Loss & Exceedance Probability Schedule", 14, 84);

      let yPos = 90;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, yPos, pageWidth - 28, 7, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("Return Period", 16, yPos + 5);
      doc.text("AEP (Prob)", 46, yPos + 5);
      doc.text("Inundation Depth", 76, yPos + 5);
      doc.text("Damage Ratio", 112, yPos + 5);
      doc.text("Gross Loss (KES)", 148, yPos + 5);
      doc.text("Net Insured Loss", pageWidth - 16, yPos + 5, { align: "right" });

      yPos += 8;
      doc.setFont("helvetica", "normal");
      const epRows = dossier?.exceedance_probability_curve || [];
      epRows.forEach((row, i) => {
        if (i % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, yPos - 1, pageWidth - 28, 6.5, "F");
        }
        doc.setTextColor(15, 23, 42);
        doc.text(`${row.years}-Year (${row.return_period})`, 16, yPos + 4);
        doc.text(`${(row.annual_exceedance_prob * 100).toFixed(1)}%`, 46, yPos + 4);
        doc.text(`${row.depth_m.toFixed(2)} m`, 76, yPos + 4);
        doc.text(`${row.damage_ratio_pct.toFixed(1)}%`, 112, yPos + 4);
        doc.text(formatKES(row.loss_kes), 148, yPos + 4);
        doc.text(formatKES(row.insured_loss_kes), pageWidth - 16, yPos + 4, { align: "right" });
        yPos += 6.5;
      });

      // Vulnerability Parameters
      yPos += 8;
      doc.setTextColor(0, 38, 77);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("2. Calibrated JRC Vulnerability Parameters", 14, yPos);

      yPos += 6;
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const params = dossier?.vulnerability_curve?.parameters;
      doc.text(`• Scientific Citation: ${params?.jrc_reference || "Huizinga et al. (2017) Africa Residential"}`, 16, yPos);
      yPos += 5;
      doc.text(`• Physical Damage Ceiling (Cap): ${params?.cap_pct || 85}%`, 16, yPos);
      yPos += 5;
      doc.text(`• Half-Damage Inflection Depth (Midpoint): ${params?.midpoint || 0.45} m`, 16, yPos);
      yPos += 5;
      doc.text(`• Foundation Protection Threshold (Curb Height): ${params?.threshold_m || 0.05} m`, 16, yPos);
      yPos += 5;
      doc.text(`• Typical Nairobi Reconstruction Rate: ${params?.typical_costs_sqm || "KES 20,000 / m²"}`, 16, yPos);

      // Financial Summary Box
      yPos += 10;
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(14, yPos, pageWidth - 28, 26, 2, 2, "FD");

      doc.setTextColor(22, 101, 52);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Actuarial Reinsurance Underwriting Recommendation", 18, yPos + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(21, 128, 61);
      const fin = dossier?.financial_summary;
      doc.text(`Annual Average Loss (AAL): ${formatKES(fin?.aal_gross_kes || 0)}`, 18, yPos + 14);
      doc.text(`Pure Risk Rate: ${fin?.pure_risk_rate_pct?.toFixed(3) || "0.000"}% of TIV`, 18, yPos + 20);
      doc.text(`Recommended Treaty Deductible: 10%`, pageWidth / 2 + 10, yPos + 14);
      doc.text(`Technical Pure Premium: ${formatKES(fin?.recommended_premium_kes || 0)} / year`, pageWidth / 2 + 10, yPos + 20);

      // Footer
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Confidential · Kenya Re Catastrophe Risk Intelligence Platform · Oasis OED & JRC Model Compliant", 14, 287);

      doc.save(`KenyaRe_Asset_Dossier_${asset.loc_id}_${activeScenario}.pdf`);
      toast.success(`✓ Downloaded Single Asset Dossier PDF for ${asset.loc_id}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate asset PDF dossier");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Modern Clean Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-7 py-4.5 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-[#00264D] px-2 py-0.5 rounded shadow-xs">
                  {asset.loc_id}
                </span>
                <span className="text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <MapPin className="size-3 text-red-500" />
                  {asset.ward}
                </span>
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded capitalize"
                  style={{
                    backgroundColor: `${CLASS_COLORS[housingClass]}15`,
                    color: CLASS_COLORS[housingClass],
                    border: `1px solid ${CLASS_COLORS[housingClass]}40`,
                  }}
                >
                  {classLabel}
                </span>
                {asset.source_file && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    📄 {asset.source_file}
                  </span>
                )}
              </div>

              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 truncate mt-1">
                {asset.name || asset.loc_id}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Lat: {asset.lat.toFixed(4)}, Lon: {(asset.lon ?? (asset as any).lng)?.toFixed(4)} · Area:{" "}
                {asset.floor_area_m2 ? `${asset.floor_area_m2.toLocaleString()} m²` : "N/A"} · Scenario:{" "}
                <strong className="text-slate-800">{activeScenario}</strong>
              </DialogDescription>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="gap-1.5 text-xs text-slate-700 hover:text-[#00264D] cursor-pointer"
                title="Download Single Asset PDF Dossier"
              >
                <Download className="size-3.5" />
                <span className="hidden sm:inline">Export</span> PDF
              </Button>
              {onOpenFacultativeQuote && (
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenFacultativeQuote(asset);
                    onClose();
                  }}
                  className="gap-1.5 text-xs bg-[#00264D] hover:bg-[#001830] text-white cursor-pointer"
                  title="Underwrite Single-Risk Facultative Quote"
                >
                  <Calculator className="size-3.5" />
                  <span className="hidden sm:inline">Underwrite</span> Quote
                </Button>
              )}
            </div>
          </div>

          {/* 4 Key Metric Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                TIV Valuation
              </span>
              <div className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-0.5">
                {formatKES(tivKes)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {asset.floor_area_m2 && tivKes
                  ? `KES ${(tivKes / asset.floor_area_m2).toFixed(0)}/m²`
                  : "Replacement Value"}
              </div>
            </div>

            <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Water Depth ({activeScenario})
              </span>
              <div className="text-sm sm:text-base font-bold font-mono text-blue-900 mt-0.5">
                {activeDepth.toFixed(2)} m
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                DEM Terrain Inundation
              </div>
            </div>

            <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Damage Ratio
              </span>
              <div className="text-sm sm:text-base font-bold font-mono text-amber-700 mt-0.5">
                {damageRatioPct.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                JRC Calibrated Curve
              </div>
            </div>

            <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Modeled Loss
              </span>
              <div className="text-sm sm:text-base font-bold font-mono text-red-600 mt-0.5">
                {formatKES(activeLoss)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                <span
                  className={`inline-block px-1.5 py-0.2 rounded font-bold uppercase ${
                    riskLevel === "high"
                      ? "text-red-700 bg-red-50"
                      : riskLevel === "mid"
                      ? "text-amber-700 bg-amber-50"
                      : "text-emerald-700 bg-emerald-50"
                  }`}
                >
                  {riskLevel} Tier
                </span>
              </div>
            </div>
          </div>

          {/* Segmented Control Tabs */}
          <div className="grid grid-cols-3 gap-1.5 mt-4 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold border border-slate-200/80">
            <button
              onClick={() => setActiveTab("vuln")}
              className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                activeTab === "vuln"
                  ? "bg-white text-[#00264D] font-bold shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Activity className="size-3.5 text-[#00264D]" />
                <span className="truncate">Vulnerability Function & Params</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("ep")}
              className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                activeTab === "ep"
                  ? "bg-white text-[#00264D] font-bold shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <TrendingDown className="size-3.5 text-[#D21245]" />
                <span className="truncate">Loss & Exceedance Probability</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("context")}
              className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                activeTab === "context"
                  ? "bg-white text-[#00264D] font-bold shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Layers className="size-3.5 text-blue-700" />
                <span className="truncate">Portfolio Context & Neighbors</span>
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {loading && !dossier ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="size-8 text-[#00264D] animate-spin mb-2" />
              <p className="text-sm font-medium">Computing Actuarial Single-Asset Profile...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: VULNERABILITY FUNCTION & CALIBRATED PARAMETERS */}
              {activeTab === "vuln" && (
                <div className="space-y-6">
                  {/* Vulnerability Curve Chart */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Damage Ratio vs Inundation Depth (m)
                        </h4>
                        <p className="text-xs text-slate-500">
                          Grounded on JRC / Huizinga Global Flood DDF calibrated for {classLabel}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                          Operating Depth
                        </span>
                        <span className="text-xs font-mono font-bold text-[#D21245]">
                          {activeDepth.toFixed(2)}m → {damageRatioPct.toFixed(1)}% Damage
                        </span>
                      </div>
                    </div>

                    <div className="h-64 sm:h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vulnPoints} margin={{ top: 15, right: 25, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis
                            dataKey="depth_m"
                            label={{
                              value: "Inundation Depth (m)",
                              position: "insideBottom",
                              offset: -10,
                              style: { fontSize: 11, fill: "#64748B" },
                            }}
                            tick={{ fontSize: 11, fill: "#64748B" }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            label={{
                              value: "Damage Ratio (%)",
                              angle: -90,
                              position: "insideLeft",
                              style: { fontSize: 11, fill: "#64748B" },
                            }}
                            tick={{ fontSize: 11, fill: "#64748B" }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-md text-xs">
                                  <div className="font-bold text-slate-800">
                                    Water Depth: {d.depth_m} m
                                  </div>
                                  <div className="text-red-700 font-semibold font-mono mt-0.5">
                                    Damage Ratio: {Number(d.damage_ratio_pct).toFixed(1)}%
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="damage_ratio_pct"
                            stroke={CLASS_COLORS[housingClass]}
                            strokeWidth={3}
                            dot={false}
                            name={`${classLabel} Curve`}
                          />
                          {/* Active Operating Reference Line */}
                          {activeDepth > 0 && (
                            <ReferenceLine
                              x={Number(activeDepth.toFixed(1))}
                              stroke="#D21245"
                              strokeDasharray="4 4"
                              label={{
                                value: `Site Depth: ${activeDepth.toFixed(2)}m`,
                                position: "top",
                                fill: "#D21245",
                                fontSize: 10,
                                fontWeight: "bold",
                              }}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Calibrated Curve Parameters Card */}
                  <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="size-4 text-[#00264D]" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Calibrated Mathematical Parameters ({classLabel})
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3.5">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Damage Cap (D_max)
                        </span>
                        <span className="font-mono font-bold text-slate-800 text-sm">
                          {dossier?.vulnerability_curve?.parameters.cap_pct || 85}%
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          Physical structure ceiling
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Steepness Slope (k)
                        </span>
                        <span className="font-mono font-bold text-slate-800 text-sm">
                          {dossier?.vulnerability_curve?.parameters.k || 2.5}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          Damage gradient rate
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Midpoint (α / Depth50)
                        </span>
                        <span className="font-mono font-bold text-slate-800 text-sm">
                          {dossier?.vulnerability_curve?.parameters.midpoint || 0.75} m
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          50% damage inflection
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Threshold (h_0)
                        </span>
                        <span className="font-mono font-bold text-slate-800 text-sm">
                          {dossier?.vulnerability_curve?.parameters.threshold_m || 0.10} m
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          Doorstep / Curb elevation
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1.5 border-t border-slate-200/80 pt-3">
                      <div>
                        <strong>Scientific Reference:</strong>{" "}
                        <span className="text-slate-800 font-mono text-[11px]">
                          {dossier?.vulnerability_curve?.parameters.jrc_reference ||
                            "Huizinga et al. (2017) - Global Flood Depth-Damage Functions"}
                        </span>
                      </div>
                      <div>
                        <strong>Typical Nairobi Replacement Cost:</strong>{" "}
                        <span className="text-slate-800 font-mono text-[11px]">
                          {dossier?.vulnerability_curve?.parameters.typical_costs_sqm ||
                            "KES 20,000 - 35,000 / m²"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 italic mt-1">
                        "{dossier?.vulnerability_curve?.parameters.description ||
                          "Adapted for Nairobi terrain and building practices."}"
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LOSS & EXCEEDANCE PROBABILITY (EP) */}
              {activeTab === "ep" && (
                <div className="space-y-6">
                  {/* Single-Asset EP Loss Chart */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                    <h4 className="text-sm font-bold text-slate-900 mb-1">
                      Modeled Financial Loss across Return Periods
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Direct single-asset EP distribution based on localized DEM hazard depth scaling
                    </p>

                    <div className="h-56 sm:h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={epPoints} margin={{ top: 15, right: 25, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis
                            dataKey="years"
                            label={{
                              value: "Return Period (Years)",
                              position: "insideBottom",
                              offset: -10,
                              style: { fontSize: 11, fill: "#64748B" },
                            }}
                            tick={{ fontSize: 11, fill: "#64748B" }}
                          />
                          <YAxis
                            label={{
                              value: "Modeled Loss (KES Millions)",
                              angle: -90,
                              position: "insideLeft",
                              style: { fontSize: 11, fill: "#64748B" },
                            }}
                            tick={{ fontSize: 11, fill: "#64748B" }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const p = payload[0].payload;
                              return (
                                <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-md text-xs">
                                  <div className="font-bold text-slate-800">
                                    {p.years} Event (AEP: {p.prob_pct})
                                  </div>
                                  <div className="text-slate-600 mt-0.5">Water Depth: {p.depth_m} m</div>
                                  <div className="text-red-700 font-bold font-mono mt-0.5">
                                    Modeled Loss: {formatKES(p.loss_kes)}
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="loss_millions" fill="#00264D" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Return Period Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700">
                      Single-Asset Return Period Loss & Exceedance Schedule
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50/50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Scenario</th>
                            <th className="py-2.5 px-3">Annual Prob (AEP)</th>
                            <th className="py-2.5 px-3 text-right">Flood Depth</th>
                            <th className="py-2.5 px-3 text-right">Damage Ratio</th>
                            <th className="py-2.5 px-3 text-right">Modeled Gross Loss</th>
                            <th className="py-2.5 px-3 text-right">Net Insured Loss (10% Ded.)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {dossier?.exceedance_probability_curve.map((row) => {
                            const isCurrent = row.return_period === activeScenario;
                            return (
                              <tr
                                key={row.return_period}
                                className={`hover:bg-slate-50 transition ${
                                  isCurrent ? "bg-blue-50/60 font-bold" : ""
                                }`}
                              >
                                <td className="py-2.5 px-3 font-sans">
                                  <span className="font-semibold text-slate-900">{row.years}-Year</span>{" "}
                                  <span className="text-slate-400">({row.return_period})</span>
                                  {isCurrent && (
                                    <span className="ml-1.5 text-[9px] bg-[#00264D] text-white px-1.5 py-0.2 rounded font-sans">
                                      Active
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">
                                  {(row.annual_exceedance_prob * 100).toFixed(1)}%
                                </td>
                                <td className="py-2.5 px-3 text-right text-blue-900">
                                  {row.depth_m.toFixed(2)} m
                                </td>
                                <td className="py-2.5 px-3 text-right text-amber-700">
                                  {row.damage_ratio_pct.toFixed(1)}%
                                </td>
                                <td className="py-2.5 px-3 text-right text-red-600 font-semibold">
                                  {formatKES(row.loss_kes)}
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-900">
                                  {formatKES(row.insured_loss_kes)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actuarial Financial Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Annual Average Loss (AAL)
                      </span>
                      <div className="text-base font-bold font-mono text-slate-900 mt-1">
                        {formatKES(dossier?.financial_summary.aal_gross_kes || 0)}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Integrated across exceedance curve
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Pure Risk Rate
                      </span>
                      <div className="text-base font-bold font-mono text-[#00264D] mt-1">
                        {dossier?.financial_summary.pure_risk_rate_pct?.toFixed(4) || "0.0000"}%
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Annual loss per 100 KES TIV
                      </span>
                    </div>

                    <div className="bg-emerald-50/70 rounded-xl p-3.5 border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block tracking-wider">
                        Recommended Treaty Premium
                      </span>
                      <div className="text-base font-bold font-mono text-emerald-900 mt-1">
                        {formatKES(dossier?.financial_summary.recommended_premium_kes || 0)}
                      </div>
                      <span className="text-[11px] text-emerald-700 block mt-0.5">
                        Includes 32% capital & expense loading
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PORTFOLIO CONTEXT & TOP EXPOSED NEIGHBORS */}
              {activeTab === "context" && (
                <div className="space-y-6">
                  {/* Portfolio Context Share */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">
                          Portfolio TIV Exposure Share
                        </span>
                        <span className="text-sm font-bold font-mono text-[#00264D]">
                          {dossier?.financial_summary.tiv_share_pct?.toFixed(2) || "0.00"}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                        <div
                          className="bg-[#00264D] h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(2, (dossier?.financial_summary.tiv_share_pct || 0) * 5))}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-1.5">
                        Asset represents {formatKES(tivKes)} of total dataset capital
                      </span>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">
                          Portfolio Modeled Loss Contribution
                        </span>
                        <span className="text-sm font-bold font-mono text-red-600">
                          {dossier?.financial_summary.loss_share_pct?.toFixed(2) || "0.00"}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(2, (dossier?.financial_summary.loss_share_pct || 0) * 5))}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-1.5">
                        Asset accounts for {formatKES(activeLoss)} of total modeled event losses
                      </span>
                    </div>
                  </div>

                  {/* Top Exposed Locations in Same Ward */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="font-semibold text-xs text-slate-800">
                        Top Exposed Locations in {asset.ward} & Neighboring Corridor
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Spatial accumulation risk check
                      </span>
                    </div>

                    {dossier?.top_exposed_locations && dossier.top_exposed_locations.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50/50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Asset ID & Name</th>
                              <th className="py-2.5 px-3">Typology</th>
                              <th className="py-2.5 px-3 text-right">TIV Exposure</th>
                              <th className="py-2.5 px-3 text-right">Flood Depth</th>
                              <th className="py-2.5 px-3 text-right">Modeled Loss</th>
                              <th className="py-2.5 px-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {dossier.top_exposed_locations.map((item) => (
                              <tr key={item.loc_id} className="hover:bg-slate-50 transition">
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-slate-900">{item.name || item.loc_id}</div>
                                  <div className="text-[10px] font-mono text-slate-400">{item.loc_id}</div>
                                </td>
                                <td className="py-2.5 px-3 capitalize text-slate-600">
                                  {CLASS_LABEL[item.housing_class as HousingClass] || item.housing_class}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-medium text-[#00264D]">
                                  {formatKES(item.tiv_kes)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-blue-900">
                                  {(item.depth_m || 0).toFixed(2)} m
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-semibold text-red-600">
                                  {formatKES(item.loss_kes || 0)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {onSelectAsset && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const found = portfolioAssets.find(
                                          (p) => (p.loc_id || (p as any).id) === item.loc_id
                                        );
                                        if (found) {
                                          onSelectAsset(found);
                                        } else {
                                          onSelectAsset({
                                            loc_id: item.loc_id,
                                            name: item.name,
                                            ward: item.ward,
                                            housing_class: item.housing_class as HousingClass,
                                            tiv_kes: item.tiv_kes,
                                            floor_area_m2: 1000,
                                            depth_m: item.depth_m,
                                            loss_kes: item.loss_kes,
                                            damage_ratio: item.damage_ratio,
                                            risk_level: "high",
                                            lat: asset.lat,
                                            lon: asset.lon,
                                          });
                                        }
                                      }}
                                      className="h-6 text-[11px] text-[#00264D] hover:bg-blue-50 px-2 cursor-pointer"
                                    >
                                      Inspect →
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No neighboring assets with high exposure recorded in this ward.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-7 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldAlert className="size-3.5 text-[#00264D]" />
            <span>Kenya Re Oasis OED & JRC Risk Engine Compliant</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs cursor-pointer"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleExportPDF}
              className="text-xs bg-[#00264D] hover:bg-[#001830] text-white gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="size-3.5" />
              <span>Export Single Asset PDF</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

