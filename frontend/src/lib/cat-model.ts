// Kenya Re Catastrophe Risk Model Engine — Nairobi Urban Pluvial Flood Model

export type HousingClass = "informal_iron_sheet" | "semi_permanent" | "permanent_masonry";
export type ReturnPeriod = 5 | 10 | 25 | 50 | 100;

export const SCENARIOS: { rp: ReturnPeriod; label: string; short: string }[] = [
  { rp: 5, label: "Common", short: "5-Yr" },
  { rp: 10, label: "Occasional", short: "10-Yr" },
  { rp: 25, label: "Moderate", short: "25-Yr" },
  { rp: 50, label: "Severe", short: "50-Yr" },
  { rp: 100, label: "Extreme", short: "100-Yr" },
];

export const CLASS_LABEL: Record<HousingClass, string> = {
  informal_iron_sheet: "Informal Iron Sheet",
  semi_permanent: "Semi-Permanent",
  permanent_masonry: "Permanent Masonry",
};

// Depth multiplier per return period relative to the 100-yr design flood depth
export const DEPTH_FACTOR: Record<ReturnPeriod, number> = {
  5: 0.28,
  10: 0.42,
  25: 0.62,
  50: 0.82,
  100: 1.0,
};

// Portfolio Exceedance Probability (EP) curve (KES millions)
export const EP_CURVE: { rp: ReturnPeriod; prob: number; ai: number; dem: number }[] = [
  { rp: 5, prob: 20, ai: 121.4, dem: 104.8 },
  { rp: 10, prob: 10, ai: 238.9, dem: 205.2 },
  { rp: 25, prob: 4, ai: 421.7, dem: 362.0 },
  { rp: 50, prob: 2, ai: 618.3, dem: 532.5 },
  { rp: 100, prob: 1, ai: 842.6, dem: 727.6 },
];

export const TIV_TOTAL = 4_820_000_000;
export const AAL = 94_200_000;

// JRC / Huizinga-style sigmoid depth-damage functions adapted for Nairobi
export const CURVES: Record<HousingClass, { cap: number; k: number; mid: number; start: number; desc: string }> = {
  informal_iron_sheet: {
    cap: 0.90,
    k: 3.2,
    mid: 0.75,
    start: 0.20,
    desc: "Vulnerable informal sheet metal. Rapid structural and contents loss even at 0.3m depth."
  },
  semi_permanent: {
    cap: 0.88,
    k: 2.5,
    mid: 1.15,
    start: 0.30,
    desc: "Mixed timber/brick construction. Moderate resilience with progressive water damage."
  },
  permanent_masonry: {
    cap: 0.85,
    k: 2.0,
    mid: 1.85,
    start: 0.50,
    desc: "Reinforced concrete & stone. High resilience; foundation & structural integrity preserved."
  },
};

export function damageRatio(cls: HousingClass, depth: number): number {
  const c = CURVES[cls];
  if (depth <= c.start) return 0;
  const s = (d: number) => 1 / (1 + Math.exp(-c.k * (d - c.mid)));
  const v = (s(depth) - s(c.start)) / (1 - s(c.start));
  return Math.max(0, Math.min(c.cap, v * c.cap));
}

export interface Hotspot {
  name: string;
  lat: number;
  lng: number;
  demDetected: boolean;
  aiDetected: boolean;
  notes: string;
}

