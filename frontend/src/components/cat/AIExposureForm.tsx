"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api, formatKES, CLASS_LABEL, type HousingClass, type ParseSlipResponse } from "@/lib/api";

export function AIExposureForm({ onPortfolioUpdated }: { onPortfolioUpdated?: () => void }) {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ParseSlipResponse | null>(null);

  const handleProcess = async () => {
    if (!text.trim()) {
      toast.error("Please enter property description");
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const res = await api.parseSlip(text);
      setResult(res);
      toast.success("Property data parsed and actuarially enriched via Groq!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse slip");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToPortfolio = async () => {
    if (!result?.parsed_assets || result.parsed_assets.length === 0) {
      toast.error("No valid assets extracted to upload");
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.portfolioUpload(result.parsed_assets, "nlp_parse");
      toast.success(`Added ${res.valid_count} assets to the portfolio!`);
      setText("");
      setResult(null);
      if (onPortfolioUpdated) onPortfolioUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload to portfolio");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#00264D] mb-2 flex items-center gap-2">
          <Sparkles className="size-5 text-[#D21245]" />
          Natural Language Exposure Ingestion (Groq LPU)
        </h3>
        <p className="text-sm text-slate-600">
          Paste broker placement notes, slips, or emails. The AI extracts structured properties, geocodes coordinates, and evaluates flood hazard depth.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Broker Placement Text
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Example: 5 iron sheet warehouses in Mathare along Juja road, 350 sqm each, KES 18M total"
            className="min-h-[110px]"
          />
        </div>

        <Button
          onClick={handleProcess}
          disabled={isProcessing || !text.trim()}
          className="w-full bg-[#D21245] hover:bg-[#B50F3B] text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Parsing with Groq (openai/gpt-oss-120b)...
            </>
          ) : (
            <>
              <Sparkles className="size-4 mr-2" />
              Extract & Price Exposure
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
              <span className="font-semibold text-slate-900">Extracted & Actuarially Grounded</span>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800">
              {result.hazard_tier}
            </Badge>
          </div>

          <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded border border-slate-100">
            "{result.summary}"
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-slate-50 p-2.5 rounded">
              <div className="text-xs text-slate-500">Locality</div>
              <div className="font-semibold text-slate-900">{result.location}</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded">
              <div className="text-xs text-slate-500">Typology</div>
              <div className="font-semibold text-slate-900">
                {CLASS_LABEL[result.housing_class as HousingClass] || result.housing_class}
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded">
              <div className="text-xs text-slate-500">Units Count</div>
              <div className="font-semibold text-slate-900">{result.extracted_structures} structures</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded">
              <div className="text-xs text-slate-500">Total Area</div>
              <div className="font-semibold text-slate-900">{result.total_area_sqm.toLocaleString()} m²</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded">
              <div className="text-xs text-slate-500">Total TIV</div>
              <div className="font-semibold font-mono text-[#00264D]">
                {formatKES(result.estimated_tiv_kes)}
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded">
              <div className="text-xs text-slate-500">100-Year Depth</div>
              <div className="font-semibold font-mono text-red-700">
                {result.estimated_depth_m.toFixed(2)} m
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded text-sm">
            <div>
              <span className="text-xs text-red-700 font-medium">Recommended Flood Premium:</span>
              <div className="font-bold font-mono text-red-800 text-base">
                {formatKES(result.recommended_premium_kes)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-red-700">Technical Rate:</span>
              <div className="font-semibold text-red-800">{result.technical_rate_pct}%</div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleAddToPortfolio}
              disabled={isUploading}
              className="flex-1 bg-[#00264D] hover:bg-[#001830] text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Extracted Assets to Model Portfolio"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setText("");
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5">
        <div className="flex items-start gap-2">
          <AlertCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <strong>Underwriter Tip:</strong> Natural language parser accepts complex commercial slips, e.g. "Landmark Plaza Upper Hill, 24,500 sqm RCC commercial office, TIV KES 1.09B, flood cover requested."
          </div>
        </div>
      </div>
    </div>
  );
}
