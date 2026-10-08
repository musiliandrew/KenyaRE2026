"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Building2, MapPin, DollarSign, Ruler, Loader2 } from "lucide-react";
import { api, formatKES } from "@/lib/api";

export function PropertyForm({ onCreated }: { onCreated?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    location: "",
    housingClass: "",
    floorArea: "",
    costPerM2: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.location || !formData.housingClass || !formData.floorArea || !formData.costPerM2) {
      toast.error("Please fill in all fields");
      return;
    }

    const area = parseFloat(formData.floorArea);
    const cost = parseFloat(formData.costPerM2);
    const tiv = area * cost;

    setIsSubmitting(true);
    try {
      const locId = `PROP-${Math.floor(1000 + Math.random() * 9000)}`;
      const ward = formData.location.split(",")[0].trim() || "Nairobi Central";
      const payload = [
        {
          loc_id: locId,
          name: formData.location,
          ward: ward,
          housing_class: formData.housingClass,
          floor_area_m2: area,
          cost_per_m2_kes: cost,
          tiv_kes: tiv,
          // default coordinate near central Nairobi if geocoding not provided
          lat: -1.286389,
          lon: 36.817223,
        },
      ];

      const res = await api.portfolioUpload(payload, "manual_form");
      toast.success(`Property registered: ${formatKES(tiv)} TIV (${res.valid_count} added)`);

      // Reset form
      setFormData({
        location: "",
        housingClass: "",
        floorArea: "",
        costPerM2: "",
      });

      if (onCreated) onCreated();
    } catch (err: any) {
      toast.error(err.message || "Failed to add property to portfolio");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#00264D] mb-2">Add New Property</h3>
        <p className="text-sm text-slate-600">
          Enter property details to add to the risk portfolio.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <MapPin className="size-4" />
            Location
          </label>
          <Input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Kayole, Nairobi"
            required
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Building2 className="size-4" />
            Housing Class
          </label>
          <select
            value={formData.housingClass}
            onChange={(e) => setFormData({ ...formData, housingClass: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#00264D] focus:border-transparent outline-none transition bg-white"
            required
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
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Ruler className="size-4" />
              Floor Area (m²)
            </label>
            <Input
              type="number"
              value={formData.floorArea}
              onChange={(e) => setFormData({ ...formData, floorArea: e.target.value })}
              placeholder="e.g., 45"
              min="1"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <DollarSign className="size-4" />
              Cost per m² (KES)
            </label>
            <Input
              type="number"
              value={formData.costPerM2}
              onChange={(e) => setFormData({ ...formData, costPerM2: e.target.value })}
              placeholder="e.g., 15000"
              min="1"
              required
            />
          </div>
        </div>

        {formData.floorArea && formData.costPerM2 && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="text-sm text-slate-600">Calculated Total Insured Value (TIV)</div>
            <div className="text-2xl font-bold text-[#00264D] font-mono mt-1">
              KES {(parseFloat(formData.floorArea) * parseFloat(formData.costPerM2)).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-[#D21245] hover:bg-[#B50F3B]">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" /> Adding to Portfolio...
          </>
        ) : (
          "Add Property to Portfolio"
        )}
      </Button>
    </form>
  );
}
