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
    <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
      <Button
        size="sm"
        variant={currentProvider === "mapbox" ? "default" : "ghost"}
        className={currentProvider === "mapbox" ? "bg-[#00264D] hover:bg-[#00264D]/90" : ""}
        onClick={() => onProviderChange("mapbox")}
      >
        <MapPin className="size-4 mr-2" />
        Mapbox GL
      </Button>
      <Button
        size="sm"
        variant={currentProvider === "maplibre-deckgl" ? "default" : "ghost"}
        className={currentProvider === "maplibre-deckgl" ? "bg-[#00264D] hover:bg-[#00264D]/90" : ""}
        onClick={() => onProviderChange("maplibre-deckgl")}
      >
        <Layers className="size-4 mr-2" />
        MapLibre + deck.gl
      </Button>
    </div>
  );
}
