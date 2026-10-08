"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  api,
  formatKES,
  CLASS_LABEL,
  type ExposureAsset,
  type HousingClass,
  type Hotspot,
  type RP,
} from "@/lib/api";
import { Layers, Compass, Eye, Sparkles, Waves } from "lucide-react";
import {
  NAIROBI_DRAINAGE_GEOJSON,
  NAIROBI_DRAINAGE_RIBBONS_GEOJSON,
  NAIROBI_SURGE_TOWERS_GEOJSON,
  calculateCorridorExposure,
  lineStringToRibbonPolygon,
} from "@/lib/drainageData";

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.MAPBOX_TOKEN ||
  "";

export function RiskMap({
  rp = "25y",
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
  selectedBuilding?: ExposureAsset | null;
  selectedHotspot?: Hotspot | null;
  onSelectBuilding?: (b: ExposureAsset) => void;
  onSelectHotspot?: (h: Hotspot) => void;
}) {
  const normRP: RP = typeof rp === "number" ? (`${rp}y` as RP) : rp;

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const [showDrains, setShowDrains] = useState(true);
  const [activeCorridor, setActiveCorridor] = useState<{
    id: string;
    name: string;
    exposedCount: number;
    totalTivKes: number;
  } | null>(null);
  const [mapStyle, setMapStyle] = useState<"light" | "dark" | "satellite">("light");

  const [assets, setAssets] = useState<ExposureAsset[]>(propAssets || []);
  const [hotspots, setHotspots] = useState<Hotspot[]>(propHotspots || []);

  const cb = useRef({ onSelectBuilding, onSelectHotspot });
  cb.current = { onSelectBuilding, onSelectHotspot };

  // Sync or fetch dynamic assets & hotspots
  useEffect(() => {
    if (propAssets !== undefined) {
      setAssets(propAssets);
    } else {
      api.exposureAssets(normRP, { limit: 1000 }).then((res) => setAssets(res.assets)).catch(() => {});
    }
  }, [propAssets, normRP]);

  // Auto-fit map bounds when assets list changes (e.g. fly to Mandera or Nairobi)
  useEffect(() => {
    if (map.current && mapLoaded && assets.length > 0) {
      try {
        const bounds = new mapboxgl.LngLatBounds();
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
          map.current.fitBounds(bounds, { padding: 60, maxZoom: 14.5, duration: 1200 });
        }
      } catch (err) {
        console.warn("Failed to fit map bounds", err);
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

  // Animated downstream water currents along channels
  useEffect(() => {
    if (!map.current || !mapLoaded || !showDrains) return;

    const m = map.current;
    let animId: number;
    let step = 0;
    const dashPhases = [
      [0, 4, 3],
      [0.5, 4, 2.5],
      [1, 4, 2],
      [1.5, 4, 1.5],
      [2, 4, 1],
      [2.5, 4, 0.5],
      [3, 4, 0],
      [0, 0.5, 3, 3.5],
      [0, 1, 3, 3],
      [0, 1.5, 3, 2.5],
      [0, 2, 3, 2],
      [0, 2.5, 3, 1.5],
      [0, 3, 3, 1],
      [0, 3.5, 3, 0.5],
    ];

    let lastTime = 0;
    const animate = (timestamp: number) => {
      if (timestamp - lastTime > 65) {
        lastTime = timestamp;
        step = (step + 1) % dashPhases.length;
        if (m.getLayer("drainage-flow-animated")) {
          try {
            m.setPaintProperty("drainage-flow-animated", "line-dasharray", dashPhases[step]);
          } catch {
            // style reloaded or layer unmounted
          }
        }
      }
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [mapLoaded, showDrains]);

  const styleUrls = {
    light: "mapbox://styles/mapbox/light-v11",
    dark: "mapbox://styles/mapbox/dark-v11",
    satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  };

  // 1. Initialize Mapbox 3D Map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (!MAPBOX_TOKEN) {
      console.warn("Mapbox public token is missing. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your Vercel or local environment variables.");
      return;
    }

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
    const bLng = (selectedBuilding as any).lng ?? selectedBuilding.lon;

    map.current.flyTo({
      center: [bLng, selectedBuilding.lat],
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
    const hLng = (selectedHotspot as any).lng ?? selectedHotspot.lon;

    map.current.flyTo({
      center: [hLng, selectedHotspot.lat],
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
  }, [normRP, filter, showHotspots, showDrains, selectedBuilding, selectedHotspot, mapLoaded, assets, hotspots]);

  function renderLayers(m: mapboxgl.Map) {
    // --- BUILDINGS GEOJSON ---
    const filteredBuildings = assets.filter(
      (b) => filter === "all" || b.housing_class === filter
    );

    const buildingFeatures: GeoJSON.Feature[] = filteredBuildings.map((b) => {
      const lvl = b.risk_level || (b.hazard_score > 0.6 ? "high" : b.hazard_score > 0.3 ? "mid" : "low");
      const isSelected = selectedBuilding?.loc_id === b.loc_id || (selectedBuilding as any)?.id === b.loc_id;
      const lng = (b as any).lng ?? b.lon;
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, b.lat],
        },
        properties: {
          id: b.loc_id,
          ward: b.ward,
          cls: b.housing_class,
          area: b.floor_area_m2,
          tiv: b.tiv_kes,
          depth100: b.depth_m,
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

      // Click event on property pin with rich popup & selection callback
      m.on("click", "buildings-points", (e) => {
        if (!e.features || !e.features[0]) return;
        const id = e.features[0].properties?.id;
        const b = assets.find((item) => item.loc_id === id || (item as any).id === id);
        if (b) {
          if (cb.current.onSelectBuilding) {
            cb.current.onSelectBuilding(b);
          }

          const lng = (b as any).lng ?? b.lon;
          const lat = b.lat;
          const depthVal = typeof b.depth_m === "number" ? b.depth_m.toFixed(2) : "0.00";
          const lossVal = formatKES(b.loss_kes || 0);
          const tivVal = formatKES(b.tiv_kes || 0);
          const fileBadge = b.source_file
            ? `<div style="display:inline-block;background:#EEF2F6;color:#00264D;border:1px solid #CBD5E1;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:600;margin:3px 0;">📄 ${b.source_file}</div>`
            : "";
          const classLabel = (CLASS_LABEL as any)[b.housing_class] || b.housing_class.replace(/_/g, " ");

          new mapboxgl.Popup({ offset: 12, closeButton: true, className: "kenya-re-point-popup" })
            .setLngLat([lng, lat])
            .setHTML(`
              <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #1E293B; min-width: 210px; padding: 2px;">
                <div style="font-weight: 700; color: #00264D; font-size: 13px; line-height: 1.25;">${b.name || b.loc_id}</div>
                ${fileBadge}
                <div style="color: #64748B; font-size: 11px; margin-top: 2px;">Ward / Area: <strong style="color: #1E293B;">${b.ward}</strong></div>
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
                <button
                  type="button"
                  onclick="window.dispatchEvent(new CustomEvent('kenya_re_inspect_asset', { detail: '${b.loc_id || (b as any).id}' }))"
                  style="margin-top: 7px; width: 100%; background: #00264D; color: white; border: none; border-radius: 6px; padding: 5px 8px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);"
                >
                  <span>🔍 Inspect Full Dossier →</span>
                </button>
              </div>
            `)
            .addTo(m);
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
    const selLng = selectedBuilding ? ((selectedBuilding as any).lng ?? selectedBuilding.lon) : 0;
    const selectedFeatureData: GeoJSON.FeatureCollection = selectedBuilding
      ? {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [selLng, selectedBuilding.lat],
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
    const hotspotFeatures: GeoJSON.Feature[] = hotspots.map((h) => {
      const lng = (h as any).lng ?? h.lon;
      const isHigh = (h.hazard_score ?? 0) > 0.5 || h.tier_label === "High" || h.tier_label === "Extreme";
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, h.lat],
        },
        properties: {
          name: h.name,
          tier_label: h.tier_label,
          color: isHigh ? "#D21245" : "#16A34A",
        },
      };
    });

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
        const h = hotspots.find((item) => item.name === name);
        if (h && cb.current.onSelectHotspot) {
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

    // --- 1. DRAINAGE & STORMWATER 3D VOLUMETRIC RIBBONS ---
    const ribbonSourceData = showDrains
      ? NAIROBI_DRAINAGE_RIBBONS_GEOJSON
      : { type: "FeatureCollection", features: [] };

    if (m.getSource("drainage-ribbons-source")) {
      (m.getSource("drainage-ribbons-source") as mapboxgl.GeoJSONSource).setData(ribbonSourceData as any);
    } else {
      m.addSource("drainage-ribbons-source", {
        type: "geojson",
        data: ribbonSourceData as any,
      });

      // 3D Extruded Water Ribbon (Canal Trench / Elevated Water Surface)
      m.addLayer({
        id: "drainage-ribbons-3d",
        type: "fill-extrusion",
        source: "drainage-ribbons-source",
        paint: {
          "fill-extrusion-height": ["get", "extrusion_height"],
          "fill-extrusion-base": 0,
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-opacity": 0.82,
        },
      });
    }

    // --- 2. 150m CORRIDOR EXPOSURE BUFFER HIGHLIGHT ---
    if (!m.getSource("drainage-corridor-buffer-source")) {
      m.addSource("drainage-corridor-buffer-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      m.addLayer({
        id: "drainage-corridor-buffer-fill",
        type: "fill",
        source: "drainage-corridor-buffer-source",
        paint: {
          "fill-color": "#38bdf8",
          "fill-opacity": 0.22,
        },
      });

      m.addLayer({
        id: "drainage-corridor-buffer-stroke",
        type: "line",
        source: "drainage-corridor-buffer-source",
        paint: {
          "line-color": "#0284c7",
          "line-width": 1.8,
          "line-dasharray": [3, 2],
          "line-opacity": 0.85,
        },
      });
    }

    // --- 3. DRAINAGE VECTOR LINES & ANIMATED FLOW CURRENTS ---
    const drainageSourceData = showDrains
      ? NAIROBI_DRAINAGE_GEOJSON
      : { type: "FeatureCollection", features: [] };

    if (m.getSource("drainage-source")) {
      (m.getSource("drainage-source") as mapboxgl.GeoJSONSource).setData(drainageSourceData as any);
    } else {
      m.addSource("drainage-source", {
        type: "geojson",
        data: drainageSourceData as any,
      });

      // Outer Glow Line for Waterways
      m.addLayer({
        id: "drainage-lines-glow",
        type: "line",
        source: "drainage-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "ai_bottleneck"], true],
            "#f59e0b",
            "#0284c7",
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            11, 4,
            16, 10,
          ],
          "line-opacity": 0.35,
        },
      });

      // Crisp Centerline
      m.addLayer({
        id: "drainage-lines-main",
        type: "line",
        source: "drainage-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "ai_bottleneck"], true],
            "#ef4444",
            "#0ea5e9",
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            11, 2.0,
            16, 4.5,
          ],
          "line-opacity": 0.95,
        },
      });

      // Animated Downstream Water Current (Pulsing Photons traveling along flow gradient)
      m.addLayer({
        id: "drainage-flow-animated",
        type: "line",
        source: "drainage-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "ai_bottleneck"], true],
            "#fef08a",
            "#e0f2fe",
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            11, 1.8,
            16, 3.5,
          ],
          "line-dasharray": [0, 4, 3],
          "line-opacity": 0.95,
        },
      });
    }

    // --- 4. 3D BOTTLENECK SURGE TOWERS (HYDRAULIC CHOKE POINTS) ---
    const surgeSourceData = showDrains
      ? NAIROBI_SURGE_TOWERS_GEOJSON
      : { type: "FeatureCollection", features: [] };

    if (m.getSource("drainage-surge-towers-source")) {
      (m.getSource("drainage-surge-towers-source") as mapboxgl.GeoJSONSource).setData(surgeSourceData as any);
    } else {
      m.addSource("drainage-surge-towers-source", {
        type: "geojson",
        data: surgeSourceData as any,
      });

      // 3D Volumetric Surge Tower (Rising 35m–48m into 3D Skyline)
      m.addLayer({
        id: "drainage-surge-towers-3d",
        type: "fill-extrusion",
        source: "drainage-surge-towers-source",
        paint: {
          "fill-extrusion-height": ["get", "tower_height"],
          "fill-extrusion-base": 0,
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-opacity": 0.72,
        },
      });

      // Ground Beacon Pulsing Ring
      m.addLayer({
        id: "drainage-surge-towers-ring",
        type: "circle",
        source: "drainage-surge-towers-source",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            11, 8,
            15, 18,
          ],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.25,
          "circle-stroke-width": 2,
          "circle-stroke-color": ["get", "color"],
        },
      });

      // Center Dot
      m.addLayer({
        id: "drainage-surge-towers-dot",
        type: "circle",
        source: "drainage-surge-towers-source",
        paint: {
          "circle-radius": 4.5,
          "circle-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-stroke-color": ["get", "color"],
        },
      });

      // Click Event on 3D Surge Tower
      m.on("click", "drainage-surge-towers-ring", (e) => {
        if (!e.features || !e.features[0]) return;
        const p = e.features[0].properties as any;
        if (!p) return;

        m.flyTo({
          center: [Number(p.lng), Number(p.lat)],
          zoom: 15.2,
          pitch: 62,
          bearing: -24,
          duration: 1800,
          essential: true,
        });

        new mapboxgl.Popup({ offset: 14, closeButton: true, className: "kenya-re-tower-popup", maxWidth: "340px" })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #1E293B; min-width: 250px; padding: 2px;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                <span style="background:#FEE2E2;color:#DC2626;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">⚠️ 3D SURGE TOWER</span>
                <span style="font-size:10px;color:#64748B;font-family:monospace;font-weight:700;">${p.tower_height}m Elevation</span>
              </div>
              <div style="font-weight: 700; color: #00264D; font-size: 13px; margin-top: 4px; line-height: 1.25;">${p.name}</div>
              <div style="color: #64748B; font-size: 11px; margin-top: 1px;">Basin: <strong style="color: #0F172A;">${p.catchment}</strong></div>

              <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; padding: 7px; margin-top: 6px; font-size: 11px;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 3px;">
                  <span style="color: #7F1D1D;">Siltation Capacity Loss:</span>
                  <strong style="color: #DC2626; font-family: monospace;">${p.siltation_loss_pct}% Clogged</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom: 3px;">
                  <span style="color: #7F1D1D;">Backwater Surge Head:</span>
                  <strong style="color: #DC2626; font-family: monospace;">+${p.surge_head_m}m</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="color: #7F1D1D;">Overtopping Risk:</span>
                  <strong style="color: #B91C1C;">${p.overtopping_prob}</strong>
                </div>
              </div>

              <p style="color: #475569; font-size: 10.5px; margin-top: 6px; line-height: 1.35;">${p.description}</p>
            </div>
          `)
          .addTo(m);
      });

      m.on("mouseenter", "drainage-surge-towers-ring", () => {
        m.getCanvas().style.cursor = "pointer";
      });
      m.on("mouseleave", "drainage-surge-towers-ring", () => {
        m.getCanvas().style.cursor = "";
      });
    }

    // --- 5. INTERACTIVE 3D CORRIDOR FLY-ALONG & 150m EXPOSURE SCAN ---
    const handleDrainageFeatureClick = (e: mapboxgl.MapLayerMouseEvent) => {
      if (!e.features || !e.features[0]) return;
      const feat = e.features[0];
      const p = feat.properties as any;
      if (!p) return;

      // Find original full geometry coordinates
      const originalFeature = NAIROBI_DRAINAGE_GEOJSON.features.find(
        (f) => f.id === p.id || f.properties.name === p.name
      );
      const coords = originalFeature?.geometry.coordinates || [];
      if (coords.length < 2) return;

      // Calculate 150m corridor exposure scan
      const exposure = calculateCorridorExposure(coords, assets, 150);

      setActiveCorridor({
        id: p.id,
        name: p.name,
        exposedCount: exposure.exposedCount,
        totalTivKes: exposure.totalTivKes,
      });

      // Highlight 150m corridor buffer polygon
      const bufferRing = lineStringToRibbonPolygon(coords, 300);
      if (m.getSource("drainage-corridor-buffer-source")) {
        (m.getSource("drainage-corridor-buffer-source") as mapboxgl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [bufferRing],
              },
              properties: {},
            },
          ],
        });
      }

      // Calculate midpoint & channel heading for cinematic 3D fly-along
      const midIdx = Math.floor(coords.length / 2);
      const midLng = coords[midIdx][0];
      const midLat = coords[midIdx][1];
      const p1 = coords[Math.max(0, midIdx - 1)];
      const p2 = coords[Math.min(coords.length - 1, midIdx + 1)];
      const bearing = Math.round((Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180) / Math.PI);

      m.flyTo({
        center: [midLng, midLat],
        zoom: 14.6,
        pitch: 62,
        bearing: bearing,
        duration: 2000,
        essential: true,
      });

      // Render rich popup with exposure scan results
      const isBottleneck = p.ai_bottleneck === "true" || p.ai_bottleneck === true;
      const statusBadge = isBottleneck
        ? `<div style="display:inline-block;background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700;margin:3px 0;">⚠️ AI Siltation Bottleneck · High Overtopping Probability</div>`
        : `<div style="display:inline-block;background:#F0FDF4;color:#16A34A;border:1px solid #BBF7D0;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700;margin:3px 0;">✓ Open Flow Artery</div>`;

      const exposedAssetsList = exposure.exposedAssets.slice(0, 3).map((a: any) =>
        `<li style="margin-top:2px;display:flex;justify-content:space-between;gap:8px;">
          <span style="max-width:145px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#1E293B;">${a.name || a.ward} (${a.loc_id})</span>
          <span style="font-family:monospace;font-weight:600;color:#00264D;">${formatKES(a.tiv_kes)}</span>
        </li>`
      ).join("");

      new mapboxgl.Popup({ offset: 12, closeButton: true, className: "kenya-re-drain-popup", maxWidth: "340px" })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #1E293B; min-width: 250px; padding: 2px;">
            <div style="font-weight: 700; color: #00264D; font-size: 13px; line-height: 1.25;">🌊 ${p.name}</div>
            <div style="color: #64748B; font-size: 11px; margin-top: 1px;">Type: <strong style="color: #0F172A;">${p.type_label}</strong> · Physical Width: <strong style="color: #0284c7;">${p.width_m}m</strong></div>
            ${statusBadge}
            
            <!-- 150m Hydrological Proximity Scan -->
            <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 7px; margin-top: 6px;">
              <div style="font-size: 10px; font-weight: 700; color: #1E40AF; text-transform: uppercase; letter-spacing: 0.5px;">⚡ 150m Corridor Exposure Scan</div>
              <div style="display:flex; justify-content:space-between; margin-top: 4px; font-size: 11px;">
                <span style="color: #475569;">Insured Assets in Corridor:</span>
                <strong style="color: ${exposure.exposedCount > 0 ? '#DC2626' : '#16A34A'};">${exposure.exposedCount} Properties</strong>
              </div>
              <div style="display:flex; justify-content:space-between; margin-top: 2px; font-size: 11px;">
                <span style="color: #475569;">Aggregate TIV at Risk:</span>
                <strong style="color: #00264D; font-family: monospace;">${formatKES(exposure.totalTivKes)}</strong>
              </div>
              ${exposure.maxDepthM > 0 ? `
                <div style="display:flex; justify-content:space-between; margin-top: 2px; font-size: 11px;">
                  <span style="color: #475569;">Max Modeled Depth:</span>
                  <strong style="color: #DC2626; font-family: monospace;">${exposure.maxDepthM.toFixed(2)}m</strong>
                </div>
              ` : ''}
              ${exposedAssetsList ? `
                <div style="margin-top: 5px; padding-top: 4px; border-top: 1px dashed #BFDBFE; font-size: 10px;">
                  <ul style="padding-left:0;list-style:none;margin:0;">
                    ${exposedAssetsList}
                  </ul>
                </div>
              ` : ''}
            </div>

            <!-- Technical Hydraulic Metrics -->
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px; font-size: 11px; margin-top: 6px;">
              <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
                <span style="color: #64748B;">Catchment Basin:</span>
                <strong style="color: #0F172A;">${p.catchment}</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color: #64748B;">Peak Discharge:</span>
                <strong style="color: #0284C7; font-family: monospace;">${p.capacity_m3s} m³/s</strong>
              </div>
            </div>
            <p style="color: #475569; font-size: 10px; margin-top: 5px; line-height: 1.35;">${p.description}</p>
          </div>
        `)
        .addTo(m);
    };

    m.on("click", "drainage-ribbons-3d", handleDrainageFeatureClick);
    m.on("mouseenter", "drainage-ribbons-3d", () => {
      m.getCanvas().style.cursor = "pointer";
    });
    m.on("mouseleave", "drainage-ribbons-3d", () => {
      m.getCanvas().style.cursor = "";
    });

    m.on("click", "drainage-lines-main", handleDrainageFeatureClick);
    m.on("mouseenter", "drainage-lines-main", () => {
      m.getCanvas().style.cursor = "pointer";
    });
    m.on("mouseleave", "drainage-lines-main", () => {
      m.getCanvas().style.cursor = "";
    });
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/90 p-6 text-center text-white backdrop-blur-sm">
          <div className="size-12 rounded-full bg-[#D21245]/20 flex items-center justify-center text-[#D21245] mb-3">
            <Compass className="size-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Mapbox Public Token Required</h3>
          <p className="max-w-md text-xs text-slate-300 mb-4 leading-relaxed">
            To view the interactive 3D Nairobi pluvial flood map, add your Mapbox token as an environment variable in your Vercel Dashboard:
          </p>
          <div className="rounded-md bg-black/60 px-3 py-2 font-mono text-xs text-emerald-400 select-all border border-white/10">
            NEXT_PUBLIC_MAPBOX_TOKEN = pk.eyJ1...
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Once saved in Vercel project settings, redeploy to see the full 3D building extrusions and terrain.
          </p>
        </div>
      )}

      {/* 3D Mapbox Canvas */}
      <div ref={mapContainer} className="h-full w-full" />

      {/* 3D Floating Control Ribbon (Top-Left of map) */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 max-w-[calc(100%-24px)] rounded-lg border border-slate-200/90 bg-white/95 p-1 shadow-md backdrop-blur">
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

        {/* Drainage Network Toggle */}
        <button
          onClick={() => setShowDrains(!showDrains)}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
            showDrains
              ? "bg-[#0ea5e9] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
          title="Toggle Urban Stormwater Drains & Canals"
        >
          <Waves className="size-3.5" /> Drains: {showDrains ? "ON" : "OFF"}
        </button>

        {/* Active Corridor Exposure Chip */}
        {activeCorridor && (
          <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-900 rounded-md px-2 py-1 text-xs font-medium shadow-2xs">
            <span className="font-bold text-sky-950">🌊 {activeCorridor.name}:</span>
            <span>{activeCorridor.exposedCount} assets ({formatKES(activeCorridor.totalTivKes)})</span>
            <button
              onClick={() => {
                setActiveCorridor(null);
                if (map.current?.getSource("drainage-corridor-buffer-source")) {
                  (map.current.getSource("drainage-corridor-buffer-source") as mapboxgl.GeoJSONSource).setData({
                    type: "FeatureCollection",
                    features: [],
                  });
                }
              }}
              className="ml-1 text-sky-700 hover:text-red-600 font-bold cursor-pointer"
              title="Clear corridor highlight"
            >
              ✕
            </button>
          </div>
        )}

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
