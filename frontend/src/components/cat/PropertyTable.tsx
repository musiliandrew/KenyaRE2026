"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/cat/SearchBar";
import { Download, Loader2 } from "lucide-react";
import { api, formatKES, CLASS_LABEL, type ExposureAsset, type RP } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

export function PropertyTable({
  assets: propAssets,
  returnPeriod,
  rp,
  onSelectAsset,
}: {
  assets?: ExposureAsset[];
  returnPeriod?: RP;
  rp?: RP;
  onSelectAsset?: (asset: ExposureAsset) => void;
}) {
  const activeRP = rp || returnPeriod || "100y";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch real assets if not passed via props
  const { data, loading } = useApi(
    () => (propAssets ? Promise.resolve({ assets: propAssets }) : api.exposureAssets(activeRP, { limit: 1000 })),
    [propAssets, activeRP]
  );

  const assets = useMemo(() => propAssets || data?.assets || [], [propAssets, data]);

  const filtered = useMemo(() => {
    return assets.filter((p) => {
      const matchSearch =
        searchQuery === "" ||
        p.loc_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchClass = selectedClass === "all" || p.housing_class === selectedClass;
      const matchTier = selectedTier === "all" || p.risk_level === selectedTier;
      return matchSearch && matchClass && matchTier;
    });
  }, [assets, searchQuery, selectedClass, selectedTier]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Loc_ID", "Name", "Ward", "Housing_Class", "Floor_Area_M2", "TIV_KES", "Hazard_Depth_M", "Modeled_Loss_KES", "Risk_Level"];
    const rows = filtered.map((a) => [
      a.loc_id,
      `"${a.name || "Asset"}"`,
      `"${a.ward}"`,
      a.housing_class,
      a.floor_area_m2,
      a.tiv_kes,
      a.depth_m,
      a.loss_kes,
      a.risk_level,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kenya-re-exposure-${returnPeriod}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="w-full sm:w-72">
          <SearchBar
            value={searchQuery}
            onChange={(q) => {
              setSearchQuery(q);
              setCurrentPage(1);
            }}
            placeholder="Search by ID, Ward, Name..."
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 sm:flex-initial px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-[#00264D] outline-none truncate"
          >
            <option value="all">All Typologies</option>
            <option value="informal_iron_sheet">Informal Iron Sheet</option>
            <option value="semi_permanent">Semi-Permanent</option>
            <option value="permanent_masonry">Permanent Masonry</option>
            <option value="concrete_rcc">Concrete RCC</option>
          </select>

          <select
            value={selectedTier}
            onChange={(e) => {
              setSelectedTier(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 sm:flex-initial px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-[#00264D] outline-none truncate"
          >
            <option value="all">All Risk Tiers</option>
            <option value="high">🔴 High Tier</option>
            <option value="mid">🟡 Medium Tier</option>
            <option value="low">🟢 Low Tier</option>
          </select>

          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs shrink-0 cursor-pointer">
            <Download className="size-3.5" />
            <span className="hidden xs:inline">Export</span> CSV
          </Button>
        </div>
      </div>

      {/* Real Assets Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading && !assets.length ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="size-6 text-[#00264D] animate-spin" />
            <span className="ml-2 text-sm text-slate-500">Loading exposure assets from Exposure Engine...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow>
                  <TableHead className="font-semibold text-slate-900 text-xs">Asset ID</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-xs">Administrative Ward</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-xs">Typology</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-xs">Floor Area</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-xs">TIV (KES)</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-xs">Flood Depth</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-xs">Loss (KES)</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-xs text-right">Risk Tier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-sm text-slate-500">
                      No matching properties found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((prop) => (
                    <TableRow
                      key={prop.loc_id}
                      onClick={() => onSelectAsset?.(prop)}
                      className={`hover:bg-blue-50/40 text-xs transition-colors ${
                        onSelectAsset ? "cursor-pointer" : ""
                      }`}
                    >
                      <TableCell className="font-mono font-medium text-slate-800">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAsset?.(prop);
                          }}
                          className="font-mono font-bold text-[#00264D] hover:text-[#D21245] hover:underline cursor-pointer text-left inline-flex items-center gap-1"
                          title={`Inspect ${prop.loc_id} dossier`}
                        >
                          <span>{prop.loc_id}</span>
                        </button>
                      </TableCell>
                      <TableCell className="text-slate-900 font-medium">{prop.ward}</TableCell>
                      <TableCell className="text-slate-600">
                        {CLASS_LABEL[prop.housing_class] || prop.housing_class}
                      </TableCell>
                      <TableCell className="font-mono text-slate-600">{prop.floor_area_m2.toLocaleString()} m²</TableCell>
                      <TableCell className="font-mono font-medium text-[#00264D]">{formatKES(prop.tiv_kes)}</TableCell>
                      <TableCell className="font-mono text-slate-700">{prop.depth_m.toFixed(2)} m</TableCell>
                      <TableCell className="font-mono text-red-700 font-medium">{formatKES(prop.loss_kes)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Badge
                            className={
                              prop.risk_level === "high"
                                ? "bg-red-100 text-red-700"
                                : prop.risk_level === "mid"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }
                          >
                            {prop.risk_level.toUpperCase()}
                          </Badge>
                          {onSelectAsset && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectAsset(prop);
                              }}
                              className="h-6 text-[11px] text-[#00264D] hover:bg-blue-50 px-2 cursor-pointer hidden sm:inline-flex"
                            >
                              Inspect →
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
        <div className="text-center sm:text-left">
          Showing {filtered.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, filtered.length)} of{" "}
          <span className="font-semibold">{filtered.length}</span> properties
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 text-xs cursor-pointer"
          >
            Previous
          </Button>
          <span className="px-2 text-slate-700 font-medium">
            {totalPages === 0 ? 0 : currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="h-8 text-xs cursor-pointer"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
