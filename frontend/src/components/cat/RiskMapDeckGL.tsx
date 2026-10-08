"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  api,
  formatKES,
  CLASS_LABEL,
  type ExposureAsset,
  type Hotspot,
  type HousingClass,
  type RP,
} from "@/lib/api";
import { Compass, Eye, Sparkles, Waves } from "lucide-react";
import { NAIROBI_DRAINAGE_GEOJSON } from "@/lib/drainageData";

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
  const [showDrains, setShowDrains] = useState(true);
  const [mapStyle, setMapStyle] = useState<"light" | "dark" | "satellite">("light");

  const [assets, setAssets] = useState<ExposureAsset[]>(propAssets || []);
  const [hotspots, setHotspots] = useState<Hotspot[]>(propHotspots || []);

  const cb = useRef({ onSelectBuilding, onSelectHotspot });
  cb.current = { onSelectBuilding, onSelectHotspot };

  // Sync or fetch dynamic assets
  useEffect(() => {
    if (propAssets !== undefined) {
      setAssets(propAssets);
    } else {
      api.exposureAssets(normRP, { limit: 1000 }).then((res) => setAssets(res.assets)).catch(() => {});
    }
  }, [propAssets, normRP]);

  // Auto-fit MapLibre map bounds when assets list changes (e.g. fly to Mandera or Nairobi)
  useEffect(() => {
    if (mapRef.current && mapLoaded && assets.length > 0) {
      try {
        const bounds = new maplibregl.LngLatBounds();
        let valid = 0;
        assets.forEach((a) => {
          const lng = (a as any).lng ?? a.lon;
          const lat = a.lat;
          if (typeof lng === "number" && typeof lat === "number" && !isNaN(lng) && !isNaN(lat)) {
            bounds.extend([lng, lat]);
            valid++;
          }
        });
        if (valid > 0) {
          mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14.5, duration: 1200 });
        }
      } catch (err) {
        console.warn("Failed to fit MapLibre bounds", err);
      }
    }
  }, [assets, mapLoaded]);

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
          const found = assets.find((b) => b.loc_id === props?.id || (b as any).id === props?.id);
          if (found) {
            if (cb.current.onSelectBuilding) {
              cb.current.onSelectBuilding(found);
            }

            const lng = (found as any).lng ?? found.lon;
            const lat = found.lat;
            const depthVal = typeof found.depth_m === "number" ? found.depth_m.toFixed(2) : "0.00";
            const lossVal = formatKES(found.loss_kes || 0);
            const tivVal = formatKES(found.tiv_kes || 0);
            const fileBadge = found.source_file
              ? `<div style="display:inline-block;background:#EEF2F6;color:#00264D;border:1px solid #CBD5E1;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:600;margin:3px 0;">📄 ${found.source_file}</div>`
              : "";
            const classLabel = (CLASS_LABEL as any)[found.housing_class] || found.housing_class.replace(/_/g, " ");

            new maplibregl.Popup({ offset: 12, closeButton: true })
              .setLngLat([lng, lat])
              .setHTML(`
                <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #1E293B; min-width: 210px; padding: 2px;">
                  <div style="font-weight: 700; color: #00264D; font-size: 13px; line-height: 1.25;">${found.name || found.loc_id}</div>
                  ${fileBadge}
                  <div style="color: #64748B; font-size: 11px; margin-top: 2px;">Ward / Area: <strong style="color: #1E293B;">${found.ward}</strong></div>
                  <div style="color: #64748B; font-size: 11px; margin-bottom: 6px;">Class: <strong style="color: #1E293B; text-transform: capitalize;">${classLabel}</strong></div>
                  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px; font-size: 11px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
                      <span style="color: #64748B;">TIV Exposure:</span>
                      <strong style="color: #0F172A; font-family: monospace;">${tivVal}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
                      <span style="color: #64748B;">Flood Depth:</span>
                      <strong style="color: #D21245; font-family: monospace;">${depthVal} m</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                      <span style="color: #64748B;">Modeled Loss:</span>
                      <strong style="color: #B91C1C; font-family: monospace;">${lossVal}</strong>
                    </div>
                  </div>
                </div>
              `)
              .addTo(map);
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

  // Render Nairobi Drainage & Stormwater Canal Network
  function addDrainageLayers(map: maplibregl.Map) {
    if (!showDrains) {
      if (map.getLayer("drainage-lines-main")) map.removeLayer("drainage-lines-main");
      if (map.getLayer("drainage-lines-glow")) map.removeLayer("drainage-lines-glow");
      if (map.getSource("drainage-source")) map.removeSource("drainage-source");
      return;
    }

    if (map.getSource("drainage-source")) {
      (map.getSource("drainage-source") as maplibregl.GeoJSONSource).setData(NAIROBI_DRAINAGE_GEOJSON as any);
    } else {
      map.addSource("drainage-source", {
        type: "geojson",
        data: NAIROBI_DRAINAGE_GEOJSON as any,
      });

      map.addLayer({
        id: "drainage-lines-glow",
        type: "line",
        source: "drainage-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": ["case", ["==", ["get", "ai_bottleneck"], true], "#f59e0b", "#0284c7"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 4, 16, 9],
          "line-opacity": 0.32,
        },
      });

      map.addLayer({
        id: "drainage-lines-main",
        type: "line",
        source: "drainage-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": ["case", ["==", ["get", "ai_bottleneck"], true], "#ef4444", "#0ea5e9"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 2.0, 16, 4.2],
          "line-opacity": 0.95,
        },
      });

      map.on("click", "drainage-lines-main", (e) => {
        if (!e.features || !e.features[0]) return;
        const p = e.features[0].properties as any;
        if (!p) return;
        const isBottleneck = p.ai_bottleneck === "true" || p.ai_bottleneck === true;
        const statusBadge = isBottleneck
          ? `<div style="display:inline-block;background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700;margin:3px 0;">⚠️ AI Siltation Choke Point · High Overtopping Probability</div>`
          : `<div style="display:inline-block;background:#F0FDF4;color:#16A34A;border:1px solid #BBF7D0;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700;margin:3px 0;">✓ Open Flow Artery</div>`;

        new maplibregl.Popup({ offset: 10, closeButton: true })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #1E293B; min-width: 220px; padding: 2px;">
              <div style="font-weight: 700; color: #00264D; font-size: 13px; line-height: 1.25;">💧 ${p.name}</div>
              <div style="color: #64748B; font-size: 11px; margin-top: 1px;">Type: <strong style="color: #0F172A;">${p.type_label}</strong></div>
              ${statusBadge}
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px; font-size: 11px; margin-top: 4px;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
                  <span style="color: #64748B;">Catchment:</span>
                  <strong style="color: #0F172A;">${p.catchment}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
                  <span style="color: #64748B;">Peak Discharge:</span>
                  <strong style="color: #0284C7; font-family: monospace;">${p.capacity_m3s} m³/s</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="color: #64748B;">Channel Width:</span>
                  <strong style="color: #0F172A; font-family: monospace;">${p.width_m} m</strong>
                </div>
              </div>
              <p style="color: #475569; font-size: 10.5px; margin-top: 5px; line-height: 1.35;">${p.description}</p>
            </div>
          `)
          .addTo(map);
      });

      map.on("mouseenter", "drainage-lines-main", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "drainage-lines-main", () => {
        map.getCanvas().style.cursor = "";
      });
    }
  }

  // Update layers when assets, hotspots or props change
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      addBuildingLayers(mapRef.current);
      addHotspotLayers(mapRef.current);
      addDrainageLayers(mapRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, hotspots, normRP, filter, showHotspots, showDrains, selectedBuilding, selectedHotspot, mapLoaded]);

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
          onClick={() => setShowDrains(!showDrains)}
          className={`p-2 rounded-lg shadow-md transition flex items-center justify-center ${
            showDrains ? "bg-[#0ea5e9] text-white" : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
          title="Toggle Urban Stormwater Drains & Canals"
        >
          <Waves className="size-5" />
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
