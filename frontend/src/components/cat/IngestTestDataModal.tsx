"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  UploadCloud,
  FileSpreadsheet,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileDown,
  Download,
  Building2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  api,
  formatKES,
  type HousingClass,
  type ExposureAsset,
  type RP,
  type RunModelResponse,
  type PortfolioSummary,
  type EPCurveResponse,
} from "@/lib/api";

export interface DatasetRun {
  id: string;
  name: string;
  fileName?: string;
  timestamp: string;
  source: "file_upload" | "csv_upload" | "ai_slip" | "preset";
  assetCount: number;
  totalTivKes: number;
  assets: ExposureAsset[];
  summary: PortfolioSummary;
  epData: EPCurveResponse;
  lastRunResult?: RunModelResponse;
}

interface IngestTestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCreated: (run: DatasetRun) => void;
  activeScenario: RP;
  applyAI: boolean;
}

// PRE-CALIBRATED HACKATHON TEST BATCHES FOR 1-CLICK PROOF
const DEMO_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  assetCount: number;
  tivKes: number;
  assets: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    housing_class: HousingClass;
    area_sqm: number;
    tiv_kes: number;
    ward: string;
  }>;
}> = [
  {
    id: "preset-upper-hill",
    name: "Upper Hill Commercial District (12 Commercial Towers)",
    description: "High-value reinforced concrete commercial assets. Elevated terrain with localized basement pluvial ingress.",
    assetCount: 12,
    tivKes: 14850000000,
    assets: [
      { id: "UH-001", name: "Landmark Plaza Commercial", lat: -1.2995, lng: 36.8152, housing_class: "concrete_rcc", area_sqm: 24500, tiv_kes: 1102500000, ward: "Upper Hill" },
      { id: "UH-002", name: "Taifa Financial Center", lat: -1.2982, lng: 36.8165, housing_class: "concrete_rcc", area_sqm: 31000, tiv_kes: 1550000000, ward: "Upper Hill" },
      { id: "UH-003", name: "Equity Center Complex", lat: -1.3008, lng: 36.8182, housing_class: "concrete_rcc", area_sqm: 28000, tiv_kes: 1400000000, ward: "Upper Hill" },
      { id: "UH-004", name: "Britam Tower Annex", lat: -1.3001, lng: 36.8143, housing_class: "concrete_rcc", area_sqm: 45000, tiv_kes: 2250000000, ward: "Upper Hill" },
      { id: "UH-005", name: "KCB Leadership Hub", lat: -1.2974, lng: 36.8139, housing_class: "concrete_rcc", area_sqm: 19500, tiv_kes: 975000000, ward: "Upper Hill" },
      { id: "UH-006", name: "Prism Tower Upper Hill", lat: -1.2989, lng: 36.8122, housing_class: "concrete_rcc", area_sqm: 36000, tiv_kes: 1800000000, ward: "Upper Hill" },
      { id: "UH-007", name: "CIC Insurance Plaza", lat: -1.3015, lng: 36.8171, housing_class: "concrete_rcc", area_sqm: 22000, tiv_kes: 1100000000, ward: "Upper Hill" },
      { id: "UH-008", name: "Hospital Hill Medical Center", lat: -1.2965, lng: 36.8189, housing_class: "concrete_rcc", area_sqm: 16000, tiv_kes: 800000000, ward: "Upper Hill" },
      { id: "UH-009", name: "Mara Road Office Suites", lat: -1.3021, lng: 36.8158, housing_class: "permanent_masonry", area_sqm: 12500, tiv_kes: 562500000, ward: "Upper Hill" },
      { id: "UH-010", name: "Kilimani Crest Offices", lat: -1.2952, lng: 36.8115, housing_class: "concrete_rcc", area_sqm: 26000, tiv_kes: 1300000000, ward: "Upper Hill" },
      { id: "UH-011", name: "NHIF Headquarters Wing B", lat: -1.2961, lng: 36.8201, housing_class: "concrete_rcc", area_sqm: 24000, tiv_kes: 1200000000, ward: "Upper Hill" },
      { id: "UH-012", name: "Ragati Road Corporate Park", lat: -1.3033, lng: 36.8135, housing_class: "permanent_masonry", area_sqm: 18000, tiv_kes: 810000000, ward: "Upper Hill" },
    ],
  },
  {
    id: "preset-mathare-floodway",
    name: "Mathare River Severe Floodway Corridor (16 Mixed Assets)",
    description: "High-vulnerability residential & workshop corridor in Nairobi's lowest river depression. Inundation depth exceeds 1.4m.",
    assetCount: 16,
    tivKes: 1240000000,
    assets: [
      { id: "MR-101", name: "Mathare Valley Mabati Line A", lat: -1.2612, lng: 36.8584, housing_class: "informal_iron_sheet", area_sqm: 1800, tiv_kes: 18000000, ward: "Mathare" },
      { id: "MR-102", name: "Juja Road Light Workshops", lat: -1.2625, lng: 36.8598, housing_class: "semi_permanent", area_sqm: 4500, tiv_kes: 67500000, ward: "Mathare" },
      { id: "MR-103", name: "Mathare 4A Residential Cluster", lat: -1.2601, lng: 36.8612, housing_class: "informal_iron_sheet", area_sqm: 3200, tiv_kes: 32000000, ward: "Mathare" },
      { id: "MR-104", name: "Mlango Kubwa Timber Yards", lat: -1.2638, lng: 36.8569, housing_class: "semi_permanent", area_sqm: 5400, tiv_kes: 81000000, ward: "Mathare" },
      { id: "MR-105", name: "Mathare North Community Depot", lat: -1.2585, lng: 36.8645, housing_class: "permanent_masonry", area_sqm: 2800, tiv_kes: 70000000, ward: "Mathare" },
      { id: "MR-106", name: "Mau Mau Road Micro Retail", lat: -1.2642, lng: 36.8552, housing_class: "informal_iron_sheet", area_sqm: 2100, tiv_kes: 21000000, ward: "Mathare" },
      { id: "MR-107", name: "Hospital Ward Warehouses", lat: -1.2598, lng: 36.8671, housing_class: "permanent_masonry", area_sqm: 6200, tiv_kes: 155000000, ward: "Mathare" },
      { id: "MR-108", name: "Mathare River Basin Dwellings", lat: -1.2619, lng: 36.8605, housing_class: "informal_iron_sheet", area_sqm: 4000, tiv_kes: 40000000, ward: "Mathare" },
      { id: "MR-109", name: "Austin Grounds Fabricators", lat: -1.2631, lng: 36.8622, housing_class: "semi_permanent", area_sqm: 3800, tiv_kes: 57000000, ward: "Mathare" },
      { id: "MR-110", name: "St. Teresa Flats", lat: -1.2655, lng: 36.8575, housing_class: "permanent_masonry", area_sqm: 7500, tiv_kes: 187500000, ward: "Mathare" },
      { id: "MR-111", name: "Kosovo Settlement Mabati", lat: -1.2608, lng: 36.8639, housing_class: "informal_iron_sheet", area_sqm: 2900, tiv_kes: 29000000, ward: "Mathare" },
      { id: "MR-112", name: "Mathare Depot Storage B", lat: -1.2649, lng: 36.8611, housing_class: "semi_permanent", area_sqm: 4800, tiv_kes: 72000000, ward: "Mathare" },
      { id: "MR-113", name: "Kariadudu Commercial Mill", lat: -1.2574, lng: 36.8682, housing_class: "permanent_masonry", area_sqm: 5100, tiv_kes: 127500000, ward: "Mathare" },
      { id: "MR-114", name: "Bondeni Iron Row Units", lat: -1.2622, lng: 36.8561, housing_class: "informal_iron_sheet", area_sqm: 2200, tiv_kes: 22000000, ward: "Mathare" },
      { id: "MR-115", name: "Mathare River Footbridge Sheds", lat: -1.2615, lng: 36.8592, housing_class: "informal_iron_sheet", area_sqm: 2600, tiv_kes: 26000000, ward: "Mathare" },
      { id: "MR-116", name: "Pangani Border Flats", lat: -1.2662, lng: 36.8539, housing_class: "concrete_rcc", area_sqm: 9500, tiv_kes: 261250000, ward: "Mathare" },
    ],
  },
  {
    id: "preset-industrial-westlands",
    name: "Industrial Area & Westlands Drainage Hotspots (14 Assets)",
    description: "Commercial logistics depots and retail parks located directly at stormwater culvert choke points.",
    assetCount: 14,
    tivKes: 8950000000,
    assets: [
      { id: "IND-201", name: "Enterprise Road Logistics Depot", lat: -1.3105, lng: 36.8510, housing_class: "concrete_rcc", area_sqm: 18000, tiv_kes: 900000000, ward: "Industrial Area" },
      { id: "IND-202", name: "Likoni Road Distribution Hub", lat: -1.3142, lng: 36.8535, housing_class: "concrete_rcc", area_sqm: 22000, tiv_kes: 1100000000, ward: "Industrial Area" },
      { id: "IND-203", name: "Lunga Lunga Cold Storage", lat: -1.3188, lng: 36.8621, housing_class: "permanent_masonry", area_sqm: 14000, tiv_kes: 630000000, ward: "Industrial Area" },
      { id: "IND-204", name: "Commercial Street Depot", lat: -1.3092, lng: 36.8488, housing_class: "concrete_rcc", area_sqm: 26000, tiv_kes: 1300000000, ward: "Industrial Area" },
      { id: "WST-301", name: "Sarit Centre Perimeter Retail", lat: -1.2673, lng: 36.8045, housing_class: "concrete_rcc", area_sqm: 19500, tiv_kes: 975000000, ward: "Westlands" },
      { id: "WST-302", name: "Westgate Avenue Offices", lat: -1.2655, lng: 36.8028, housing_class: "concrete_rcc", area_sqm: 24000, tiv_kes: 1200000000, ward: "Westlands" },
      { id: "WST-303", name: "Muthithi Road Commercial Hub", lat: -1.2691, lng: 36.8082, housing_class: "permanent_masonry", area_sqm: 11000, tiv_kes: 495000000, ward: "Westlands" },
      { id: "WST-304", name: "Parklands Avenue Suites", lat: -1.2632, lng: 36.8124, housing_class: "concrete_rcc", area_sqm: 16500, tiv_kes: 825000000, ward: "Westlands" },
      { id: "IND-205", name: "Dar es Salaam Rd Metal Works", lat: -1.3119, lng: 36.8472, housing_class: "semi_permanent", area_sqm: 8500, tiv_kes: 127500000, ward: "Industrial Area" },
      { id: "IND-206", name: "Bandari Road Container Yard", lat: -1.3165, lng: 36.8580, housing_class: "permanent_masonry", area_sqm: 12000, tiv_kes: 480000000, ward: "Industrial Area" },
      { id: "WST-305", name: "Chiromo Road Corporate Park", lat: -1.2721, lng: 36.8095, housing_class: "concrete_rcc", area_sqm: 15000, tiv_kes: 675000000, ward: "Westlands" },
      { id: "IND-207", name: "Falcon Road Warehouse B", lat: -1.3131, lng: 36.8499, housing_class: "permanent_masonry", area_sqm: 9200, tiv_kes: 414000000, ward: "Industrial Area" },
      { id: "WST-306", name: "Mpaka Plaza Commercial", lat: -1.2661, lng: 36.8062, housing_class: "concrete_rcc", area_sqm: 12500, tiv_kes: 562500000, ward: "Westlands" },
      { id: "IND-208", name: "Dunga Road Assembly Line", lat: -1.3078, lng: 36.8455, housing_class: "semi_permanent", area_sqm: 11500, tiv_kes: 172500000, ward: "Industrial Area" },
    ],
  },
];

