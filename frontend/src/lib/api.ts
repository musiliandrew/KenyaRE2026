// Typed API client for the Kenya Re CAT backend (FastAPI).
// Single source of truth for every network call - no component should call fetch() directly.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export type RP = "5y" | "10y" | "25y" | "50y" | "100y";
export type HousingClass = "informal_iron_sheet" | "semi_permanent" | "permanent_masonry" | "concrete_rcc";

export const RP_LIST: { rp: RP; years: number; label: string; short: string }[] = [
  { rp: "5y", years: 5, label: "Common", short: "5-Yr" },
  { rp: "10y", years: 10, label: "Occasional", short: "10-Yr" },
  { rp: "25y", years: 25, label: "Moderate", short: "25-Yr" },
  { rp: "50y", years: 50, label: "Severe", short: "50-Yr" },
  { rp: "100y", years: 100, label: "Extreme", short: "100-Yr" },
];

export const CLASS_LABEL: Record<HousingClass, string> = {
  informal_iron_sheet: "Informal Iron Sheet",
  semi_permanent: "Semi-Permanent",
  permanent_masonry: "Permanent Masonry",
  concrete_rcc: "Concrete RCC",
};

// ---------- Response types (mirror backend/app/models/schemas.py) ----------
export interface ReturnPeriodMetric {
  return_period: RP;
  years: number;
  annual_prob: number;
  portfolio_loss_kes: number;
  loss_ratio: number;
  pml_90: number;
  ai_adjusted_loss: number | null;
  ai_delta_kes: number | null;
}

export interface EPCurveResponse {
  metrics: ReturnPeriodMetric[];
  total_tiv_kes: number;
  aal_kes: number;
  baseline_aal_kes: number | null;
  ai_enabled: boolean;
}

export interface PortfolioSummary {
  tiv_kes: number;
  event_loss_kes: number;
  aal_kes: number;
  asset_count: number;
  active_rp: string;
  hotspot_count: number;
  pml_100y_kes: number;
  loss_ratio: number;
  synthetic_notice: string;
}

export interface ExposureAsset {
  loc_id: string;
  name?: string;
  lat: number;
  lon: number;
  ward: string;
  housing_class: HousingClass;
  floor_area_m2: number;
  cost_per_m2_kes: number;
  tiv_kes: number;
  synthetic: boolean;
  hazard_score: number;
  depth_m: number;
  tier_label: string;
  damage_ratio: number;
  loss_kes: number;
  risk_level: "low" | "mid" | "high";
  lng?: number;
  dataset_id?: string;
  dataset_name?: string;
  source_file?: string;
}

export interface AssetsResponse {
  total: number;
  offset: number;
  returned: number;
  return_period: RP;
  assets: ExposureAsset[];
}

export interface ExposureStats {
  asset_count: number;
  total_tiv_kes: number;
  average_tiv_kes: number;
  median_tiv_kes: number;
  distribution_by_class: Record<HousingClass, { count: number; tiv_kes: number; tiv_percentage: number }>;
  top_wards_by_asset_count: Record<string, number>;
  synthetic_notice: string;
}

export interface Hotspot {
  name: string;
  lat: number;
  lon: number;
  hazard_score: number;
  depth_m: number;
  tier_label: string;
  status: string;
}

export interface HazardGrid {
  return_period: RP;
  cell_size_deg: number;
  count: number;
  cells: { lat: number; lon: number; score: number; depth_m: number }[];
}

export interface CurvePoint { depth_m: number; damage_ratio: number; damage_ratio_pct: number }
export interface CurveParams {
  label: string; cap: number; k: number; midpoint: number; threshold_m: number;
  jrc_reference: string; typical_costs_sqm: string; description: string;
}
export interface VulnerabilityCurves {
  curves: Record<HousingClass, CurvePoint[]>;
  parameters: Record<HousingClass, CurveParams>;
}

export interface RunModelResponse {
  scenario: RP;
  total_tiv_kes: number;
  portfolio_loss_kes: number;
  loss_ratio: number;
  aal_kes: number;
  asset_count: number;
  ai_enabled: boolean;
  ai_delta_kes: number | null;
  aal_ai_delta_kes: number | null;
  loss_by_class: Record<string, number>;
  loss_by_ward: Record<string, number>;
  top_losses: Record<string, unknown>[];
  ep_curve: ReturnPeriodMetric[];
  source: string;
}

export interface XoLRequest { attachment_kes: number; limit_kes: number; share_pct?: number; apply_ai_drainage?: boolean }
export interface XoLResponse {
  layer_name: string; attachment_kes: number; limit_kes: number; share_pct: number;
  layer_aal_kes: number; rate_on_line_pct: number; technical_pure_premium_kes: number;
  recommended_treaty_premium_kes: number; layer_event_outcomes: Record<string, unknown>[];
}

