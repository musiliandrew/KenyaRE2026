"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Calculator, Sparkles, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function QuoteGenerator() {
  const [propertyData, setPropertyData] = useState({
    location: "",
    housingClass: "",
    floorArea: "",
    costPerM2: "",
  });
  const [quote, setQuote] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = () => {
    if (!propertyData.location || !propertyData.housingClass || !propertyData.floorArea || !propertyData.costPerM2) {
      toast.error("Please fill in all property details");
      return;
    }

    setIsCalculating(true);

    // Simulate calculation
    setTimeout(() => {
      const tiv = parseFloat(propertyData.floorArea) * parseFloat(propertyData.costPerM2);
      const riskLevel = propertyData.housingClass === "informal_iron_sheet" ? "high" : "medium";
      const premiumRate = riskLevel === "high" ? 0.025 : 0.015;
      const annualPremium = tiv * premiumRate;
      const deductible = tiv * 0.025;

      setQuote({
        tiv,
        riskLevel,
        premiumRate,
        annualPremium,
        deductible,
        hundredYearLoss: tiv * 0.175,
      });
      setIsCalculating(false);
      toast.success("Quote calculated successfully!");
    }, 1500);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#00264D] mb-2 flex items-center gap-2">
          <Calculator className="size-5" />
          Insurance Quote Calculator
        </h3>
        <p className="text-sm text-slate-600">
          Calculate premiums and deductibles for flood insurance based on property risk.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Location
          </label>
          <Input
            type="text"
            value={propertyData.location}
            onChange={(e) => setPropertyData({ ...propertyData, location: e.target.value })}
            placeholder="e.g., Kayole, Nairobi"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Housing Class
          </label>
          <select
            value={propertyData.housingClass}
            onChange={(e) => setPropertyData({ ...propertyData, housingClass: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#00264D] focus:border-transparent outline-none transition bg-white"
          >
            <option value="">Select housing class...</option>
            <option value="informal_iron_sheet">Informal Iron Sheet</option>
            <option value="semi_permanent">Semi-Permanent</option>
            <option value="permanent_masonry">Permanent Masonry</option>
            <option value="concrete_rcc">Concrete RCC</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Floor Area (m²)
            </label>
            <Input
              type="number"
              value={propertyData.floorArea}
              onChange={(e) => setPropertyData({ ...propertyData, floorArea: e.target.value })}
              placeholder="e.g., 45"
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
              placeholder="e.g., 15000"
            />
          </div>
        </div>

        <Button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full bg-[#D21245] hover:bg-[#B50F3B]"
        >
          {isCalculating ? "Calculating..." : "Calculate Quote"}
        </Button>
      </div>

      {quote && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              <span className="font-semibold text-slate-900">Quote Generated</span>
            </div>
            <Badge className={quote.riskLevel === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
              {quote.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-slate-500">Total Insured Value</div>
              <div className="text-xl font-bold text-[#00264D] font-mono mt-1">
                {formatCurrency(quote.tiv)}
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-slate-500">Annual Premium</div>
              <div className="text-xl font-bold text-[#D21245] font-mono mt-1">
                {formatCurrency(quote.annualPremium)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {(quote.premiumRate * 100).toFixed(2)}% of TIV
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-slate-500">Deductible</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {formatCurrency(quote.deductible)}
              </div>
              <div className="text-xs text-slate-500 mt-1">2.5% of TIV</div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-red-700">1-in-100 Year Loss</div>
              <div className="text-xl font-bold text-red-600 font-mono mt-1">
                {formatCurrency(quote.hundredYearLoss)}
              </div>
              <div className="text-xs text-red-600 mt-1">Worst-case scenario</div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                const text = `INSURANCE QUOTE\n\nLocation: ${propertyData.location}\nHousing Class: ${propertyData.housingClass}\nFloor Area: ${propertyData.floorArea} m²\nCost per m²: KES ${parseInt(propertyData.costPerM2).toLocaleString()}\n\nQUOTE:\n- Total Insured Value: ${formatCurrency(quote.tiv)}\n- Annual Premium: ${formatCurrency(quote.annualPremium)}\n- Deductible: ${formatCurrency(quote.deductible)}\n- 1-in-100 Year Loss: ${formatCurrency(quote.hundredYearLoss)}\n\nGenerated by Kenya Re CAT Risk Intelligence Platform`;
                const blob = new Blob([text], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `quote-${Date.now()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("Quote downloaded!");
              }}
            >
              <Download className="size-4" />
              Download
            </Button>
            <Button
              onClick={() => {
                setQuote(null);
                setPropertyData({ location: "", housingClass: "", floorArea: "", costPerM2: "" });
              }}
              variant="outline"
              className="flex-1"
            >
              New Quote
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