export const HOTSPOTS: Hotspot[] = [
  { name: "Kibera", lat: -1.3127, lng: 36.7884, demDetected: false, aiDetected: true, notes: "Drainage blockage & high density informal runoff" },
  { name: "Westlands", lat: -1.2676, lng: 36.8108, demDetected: false, aiDetected: true, notes: "Culvert overflow along commercial avenue" },
  { name: "Lavington", lat: -1.2782, lng: 36.7698, demDetected: false, aiDetected: true, notes: "Nairobi River tributary curb overtop" },
  { name: "Kileleshwa", lat: -1.2838, lng: 36.7868, demDetected: false, aiDetected: true, notes: "Roadway drainage constriction" },
  { name: "South B", lat: -1.3105, lng: 36.8366, demDetected: false, aiDetected: true, notes: "Ngong River backwater bottleneck" },
  { name: "Industrial Area", lat: -1.3047, lng: 36.8529, demDetected: false, aiDetected: true, notes: "Commercial basin impervious surface runoff" },
  { name: "CBD River Road", lat: -1.2834, lng: 36.8287, demDetected: false, aiDetected: true, notes: "Stormwater conduit under-capacity" },
  { name: "Parklands", lat: -1.2615, lng: 36.8193, demDetected: false, aiDetected: true, notes: "Local depression & blocked inlets" },
  { name: "Ngara", lat: -1.2729, lng: 36.8231, demDetected: false, aiDetected: true, notes: "Nairobi River confluence surge" },
  { name: "Kilimani", lat: -1.2913, lng: 36.7851, demDetected: false, aiDetected: true, notes: "High development density runoff" },
  { name: "Upper Hill", lat: -1.2985, lng: 36.8146, demDetected: false, aiDetected: false, notes: "Elevated topography; low flood risk" },
  { name: "Karen", lat: -1.3197, lng: 36.7073, demDetected: false, aiDetected: false, notes: "Low impervious density; natural soak-away" },
  { name: "Mathare", lat: -1.2598, lng: 36.8584, demDetected: true, aiDetected: true, notes: "Valley depression adjacent to Mathare River" },
  { name: "Kiambiu", lat: -1.2876, lng: 36.8642, demDetected: true, aiDetected: true, notes: "Low-lying floodplain adjacent to Nairobi River" },
  { name: "Dandora", lat: -1.2505, lng: 36.8968, demDetected: true, aiDetected: true, notes: "Downstream Nairobi River basin depression" },
  { name: "Korogocho", lat: -1.2489, lng: 36.8824, demDetected: true, aiDetected: true, notes: "Riverbed constriction & low elevation" },
  { name: "Mukuru kwa Njenga", lat: -1.3165, lng: 36.8814, demDetected: true, aiDetected: true, notes: "Ngong River floodplain" },
  { name: "Mukuru kwa Reuben", lat: -1.3124, lng: 36.8707, demDetected: true, aiDetected: true, notes: "Ngong River channel bottleneck" },
  { name: "Kariobangi", lat: -1.2537, lng: 36.8774, demDetected: true, aiDetected: true, notes: "River confluence accumulation zone" },
  { name: "Kawangware", lat: -1.2851, lng: 36.7487, demDetected: true, aiDetected: true, notes: "Natural valley terrain depression" },
  { name: "Githurai", lat: -1.2006, lng: 36.9132, demDetected: true, aiDetected: true, notes: "Depression basin along Thika highway corridor" },
  { name: "Kayole", lat: -1.2742, lng: 36.9134, demDetected: true, aiDetected: true, notes: "Nairobi River downstream marshland" },
  { name: "Embakasi", lat: -1.3192, lng: 36.8943, demDetected: true, aiDetected: true, notes: "Flat terrain poor drainage gradient" },
  { name: "Mwiki", lat: -1.2311, lng: 36.9323, demDetected: true, aiDetected: true, notes: "Kasarani River tributary floodplain" },
];

export interface Building {
  id: string;
  ward: string;
  lat: number;
  lng: number;
  cls: HousingClass;
  area: number;
  unitCost: number;
  tiv: number;
  depth100: number;
}

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const UNIT_COST: Record<HousingClass, number> = {
  informal_iron_sheet: 9_000,
  semi_permanent: 22_000,
  permanent_masonry: 48_000,
};

