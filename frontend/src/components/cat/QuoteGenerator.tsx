"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calculator, Download, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatKES, type HousingClass, type FacultativeResponse } from "@/lib/api";

const NAIROBI_LOCALITIES: Record<string, [number, number]> = {
  "upper hill": [-1.2995, 36.8152],
  "cbd": [-1.2847, 36.8247],
  "westlands": [-1.2673, 36.8045],
  "mathare": [-1.2612, 36.8584],
  "kibera": [-1.3125, 36.7872],
  "dandora": [-1.2486, 36.8974],
  "kayole": [-1.2742, 36.9134],
  "industrial area": [-1.3105, 36.8510],
  "south c": [-1.3204, 36.8277],
  "kawangware": [-1.2841, 36.7456],
  "embakasi": [-1.3240, 36.9010],
};

export function QuoteGenerator() {
  const [propertyData, setPropertyData] = useState({
    location: "Upper Hill",
    housingClass: "concrete_rcc" as HousingClass,
    floorArea: "24500",
    costPerM2: "45000",
    deductiblePct: "5",
  });
  const [quote, setQuote] = useState<FacultativeResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    if (!propertyData.location || !propertyData.housingClass || !propertyData.floorArea || !propertyData.costPerM2) {
      toast.error("Please fill in all property details");
      return;
    }

    setIsCalculating(true);
    try {
      const area = parseFloat(propertyData.floorArea);
      const cost = parseFloat(propertyData.costPerM2);
      const tiv = area * cost;
      const dedPct = (parseFloat(propertyData.deductiblePct) || 5) / 100;

      // Geocode locality or default to Nairobi CBD
      const key = propertyData.location.toLowerCase().trim();
      let coords = NAIROBI_LOCALITIES[key];
      if (!coords) {
        const found = Object.keys(NAIROBI_LOCALITIES).find((k) => key.includes(k));
        coords = found ? NAIROBI_LOCALITIES[found] : [-1.2847, 36.8247];
      }

      const res = await api.quoteFacultative({
        tiv_kes: tiv,
        lat: coords[0],
        lng: coords[1],
        housing_class: propertyData.housingClass,
        deductible_pct: dedPct,
      });

      setQuote(res);
      toast.success("Facultative quote calculated via Financial Engine!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to calculate quote");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#00264D] mb-2 flex items-center gap-2">
          <Calculator className="size-5" />
          Technical Flood Underwriting & Facultative Quote
        </h3>
        <p className="text-sm text-slate-600">
          Evaluates pure flood burn rate, return-period depth anchors, and technical underwriting premium.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nairobi Locality
          </label>
          <Input
            type="text"
            value={propertyData.location}
            onChange={(e) => setPropertyData({ ...propertyData, location: e.target.value })}
            placeholder="e.g., Upper Hill, Mathare, Westlands, Kayole"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Construction Typology
          </label>
          <select
            value={propertyData.housingClass}
            onChange={(e) => setPropertyData({ ...propertyData, housingClass: e.target.value as HousingClass })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#00264D] focus:border-transparent outline-none transition bg-white text-sm"
          >
            <option value="informal_iron_sheet">Informal Iron Sheet (Mabati)</option>
            <option value="semi_permanent">Semi-Permanent (Timber / Block)</option>
            <option value="permanent_masonry">Permanent Masonry (Stone / Brick)</option>
            <option value="concrete_rcc">Concrete RCC (Reinforced Frame / Commercial)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Floor Area (m²)
            </label>
            <Input
              type="number"
              value={propertyData.floorArea}
              onChange={(e) => setPropertyData({ ...propertyData, floorArea: e.target.value })}
              placeholder="e.g., 24500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cost per m² (KES)
            </label>
            <Input
              type="number"
              value={propertyData.costPerM2}
              onChange={(e) => setPropertyData({ ...propertyData, costPerM2: e.target.value })}
              placeholder="e.g., 45000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Deductible (%)
            </label>
            <Input
              type="number"
              value={propertyData.deductiblePct}
              onChange={(e) => setPropertyData({ ...propertyData, deductiblePct: e.target.value })}
              placeholder="e.g., 5"
            />
          </div>
        </div>

        <Button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full bg-[#D21245] hover:bg-[#B50F3B] text-white"
        >
          {isCalculating ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Calculating via Financial Engine...
            </>
          ) : (
            "Calculate Technical Quote"
          )}
        </Button>
      </div>

      {quote && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
              <span className="font-semibold text-slate-900">Actuarial Quote Generated</span>
            </div>
            <Badge className={quote.depth_100y_m > 0.5 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}>
              {quote.depth_100y_m > 0.5 ? "HIGH EXPOSURE" : "LOW / RESILIENT"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">Total Insured Value</div>
              <div className="text-lg font-bold text-[#00264D] font-mono mt-1">
                {formatKES(quote.tiv_kes)}
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">Recommended Premium</div>
              <div className="text-lg font-bold text-[#D21245] font-mono mt-1">
                {formatKES(quote.recommended_annual_premium_kes)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Rate: {quote.recommended_technical_rate_pct}%
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">Deductible Retention</div>
              <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                {formatKES(quote.deductible_kes)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{quote.deductible_pct}% of TIV</div>
            </div>

            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <div className="text-xs text-red-700">100-Year Modeled Depth</div>
              <div className="text-lg font-bold text-red-600 font-mono mt-1">
                {quote.depth_100y_m.toFixed(2)} m
              </div>
              <div className="text-[11px] text-red-600 mt-0.5">
                Insured Loss: {formatKES(quote.insured_loss_100y_kes)}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                const text = `KENYA REINSURANCE CORPORATION — FACULTATIVE QUOTE SLIP\n\nLocality: ${propertyData.location} (${quote.lat}, ${quote.lon})\nConstruction: ${quote.housing_class}\nTotal Insured Value: KES ${quote.tiv_kes.toLocaleString()}\n\nACTUARIAL RESULTS:\n- 100-Year Modeled Flood Depth: ${quote.depth_100y_m.toFixed(2)} m\n- Asset Pure AAL: KES ${quote.asset_aal_gross_kes.toLocaleString()} / year\n- Policy Deductible (${quote.deductible_pct}%): KES ${quote.deductible_kes.toLocaleString()}\n- Recommended Technical Rate: ${quote.recommended_technical_rate_pct}%\n- Annual Flood Premium: KES ${quote.recommended_annual_premium_kes.toLocaleString()}\n\nCalculated by Kenya Re Catastrophe Risk Intelligence Platform`;
                const blob = new Blob([text], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `kenya-re-quote-${Date.now()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("Quote slip downloaded!");
              }}
            >
              <Download className="size-4" />
              Download Slip
            </Button>
            <Button
              onClick={() => setQuote(null)}
              variant="outline"
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
