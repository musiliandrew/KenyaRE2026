"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function AIExposureForm() {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleProcess = async () => {
    if (!text.trim()) {
      toast.error("Please enter property description");
      return;
    }

    setIsProcessing(true);
    setResult(null);

    // Simulate AI processing
    setTimeout(() => {
      // Mock AI parsing result
      setResult({
        success: true,
        extracted: {
          location: "Nairobi",
          housingClass: "Informal Iron Sheet",
          count: 10,
          floorArea: 45,
          costPerM2: 15000,
          totalTIV: 6750000,
        },
      });
      setIsProcessing(false);
      toast.success("Property data extracted successfully!");
    }, 2000);
  };

  const handleAddToPortfolio = () => {
    toast.success("Properties added to portfolio!");
    setText("");
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#00264D] mb-2">AI Property Ingestion</h3>
        <p className="text-sm text-slate-600">
          Describe properties in plain English and our AI will extract the data automatically.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Property Description
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Example: 10 iron-sheet shops near the river in Dandora, each 45 square meters at KES 15,000 per square meter..."
            className="min-h-[120px]"
          />
        </div>

        <Button
          onClick={handleProcess}
          disabled={isProcessing || !text.trim()}
          className="w-full bg-[#D21245] hover:bg-[#B50F3B]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Processing with AI...
            </>
          ) : (
            <>
              <Sparkles className="size-4 mr-2" />
              Extract Property Data
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-600" />
            <span className="font-semibold text-slate-900">Data Extracted Successfully</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-500">Location</div>
              <div className="font-medium">{result.extracted.location}</div>
            </div>
            <div>
              <div className="text-slate-500">Housing Class</div>
              <div className="font-medium">{result.extracted.housingClass}</div>
            </div>
            <div>
              <div className="text-slate-500">Number of Properties</div>
              <div className="font-medium">{result.extracted.count}</div>
            </div>
            <div>
              <div className="text-slate-500">Floor Area (m²)</div>
              <div className="font-medium">{result.extracted.floorArea}</div>
            </div>
            <div>
              <div className="text-slate-500">Cost per m² (KES)</div>
              <div className="font-medium">
                {result.extracted.costPerM2.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Total TIV (KES)</div>
              <div className="font-medium font-mono text-[#00264D]">
                {result.extracted.totalTIV.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleAddToPortfolio} className="flex-1 bg-[#00264D] hover:bg-[#001830]">
              Add to Portfolio
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setText("");
              }}
            >
              Edit
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <strong>Tip:</strong> Be specific about location, building type, size, and cost for best results.
            Example: "5 masonry commercial buildings in Westlands, 100m² each, KES 40,000/m²"
          </div>
        </div>
      </div>
    </div>
  );
}
