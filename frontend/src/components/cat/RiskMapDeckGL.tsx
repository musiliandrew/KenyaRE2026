"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  BUILDINGS,
  HOTSPOTS,
  riskLevel,
  type Building,
  type HousingClass,
  type Hotspot,
  type ReturnPeriod,
} from "@/lib/cat-model";
import { Layers, Compass, Eye, Sparkles } from "lucide-react";

export function RiskMapDeckGL({
  rp,
  filter,
  showHotspots,
  selectedBuilding,
  selectedHotspot,
  onSelectBuilding,
  onSelectHotspot,
}: {
  rp: ReturnPeriod;
  filter: HousingClass | "all";
  showHotspots: boolean;
  selectedBuilding?: Building | null;
  selectedHotspot?: Hotspot | null;
  onSelectBuilding: (b: Building) => void;
  onSelectHotspot: (h: Hotspot) => void;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const [mapStyle, setMapStyle] = useState<"light" | "dark" | "satellite">("light");

  const cb = useRef({ onSelectBuilding, onSelectHotspot });
  cb.current = { onSelectBuilding, onSelectHotspot };

  const styleUrls = {
    light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    satellite: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  };

  // Initialize MapLibre Map
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrls[mapStyle],
      center: [36.8372, -1.2864], // Nairobi [lng, lat]
      zoom: 12.2,
      pitch: is3D ? 52 : 0,
      bearing: is3D ? -18 : 0,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");

    map.on("load", () => {
      setMapLoaded(true);
      addBuildingLayers(map);
      addHotspotLayers(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Style Change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.setStyle(styleUrls[mapStyle]);
    mapRef.current.once("style.load", () => {
      if (mapRef.current) {
        addBuildingLayers(mapRef.current);
        addHotspotLayers(mapRef.current);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle]);

  // Render building layers
  function addBuildingLayers(map: maplibregl.Map) {
    const filteredBuildings = BUILDINGS.filter(
      (b) => filter === "all" || b.cls === filter
    );

    const buildingFeatures: GeoJSON.Feature[] = filteredBuildings.map((b) => {
      const lvl = riskLevel(b, rp);
      const isSelected = selectedBuilding?.id === b.id;
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [b.lng, b.lat],
        },
        properties: {
          id: b.id,
          ward: b.ward,
          cls: b.cls,
          area: b.area,
          tiv: b.tiv,
          depth100: b.depth100,
          risk: lvl,
          color: isSelected ? "#00264D" : lvl === "high" ? "#D21245" : lvl === "mid" ? "#D97706" : "#16A34A",
          radius: isSelected ? 8 : lvl === "high" ? 6 : 4.5,
        },
      };
    });

    const buildingSourceData: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: buildingFeatures,
    };

    if (map.getSource("buildings-source")) {
      (map.getSource("buildings-source") as maplibregl.GeoJSONSource).setData(buildingSourceData);
    } else {
      map.addSource("buildings-source", {
        type: "geojson",
        data: buildingSourceData,
      });

      map.addLayer({
        id: "buildings-points",
        type: "circle",
        source: "buildings-source",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            11,
            ["get", "radius"],
            16,
            ["*", ["get", "radius"], 2.2],
          ],
          "circle-color": ["get", "color"],
          "circle-stroke-width": 1.8,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.95,
        },
      });

      map.on("click", "buildings-points", (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          const building = BUILDINGS.find((b) => b.id === props?.id);
          if (building) {
            cb.current.onSelectBuilding(building);
          }
        }
      });

      map.on("mouseenter", "buildings-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "buildings-points", () => {
        map.getCanvas().style.cursor = "";
      });
    }
  }

  // Render hotspot layers
  function addHotspotLayers(map: maplibregl.Map) {
    if (!showHotspots) {
      if (map.getLayer("hotspots-points")) {
        map.removeLayer("hotspots-points");
      }
      if (map.getSource("hotspots-source")) {
        map.removeSource("hotspots-source");
      }
      return;
    }

    const hotspotFeatures: GeoJSON.Feature[] = HOTSPOTS.map((h) => {
      const isSelected = selectedHotspot?.name === h.name;
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [h.lng, h.lat],
        },
        properties: {
          name: h.name,
          aiDetected: h.aiDetected,
          demDetected: h.demDetected,
          notes: h.notes,
          color: isSelected ? "#00264D" : h.aiDetected ? "#D21245" : "#00264D",
          radius: isSelected ? 12 : 10,
        },
      };
    });

    const hotspotSourceData: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: hotspotFeatures,
    };

    if (map.getSource("hotspots-source")) {
      (map.getSource("hotspots-source") as maplibregl.GeoJSONSource).setData(hotspotSourceData);
    } else {
      map.addSource("hotspots-source", {
        type: "geojson",
        data: hotspotSourceData,
      });

      map.addLayer({
        id: "hotspots-points",
        type: "circle",
        source: "hotspots-source",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            11,
            ["get", "radius"],
            16,
            ["*", ["get", "radius"], 2],
          ],
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      });

      map.on("click", "hotspots-points", (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          const hotspot = HOTSPOTS.find((h) => h.name === props?.name);
          if (hotspot) {
            cb.current.onSelectHotspot(hotspot);
          }
        }
      });

      map.on("mouseenter", "hotspots-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "hotspots-points", () => {
        map.getCanvas().style.cursor = "";
      });
    }
  }

  // Update layers when props change
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      addBuildingLayers(mapRef.current);
      addHotspotLayers(mapRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rp, filter, showHotspots, selectedBuilding, selectedHotspot, mapLoaded]);

  // Zoom to selected building
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !selectedBuilding) return;

    mapRef.current.flyTo({
      center: [selectedBuilding.lng, selectedBuilding.lat],
      zoom: 16.5,
      pitch: is3D ? 62 : 0,
      bearing: is3D ? -15 : 0,
      offset: [-90, 0],
      duration: 1500,
      essential: true,
    });
  }, [selectedBuilding, mapLoaded, is3D]);

  // Zoom to selected hotspot
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !selectedHotspot) return;

    mapRef.current.flyTo({
      center: [selectedHotspot.lng, selectedHotspot.lat],
      zoom: 15.2,
      pitch: is3D ? 58 : 0,
      bearing: is3D ? -12 : 0,
      offset: [-90, 0],
      duration: 1500,
      essential: true,
    });
  }, [selectedHotspot, mapLoaded, is3D]);

  // Handle 3D toggle
  const toggle3DTilt = () => {
    if (!mapRef.current) return;
    const next3D = !is3D;
    setIs3D(next3D);
    mapRef.current.easeTo({
      pitch: next3D ? 55 : 0,
      bearing: next3D ? -18 : 0,
      duration: 1000,
    });
  };

  // Reset view
  const resetView = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [36.8372, -1.2864],
      zoom: 12.2,
      pitch: is3D ? 52 : 0,
      bearing: is3D ? -18 : 0,
      offset: [0, 0],
      essential: true,
    });
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setMapStyle("light")}
            className={`p-2 rounded-lg shadow-md transition ${
              mapStyle === "light" ? "bg-white ring-2 ring-[#00264D]" : "bg-white hover:bg-slate-50"
            }`}
            title="Light style"
          >
            <div className="w-4 h-4 rounded bg-slate-100 border border-slate-300" />
          </button>
          <button
            onClick={() => setMapStyle("dark")}
            className={`p-2 rounded-lg shadow-md transition ${
              mapStyle === "dark" ? "bg-white ring-2 ring-[#00264D]" : "bg-white hover:bg-slate-50"
            }`}
            title="Dark style"
          >
            <div className="w-4 h-4 rounded bg-slate-800 border border-slate-700" />
          </button>
          <button
            onClick={() => setMapStyle("satellite")}
            className={`p-2 rounded-lg shadow-md transition ${
              mapStyle === "satellite" ? "bg-white ring-2 ring-[#00264D]" : "bg-white hover:bg-slate-50"
            }`}
            title="Satellite style"
          >
            <div className="w-4 h-4 rounded bg-blue-900 border border-blue-700" />
          </button>
        </div>

        <button
          onClick={toggle3DTilt}
          className="p-2 rounded-lg bg-white shadow-md hover:bg-slate-50 transition"
          title={is3D ? "Switch to 2D" : "Switch to 3D"}
        >
          <Eye className="size-5 text-[#00264D]" />
        </button>

        <button
          onClick={resetView}
          className="p-2 rounded-lg bg-white shadow-md hover:bg-slate-50 transition"
          title="Reset view"
        >
          <Compass className="size-5 text-[#00264D]" />
        </button>
      </div>

      {/* Map Provider Badge */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-md">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <Sparkles className="size-3 text-[#D21245]" />
          MapLibre GL
        </div>
      </div>
    </div>
  );
}
