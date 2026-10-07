"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  BUILDINGS,
  HOTSPOTS,
  riskLevel,
  formatKES,
  CLASS_LABEL,
  type Building,
  type HousingClass,
  type Hotspot,
  type ReturnPeriod,
} from "@/lib/cat-model";
import { Layers, Compass, Eye, Sparkles } from "lucide-react";

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export function RiskMap({
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
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const [mapStyle, setMapStyle] = useState<"light" | "dark" | "satellite">("light");

  const cb = useRef({ onSelectBuilding, onSelectHotspot });
  cb.current = { onSelectBuilding, onSelectHotspot };

  const styleUrls = {
    light: "mapbox://styles/mapbox/light-v11",
    dark: "mapbox://styles/mapbox/dark-v11",
    satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  };

  // 1. Initialize Mapbox 3D Map
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: styleUrls[mapStyle],
      center: [36.8372, -1.2864], // Nairobi [lng, lat]
      zoom: 12.2,
      pitch: is3D ? 52 : 0,
      bearing: is3D ? -18 : 0,
      antialias: true,
      attributionControl: true,
    });

    m.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "bottom-right");

    m.on("load", () => {
      setMapLoaded(true);
      add3DBuildingsLayer(m);
      renderLayers(m);
    });

    map.current = m;

    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Handle Style Change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    map.current.setStyle(styleUrls[mapStyle]);
    map.current.once("style.load", () => {
      if (map.current) {
        add3DBuildingsLayer(map.current);
        renderLayers(map.current);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle]);

  // 3. Zoom into Selected Building with 3D Camera FlyTo
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedBuilding) return;

    map.current.flyTo({
      center: [selectedBuilding.lng, selectedBuilding.lat],
      zoom: 16.5,
      pitch: is3D ? 62 : 0,
      bearing: is3D ? -15 : 0,
      offset: [-90, 0], // slight horizontal offset to keep building visible beside the side sheet
      duration: 1500,
      essential: true,
    });
  }, [selectedBuilding, mapLoaded, is3D]);

  // 4. Zoom into Selected Hotspot with 3D Camera FlyTo
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedHotspot) return;

    map.current.flyTo({
      center: [selectedHotspot.lng, selectedHotspot.lat],
      zoom: 15.2,
      pitch: is3D ? 58 : 0,
      bearing: is3D ? -12 : 0,
      offset: [-90, 0],
      duration: 1500,
      essential: true,
    });
  }, [selectedHotspot, mapLoaded, is3D]);

  // 5. Handle 3D Tilt Toggle
  const toggle3DTilt = () => {
    if (!map.current) return;
    const next3D = !is3D;
    setIs3D(next3D);
    map.current.easeTo({
      pitch: next3D ? 55 : 0,
      bearing: next3D ? -18 : 0,
      duration: 1000,
    });
  };

  // 6. Reset View to Nairobi Center
  const resetView = () => {
    if (!map.current) return;
    map.current.flyTo({
      center: [36.8372, -1.2864],
      zoom: 12.2,
      pitch: is3D ? 52 : 0,
      bearing: is3D ? -18 : 0,
      offset: [0, 0],
      essential: true,
    });
  };

  // 7. Add 3D Extruded Buildings Layer
  function add3DBuildingsLayer(m: mapboxgl.Map) {
    if (m.getLayer("3d-buildings")) return;

    const layers = m.getStyle()?.layers;
    let labelLayerId: string | undefined;
    if (layers) {
      for (const layer of layers) {
        if (layer.type === "symbol" && layer.layout && (layer.layout as any)["text-field"]) {
          labelLayerId = layer.id;
          break;
        }
      }
    }

    m.addLayer(
      {
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 13,
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["get", "height"],
            0,
            "#d1d5db",
            50,
            "#94a3b8",
            100,
            "#475569",
          ],
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            13,
            0,
            13.05,
            ["get", "height"],
          ],
          "fill-extrusion-base": [
            "interpolate",
            ["linear"],
            ["zoom"],
            13,
            0,
            13.05,
            ["get", "min_height"],
          ],
          "fill-extrusion-opacity": 0.55,
        },
      },
      labelLayerId
    );
  }

  // 8. Render GeoJSON Building Pins & Hotspots
  useEffect(() => {
    if (map.current && mapLoaded) {
      renderLayers(map.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rp, filter, showHotspots, selectedBuilding, selectedHotspot, mapLoaded]);

  function renderLayers(m: mapboxgl.Map) {
    // --- BUILDINGS GEOJSON ---
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

    if (m.getSource("buildings-source")) {
      (m.getSource("buildings-source") as mapboxgl.GeoJSONSource).setData(buildingSourceData);
    } else {
      m.addSource("buildings-source", {
        type: "geojson",
        data: buildingSourceData,
      });

      // Buildings Circle Layer
      m.addLayer({
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

      // Click event on property pin
      m.on("click", "buildings-points", (e) => {
        if (!e.features || !e.features[0]) return;
        const id = e.features[0].properties?.id;
        const b = BUILDINGS.find((item) => item.id === id);
        if (b) {
          cb.current.onSelectBuilding(b);
        }
      });

      // Cursor change on hover
      m.on("mouseenter", "buildings-points", () => {
        m.getCanvas().style.cursor = "pointer";
      });
      m.on("mouseleave", "buildings-points", () => {
        m.getCanvas().style.cursor = "";
      });
    }

    // --- SELECTED BUILDING HIGHLIGHT RING ---
    const selectedFeatureData: GeoJSON.FeatureCollection = selectedBuilding
      ? {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [selectedBuilding.lng, selectedBuilding.lat],
              },
              properties: {},
            },
          ],
        }
      : { type: "FeatureCollection", features: [] };

    if (m.getSource("selected-building-source")) {
      (m.getSource("selected-building-source") as mapboxgl.GeoJSONSource).setData(selectedFeatureData);
    } else {
      m.addSource("selected-building-source", {
        type: "geojson",
        data: selectedFeatureData,
      });

      m.addLayer({
        id: "selected-building-pulse",
        type: "circle",
        source: "selected-building-source",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12, 14,
            16, 28,
          ],
          "circle-color": "#D21245",
          "circle-opacity": 0.28,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#00264D",
        },
      });
    }

    // --- HOTSPOTS GEOJSON ---
    const hotspotFeatures: GeoJSON.Feature[] = HOTSPOTS.map((h) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [h.lng, h.lat],
      },
      properties: {
        name: h.name,
        demDetected: h.demDetected,
        aiDetected: h.aiDetected,
        color: h.demDetected ? "#16A34A" : "#D21245",
      },
    }));

    const hotspotSourceData: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: showHotspots ? hotspotFeatures : [],
    };

    if (m.getSource("hotspots-source")) {
      (m.getSource("hotspots-source") as mapboxgl.GeoJSONSource).setData(hotspotSourceData);
    } else {
      m.addSource("hotspots-source", {
        type: "geojson",
        data: hotspotSourceData,
      });

      // Hotspot Outer Glow Ring
      m.addLayer({
        id: "hotspots-rings",
        type: "circle",
        source: "hotspots-source",
        paint: {
          "circle-radius": 14,
          "circle-color": ["get", "color"],
          "circle-opacity": 0.18,
          "circle-stroke-width": 2,
          "circle-stroke-color": ["get", "color"],
        },
      });

      // Hotspot Center Dot
      m.addLayer({
        id: "hotspots-dots",
        type: "circle",
        source: "hotspots-source",
        paint: {
          "circle-radius": 4.5,
          "circle-color": ["get", "color"],
        },
      });

      // Click event on hotspot
      m.on("click", "hotspots-rings", (e) => {
        if (!e.features || !e.features[0]) return;
        const name = e.features[0].properties?.name;
        const h = HOTSPOTS.find((item) => item.name === name);
        if (h) {
          cb.current.onSelectHotspot(h);
        }
      });

      m.on("mouseenter", "hotspots-rings", () => {
        m.getCanvas().style.cursor = "pointer";
      });
      m.on("mouseleave", "hotspots-rings", () => {
        m.getCanvas().style.cursor = "";
      });
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* 3D Mapbox Canvas */}
      <div ref={mapContainer} className="h-full w-full" />

      {/* 3D Floating Control Ribbon (Top-Left of map) */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/95 p-1 shadow-md backdrop-blur">
        {/* 3D Tilt Button */}
        <button
          onClick={toggle3DTilt}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
            is3D
              ? "bg-[#00264D] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
          title="Toggle 3D Perspective Tilt"
        >
          <Compass className="size-3.5" /> {is3D ? "3D Perspective" : "2D Flat"}
        </button>

        {/* Style Selector */}
        <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-medium text-slate-600">
          <button
            onClick={() => setMapStyle("light")}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              mapStyle === "light" ? "bg-white font-bold text-slate-900 shadow-2xs" : "hover:text-slate-900"
            }`}
          >
            Light 3D
          </button>
          <button
            onClick={() => setMapStyle("dark")}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              mapStyle === "dark" ? "bg-slate-900 font-bold text-white shadow-2xs" : "hover:text-slate-900"
            }`}
          >
            Dark 3D
          </button>
          <button
            onClick={() => setMapStyle("satellite")}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              mapStyle === "satellite" ? "bg-emerald-800 font-bold text-white shadow-2xs" : "hover:text-slate-900"
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Reset Camera */}
        <button
          onClick={resetView}
          className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
          title="Reset Camera to Center of Nairobi"
        >
          Reset Camera
        </button>
      </div>

      {/* 3D Attribution Badge */}
      <div className="absolute bottom-2 left-3 z-10 hidden sm:flex items-center gap-2 rounded-md bg-white/90 px-2 py-1 text-[10px] text-slate-600 shadow-xs border border-slate-200 backdrop-blur">
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        Mapbox GL 3D Engine · Click any pin to zoom & inspect in 3D
      </div>
    </div>
  );
}