export interface FacultativeRequest { tiv_kes: number; lat: number; lng: number; housing_class: HousingClass; deductible_pct?: number }
export interface FacultativeResponse {
  tiv_kes: number; lat: number; lon: number; housing_class: string; deductible_pct: number; deductible_kes: number;
  asset_aal_gross_kes: number; asset_aal_insured_kes: number; pure_rate_pct: number;
  recommended_technical_rate_pct: number; recommended_annual_premium_kes: number;
  depth_100y_m: number; insured_loss_100y_kes: number;
}

export interface ParseSlipResponse {
  extracted_structures: number; housing_class: string; location: string; total_area_sqm: number;
  estimated_tiv_kes: number; hazard_tier: string; estimated_depth_m: number; damage_ratio: number;
  recommended_premium_kes: number; technical_rate_pct: number; summary: string;
  parsed_assets: Record<string, unknown>[] | null;
}

export interface BriefingRequest { scenario: RP; portfolio_loss_kes: number; loss_ratio: number; key_hotspots: string[]; ai_enabled?: boolean }
export interface BriefingResponse { briefing: string; executive_summary: string; key_findings: string[]; recommendations: string[]; disclaimer: string }

// ---------- Core request helper ----------
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    signal,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try { detail = JSON.stringify((await res.json()).detail ?? detail); } catch { /* ignore */ }
    throw new ApiError(res.status, `${res.status} ${path}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

const qs = (p: Record<string, string | number | boolean | undefined>) => {
  const q = Object.entries(p).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return q.length ? `?${q.join("&")}` : "";
};

// ---------- Endpoints ----------
export const api = {
  health: (s?: AbortSignal) => request<{ status: string }>("/health", undefined, s),

  // Hazard
  hazardLookup: (lat: number, lng: number, rp: RP, s?: AbortSignal) =>
    request<{ lat: number; lng: number; return_period: string; hazard_score: number; depth_m: number; tier_label: string }>(
      "/hazard/lookup", { method: "POST", body: JSON.stringify({ lat, lng, return_period: rp }) }, s),
  hazardHotspots: (rp: RP, s?: AbortSignal) => request<Hotspot[]>(`/hazard/hotspots${qs({ return_period: rp })}`, undefined, s),
  hazardGrid: (rp: RP, step = 12, s?: AbortSignal) => request<HazardGrid>(`/hazard/grid${qs({ return_period: rp, step })}`, undefined, s),

  // Vulnerability
  vulnerabilityCurves: (maxDepth = 4, step = 0.1, s?: AbortSignal) =>
    request<VulnerabilityCurves>(`/vulnerability/curves${qs({ max_depth_m: maxDepth, step_m: step })}`, undefined, s),
  vulnerabilityCalc: (tiv_kes: number, depth_m: number, housing_class: HousingClass) =>
    request<{ damage_ratio: number; loss_kes: number; damage_cap_pct: number }>(
      "/vulnerability/calculate", { method: "POST", body: JSON.stringify({ tiv_kes, depth_m, housing_class }) }),

  // Exposure
  exposureAssets: (rp: RP, opts: { limit?: number; offset?: number; ward?: string; housing_class?: HousingClass } = {}, s?: AbortSignal) =>
    request<AssetsResponse>(`/exposure/assets${qs({ return_period: rp, limit: 1000, ...opts })}`, undefined, s),
  assets: (limit = 600, s?: AbortSignal) =>
    request<AssetsResponse>(`/exposure/assets${qs({ return_period: "25y", limit })}`, undefined, s),
  exposureStats: (s?: AbortSignal) => request<ExposureStats>("/exposure/stats", undefined, s),
  portfolioSummary: (rp: RP, s?: AbortSignal) => request<PortfolioSummary>(`/portfolio/summary${qs({ return_period: rp })}`, undefined, s),
  summary: (rp: RP = "25y", s?: AbortSignal) => request<PortfolioSummary>(`/portfolio/summary${qs({ return_period: rp })}`, undefined, s),
  portfolioUpload: (assets: Record<string, unknown>[], source = "upload") =>
    request<{ message: string; valid_count: number; rejected_count: number; errors: string[]; total_tiv_kes: number }>(
      "/portfolio/upload", { method: "POST", body: JSON.stringify({ assets, source }) }),

  // Financial
  epCurve: (ai: boolean, s?: AbortSignal) => request<EPCurveResponse>(`/curves/ep${qs({ ai_enabled: ai })}`, undefined, s),
  runModel: (scenario: RP, apply_ai: boolean, exposure?: Record<string, unknown>[], s?: AbortSignal) =>
    request<RunModelResponse>("/model/run", { method: "POST", body: JSON.stringify({ scenario, apply_ai, exposure }) }, s),
  priceXol: (body: XoLRequest) => request<XoLResponse>("/reinsurance/xol", { method: "POST", body: JSON.stringify(body) }),
  quoteFacultative: (body: FacultativeRequest) => request<FacultativeResponse>("/quotes/facultative", { method: "POST", body: JSON.stringify(body) }),

  // AI
  parseSlip: (text: string) => request<ParseSlipResponse>("/ai/parse-slip", { method: "POST", body: JSON.stringify({ text }) }),
  ingestFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/api/ai/ingest-file`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "File ingestion failed" }));
      throw new Error(err.detail || `Upload failed with status ${res.status}`);
    }
    return res.json() as Promise<{
      file_name: string;
      file_type: string;
      method: "tabular_csv" | "unstructured_nlp";
      extracted_text_preview: string;
      extracted_structures: number;
      housing_class: HousingClass;
      location: string;
      total_area_sqm: number;
      estimated_tiv_kes: number;
      summary?: string;
      parsed_assets: Array<{
        id: string;
        name: string;
        lat: number;
        lng: number;
        housing_class: HousingClass;
        area_sqm: number;
        tiv_kes: number;
        ward: string;
      }>;
    }>;
  },
  briefing: (body: BriefingRequest) => request<BriefingResponse>("/ai/briefing", { method: "POST", body: JSON.stringify(body) }),
  /** Streams the copilot reply token-by-token; calls onToken for each chunk. */
  chatStream: async (message: string, onToken: (t: string) => void, history?: { role: string; content: string }[], signal?: AbortSignal) => {
    const res = await fetch(`${API_URL}/api/ai/chat/stream`, {
      method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, history }),
    });
    if (!res.ok || !res.body) throw new ApiError(res.status, `chat stream failed (${res.status})`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      onToken(dec.decode(value, { stream: true }));
    }
  },
  assetDossier: (locId: string, rp: RP = "100y", s?: AbortSignal) =>
    request<AssetDossierResponse>(`/exposure/asset/${encodeURIComponent(locId)}${qs({ return_period: rp })}`, undefined, s),
  calculateAssetDossier: (payload: { asset: any; return_period?: RP; portfolio_assets?: any[] }, s?: AbortSignal) =>
    request<AssetDossierResponse>("/exposure/asset/dossier", { method: "POST", body: JSON.stringify(payload) }, s),
};

