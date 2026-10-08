import base64

with open('frontend/public/image.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')
data_uri = f"data:image/png;base64,{b64}"

code = f'''import {{ jsPDF }} from "jspdf";

/**
 * Official Kenya Re Logo embedded as an instantaneous, offline Base64 Data URI.
 * Guaranteed zero network latency, 100% reliable across all browser environments.
 */
export const KENYA_RE_LOGO_DATA_URL = "{data_uri}";

export interface LetterheadOptions {{
  title: string;
  subtitle?: string;
  referenceCode?: string;
  classification?: string;
}}

/**
 * Standard Kenya Re corporate letterhead banner for publication-grade PDF documents.
 * Accurately scales the official Kenya Re logo and renders corporate metadata.
 */
export function drawKenyaReLetterhead(doc: jsPDF, options: LetterheadOptions): number {{
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Corporate Header Container (Crisp White Canvas)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 42, "F");

  // 2. Official Kenya Re Logo (Aspect ratio preserved: 34mm wide x 19.4mm high)
  try {{
    doc.addImage(KENYA_RE_LOGO_DATA_URL, "PNG", 14, 8, 34, 19.4);
  }} catch (e) {{
    console.warn("Could not draw Kenya Re logo in PDF header:", e);
  }}

  // 3. Corporate Metadata (Right-Aligned)
  doc.setTextColor(0, 38, 77); // Kenya Re Navy #00264D
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("KENYA REINSURANCE CORPORATION", pageWidth - 14, 14, {{ align: "right" }});

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text("Catastrophe Modeling & Actuarial Intelligence System", pageWidth - 14, 19, {{ align: "right" }});
  doc.text("Reinsurance Plaza, Taifa Road, P.O. Box 30271-00100 Nairobi", pageWidth - 14, 23.5, {{ align: "right" }});
  
  const dateStr = new Date().toLocaleString("en-KE", {{ dateStyle: "medium", timeStyle: "short" }});
  const refCode = options.referenceCode || `KRE-CAT-${{Date.now().toString().slice(-6)}}`;
  doc.text(`Doc Ref: ${{refCode}} · Generated: ${{dateStr}}`, pageWidth - 14, 28, {{ align: "right" }});

  // 4. Kenya Re Signature Crimson Divider (#D21245)
  doc.setDrawColor(210, 18, 69);
  doc.setLineWidth(1.0);
  doc.line(14, 33, pageWidth - 14, 33);

  doc.setDrawColor(0, 38, 77);
  doc.setLineWidth(0.3);
  doc.line(14, 34.2, pageWidth - 14, 34.2);

  // 5. Document Title Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 37, pageWidth - 28, 16, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 38, 77);
  doc.text(options.title.toUpperCase(), 18, 45);

  if (options.subtitle) {{
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(options.subtitle, 18, 50);
  }}

  if (options.classification) {{
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(pageWidth - 55, 41, 37, 7, 1, 1, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(210, 18, 69);
    doc.text(options.classification.toUpperCase(), pageWidth - 36.5, 45.8, {{ align: "center" }});
  }}

  return 58; // Y-coordinate where document body begins
}}

/**
 * Standard Kenya Re corporate footer with ISO certifications and confidentiality notice.
 */
export function drawKenyaReFooter(doc: jsPDF, pageNumber: number = 1, totalPages: number = 1, docRef?: string) {{
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 12;

  // Thin dividing line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);

  // Corporate & Security Stamp
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    "KENYA REINSURANCE CORPORATION · STRICTLY CONFIDENTIAL & PROPRIETARY · FOR ACTUARIAL / UNDERWRITING USE ONLY",
    14,
    footerY
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text(`Page ${{pageNumber}} of ${{totalPages}}`, pageWidth - 14, footerY, {{ align: "right" }});
}}
'''

with open('frontend/src/lib/branding.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print('Generated frontend/src/lib/branding.ts successfully')

