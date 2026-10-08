/**
 * Curated High-Resolution Nairobi Urban Drainage & Stormwater Canal Network GeoJSON.
 * Encompasses:
 * 1. Primary natural drainage arteries (Nairobi River, Ngong River, Mathare River, Motoine, Kirichwa Kubwa/Ndogo).
 * 2. Major engineered municipal stormwater canals (South C Outfall, Lusaka Road Canal, Enterprise Road Collector).
 * 3. Highway culvert conduits (Mombasa Road / Nyayo, Uhuru Highway, Expressway median drains).
 * 4. Critical AI-identified drainage bottlenecks (choke points causing urban backwater inundation).
 */

export interface DrainageFeatureProperties {
  id: string;
  name: string;
  system_type: "primary_river" | "engineered_canal" | "roadside_culvert" | "tributary";
  type_label: string;
  width_m: number;
  capacity_m3s: number;
  clogging_risk: "high" | "moderate" | "low";
  ai_bottleneck: boolean;
  catchment: string;
  description: string;
  color?: string;
}

export interface DrainageFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "LineString";
    coordinates: [number, number][]; // [lng, lat]
  };
  properties: DrainageFeatureProperties;
}

export interface DrainageFeatureCollection {
  type: "FeatureCollection";
  features: DrainageFeature[];
}