export interface AssetDossierResponse {
  asset: {
    loc_id: string;
    name: string;
    ward: string;
    lat: number;
    lon: number;
    housing_class: HousingClass;
    housing_class_label: string;
    floor_area_m2: number;
    tiv_kes: number;
    depth_m: number;
    damage_ratio: number;
    damage_ratio_pct: number;
    loss_kes: number;
    risk_level: string;
    active_rp: string;
    source_file?: string;
  };
  financial_summary: {
    tiv_kes: number;
    active_loss_kes: number;
    damage_ratio_pct: number;
    aal_gross_kes: number;
    pure_risk_rate_pct: number;
    recommended_premium_kes: number;
    recommended_deductible_pct: number;
    tiv_share_pct: number;
    loss_share_pct: number;
  };
  exceedance_probability_curve: Array<{
    return_period: string;
    years: number;
    annual_exceedance_prob: number;
    label: string;
    depth_m: number;
    damage_ratio: number;
    damage_ratio_pct: number;
    loss_kes: number;
    deductible_kes: number;
    insured_loss_kes: number;
  }>;
  vulnerability_curve: {
    housing_class: HousingClass;
    label: string;
    parameters: {
      cap: number;
      cap_pct: number;
      k: number;
      midpoint: number;
      threshold_m: number;
      jrc_reference: string;
      typical_costs_sqm: string;
      description: string;
    };
    points: Array<{ depth_m: number; damage_ratio: number; damage_ratio_pct: number }>;
    active_operating_point: {
      depth_m: number;
      damage_ratio: number;
      damage_ratio_pct: number;
    };
  };
  top_exposed_locations: Array<{
    loc_id: string;
    name: string;
    ward: string;
    housing_class: string;
    tiv_kes: number;
    depth_m: number;
    loss_kes: number;
    damage_ratio: number;
  }>;
}

// ---------- Formatting helpers (pure UI, no data) ----------
export function formatKES(v: number, digits = 1): string {
  const a = Math.abs(v);
  if (a >= 1e9) return `KES ${(v / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `KES ${(v / 1e6).toFixed(digits)}M`;
  if (a >= 1e3) return `KES ${(v / 1e3).toFixed(0)}K`;
  return `KES ${v.toFixed(0)}`;
}