function buildPortfolio(): Building[] {
  const r = rng(42);
  const out: Building[] = [];
  for (let i = 0; i < 600; i++) {
    const h = HOTSPOTS[Math.floor(r() * HOTSPOTS.length)];
    const informalArea = ["Kibera", "Mathare", "Kiambiu", "Korogocho", "Mukuru kwa Njenga", "Mukuru kwa Reuben", "Dandora", "Kariobangi"].includes(h.name);
    const x = r();
    const cls: HousingClass = informalArea
      ? x < 0.6 ? "informal_iron_sheet" : x < 0.85 ? "semi_permanent" : "permanent_masonry"
      : x < 0.1 ? "informal_iron_sheet" : x < 0.3 ? "semi_permanent" : "permanent_masonry";
    const area = Math.round(cls === "permanent_masonry" ? 120 + r() * 380 : cls === "semi_permanent" ? 50 + r() * 120 : 18 + r() * 40);
    const unitCost = Math.round((UNIT_COST[cls] * (0.85 + r() * 0.3)) / 500) * 500;
    const dist = r();
    const depth100 = Math.max(0.05, (1 - dist) * (h.aiDetected ? 2.6 : 1.1) + r() * 0.5);
    const ang = r() * Math.PI * 2;
    const rad = 0.002 + dist * 0.012;
    out.push({
      id: `NBO-${String(i + 1).padStart(4, "0")}`,
      ward: h.name,
      lat: h.lat + Math.sin(ang) * rad,
      lng: h.lng + Math.cos(ang) * rad,
      cls,
      area,
      unitCost,
      tiv: area * unitCost,
      depth100: Math.round(depth100 * 100) / 100,
    });
  }
  return out;
}

export const BUILDINGS = buildPortfolio();

export type RiskLevel = "low" | "mid" | "high";
export function riskLevel(b: Building, rp: ReturnPeriod): RiskLevel {
  const dr = damageRatio(b.cls, b.depth100 * DEPTH_FACTOR[rp]);
  return dr > 0.35 ? "high" : dr > 0.08 ? "mid" : "low";
}

export function formatKES(v: number, digits = 1): string {
  const a = Math.abs(v);
  if (a >= 1e9) return `KES ${(v / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `KES ${(v / 1e6).toFixed(digits)}M`;
  if (a >= 1e3) return `KES ${(v / 1e3).toFixed(0)}K`;
  return `KES ${v.toFixed(0)}`;
}

// --- Simulated AI Policy Ingestion Engine (NLP) ------------------------------
export interface ParsedLine {
  count: number;
  cls: HousingClass;
  ward: string;
  lat: number;
  lng: number;
  area: number;
  unitCost: number;
  tiv: number;
  depth100: number;
  loss100: number;
}

export function parsePolicy(text: string): ParsedLine[] {
  const segments = text.split(/,?\s*(?:\bplus\b|\band\b|;|\.\s)\s*/i).filter((s) => /\d/.test(s));
  const lines: ParsedLine[] = [];
  let lastWard: Hotspot | undefined;
  for (const seg of segments) {
    const s = seg.toLowerCase();
    const cls: HousingClass = /iron|informal|mabati/.test(s)
      ? "informal_iron_sheet"
      : /semi/.test(s)
        ? "semi_permanent"
        : "permanent_masonry";
    const countM = s.match(/\b(\d{1,4})\s+(?:[a-z-]+\s+){0,4}(?:warehouse|structure|house|home|building|unit|propert|shop|office|apartment)/);
    const areaM = s.match(/(\d[\d,]*)\s*(?:m2|m²|sqm|square)/);
    const costM = s.match(/kes\s*([\d,]+)\s*(?:\/|per)\s*m/);
    const ward = HOTSPOTS.find((h) => s.includes(h.name.toLowerCase())) ?? lastWard ?? HOTSPOTS[1];
    lastWard = ward;
    const count = countM ? parseInt(countM[1]) : 1;
    const area = areaM ? parseInt(areaM[1].replace(/,/g, "")) : cls === "permanent_masonry" ? 200 : 30;
    const unitCost = costM ? parseInt(costM[1].replace(/,/g, "")) : UNIT_COST[cls];
    const depth100 = ward.aiDetected ? (/river/.test(s) ? 2.4 : 1.6) : 0.9;
    const tiv = count * area * unitCost;
    lines.push({
      count,
      cls,
      ward: ward.name,
      lat: ward.lat,
      lng: ward.lng,
      area,
      unitCost,
      tiv,
      depth100,
      loss100: tiv * damageRatio(cls, depth100),
    });
  }
  return lines;
}

