"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  api,
  type ExposureAsset,
  type Hotspot,
  type HousingClass,
  type RP,
} from "@/lib/api";
import { Compass, Eye, Sparkles } from "lucide-react";

if (typeof window !== "undefined") {
  try {
    const origin = window.location.origin || "";
    maplibregl.setWorkerUrl(`${origin}/maplibre-gl-worker.mjs`);
  } catch (err) {
    console.warn("Could not set MapLibre worker URL at module scope:", err);
  }
}

export function RiskMapDeckGL({
  rp = "100y",
  filter = "all",
  showHotspots = true,
  assets: propAssets,
  hotspots: propHotspots,
  selectedBuilding,
  selectedHotspot,
  onSelectBuilding,
  onSelectHotspot,
}: {
  rp?: RP | number;
  filter?: HousingClass | "all";
  showHotspots?: boolean;
  assets?: ExposureAsset[];
  hotspots?: Hotspot[];
  selectedBuilding?: any | null;
  selectedHotspot?: any | null;
  onSelectBuilding?: (b: any) => void;
  onSelectHotspot?: (h: any) => void;
}) {
  const normRP: RP = typeof rp === "number" ? (`${rp}y` as RP) : rp;

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const [mapStyle, setMapStyle] = useState<"light" | "dark" | "satellite">("light");

  const [assets, setAssets] = useState<ExposureAsset[]>(propAssets || []);
  const [hotspots, setHotspots] = useState<Hotspot[]>(propHotspots || []);

  const cb = useRef({ onSelectBuilding, onSelectHotspot });
  cb.current = { onSelectBuilding, onSelectHotspot };

  // Fetch real data if not provided via props
  useEffect(() => {
    if (propAssets && propAssets.length) {
      setAssets(propAssets);
    } else {
      api.exposureAssets(normRP, { limit: 1000 }).then((res) => setAssets(res.assets)).catch(() => {});
    }
  }, [propAssets, normRP]);

  useEffect(() => {
    if (propHotspots && propHotspots.length) {
      setHotspots(propHotspots);
    } else {
      api.hazardHotspots(normRP).then((res) => setHotspots(res)).catch(() => {});
    }
  }, [propHotspots, normRP]);

  const styleUrls = {
    light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    satellite: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  };

  // Initialize MapLibre Map
  useEffect(() => {
    if (!mapContainer.current) return;

    if (typeof window !== "undefined") {
      try {
        const origin = window.location.origin || "";
        maplibregl.setWorkerUrl(`${origin}/maplibre-gl-worker.mjs`);
      } catch (err) {
        console.warn("Could not set MapLibre worker URL:", err);
      }
    }

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
    const filtered = assets.filter((b) => filter === "all" || b.housing_class === filter);

    const buildingFeatures: GeoJSON.Feature[] = filtered.map((b) => {
      const isSelected = selectedBuilding?.loc_id === b.loc_id || selectedBuilding?.id === b.loc_id;
      const lvl = b.risk_level || "low";
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [b.lon, b.lat],
        },
        properties: {
          id: b.loc_id,
          ward: b.ward,
          cls: b.housing_class,
          area: b.floor_area_m2,
          tiv: b.tiv_kes,
          depth: b.depth_m,
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
          const found = assets.find((b) => b.loc_id === props?.id);
          if (found && cb.current.onSelectBuilding) {
            cb.current.onSelectBuilding(found);
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

    const hotspotFeatures: GeoJSON.Feature[] = hotspots.map((h) => {
      const isSelected = selectedHotspot?.name === h.name;
      const isHigh = (h.hazard_score || 0) > 0.4 || h.depth_m > 0.5;
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [h.lon, h.lat],
        },
        properties: {
          name: h.name,
          depth_m: h.depth_m,
          score: h.hazard_score,
          color: isSelected ? "#00264D" : isHigh ? "#D21245" : "#00264D",
          radius: isSelected ? 12 : 9,
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
          const found = hotspots.find((h) => h.name === props?.name);
          if (found && cb.current.onSelectHotspot) {
            cb.current.onSelectHotspot(found);
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

  // Update layers when assets, hotspots or props change
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      addBuildingLayers(mapRef.current);
      addHotspotLayers(mapRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, hotspots, normRP, filter, showHotspots, selectedBuilding, selectedHotspot, mapLoaded]);

  // Zoom to selected building
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !selectedBuilding) return;
    const lon = selectedBuilding.lon ?? selectedBuilding.lng;
    const lat = selectedBuilding.lat;
    if (lon && lat) {
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: 16.5,
        pitch: is3D ? 62 : 0,
        bearing: is3D ? -15 : 0,
        offset: [-90, 0],
        duration: 1500,
        essential: true,
      });
    }
  }, [selectedBuilding, mapLoaded, is3D]);

  // Zoom to selected hotspot
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !selectedHotspot) return;
    const lon = selectedHotspot.lon ?? selectedHotspot.lng;
    const lat = selectedHotspot.lat;
    if (lon && lat) {
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: 15.2,
        pitch: is3D ? 58 : 0,
        bearing: is3D ? -12 : 0,
        offset: [-90, 0],
        duration: 1500,
        essential: true,
      });
    }
  }, [selectedHotspot, mapLoaded, is3D]);

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
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-white/90 backdrop-blur px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-md max-w-[calc(100%-16px)]">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium text-slate-700">
          <Sparkles className="size-3 text-[#D21245] shrink-0" />
          <span className="truncate">MapLibre GL · {assets.length} Assets · {hotspots.length} Hotspots</span>
        </div>
      </div>
    </div>
  );
}
