"""
Generates real-world catastrophe modeling test scenarios for Kenya Re:
1. Upper Hill Commercial Towers (Word .docx)
2. Industrial Area Logistics Park (PDF .pdf via ReportLab)
3. Nairobi West & South C Residential Flood Zone (Tabular .csv)
4. Mathare River Vulnerability Corridor (Policy Slip .txt)
5. Westlands & Parklands Commercial Suites (Word .docx)
"""

import os
import csv
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_scenarios"))
os.makedirs(OUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. Upper Hill Commercial Towers (Word .docx)
# -------------------------------------------------------------
def create_upper_hill_docx():
    doc = Document()
    
    # Title
    title = doc.add_heading("KENYA REINSURANCE CORPORATION", level=0)
    title.runs[0].font.color.rgb = RGBColor(0, 38, 77)
    
    subtitle = doc.add_paragraph("FACULTATIVE REINSURANCE PORTFOLIO SUBMISSION · PROPERTY RISK SLIP")
    subtitle.runs[0].bold = True
    subtitle.runs[0].font.color.rgb = RGBColor(210, 18, 69)
    
    doc.add_paragraph(
        "Broker / Cedant: Minet Kenya Insurance Brokers on behalf of Kenindia Assurance\n"
        "Policy Ref: CED-FAC-NBO-2026-089\n"
        "Period: 01 January 2026 to 31 December 2026\n"
        "Location: Upper Hill Commercial Financial District, Nairobi County, Kenya\n"
        "Perils Covered: Fire, Allied Perils, Earthquake, and Urban Flash Flood (Pluvial Inundation)\n"
        "Aggregate Total Insured Value (TIV): KES 28,500,000,000"
    )
    
    doc.add_heading("Schedule of High-Value Commercial Assets", level=1)
    
    table = doc.add_table(rows=1, cols=6)
    table.style = "Table Grid"
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = "Asset ID"
    hdr_cells[1].text = "Property Name"
    hdr_cells[2].text = "Typology"
    hdr_cells[3].text = "Floor Area (m²)"
    hdr_cells[4].text = "TIV (KES)"
    hdr_cells[5].text = "Coordinates (Lat, Lon)"
    
    assets = [
        ("UH-001", "Britam Tower Annex Commercial Highrise", "Reinforced Concrete (RCC)", "45,000", "4,500,000,000", "-1.3001, 36.8143"),
        ("UH-002", "Prism Tower Upper Hill Corporate Suites", "Reinforced Concrete (RCC)", "38,000", "3,800,000,000", "-1.2989, 36.8122"),
        ("UH-003", "KCB Leadership Center & Towers", "Reinforced Concrete (RCC)", "35,000", "3,500,000,000", "-1.2974, 36.8139"),
        ("UH-004", "Taifa Financial Center", "Reinforced Concrete (RCC)", "32,000", "3,200,000,000", "-1.2982, 36.8165"),
        ("UH-005", "CIC Insurance Plaza Complex", "Reinforced Concrete (RCC)", "28,000", "2,800,000,000", "-1.3015, 36.8171"),
        ("UH-006", "Equity Center Head Office", "Reinforced Concrete (RCC)", "30,000", "3,000,000,000", "-1.3008, 36.8182"),
        ("UH-007", "NHIF Headquarters Wing B", "Reinforced Concrete (RCC)", "26,000", "2,600,000,000", "-1.2961, 36.8201"),
        ("UH-008", "Landmark Plaza Commercial", "Reinforced Concrete (RCC)", "24,500", "2,450,000,000", "-1.2995, 36.8152"),
        ("UH-009", "Kilimani Crest Corporate Park", "Reinforced Concrete (RCC)", "18,000", "1,800,000,000", "-1.2952, 36.8115"),
        ("UH-010", "Hospital Hill Specialist Medical Wing", "Reinforced Concrete (RCC)", "12,000", "850,000,000", "-1.2965, 36.8189"),
    ]
    
    for row in assets:
        row_cells = table.add_row().cells
        for i, val in enumerate(row):
            row_cells[i].text = val
            
    doc.add_paragraph(
        "\nUnderwriting Notes:\n"
        "All structures represent Grade-A engineered reinforced concrete frameworks with underground parking "
        "and sub-grade electrical switchgear. Basement pluvial flood inundation is the primary exposure during "
        "extreme return-period rainfall events (25y and 100y scenarios). Submersible bilge pumps and flood gates "
        "are installed at UH-001 and UH-003."
    )
    
    path = os.path.join(OUT_DIR, "1_Upper_Hill_Commercial_Towers.docx")
    doc.save(path)
    print(f"Created: {path}")


# -------------------------------------------------------------
# 2. Industrial Area Logistics Park (PDF via ReportLab)
# -------------------------------------------------------------
def create_industrial_area_pdf():
    path = os.path.join(OUT_DIR, "2_Industrial_Area_Logistics_Park.pdf")
    doc = SimpleDocTemplate(path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Heading1"],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#00264D"),
        spaceAfter=6,
    )
    sub_style = ParagraphStyle(
        "SubStyle",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#D21245"),
        fontName="Helvetica-Bold",
        spaceAfter=12,
    )
    body_style = ParagraphStyle(
        "BodyStyle",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B"),
    )
    
    elements = []
    
    elements.append(Paragraph("KENYA REINSURANCE CORPORATION", title_style))
    elements.append(Paragraph("PROPERTY UNDERWRITING DOSSIER · INDUSTRIAL AREA MANUFACTURING CORRIDOR", sub_style))
    
    elements.append(Paragraph(
        "<b>Lead Underwriter:</b> Kenya Re Treaty & Facultative Division<br/>"
        "<b>Portfolio Name:</b> Enterprise & Lunga Lunga Manufacturing & Warehousing Hub<br/>"
        "<b>County / Ward:</b> Nairobi County · Industrial Area / Makadara Sub-county<br/>"
        "<b>Aggregated TIV:</b> KES 6,450,000,000<br/>"
        "<b>Peril Focus:</b> Pluvial Flash Flood & Ngong River Basin Fluvial Overflow",
        body_style
    ))
    elements.append(Spacer(1, 14))
    
    # Table data
    data = [
        ["Asset ID", "Property / Facility Name", "Typology", "TIV (KES)", "Flood Depth", "Lat, Lon"],
        ["IND-101", "Enterprise Cold Chain Logistics Center", "Permanent Masonry", "1,200,000,000", "0.85 m", "-1.3120, 36.8540"],
        ["IND-102", "Lunga Lunga Steel Fabricators Yard", "Semi-Permanent", "850,000,000", "1.10 m", "-1.3155, 36.8620"],
        ["IND-103", "Commercial Street Packaging Hub", "Permanent Masonry", "950,000,000", "0.65 m", "-1.3090, 36.8480"],
        ["IND-104", "Nairobi River Basin Textile Depot", "Semi-Permanent", "620,000,000", "1.45 m", "-1.3180, 36.8670"],
        ["IND-105", "Dakar Road Plastics Manufacturing", "Permanent Masonry", "780,000,000", "0.75 m", "-1.3135, 36.8590"],
        ["IND-106", "Bandari Road Agro-Chemical Stores", "Permanent Masonry", "1,100,000,000", "0.55 m", "-1.3060, 36.8510"],
        ["IND-107", "Likoni Road Auto Assembly Depot", "Concrete RCC", "950,000,000", "0.40 m", "-1.3040, 36.8440"],
    ]
    
    t = Table(data, colWidths=[55, 175, 95, 80, 55, 80])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#00264D")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("FONTSIZE", (0, 1), (-1, -1), 7.5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("ALIGN", (3, 1), (4, -1), "RIGHT"),
    ]))
    
    elements.append(t)
    elements.append(Spacer(1, 14))
    
    elements.append(Paragraph(
        "<b>Actuarial Hazard Analysis:</b><br/>"
        "Assets IND-102 and IND-104 are situated in historical depression floodways adjacent to the Ngong River. "
        "In the 50-year pluvial event, flood depth is projected to exceed 1.1 meters, causing extensive damage "
        "to raw inventory and ground-level machinery. Recommended treaty condition: 15% special flood deductible "
        "with a 30-day waiting clause during the March-May Long Rains.",
        body_style
    ))
    
    doc.build(elements)
    print(f"Created: {path}")