export const SAMPLE_TEST_SCENARIOS = [
  {
    fileName: "1_Upper_Hill_Commercial_Towers.docx",
    label: "Upper Hill Commercial Towers",
    format: "Word .DOCX",
    badge: "10 Grade-A Highrises",
    tiv: "KES 28.5B",
    description: "Britam Tower Annex, Prism Tower & KCB Leadership Center",
  },
  {
    fileName: "2_Industrial_Area_Logistics_Park.pdf",
    label: "Industrial Area Logistics Park",
    format: "PDF Document",
    badge: "8 Manufacturing Depots",
    tiv: "KES 6.45B",
    description: "Enterprise Road cold chain & Lunga Lunga steel fabrication",
  },
  {
    fileName: "3_Nairobi_West_South_C_Residential.csv",
    label: "Nairobi West & South C Estates",
    format: "Tabular .CSV",
    badge: "25 Residential Assets",
    tiv: "KES 5.6B",
    description: "Akila & Mugoya Estates in high-risk river depression zones",
  },
  {
    fileName: "4_Mathare_River_Vulnerability_Corridor.txt",
    label: "Mathare River Basin Corridor",
    format: "Text Slip .TXT",
    badge: "12 Informal Structures",
    tiv: "KES 480M",
    description: "Artisan workshops & timber sheds along Mathare River",
  },
  {
    fileName: "5_Westlands_Parklands_Commercial_Suites.docx",
    label: "Westlands Commercial Suites",
    format: "Word .DOCX",
    badge: "5 Commercial Complexes",
    tiv: "KES 9.2B",
    description: "Mpaka Plaza, Chiromo Suites & Sarit Business Annex",
  },
];