export const NAIROBI_DRAINAGE_GEOJSON: DrainageFeatureCollection = {
  type: "FeatureCollection",
  features: [
    // 1. Nairobi River Main Stem
    {
      type: "Feature",
      id: "drain-nbo-01",
      geometry: {
        type: "LineString",
        coordinates: [
          [36.755, -1.258],
          [36.772, -1.262],
          [36.785, -1.2665],
          [36.801, -1.271],
          [36.812, -1.274],
          [36.822, -1.2785],
          [36.832, -1.2815],
          [36.842, -1.2828],
          [36.852, -1.2835],
          [36.868, -1.277],
          [36.885, -1.268],
          [36.91, -1.26],
          [36.935, -1.254],
          [36.96, -1.248],
          [36.985, -1.242],
        ],
      },
      properties: {
        id: "drain-nbo-01",
        name: "Nairobi River Main Channel",
        system_type: "primary_river",
        type_label: "Primary Natural River Stem",
        width_m: 14.5,
        capacity_m3s: 180,
        clogging_risk: "high",
        ai_bottleneck: true,
        catchment: "Nairobi Basin Core",
        description: "Primary municipal drainage axis. Backwater flood risks around Gikomba, Kirinyaga Rd, and downstream Dandora bridges.",
        color: "#0284c7",
      },
    },

    // 2. Ngong River (Industrial Area & South Corridor)
    {
      type: "Feature",
      id: "drain-nbo-02",
      geometry: {
        type: "LineString",
        coordinates: [
          [36.762, -1.312],
          [36.778, -1.3135],
          [36.79, -1.315],
          [36.805, -1.3168],
          [36.82, -1.3175],
          [36.833, -1.3155],
          [36.842, -1.314],
          [36.853, -1.312],
          [36.865, -1.3105],
          [36.878, -1.3075],
          [36.89, -1.305],
          [36.912, -1.296],
          [36.93, -1.288],
        ],
      },
      properties: {
        id: "drain-nbo-02",
        name: "Ngong River Basin (Industrial Corridor)",
        system_type: "primary_river",
        type_label: "Primary Industrial Runoff River",
        width_m: 12.0,
        capacity_m3s: 145,
        clogging_risk: "high",
        ai_bottleneck: true,
        catchment: "Ngong / Industrial Area Basin",
        description: "Key drainage artery for Industrial Area & South C. High vulnerability to industrial sediment deposition and flash overflows.",
        color: "#0369a1",
      },
    },

    // 3. Mathare River (Northern Corridor)
    {
      type: "Feature",
      id: "drain-nbo-03",
      geometry: {
        type: "LineString",
        coordinates: [
          [36.802, -1.248],
          [36.818, -1.251],
          [36.831, -1.254],
          [36.845, -1.2575],
          [36.858, -1.2605],
          [36.871, -1.2612],
          [36.882, -1.2615],
          [36.895, -1.2602],
          [36.905, -1.259],
          [36.92, -1.2565],
          [36.935, -1.254],
        ],
      },
      properties: {
        id: "drain-nbo-03",
        name: "Mathare River Basin",
        system_type: "primary_river",
        type_label: "High-Gradient Urban Stream",
        width_m: 9.5,
        capacity_m3s: 110,
        clogging_risk: "high",
        ai_bottleneck: true,
        catchment: "Mathare Valley Catchment",
        description: "Dense riverine corridor through Mathare & Huruma. Steep valley slopes cause rapid runoff accumulation with severe flash flood hazard.",
        color: "#0ea5e9",
      },
    },

    // 4. South C & Nairobi West Stormwater Outfall Canal
    {
      type: "Feature",
      id: "drain-nbo-04",
      geometry: {
        type: "LineString",
        coordinates: [
          [36.808, -1.319],
          [36.814, -1.3178],
          [36.819, -1.3165],
          [36.825, -1.3172],
          [36.832, -1.318],
          [36.838, -1.316],
          [36.842, -1.314],
        ],
      },
      properties: {
        id: "drain-nbo-04",
        name: "Nairobi West - South C Stormwater Outfall",
        system_type: "engineered_canal",
        type_label: "Engineered Concrete Trapezoidal Canal",
        width_m: 6.5,
        capacity_m3s: 55,
        clogging_risk: "high",
        ai_bottleneck: true,
        catchment: "South C Lowland Catchment",
        description: "Engineered canal discharging South C & Nairobi West runoff. High bottleneck probability at Mombasa Rd underpass & rail culvert.",
        color: "#f59e0b",
      },
    },

    // 5. Lusaka Road Industrial Stormwater Canal
    {
      type: "Feature",
      id: "drain-nbo-05",
      geometry: {
        type: "LineString",
        coordinates: [
          [36.831, -1.305],
          [36.835, -1.308],
          [36.839, -1.311],
          [36.843, -1.3132],
          [36.848, -1.3145],
        ],
      },
      properties: {
        id: "drain-nbo-05",
        name: "Lusaka Road Industrial Canal",
        system_type: "engineered_canal",
        type_label: "Heavy Industrial Drainage Canal",
        width_m: 5.0,
        capacity_m3s: 42,
        clogging_risk: "high",
        ai_bottleneck: true,
        catchment: "Upper Industrial Area",
        description: "Channels heavy industrial pluvial runoff from City Stadium down Lusaka Rd into Ngong River. Prone to industrial waste choking.",
        color: "#f59e0b",
      },
    },

    // 6. Enterprise Road Collector Drain
    {
      type: "Feature",
      id: "drain-nbo-06",
      geometry: {
        type: "LineString",
        coordinates: [
          [36.848, -1.308],
          [36.851, -1.312],
          [36.854, -1.316],
          [36.858, -1.3185],
          [36.861, -1.321],
        ],
      },
      properties: {
        id: "drain-nbo-06",
        name: "Enterprise Road Collector Channel",
        system_type: "roadside_culvert",
        type_label: "Reinforced Concrete Box Drain",
        width_m: 4.2,
        capacity_m3s: 38,
        clogging_risk: "moderate",
        ai_bottleneck: false,
        catchment: "Central Industrial Area",
        description: "Parallel roadside drainage for heavy manufacturing warehouses. Connects to Ngong River downstream.",
        color: "#38bdf8",
      },
    },

    // 7. Kirichwa Kubwa Stream (Kilimani / Lavington)
    {
      type: "Feature",
      id: "drain-nbo-07",
      geometry: {
        type: "LineString",
        coordinates: [
          [36.772, -1.298],
          [36.781, -1.2945],
          [36.788, -1.291],
          [36.795, -1.286],
          [36.801, -1.281],
          [36.808, -1.277],
          [36.812, -1.274],
        ],
      },
      properties: {
        id: "drain-nbo-07",
        name: "Kirichwa Kubwa Drainage Basin",
        system_type: "tributary",
        type_label: "Natural Tributary & Green Belt Drain",
        width_m: 7.0,
        capacity_m3s: 70,
        clogging_risk: "moderate",
        ai_bottleneck: false,
        catchment: "Kilimani / Arboretum Basin",
        description: "Drains high-value residential & commercial properties across Lavington, Kilimani, and Kileleshwa into Nairobi River.",
        color: "#0284c7",
      },
    },

    // 8. Kirichwa Ndogo Stream (Kileleshwa / Westlands)
    {
      type: "Feature",
      id: "drain-nbo-08",
      geometry: {
        type: "LineString",
        coordinates: [
          [36.765, -1.292],
          [36.774, -1.288],
          [36.782, -1.284],
          [36.793, -1.2795],
          [36.803, -1.276],
          [36.812, -1.274],
        ],
      },
      properties: {
        id: "drain-nbo-08",
        name: "Kirichwa Ndogo Urban Tributary",
        system_type: "tributary",
        type_label: "Natural Urban Stream",
        width_m: 5.5,
        capacity_m3s: 50,
        clogging_risk: "moderate",
        ai_bottleneck: false,
        catchment: "Kileleshwa Basin",
        description: "Confluences with Kirichwa Kubwa near Museum Hill before joining the main Nairobi River channel.",
        color: "#0ea5e9",
      },
    },

    // 9. Mombasa Road / Nyayo Stadium Express Culvert
    {
      type: "Feature",
      id: "drain-nbo-09",
      geometry: {
        type: "LineString",
        coordinates: [
          [36.824, -1.296],
          [36.8255, -1.3],
          [36.827, -1.304],
          [36.829, -1.308],
          [36.831, -1.311],
        ],
      },
      properties: {
        id: "drain-nbo-09",
        name: "Uhuru Hwy / Nyayo Stadium Box Culvert",
        system_type: "roadside_culvert",
        type_label: "Highway Underground Box Culvert",
        width_m: 3.8,
        capacity_m3s: 32,
        clogging_risk: "high",
        ai_bottleneck: true,
        catchment: "CBD South Drainage Sub-catchment",
        description: "Major highway stormwater drain. Historical standing water pooling zone under Nyayo roundabout during extreme storms.",
        color: "#ef4444",
      },
    },

    // 10. Kibera - Motoine River Channel
    {
      type: "Feature",
      id: "drain-nbo-10",
      geometry: {
        type: "LineString",
        coordinates: [
          [36.775, -1.311],
          [36.784, -1.313],
          [36.792, -1.3145],
          [36.798, -1.316],
          [36.804, -1.317],
        ],
      },
      properties: {
        id: "drain-nbo-10",
        name: "Motoine River / Nairobi Dam Silt Runoff Channel",
        system_type: "primary_river",
        type_label: "Unlined Informal Settlement Waterway",
        width_m: 8.0,
        capacity_m3s: 85,
        clogging_risk: "high",
        ai_bottleneck: true,
        catchment: "Motoine / Kibera Basin",
        description: "High erosion and siltation corridor flowing through Kibera into Nairobi Dam. AI drainage gap penalty applied.",
        color: "#ef4444",
      },
    },

    // 11. Westlands - Chiromo Stormwater Conduit
    {
      type: "Feature",
      id: "drain-nbo-11",
      geometry: {
        type: "LineString",
        coordinates: [
          [36.802, -1.263],
          [36.807, -1.266],
          [36.811, -1.269],
          [36.813, -1.2715],
          [36.815, -1.2735],
        ],
      },
      properties: {
        id: "drain-nbo-11",
        name: "Westlands - Chiromo Stormwater Conduit",
        system_type: "engineered_canal",
        type_label: "Urban Commercial Stormwater Conduit",
        width_m: 4.5,
        capacity_m3s: 35,
        clogging_risk: "moderate",
        ai_bottleneck: false,
        catchment: "Westlands Commercial Hub",
        description: "Drains Westlands commercial core and Ring Road runoff down into Nairobi River at Museum Hill.",
        color: "#0284c7",
      },
    },

    // 12. Eastleigh - Juja Road Collector Canal
    {
      type: "Feature",
      id: "drain-nbo-12",
      geometry: {
        type: "LineString",
        coordinates: [
          [36.852, -1.278],
          [36.857, -1.274],
          [36.861, -1.271],
          [36.865, -1.267],
          [36.868, -1.264],
        ],
      },
      properties: {
        id: "drain-nbo-12",
        name: "Eastleigh - Juja Road Collector Canal",
        system_type: "engineered_canal",
        type_label: "Commercial Sector Stormwater Canal",
        width_m: 4.0,
        capacity_m3s: 30,
        clogging_risk: "high",
        ai_bottleneck: true,
        catchment: "Eastleigh Commercial Basin",
        description: "Drains commercial malls and high-density residential blocks in Eastleigh northwards into Mathare River.",
        color: "#f59e0b",
      },
    },

    // 13. Lunga Lunga Heavy Industrial Silt Channel
    {
      type: "Feature",
      id: "drain-nbo-13",
      geometry: {
        type: "LineString",
        coordinates: [
          [36.862, -1.312],
          [36.865, -1.314],
          [36.869, -1.317],
          [36.874, -1.319],
          [36.878, -1.3205],
        ],
      },
      properties: {
        id: "drain-nbo-13",
        name: "Lunga Lunga Industrial Runoff Silt Channel",
        system_type: "engineered_canal",
        type_label: "Low-Gradient Industrial Storm Canal",
        width_m: 4.8,
        capacity_m3s: 28,
        clogging_risk: "high",
        ai_bottleneck: true,
        catchment: "Industrial Area East",
        description: "Low-gradient open drainage with high siltation susceptibility. Flanks major manufacturing plants and logistics depots.",
        color: "#ef4444",
      },
    },

    // 14. Nairobi Expressway Median Sump Drain
    {
      type: "Feature",
      id: "drain-nbo-14",
      geometry: {
        type: "LineString",
        coordinates: [
          [36.818, -1.288],
          [36.82, -1.2915],
          [36.822, -1.295],
          [36.824, -1.2985],
          [36.826, -1.302],
        ],
      },
      properties: {
        id: "drain-nbo-14",
        name: "Nairobi Expressway Central Arterial Drain",
        system_type: "roadside_culvert",
        type_label: "Modern Engineered Sump & Pipe Conduit",
        width_m: 3.0,
        capacity_m3s: 25,
        clogging_risk: "low",
        ai_bottleneck: false,
        catchment: "Central Arterial Transit Corridor",
        description: "Modern deep subsurface storm conduits installed along the expressway viaduct alignment.",
        color: "#0ea5e9",
      },
    },
  ],
};
