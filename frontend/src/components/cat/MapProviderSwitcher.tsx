"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Layers, MapPin } from "lucide-react";

export type MapProvider = "mapbox" | "maplibre-deckgl";

interface MapProviderSwitcherProps {
  currentProvider: MapProvider;
  onProviderChange: (provider: MapProvider) => void;
}

export function MapProviderSwitcher({ currentProvider, onProviderChange }: MapProviderSwitcherProps) {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-full sm:w-auto">
      <Button
        size="sm"
        variant={currentProvider === "mapbox" ? "default" : "ghost"}
        className={`flex-1 sm:flex-initial text-xs h-8 cursor-pointer ${currentProvider === "mapbox" ? "bg-[#00264D] text-white hover:bg-[#00264D]/90 shadow-xs" : "text-slate-600"}`}
        onClick={() => onProviderChange("mapbox")}
      >
        <MapPin className="size-3.5 mr-1.5 shrink-0" />
        Mapbox 3D
      </Button>
      <Button
        size="sm"
        variant={currentProvider === "maplibre-deckgl" ? "default" : "ghost"}
        className={`flex-1 sm:flex-initial text-xs h-8 cursor-pointer ${currentProvider === "maplibre-deckgl" ? "bg-[#00264D] text-white hover:bg-[#00264D]/90 shadow-xs" : "text-slate-600"}`}
        onClick={() => onProviderChange("maplibre-deckgl")}
      >
        <Layers className="size-3.5 mr-1.5 shrink-0" />
        MapLibre GL
      </Button>
    </div>
  );
}