# -------------------------------------------------------------
# 3. Nairobi West & South C Residential Flood Zone (CSV)
# -------------------------------------------------------------
def create_nairobi_west_csv():
    path = os.path.join(OUT_DIR, "3_Nairobi_West_South_C_Residential.csv")
    headers = ["loc_id", "name", "ward", "housing_class", "area_sqm", "tiv_kes", "lat", "lon"]
    
    rows = [
        ["NW-001", "Akila Estate Residential Courts Block A", "Nairobi West", "permanent_masonry", 4500, 315000000, -1.3145, 36.8220],
        ["NW-002", "Akila Estate Residential Courts Block B", "Nairobi West", "permanent_masonry", 4200, 294000000, -1.3150, 36.8225],
        ["NW-003", "Mugoya Estate Phase 2 Maisonettes", "South C", "permanent_masonry", 6500, 487500000, -1.3210, 36.8340],
        ["NW-004", "Muhoho Avenue Commercial Center", "South C", "concrete_rcc", 5200, 468000000, -1.3190, 36.8310],
        ["NW-005", "Madaraka Estate Phase 1 Block C", "Nairobi West", "concrete_rcc", 7800, 624000000, -1.3090, 36.8180],
        ["NW-006", "Bellevue Commercial Offices", "South C", "concrete_rcc", 8500, 765000000, -1.3260, 36.8410],
        ["NW-007", "Kodi Road Residential Rowhouses", "Nairobi West", "permanent_masonry", 3100, 217000000, -1.3175, 36.8250],
        ["NW-008", "Halai Sports Club Annex", "South C", "permanent_masonry", 2800, 168000000, -1.3235, 36.8360],
        ["NW-009", "South C Five Star Gardens", "South C", "permanent_masonry", 8900, 712000000, -1.3270, 36.8385],
        ["NW-010", "Ole Shapara Avenue Retail Suites", "South C", "permanent_masonry", 3400, 255000000, -1.3205, 36.8325],
        ["NW-011", "Gandhi Avenue Flats", "Nairobi West", "permanent_masonry", 4100, 287000000, -1.3130, 36.8240],
        ["NW-012", "Nairobi Dam View Villas", "Nairobi West", "permanent_masonry", 5600, 448000000, -1.3160, 36.8190],
        ["NW-013", "Popo Road Distribution Yard", "South C", "semi_permanent", 3800, 152000000, -1.3240, 36.8430],
        ["NW-014", "South C Mosque Plaza", "South C", "concrete_rcc", 4400, 396000000, -1.3220, 36.8350],
        ["NW-015", "T-Mall Annex Commercial", "Nairobi West", "concrete_rcc", 9200, 920000000, -1.3110, 36.8210],
    ]
    
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
        
    print(f"Created: {path}")


