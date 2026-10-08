import { jsPDF } from "jspdf";
import { formatKES, type QuoteResponse, type HousingClass, CLASS_LABEL } from "./api";
import { drawKenyaReLetterhead, drawKenyaReFooter } from "./branding";

/**
 * Draws the standard Kenya Re letterhead banner with official corporate logo.
 */
async function drawHeader(doc: jsPDF, title: string, subtitle?: string): Promise<number> {
  return drawKenyaReLetterhead(doc, { title, subtitle });
}

/**
 * Draws standard document footer with Kenya Re security and ISO certification stamps.
 */
function drawFooter(doc: jsPDF, pageNumber: number = 1, totalPages: number = 1) {
  drawKenyaReFooter(doc, pageNumber, totalPages);
}

/**
 * EXPORT 1: Official Kenya Re Facultative Quote Slip PDF
 */
export async function exportQuoteSlipPDF(
  quote: QuoteResponse,
  propertyData: {
    location: string;
    housingClass: HousingClass;
    floorArea: string;
    costPerM2: string;
    deductiblePct: string;
  }
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const refNumber = `KRE-FAC-${Math.floor(100000 + Math.random() * 900000)}`;

  let y = await drawHeader(
    doc,
    "Facultative Underwriting & Flood Risk Quote Slip",
    `Reference: ${refNumber} · Nairobi Urban Pluvial Catastrophe Model`
  );

  // Section 1: Risk Identification
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 38, 77);
  doc.text("1. RISK & ASSET IDENTIFICATION", 14, y);
  y += 4;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 32, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const col1X = 18;
  const col2X = 105;

  doc.text("Risk Locality:", col1X, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(propertyData.location || "Nairobi County", col1X + 28, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("GPS Coordinates:", col1X, y + 13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${quote.lat?.toFixed(5) ?? "-1.29210"}° S, ${quote.lon?.toFixed(5) ?? "36.82190"}° E`, col1X + 28, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Construction Class:", col1X, y + 20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(CLASS_LABEL[quote.housing_class as HousingClass] || quote.housing_class, col1X + 32, y + 20);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Floor Area (m²):", col2X, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${Number(propertyData.floorArea).toLocaleString()} m²`, col2X + 35, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Replacement Cost:", col2X, y + 13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`KES ${Number(propertyData.costPerM2).toLocaleString()} / m²`, col2X + 35, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Total Insured Value:", col2X, y + 20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 38, 77);
  doc.text(formatKES(quote.tiv_kes), col2X + 35, y + 20);

  y += 38;

  // Section 2: Actuarial Hazard & Catastrophe Modeling
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 38, 77);
  doc.text("2. ACTUARIAL FLOOD MODELING & EXPOSURE METRICS", 14, y);
  y += 4;

  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 38, 1.5, 1.5, "FD");

  // Metric boxes
  // Box A: Modeled Flood Depth
  doc.setFillColor(254, 242, 242); // red-50
  doc.roundedRect(18, y + 4, 38, 28, 1, 1, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(153, 27, 27);
  doc.text("100-YR FLOOD DEPTH", 20, y + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(185, 28, 28);
  doc.text(`${quote.depth_100y_m.toFixed(2)} m`, 20, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("SRTM + DEM Inundation", 20, y + 27);

  // Box B: 100-Yr Modeled Loss
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(60, y + 4, 42, 28, 1, 1, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("100-YR MODELED LOSS", 62, y + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatKES(quote.insured_loss_100y_kes), 62, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Damage Ratio: ${((quote.insured_loss_100y_kes / (quote.tiv_kes || 1)) * 100).toFixed(1)}%`, 62, y + 27);

  // Box C: Pure Asset AAL
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(106, y + 4, 42, 28, 1, 1, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("ASSET PURE AAL", 108, y + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatKES(quote.asset_aal_gross_kes), 108, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Annual Expected Burn", 108, y + 27);

  // Box D: Deductible
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(152, y + 4, 40, 28, 1, 1, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("DEDUCTIBLE RETENTION", 154, y + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatKES(quote.deductible_kes), 154, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`${quote.deductible_pct}% of Asset TIV`, 154, y + 27);

  y += 44;

  // Section 3: Pricing & Reinsurance Terms
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 38, 77);
  doc.text("3. TECHNICAL PRICING & QUOTATION SUMMARY", 14, y);
  y += 4;

  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, y, 182, 34, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52);
  doc.text("RECOMMENDED ANNUAL FLOOD PREMIUM:", 20, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(210, 18, 69); // #D21245 Crimson
  doc.text(formatKES(quote.recommended_annual_premium_kes), 20, y + 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Technical Rate: ${quote.recommended_technical_rate_pct}% · Loading Factor: 1.35x (Catastrophe Load + Expense + Solvency Margin)`, 20, y + 27);

  y += 42;

  // Section 4: Endorsement & Terms
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 38, 77);
  doc.text("4. SPECIAL CONDITIONS & UNDERWRITING WARRANTIES", 14, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const terms = [
    "1. Pluvial Surface-Water Peril: Coverage is subject to a 72-hour Catastrophe Clause for continuous storm events.",
    "2. Deductible: The stated deductible applies per occurrence to all property damage and business interruption claims.",
    "3. S-Curve Vulnerability Calibration: Loss estimation is based on JRC-calibrated vulnerability functions for Nairobi County.",
    "4. Drainage Calibration: Premium accounts for local stormwater infrastructure capacity and documented bottlenecks."
  ];

  terms.forEach((t) => {
    doc.text(t, 14, y);
    y += 5;
  });

  y += 8;

  // Sign-off Block
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y + 16, 75, y + 16);
  doc.line(125, y + 16, 186, y + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("Authorized Actuarial Signatory", 14, y + 21);
  doc.text("Cedant / Broker Acceptance", 125, y + 21);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Kenya Reinsurance Corporation", 14, y + 26);
  doc.text("Date: ________________________", 125, y + 26);

  drawFooter(doc, 1, 1);

  // Save the PDF
  doc.save(`KenyaRe_QuoteSlip_${refNumber}.pdf`);
}

/**
 * EXPORT 2: Executive Catastrophe Risk Memorandum PDF
 */
export async function exportRiskBriefingPDF(
  briefing: {
    executive_summary: string;
    key_findings: string[];
    recommendations: string[];
    loss_metrics?: {
      pml_100y_kes: number;
      aal_kes: number;
      baseline_aal_kes?: number;
      ai_solvency_delta_kes?: number;
    };
  },
  scenario: string = "100y"
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const refNumber = `KRE-MEMO-${scenario.toUpperCase()}-${Date.now().toString().slice(-5)}`;

  let y = await drawHeader(
    doc,
    "Executive Catastrophe Risk Briefing & Reinsurance Memorandum",
    `Scenario: 1-in-${scenario.replace("y", "")} Year Flood · Groq LLM Actuarial Synthesis · Ref: ${refNumber}`
  );

  // Executive Summary Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 38, 77);
  doc.text("EXECUTIVE SUMMARY", 14, y);
  y += 4;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);

  const summaryLines = doc.splitTextToSize(briefing.executive_summary, 172);
  const summaryBoxHeight = Math.max(24, summaryLines.length * 4.2 + 8);

  doc.roundedRect(14, y, 182, summaryBoxHeight, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(summaryLines, 19, y + 6);

  y += summaryBoxHeight + 6;

  // Key Actuarial Findings
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 38, 77);
  doc.text("KEY ACTUARIAL & DRAINAGE FINDINGS", 14, y);
  y += 4;

  briefing.key_findings.forEach((finding, idx) => {
    const findingLines = doc.splitTextToSize(finding, 150);
    const itemHeight = Math.max(10, findingLines.length * 4.2 + 5);

    if (y + itemHeight > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, 182, itemHeight, 1, 1, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(210, 18, 69);
    doc.text(`${idx + 1}.`, 18, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(findingLines, 25, y + 5);

    y += itemHeight + 2.5;
  });

  y += 3;

  // Actuarial Recommendations
  if (y > 245) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 38, 77);
  doc.text("REINSURANCE TREATY & SOLVENCY RECOMMENDATIONS", 14, y);
  y += 4;

  briefing.recommendations.forEach((rec, idx) => {
    const recLines = doc.splitTextToSize(rec, 148);
    const itemHeight = Math.max(10, recLines.length * 4.2 + 5);

    if (y + itemHeight > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, y, 182, itemHeight, 1, 1, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52);
    doc.text(`R${idx + 1}:`, 18, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 83, 45);
    doc.text(recLines, 27, y + 5);

    y += itemHeight + 2.5;
  });

  // Signatures
  if (y > 240) {
    doc.addPage();
    y = 25;
  } else {
    y += 5;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(14, y + 14, 75, y + 14);
  doc.line(125, y + 14, 186, y + 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("Chief Risk Officer / Actuary", 14, y + 19);
  doc.text("Managing Director / Board Committee", 125, y + 19);

  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages);
  }

  doc.save(`KenyaRe_Executive_Briefing_${scenario}.pdf`);
}

/**
 * EXPORT 3: Exposure Portfolio Export PDF
 */
export async function exportExposurePortfolioPDF(
  assetsOrStats: any,
  datasetNameOrSampleAssets?: any,
  tivKesParam?: number,
  optionalStats?: { aalKES?: number; pml100yKES?: number }
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let assetsList: any[] = [];
  let datasetTitle = "Exposure Portfolio";
  let totalTIV = 0;
  let totalAssets = 0;
  let aalVal = 0;
  let pmlVal = 0;

  if (Array.isArray(assetsOrStats)) {
    assetsList = assetsOrStats;
    datasetTitle = typeof datasetNameOrSampleAssets === "string" ? datasetNameOrSampleAssets : "Active Portfolio";
    totalAssets = assetsList.length;
    totalTIV = tivKesParam || assetsList.reduce((s, a) => s + (a.tiv_kes || 0), 0);
    aalVal = optionalStats?.aalKES || totalTIV * 0.00028;
    pmlVal = optionalStats?.pml100yKES || totalTIV * 0.0032;
  } else if (assetsOrStats && typeof assetsOrStats === "object") {
    totalAssets = assetsOrStats.totalAssets || (Array.isArray(datasetNameOrSampleAssets) ? datasetNameOrSampleAssets.length : 0);
    totalTIV = assetsOrStats.totalTIV || 0;
    aalVal = assetsOrStats.aalKES || 0;
    pmlVal = assetsOrStats.pml100yKES || 0;
    assetsList = Array.isArray(datasetNameOrSampleAssets) ? datasetNameOrSampleAssets : [];
    datasetTitle = "Nairobi Urban Flood Exposure Portfolio Summary";
  }

  let y = await drawHeader(
    doc,
    "Kenya Re Exposure Portfolio Schedule",
    `Dataset: ${datasetTitle} · Total Monitored: ${totalAssets.toLocaleString()} Properties · Kenya Re Cat Model`
  );

  // Portfolio KPI Row
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 22, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL INSURED VALUE", 20, y + 7);
  doc.text("ANNUAL AVERAGE LOSS", 70, y + 7);
  doc.text("1-IN-100 YR PML", 120, y + 7);
  doc.text("EXPOSURE UNITS", 165, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 38, 77);
  doc.text(formatKES(totalTIV), 20, y + 15);
  doc.text(formatKES(aalVal), 70, y + 15);
  doc.setTextColor(210, 18, 69);
  doc.text(formatKES(pmlVal), 120, y + 15);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalAssets}`, 165, y + 15);

  y += 28;

  // Table of Assets
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 38, 77);
  doc.text("PORTFOLIO ASSET AUDIT SCHEDULE", 14, y);
  y += 4;

  const renderTableHeader = (currY: number) => {
    doc.setFillColor(0, 38, 77);
    doc.rect(14, currY, 182, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("Asset ID", 18, currY + 4.8);
    doc.text("Name / Description", 45, currY + 4.8);
    doc.text("Source File", 92, currY + 4.8);
    doc.text("Locality", 125, currY + 4.8);
    doc.text("Typology", 152, currY + 4.8);
    doc.text("TIV (KES)", 192, currY + 4.8, { align: "right" });
    return currY + 7;
  };

  y = renderTableHeader(y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);

  const displayAssets = assetsList.slice(0, 50);
  displayAssets.forEach((a, i) => {
    if (y > 270) {
      doc.addPage();
      y = 18;
      y = renderTableHeader(y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
    }

    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 6, "F");
    }
    doc.setTextColor(15, 23, 42);
    doc.text(String(a.loc_id || a.id || `A-${i + 1}`).slice(0, 14), 18, y + 4.2);
    doc.text(String(a.name || "Commercial Asset").slice(0, 22), 45, y + 4.2);
    doc.text(String(a.source_file || datasetTitle).slice(0, 16), 92, y + 4.2);
    doc.text(String(a.ward || "Nairobi").slice(0, 14), 125, y + 4.2);
    const cls = a.housing_class ? (CLASS_LABEL[a.housing_class as HousingClass] || a.housing_class) : "RCC";
    doc.text(String(cls).slice(0, 15), 152, y + 4.2);
    doc.text(formatKES(a.tiv_kes || 0), 192, y + 4.2, { align: "right" });
    y += 6;
  });

  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages);
  }

  const safeFilename = datasetTitle.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30);
  doc.save(`KenyaRe_Portfolio_Schedule_${safeFilename}_${Date.now()}.pdf`);
}