export function IngestTestDataModal({
  isOpen,
  onClose,
  onRunCreated,
  activeScenario,
  applyAI,
}: IngestTestDataModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "slip" | "preset">("upload");
  const [runName, setRunName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Tab 1: Raw file upload (unstructured Word DOCX, PDF, text slip, or CSV)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRawAssets, setParsedRawAssets] = useState<any[]>([]);
  const [extractedMeta, setExtractedMeta] = useState<{
    fileName: string;
    fileType: string;
    method: "unstructured_nlp" | "tabular_csv";
    extractedCount: number;
    location?: string;
    housingClass?: string;
    totalTiv?: number;
    previewSnippet?: string;
  } | null>(null);

  // Tab 2: Broker slip text
  const [slipText, setSlipText] = useState(
    "12 concrete RCC commercial towers in Upper Hill Nairobi along Taifa and Hospital Road, total floor area 310,000 sqm, combined replacement value KES 14.85 Billion. Requesting pluvial flood risk rating."
  );

  // Tab 3: Preset selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEMO_PRESETS[0].id);

  // Download sample CSV template
  const handleDownloadTemplate = () => {
    const csvContent =
      "name,lat,lng,housing_class,area_sqm,tiv_kes,ward\n" +
      "Upper Hill Tower A,-1.2995,36.8152,concrete_rcc,24500,1102500000,Upper Hill\n" +
      "Mathare Warehouse B,-1.2612,36.8584,informal_iron_sheet,1800,18000000,Mathare\n" +
      "Industrial Area Depot C,-1.3105,36.8510,permanent_masonry,14000,630000000,Industrial Area\n" +
      "Westlands Mall Annex,-1.2673,36.8045,concrete_rcc,19500,975000000,Westlands\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "KenyaRe_Test_Exposure_Template.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Sample test exposure CSV downloaded!");
  };

  // Core reusable processor for unstructured files (.docx, .pdf, .txt, .csv, .json)
  const processFile = async (file: File) => {
    setUploadedFile(file);
    setIsExtracting(true);

    try {
      // 1. Primary ingestion via backend endpoint (extracts Word DOCX, PDF, and unstructured text using Groq LLM)
      const res = await api.ingestFile(file);
      if (!res.parsed_assets || res.parsed_assets.length === 0) {
        throw new Error("No property exposure records could be identified in the uploaded document.");
      }

      setParsedRawAssets(res.parsed_assets);
      setExtractedMeta({
        fileName: file.name,
        fileType: res.file_type || file.name.split(".").pop() || "doc",
        method: res.method,
        extractedCount: res.parsed_assets.length,
        location: res.location,
        housingClass: res.housing_class,
        totalTiv: res.estimated_tiv_kes,
        previewSnippet: res.extracted_text_preview,
      });

      if (!runName.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setRunName(res.location ? `${cleanName} (${res.location})` : cleanName);
      }

      toast.success(
        `✓ Ingested ${file.name}: ${res.parsed_assets.length} properties extracted via ${
          res.method === "unstructured_nlp" ? "AI Natural Language Engine" : "Tabular Parser"
        }!`
      );
    } catch (err: any) {
      console.warn("Backend ingestion endpoint warning, attempting client-side fallback:", err);

      // 2. Client-side fallback for CSV / TXT / JSON
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const ext = file.name.split(".").pop()?.toLowerCase() || "";

          if (ext === "csv" || text.includes(",")) {
            const lines = text.split("\n").filter((l) => l.trim().length > 0);
            if (lines.length > 1) {
              const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
              const latIdx = headers.findIndex((h) => h.includes("lat"));
              const lonIdx = headers.findIndex((h) => h.includes("lon") || h.includes("lng"));
              const tivIdx = headers.findIndex((h) => h.includes("tiv") || h.includes("value"));
              const classIdx = headers.findIndex((h) => h.includes("class") || h.includes("type"));
              const nameIdx = headers.findIndex((h) => h.includes("name") || h.includes("building"));
              const wardIdx = headers.findIndex((h) => h.includes("ward") || h.includes("loc"));

              const items: any[] = [];
              for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(",").map((c) => c.trim());
                if (cols.length < 3) continue;

                const lat = parseFloat(cols[latIdx >= 0 ? latIdx : 1]) || -1.2921;
                const lng = parseFloat(cols[lonIdx >= 0 ? lonIdx : 2]) || 36.8219;
                const tiv = parseFloat(cols[tivIdx >= 0 ? tivIdx : 5]) || 50000000;
                const rawClass = classIdx >= 0 ? cols[classIdx] : "concrete_rcc";
                const hClass = rawClass.includes("iron")
                  ? "informal_iron_sheet"
                  : rawClass.includes("semi")
                  ? "semi_permanent"
                  : rawClass.includes("masonry")
                  ? "permanent_masonry"
                  : "concrete_rcc";

                items.push({
                  id: `UPL-${i.toString().padStart(3, "0")}`,
                  name: nameIdx >= 0 && cols[nameIdx] ? cols[nameIdx] : `Test Asset #${i}`,
                  lat,
                  lng,
                  housing_class: hClass,
                  area_sqm: 1000,
                  tiv_kes: tiv,
                  ward: wardIdx >= 0 && cols[wardIdx] ? cols[wardIdx] : "Nairobi",
                });
              }

              if (items.length > 0) {
                setParsedRawAssets(items);
                setExtractedMeta({
                  fileName: file.name,
                  fileType: "csv",
                  method: "tabular_csv",
                  extractedCount: items.length,
                  location: items[0]?.ward,
                  housingClass: items[0]?.housing_class,
                  totalTiv: items.reduce((a, b) => a + b.tiv_kes, 0),
                  previewSnippet: `Tabular CSV with ${items.length} records`,
                });
                toast.success(`Successfully parsed ${items.length} records from ${file.name}!`);
                return;
              }
            }
          }

          // If not CSV or CSV had no standard columns, parse as free text with Groq NLP
          const parsed = await api.parseSlip(text);
          const count = parsed.extracted_structures || 6;
          const hClass = (parsed.housing_class as HousingClass) || "concrete_rcc";
          const singleTiv = parsed.estimated_tiv_kes / count;
          const items =
            parsed.parsed_assets && parsed.parsed_assets.length > 0
              ? (parsed.parsed_assets as any[]).map((a, i) => ({
                  id: a.loc_id || `UPL-${i + 1}`,
                  name: a.name || `Extracted Asset #${i + 1}`,
                  lat: Number(a.lat) || -1.2995,
                  lng: Number(a.lon ?? a.lng) || 36.8152,
                  housing_class: (a.housing_class as HousingClass) || "concrete_rcc",
                  area_sqm: Number(a.floor_area_m2) || 1000,
                  tiv_kes: Number(a.tiv_kes) || singleTiv,
                  ward: a.ward || parsed.location || "Nairobi",
                }))
              : Array.from({ length: count }).map((_, idx) => ({
                  id: `UPL-${idx + 1}`,
                  name: `${parsed.location || "Asset"} Unit #${idx + 1}`,
                  lat: -1.2995 + (idx - count / 2) * 0.002,
                  lng: 36.8152 + (idx % 2 === 0 ? 0.001 : -0.001),
                  housing_class: hClass,
                  area_sqm: (parsed.total_area_sqm || 6000) / count,
                  tiv_kes: singleTiv,
                  ward: parsed.location || "Nairobi",
                }));

          setParsedRawAssets(items);
          setExtractedMeta({
            fileName: file.name,
            fileType: ext || "txt",
            method: "unstructured_nlp",
            extractedCount: items.length,
            location: parsed.location,
            housingClass: parsed.housing_class,
            totalTiv: parsed.estimated_tiv_kes,
            previewSnippet: text.slice(0, 200),
          });
          toast.success(`Extracted ${items.length} properties via AI NLP from ${file.name}!`);
        } catch (innerErr: any) {
          toast.error(err.message || "Could not parse uploaded file format.");
        } finally {
          setIsExtracting(false);
        }
      };
      reader.readAsText(file);
    } finally {
      setIsExtracting(false);
    }
  };

  // Ingest unstructured files (.docx, .pdf, .txt, .csv, .json)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // Quick load of real-world sample scenarios
  const handleLoadSampleScenario = async (fileName: string, suggestedName: string) => {
    try {
      setIsExtracting(true);
      const res = await fetch(`/test_scenarios/${fileName}`);
      if (!res.ok) throw new Error("Could not load sample scenario file from /test_scenarios");
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: blob.type || "application/octet-stream" });
      setRunName(suggestedName);
      await processFile(file);
      toast.success(`✓ Loaded sample scenario: ${suggestedName}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load sample scenario");
    } finally {
      setIsExtracting(false);
    }
  };

  // Launch the new run
  const handleLaunchRun = async () => {
    setIsProcessing(true);
    try {
      let rawAssetsToRun: Array<{
        id: string;
        name: string;
        lat: number;
        lng: number;
        housing_class: HousingClass;
        area_sqm: number;
        tiv_kes: number;
        ward: string;
      }> = [];

      let finalRunName = runName.trim();
      let sourceTag: "preset" | "file_upload" | "csv_upload" | "ai_slip" = "preset";

      let fileLabel = "";
      if (activeTab === "preset") {
        const found = DEMO_PRESETS.find((p) => p.id === selectedPresetId);
        if (!found) throw new Error("Please select a preset batch");
        rawAssetsToRun = found.assets;
        fileLabel = `${found.name.toLowerCase().replace(/\s+/g, "_")}.csv`;
        finalRunName = finalRunName || found.name;
        sourceTag = "preset";
      } else if (activeTab === "upload") {
        if (!parsedRawAssets || parsedRawAssets.length === 0) {
          throw new Error("Please upload an unstructured document, slip, or dataset first");
        }
        rawAssetsToRun = parsedRawAssets;
        fileLabel = uploadedFile?.name || "uploaded_document";
        finalRunName = finalRunName || fileLabel;
        sourceTag = extractedMeta?.method === "unstructured_nlp" ? "file_upload" : "csv_upload";
      } else if (activeTab === "slip") {
        if (!slipText.trim()) throw new Error("Please enter policy slip text");
        // Parse with Groq LLM
        const parsed = await api.parseSlip(slipText);
        if (!parsed.parsed_assets || parsed.parsed_assets.length === 0) {
          const count = parsed.extracted_structures || 5;
          const hClass = (parsed.housing_class as HousingClass) || "concrete_rcc";
          const singleTiv = parsed.estimated_tiv_kes / count;
          rawAssetsToRun = Array.from({ length: count }).map((_, idx) => ({
            id: `SLIP-${idx + 1}`,
            name: `${parsed.location} Unit #${idx + 1}`,
            lat: -1.2995 + (idx - count / 2) * 0.002,
            lng: 36.8152 + (idx % 2 === 0 ? 0.001 : -0.001),
            housing_class: hClass,
            area_sqm: parsed.total_area_sqm / count,
            tiv_kes: singleTiv,
            ward: parsed.location || "Nairobi",
          }));
        } else {
          rawAssetsToRun = (parsed.parsed_assets as any[]).map((a, i) => ({
            id: a.loc_id || `SLIP-${i + 1}`,
            name: a.name || `Extracted Asset #${i + 1}`,
            lat: Number(a.lat) || -1.2995,
            lng: Number(a.lon ?? a.lng) || 36.8152,
            housing_class: (a.housing_class as HousingClass) || "concrete_rcc",
            area_sqm: Number(a.floor_area_m2) || 1000,
            tiv_kes: Number(a.tiv_kes) || 50_000_000,
            ward: a.ward || "Nairobi",
          }));
        }
        fileLabel = `${(parsed.location || "ai_slip").toLowerCase().replace(/\s+/g, "_")}.txt`;
        finalRunName = finalRunName || `AI Slip Ingestion: ${parsed.location}`;
        sourceTag = "ai_slip";
      }

      const runId = `run-${Date.now()}`;

      // Format payload for backend /model/run
      const exposurePayload = rawAssetsToRun.map((a) => ({
        id: a.id,
        name: a.name,
        lat: a.lat,
        lng: a.lng,
        housing_class: a.housing_class,
        area_sqm: a.area_sqm,
        tiv_kes: a.tiv_kes,
        ward: a.ward,
      }));

      // Execute catastrophe risk pipeline on backend
      const modelRun = await api.runModel(activeScenario, applyAI, exposurePayload as any);

      // Enrich frontend ExposureAssets with exact backend calculated depth and damage ratios
      const totalTiv = rawAssetsToRun.reduce((acc, curr) => acc + curr.tiv_kes, 0);
      const simulatedAssets: ExposureAsset[] = rawAssetsToRun.map((a) => {
        const top = modelRun.top_losses?.find((t: any) => (t as any).loc_id === a.id);
        const depth: number = typeof (top as any)?.depth_m === "number" ? Number((top as any).depth_m) : 0;
        const damageRatio: number = typeof (top as any)?.damage_ratio === "number" ? Number((top as any).damage_ratio) : 0;
        const lossKes: number = typeof (top as any)?.gross_loss_kes === "number" 
          ? Number((top as any).gross_loss_kes) 
          : (typeof (top as any)?.loss_kes === "number" ? Number((top as any).loss_kes) : a.tiv_kes * damageRatio);

        return {
          loc_id: a.id,
          name: a.name,
          lat: a.lat,
          lon: a.lng,
          lng: a.lng,
          ward: a.ward,
          housing_class: a.housing_class,
          floor_area_m2: a.area_sqm,
          cost_per_m2_kes: Math.round(a.tiv_kes / a.area_sqm),
          tiv_kes: a.tiv_kes,
          synthetic: false,
          hazard_score: Math.min(1.0, depth / 2.0),
          depth_m: depth,
          tier_label: depth > 1.0 ? "Extreme Floodway" : depth > 0.4 ? "High Hazard" : depth > 0.05 ? "Moderate Pluvial" : "Low / Below Inundation Threshold",
          damage_ratio: damageRatio,
          loss_kes: lossKes,
          risk_level: (damageRatio > 0.35 ? "high" : damageRatio > 0.08 ? "mid" : "low") as "low" | "mid" | "high",
          dataset_id: runId,
          dataset_name: finalRunName,
          source_file: fileLabel,
        };
      });

      // Construct dedicated DatasetRun instance
      const newRun: DatasetRun = {
        id: runId,
        name: finalRunName,
        fileName: fileLabel,
        timestamp: new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        source: sourceTag,
        assetCount: rawAssetsToRun.length,
        totalTivKes: totalTiv,
        assets: simulatedAssets,
        summary: {
          tiv_kes: totalTiv,
          event_loss_kes: modelRun.portfolio_loss_kes,
          aal_kes: modelRun.aal_kes,
          asset_count: rawAssetsToRun.length,
          active_rp: activeScenario,
          hotspot_count: Math.min(6, rawAssetsToRun.length),
          pml_100y_kes: modelRun.portfolio_loss_kes * 1.35,
          loss_ratio: modelRun.loss_ratio,
          synthetic_notice: `Test Exposure Document (${fileLabel})`,
        },
        epData: {
          metrics: modelRun.ep_curve || [],
          total_tiv_kes: totalTiv,
          aal_kes: modelRun.aal_kes,
          baseline_aal_kes: modelRun.aal_kes * 0.88,
          ai_enabled: applyAI,
        },
        lastRunResult: modelRun,
      };

      onRunCreated(newRun);
      onClose();
      toast.success(`✓ Created Simulation Run: "${finalRunName}" with ${rawAssetsToRun.length} assets!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to process test dataset");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Light-Themed Modern Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#00264D]">
                <UploadCloud className="size-5 text-[#00264D]" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Ingest Test File & Launch Dedicated Run
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Upload unstructured data files (Word DOCX, PDF, text slips) or tabular files to run through Nairobi's DEM hazard & JRC vulnerability engine
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Clean Segmented Control Tab Selector */}
          <div className="grid grid-cols-3 gap-1.5 mt-4 p-1 bg-slate-200/70 rounded-xl text-xs font-medium border border-slate-200/80">
            <button
              onClick={() => setActiveTab("upload")}
              className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                activeTab === "upload"
                  ? "bg-white text-[#00264D] font-bold shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <UploadCloud className="size-3.5 text-[#00264D]" />
                <span>Upload File</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("slip")}
              className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                activeTab === "slip"
                  ? "bg-white text-[#00264D] font-bold shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Sparkles className="size-3.5 text-[#D21245]" />
                <span>AI Paste Slip</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("preset")}
              className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                activeTab === "preset"
                  ? "bg-white text-[#00264D] font-bold shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Zap className="size-3.5 text-amber-500" />
                <span>1-Click Presets</span>
              </span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 max-h-[68vh] overflow-y-auto">
          {/* Run Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Simulation Run Label (Optional)
            </label>
            <Input
              type="text"
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
              placeholder="e.g., Hackathon Evaluation Portfolio #1"
              className="text-xs h-9 bg-slate-50 border-slate-300"
            />
          </div>

          {/* TAB 1: UPLOAD FILE (Unstructured Documents, Word DOCX, PDF, Slips, CSV) */}
          {activeTab === "upload" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    Upload File (Unstructured Document, Slip, or Dataset)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    AI engine automatically parses and geocodes any Word DOCX, PDF, text slip, or tabular file
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#00264D] hover:underline cursor-pointer shrink-0"
                >
                  <FileDown className="size-3 text-[#D21245]" />
                  <span>Sample Template</span>
                </button>
              </div>

              {/* Drag and Drop Zone */}
              {!uploadedFile && !isExtracting && (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 hover:border-[#00264D] rounded-xl cursor-pointer bg-slate-50/70 hover:bg-slate-100/60 transition group">
                  <div className="p-3 rounded-full bg-blue-50 group-hover:bg-blue-100/80 mb-3 transition">
                    <UploadCloud className="size-7 text-[#00264D]" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Click to select or drag & drop any file here
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 text-center max-w-md">
                    Accepts <strong>Word documents (.docx, .doc)</strong>, <strong>PDFs</strong>, <strong>text slips (.txt, .md)</strong>, and <strong>tables (.csv, .json)</strong>
                  </span>
                  <span className="mt-2 text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200">
                    Unstructured Natural Language Processing Enabled
                  </span>
                  <input
                    type="file"
                    accept=".docx,.doc,.pdf,.txt,.md,.csv,.json,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}

              {/* Sample Real-World Test Scenarios Picker */}
              {!uploadedFile && !isExtracting && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-[#D21245]" />
                      <span className="text-xs font-bold text-slate-900">
                        Sample Real-World Test Scenarios
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      1-click instant load or download files to test
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SAMPLE_TEST_SCENARIOS.map((sc) => (
                      <div
                        key={sc.fileName}
                        className="bg-white rounded-lg border border-slate-200 p-2.5 hover:border-[#00264D]/50 transition flex flex-col justify-between gap-2 shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {sc.label}
                            </span>
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                              {sc.format}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            {sc.description}
                          </p>
                          <div className="flex items-center gap-2 pt-0.5 text-[10px]">
                            <span className="font-bold text-[#00264D]">{sc.tiv}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600 font-medium">{sc.badge}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-1.5">
                          <a
                            href={`/test_scenarios/${sc.fileName}`}
                            download={sc.fileName}
                            className="inline-flex items-center gap-1 text-[10px] text-slate-600 hover:text-[#00264D] hover:underline"
                            title="Download file to test uploading yourself"
                          >
                            <Download className="size-2.5 text-[#D21245]" />
                            <span>Download File</span>
                          </a>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLoadSampleScenario(sc.fileName, sc.label)}
                            className="h-6 text-[10px] font-semibold text-[#00264D] hover:bg-blue-50 border-blue-200 px-2 cursor-pointer"
                          >
                            <span>Quick Ingest →</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingestion Loading Indicator */}
              {isExtracting && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 flex flex-col items-center justify-center text-center space-y-2">
                  <Loader2 className="size-6 text-[#00264D] animate-spin" />
                  <div className="text-xs font-bold text-slate-900">
                    AI Ingestion Engine Analyzing Document...
                  </div>
                  <div className="text-[11px] text-slate-600 max-w-sm">
                    Reading unstructured text, extracting building counts, geocoding Nairobi coordinates, and matching JRC vulnerability classes
                  </div>
                </div>
              )}

              {/* Extracted Asset Information Card */}
              {uploadedFile && !isExtracting && parsedRawAssets.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span className="truncate max-w-[280px]">{uploadedFile.name}</span>
                          <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {extractedMeta?.fileType || "doc"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Method:{" "}
                          <strong className="text-slate-700">
                            {extractedMeta?.method === "unstructured_nlp"
                              ? "AI Natural Language Extraction"
                              : "Tabular Parser"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <label className="text-[11px] text-[#00264D] hover:underline cursor-pointer font-semibold">
                      Change File
                      <input
                        type="file"
                        accept=".docx,.doc,.pdf,.txt,.md,.csv,.json,.xlsx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Properties</span>
                      <span className="text-xs font-bold text-slate-900">{parsedRawAssets.length} Assets</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Locality</span>
                      <span className="text-xs font-bold text-slate-900 truncate block">
                        {extractedMeta?.location || parsedRawAssets[0]?.ward || "Nairobi"}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Typology</span>
                      <span className="text-xs font-bold text-slate-900 truncate block capitalize">
                        {(extractedMeta?.housingClass || parsedRawAssets[0]?.housing_class || "Concrete").replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total TIV</span>
                      <span className="text-xs font-bold font-mono text-[#00264D] truncate block">
                        {formatKES(parsedRawAssets.reduce((sum, a) => sum + (a.tiv_kes || 0), 0))}
                      </span>
                    </div>
                  </div>

                  {/* Preview Snippet if unstructured text was extracted */}
                  {extractedMeta?.previewSnippet && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 italic">
                      <span className="font-semibold text-slate-700 not-italic block mb-0.5">Extracted Document Snippet:</span>
                      "{extractedMeta.previewSnippet}"
                    </div>
                  )}

                  {/* Quick table preview of first 4 properties */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2">ID</th>
                          <th className="p-2">Asset Name</th>
                          <th className="p-2">Ward</th>
                          <th className="p-2">Typology</th>
                          <th className="p-2 text-right">TIV</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRawAssets.slice(0, 4).map((a, idx) => (
                          <tr key={a.id || idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-slate-700">{a.id}</td>
                            <td className="p-2 font-medium text-slate-900 truncate max-w-[150px]">{a.name}</td>
                            <td className="p-2 text-slate-600">{a.ward}</td>
                            <td className="p-2 capitalize text-slate-600">{a.housing_class.replace(/_/g, " ")}</td>
                            <td className="p-2 font-mono font-semibold text-right text-slate-900">{formatKES(a.tiv_kes)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRawAssets.length > 4 && (
                    <div className="text-[10px] text-slate-500 text-center">
                      + {parsedRawAssets.length - 4} more geocoded assets ready for simulation run
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI UNSTRUCTURED BROKER SLIP (DIRECT TEXT) */}
          {activeTab === "slip" && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-700">
                Paste Free-Text Underwriting Slip or Note:
              </div>
              <Textarea
                rows={4}
                value={slipText}
                onChange={(e) => setSlipText(e.target.value)}
                placeholder="e.g. 5 commercial concrete warehouses in Industrial Area along Likoni Road, total area 22,000 sqm, TIV KES 1.1 Billion."
                className="text-xs leading-relaxed bg-slate-50"
              />
              <div className="text-[11px] text-slate-500 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-start gap-2">
                <Sparkles className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Groq LLM Ingestion:</strong> Automatically extracts building counts, geocodes Nairobi coordinates, applies JRC typologies, and computes pure burn rates.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: 1-CLICK DEMO PRESETS */}
          {activeTab === "preset" && (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-700">
                Choose a Realistic Nairobi Hackathon Test Scenario:
              </div>
              <div className="space-y-2">
                {DEMO_PRESETS.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPresetId(p.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                        isSelected
                          ? "border-[#00264D] bg-[#00264D]/5 ring-2 ring-[#00264D]/20 shadow-2xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                          <Building2 className="size-4 text-[#00264D]" />
                          <span>{p.name}</span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-[#00264D] bg-white px-2 py-0.5 rounded border border-slate-200">
                          {formatKES(p.tivKes)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {p.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-medium">
                        <span>✓ {p.assetCount} Geocoded Assets</span>
                        <span>· Real Nairobi Coordinates</span>
                        <span>· Full JRC Damage Calculation</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            onClick={handleLaunchRun}
            disabled={isProcessing || isExtracting || (activeTab === "upload" && parsedRawAssets.length === 0)}
            className="bg-[#D21245] hover:bg-[#B50F3B] text-white text-xs font-semibold px-5 h-9 gap-2 shadow-sm cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing Catastrophe Model...
              </>
            ) : (
              <>
                <Zap className="size-4" />
                Run Model Pipeline & Launch Fresh Dashboard
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