# -------------------------------------------------------------
# 4. Mathare River Vulnerability Corridor (Policy Slip .txt)
# -------------------------------------------------------------
def create_mathare_txt():
    path = os.path.join(OUT_DIR, "4_Mathare_River_Vulnerability_Corridor.txt")
    content = """================================================================================
KENYA REINSURANCE CORPORATION · UNDERWRITING RISK ASSESSMENT SLIP
NATURAL LANGUAGE PORTFOLIO INGESTION MEMO
================================================================================

Location: Mathare Valley River Basin Corridor, Nairobi County, Kenya
Target Community: Mathare 4A, Mlango Kubwa, and Austin Grounds light artisan zone
Broker: Micro-Enterprise Insurance Consortium Kenya
Underwriting Year: 2026/2027

EXPOSURE PORTFOLIO DESCRIPTION:
This portfolio comprises 12 community structures and semi-permanent workshop
clusters situated along the flood basin of the Mathare River. Construction
typology is predominantly semi-permanent timber frames with corrugated iron
sheet cladding and informal iron sheet dwellings, with a small number of permanent
masonry community centers.

Aggregated Total Insured Value (TIV): KES 480,000,000
Total Built Area: 8,600 m²

FACILITY SCHEDULE:
1. Mathare 4A Community Center & Dispensary
   - Location: Mathare River Front (Lat: -1.2601, Lon: 36.8612)
   - Typology: Permanent Masonry
   - Area: 1,800 m² | TIV: KES 90,000,000

2. Mlango Kubwa Metal Fabricators & Timber Sheds
   - Location: Juja Road Depression (Lat: -1.2638, Lon: 36.8569)
   - Typology: Semi-Permanent Timber & Iron
   - Area: 2,400 m² | TIV: KES 72,000,000

3. Mathare River Basin Artisan Workshops (Cluster A & B)
   - Location: Riverbank Corridor (Lat: -1.2612, Lon: 36.8584)
   - Typology: Informal Iron Sheet & Timber Frame
   - Area: 1,900 m² | TIV: KES 57,000,000

4. Kosovo Settlement Community Stores
   - Location: Mathare North Slopes (Lat: -1.2608, Lon: 36.8639)
   - Typology: Semi-Permanent
   - Area: 1,200 m² | TIV: KES 48,000,000

5. Kariadudu Grain Milling Facility
   - Location: Outer Ring Road Link (Lat: -1.2574, Lon: 36.8682)
   - Typology: Permanent Masonry
   - Area: 1,300 m² | TIV: KES 85,000,000

HYDROLOGICAL RISK SUMMARY:
Topographic elevations along the river channel fall below 1,620m above sea level.
Surface runoff during 10-year and 25-year rainfall surges inundates low-lying
structures with water depths reaching 0.85m to 1.40m. Because of fragile structural
resistance, physical damage onset occurs at merely 0.05m inundation depth with rapid
structural degradation.
================================================================================
"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Created: {path}")


# -------------------------------------------------------------
# 5. Westlands & Parklands Commercial Suites (Word .docx)
# -------------------------------------------------------------
def create_westlands_docx():
    doc = Document()
    
    title = doc.add_heading("KENYA REINSURANCE CORPORATION", level=0)
    title.runs[0].font.color.rgb = RGBColor(0, 38, 77)
    
    subtitle = doc.add_paragraph("WESTLANDS & PARKLANDS COMMERCIAL PORTFOLIO · TREATY PROPOSAL")
    subtitle.runs[0].bold = True
    subtitle.runs[0].font.color.rgb = RGBColor(0, 100, 0)
    
    doc.add_paragraph(
        "Territory: Westlands & Parklands Commercial Corridor, Nairobi, Kenya\n"
        "Total Insured Value (TIV): KES 9,200,000,000\n"
        "Primary Typologies: Engineered RCC Commercial Towers and Grade-B Masonry Suites\n"
        "Primary Watercourse: Nairobi River Chiromo Tributary"
    )
    
    doc.add_heading("Portfolio Asset Breakdown", level=1)
    
    table = doc.add_table(rows=1, cols=5)
    table.style = "Table Grid"
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = "Code"
    hdr_cells[1].text = "Asset / Complex"
    hdr_cells[2].text = "Typology"
    hdr_cells[3].text = "TIV (KES)"
    hdr_cells[4].text = "Coordinates"
    
    rows = [
        ("WST-01", "Mpaka Road Commercial Plaza", "Reinforced Concrete (RCC)", "2,200,000,000", "-1.2635, 36.8020"),
        ("WST-02", "Chiromo River View Suites", "Reinforced Concrete (RCC)", "1,850,000,000", "-1.2680, 36.8060"),
        ("WST-03", "Parklands 3rd Avenue Medical Chambers", "Permanent Masonry", "1,450,000,000", "-1.2610, 36.8150"),
        ("WST-04", "Sarit Centre Business Annex", "Reinforced Concrete (RCC)", "2,100,000,000", "-1.2590, 36.8040"),
        ("WST-05", "Woodvale Grove Hospitality Suites", "Permanent Masonry", "1,600,000,000", "-1.2650, 36.8055"),
    ]
    
    for r in rows:
        c = table.add_row().cells
        for i, val in enumerate(r):
            c[i].text = val
            
    doc.add_paragraph(
        "\nRisk Characteristics:\n"
        "High concentration of underground parking structures and basements along Chiromo Road. "
        "Elevated doorstep design at Mpaka Road provides 0.30m defense against flash pluvial runoff."
    )
    
    path = os.path.join(OUT_DIR, "5_Westlands_Parklands_Commercial_Suites.docx")
    doc.save(path)
    print(f"Created: {path}")


if __name__ == "__main__":
    create_upper_hill_docx()
    create_industrial_area_pdf()
    create_nairobi_west_csv()
    create_mathare_txt()
    create_westlands_docx()
    print("\n✓ ALL 5 SAMPLE REAL-WORLD TEST SCENARIOS GENERATED SUCCESSFULLY!")

