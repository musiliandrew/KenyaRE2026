"""
Executive Architecture, Workflow, and Tools Specification Generator for Kenya Re Cat Platform.
Generates an official, beautifully styled Microsoft Word (.docx) document.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    """Sets background color of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Sets internal padding for a table cell in dxa (1 pt = 20 dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def create_callout_box(doc, text_paragraphs, title=""):
    """Creates a stylized executive callout box with a Kenya Re crimson left border."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Left border: thick crimson (36 = 4.5pt), others none
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="36" w:space="0" w:color="D21245"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    if title:
        run_title = p.add_run(f"■  {title}\n")
        run_title.font.name = "Calibri"
        run_title.font.size = Pt(11)
        run_title.font.bold = True
        run_title.font.color.rgb = RGBColor(0, 38, 77) # Kenya Re Navy
        
    for idx, tp in enumerate(text_paragraphs):
        if idx > 0:
            p = cell.add_paragraph()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
        run = p.add_run(tp)
        run.font.name = "Calibri"
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(51, 65, 85)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def format_table_headers(table, col_widths, headers):
    """Formats the top header row of a table with Kenya Re corporate Navy."""
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "00264D")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=150, right=150)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = "Calibri"
            run.font.bold = True
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(255, 255, 255)
            
    # Set widths
    for row in table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

def format_data_rows(table, data_rows, col_widths):
    """Fills data rows with zebra striping and clean padding."""
    for row_idx, data in enumerate(data_rows):
        row = table.add_row()
        bg_hex = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cell = row.cells[col_idx]
            cell.text = str(text)
            set_cell_background(cell, bg_hex)
            set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            for run in p.runs:
                run.font.name = "Calibri"
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(30, 41, 59)
                
    for row in table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

def build_document():
    doc = docx.Document()
    
    # Page setup - Margins 0.8 inches
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Top Header Block with Kenya Re Logo & Corporate Letterhead
    logo_path = r"c:\Users\musiliandrew\OneDrive\Desktop\KenyaRE\frontend\public\kenya-re-logo.png"
    if os.path.exists(logo_path):
        header_tbl = doc.add_table(rows=1, cols=2)
        header_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        c_logo = header_tbl.cell(0, 0)
        c_text = header_tbl.cell(0, 1)
        c_logo.width = Inches(2.2)
        c_text.width = Inches(4.7)
        set_cell_margins(c_logo, top=0, bottom=60, left=0, right=60)
        set_cell_margins(c_text, top=0, bottom=60, left=60, right=0)
        
        p_img = c_logo.paragraphs[0]
        p_img.paragraph_format.space_before = Pt(0)
        p_img.paragraph_format.space_after = Pt(0)
        run_img = p_img.add_run()
        run_img.add_picture(logo_path, width=Inches(1.8))
        
        p_txt = c_text.paragraphs[0]
        p_txt.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_txt.paragraph_format.space_before = Pt(0)
        p_txt.paragraph_format.space_after = Pt(0)
        r_re = p_txt.add_run("KENYA REINSURANCE CORPORATION\n")
        r_re.font.name = "Calibri"
        r_re.font.size = Pt(13)
        r_re.font.bold = True
        r_re.font.color.rgb = RGBColor(0, 38, 77)
        r_sub = p_txt.add_run("Catastrophe Risk Intelligence Division · Enterprise Digital Twin")
        r_sub.font.name = "Calibri"
        r_sub.font.size = Pt(9)
        r_sub.font.color.rgb = RGBColor(100, 116, 139)

    # Document Title Block
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(14)
    title_p.paragraph_format.space_after = Pt(2)
    title_run = title_p.add_run("KENYA RE CAT INTELLIGENCE PLATFORM")
    title_run.font.name = "Calibri"
    title_run.font.size = Pt(20)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(0, 38, 77) # Kenya Re Navy
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(6)
    sub_run = sub_p.add_run("SYSTEM ARCHITECTURE, WORKFLOW DIAGRAMS & TECHNICAL MODULE SPECIFICATIONS")
    sub_run.font.name = "Calibri"
    sub_run.font.size = Pt(11)
    sub_run.font.bold = True
    sub_run.font.color.rgb = RGBColor(210, 18, 69) # Kenya Re Crimson
    
    # Metadata bar
    meta_p = doc.add_paragraph()
    meta_p.paragraph_format.space_after = Pt(16)
    meta_run = meta_p.add_run("Version: 2.4.0 (Production)  |  Target Domain: Nairobi Urban Pluvial Catastrophe Risk  |  Classification: Confidential / Underwriting Core")
    meta_run.font.name = "Calibri"
    meta_run.font.size = Pt(9)
    meta_run.font.italic = True
    meta_run.font.color.rgb = RGBColor(100, 116, 139)
    
    # Horizontal separator
    sep_tbl = doc.add_table(rows=1, cols=1)
    sep_cell = sep_tbl.cell(0, 0)
    set_cell_background(sep_cell, "D21245")
    sep_cell.paragraphs[0].paragraph_format.space_before = Pt(0)
    sep_cell.paragraphs[0].paragraph_format.space_after = Pt(0)
    set_cell_margins(sep_cell, top=20, bottom=20, left=0, right=0)
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # =========================================================================
    # SECTION 1: SYSTEM OVERVIEW & EXECUTIVE PURPOSE
    # =========================================================================
    h1 = doc.add_heading("1. Executive Summary & Platform Purpose", level=1)
    h1.runs[0].font.color.rgb = RGBColor(0, 38, 77)
    
    p1 = doc.add_paragraph(
        "The Kenya Re Catastrophe Risk Intelligence Platform is an enterprise-grade nat-cat modeling digital twin "
        "engineered specifically for African urban catastrophe perils, with an initial flagship deployment across the "
        "Nairobi Metropolitan River Basin. Historically, African reinsurers have operated with significant cat exposure "
        "blindspots due to relying on European or North American commercial models that lack local pluvial drainage dynamics, "
        "informal settlement vulnerability parameters, and micro-catchment terrain calibration."
    )
    p1.paragraph_format.space_after = Pt(8)
    
    p2 = doc.add_paragraph(
        "This platform replaces static broker spreadsheets and flat hazard heatmaps with a dynamic, physical 4-pillar "
        "catastrophe simulation engine coupled with a real-time WebGL 3D geospatial digital twin. It enables Kenya Re underwriters, "
        "treaty actuaries, and claims executives to quantify Average Annual Loss (AAL), evaluate 100-Year Probable Maximum Loss (PML), "
        "price facultative risk slips, structure Excess-of-Loss (XoL) treaty retentions, and simulate urban stormwater drainage "
        "bottlenecks with millimeter precision."
    )
    p2.paragraph_format.space_after = Pt(8)
    
    create_callout_box(doc, [
        "Primary Mission: Solve the reinsurance accumulation and underpricing dilemma in tropical convective flood basins.",
        "Core Capabilities: 4-Pillar Cat Modeling (Hazard, Vulnerability, Exposure, Financial) + 3D Hydrodynamic Network + AI Natural Language Ingestion.",
        "Compliance & Standards: JRC Huizinga (2017) continuous damage functions, CLIMADA impact matrix compatibility, and open actuarial transparency."
    ], title="STRATEGIC EXECUTIVE DIRECTIVE")
    
    # =========================================================================
    # SECTION 2: 4-PILLAR CATASTROPHE RISK MODELING ARCHITECTURE
    # =========================================================================
    h2 = doc.add_heading("2. The 4-Pillar Scientific Modeling Architecture", level=1)
    h2.runs[0].font.color.rgb = RGBColor(0, 38, 77)
    
    p_arch = doc.add_paragraph(
        "The mathematical and actuarial foundation of the system is structured around the four universal pillars of "
        "catastrophe risk modeling, calibrated directly for Nairobi's high-altitude tropical terrain and structural construction archetypes:"
    )
    p_arch.paragraph_format.space_after = Pt(8)
    
    # 4 Pillars Table
    tbl_pillars = doc.add_table(rows=1, cols=4)
    tbl_pillars.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_w_pillars = [Inches(1.2), Inches(1.8), Inches(2.2), Inches(1.8)]
    format_table_headers(tbl_pillars, col_w_pillars, ["Pillar", "Scientific Focus", "Core Algorithms & Implementation", "Kenya Re Output"])
    
    pillar_data = [
        [
            "Pillar 1: Hazard",
            "Geospatial Surface Water & Hydrology",
            "Five calibrated GeoTIFF DEM rasters (5y, 10y, 25y, 50y, 100y) indexed via affine coordinate transformation (pixel size 0.0002778°). Integrates 24 validated municipal hotspots & 14 river channels.",
            "Water Depth (m) at exact building footprint [lat, lng]."
        ],
        [
            "Pillar 2: Vulnerability",
            "Structural Damage Susceptibility",
            "Continuous sigmoid curves based on JRC Huizinga et al. (2017) Africa parameters. Physical damage ceilings and doorstep/plinth thresholds: Mabati (0.0m), Semi-Perm (0.10m), Masonry (0.25m), Concrete RCC (0.30m).",
            "Continuous Damage Ratio (0.00% to Cap%) per asset."
        ],
        [
            "Pillar 3: Exposure",
            "Asset Geocoding & Replacement Value",
            "600-building synthetic baseline (KES 4.82B TIV) across 12 wards (Upper Hill, Industrial Area, Westlands, South C, etc.) + dynamic ingestion engine supporting ad-hoc broker files (DOCX, PDF, CSV, Excel).",
            "Geocoded TIV, Floor Area, Cost/m², Structural Typology."
        ],
        [
            "Pillar 4: Financial",
            "Actuarial Pricing & Treaty Engine",
            "Event Loss Tables (ELT), exceedance probability (EP) curves, trapezoidal numerical integration for Average Annual Loss (AAL), pure burn rate, and Excess-of-Loss (XoL) layer attachment & exhaustion simulation.",
            "AAL (KES), 100-Yr PML, Technical Premium, Treaty ROL."
        ]
    ]
    format_data_rows(tbl_pillars, pillar_data, col_w_pillars)
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # Structural Threshold Callout
    create_callout_box(doc, [
        "Engineered Protection Thresholds: Commercial Reinforced Concrete (RCC) buildings feature a calibrated 0.30m (30 cm) plinth resistance threshold representing elevated doorways, basement sump pumps, and curb elevations.",
        "Mathematical Precision: When water depth is below 0.30m, modeled physical damage is 0.00% (KES 0). The platform strictly enforces this physical reality without artificial mock fallbacks across both the asset dossier and portfolio overview."
    ], title="VULNERABILITY CALIBRATION NOTE")

    # =========================================================================
    # SECTION 3: END-TO-END SYSTEM WORKFLOW & DIAGRAMS
    # =========================================================================
    h3 = doc.add_heading("3. End-to-End System Workflow & Data Pipeline", level=1)
    h3.runs[0].font.color.rgb = RGBColor(0, 38, 77)
    
    p_wf = doc.add_paragraph(
        "The system executes a seamless end-to-end data pipeline connecting unstructured broker inputs to actuarial outputs. "
        "The diagram below outlines the logical flow of data across the platform architecture:"
    )
    p_wf.paragraph_format.space_after = Pt(8)
    
    # ASCII / Unicode Workflow Diagram
    wf_diagram = (
        "┌────────────────────────────────────────────────────────────────────────────────────────┐\n"
        "│                          STAGE 1: EXPOSURE INGESTION & PARSING                         │\n"
        "│  • Broker Slip (DOCX / PDF / Text)     • CSV / Excel Portfolio     • Baseline 600 TIV  │\n"
        "│  └───────────────────┬───────────────────────────┬───────────────────────────┬─────────┘\n"
        "                       │                           │                           │\n"
        "                       ▼                           ▼                           ▼\n"
        "┌────────────────────────────────────────────────────────────────────────────────────────┐\n"
        "│                       STAGE 2: NATURAL LANGUAGE & SPATIAL ENGINE                       │\n"
        "│  • Regex & LLM NER (Class, Area, TIV, Ward) • Geocoding Resolver [-1.2847, 36.8247]   │\n"
        "└──────────────────────────────────────────┬─────────────────────────────────────────────┘\n"
        "                                           │\n"
        "                                           ▼\n"
        "┌────────────────────────────────────────────────────────────────────────────────────────┐\n"
        "│                         STAGE 3: HYDRODYNAMIC HAZARD SAMPLING                          │\n"
        "│  • 5 GeoTIFF Rasters (5y–100y) • Spatial Coordinate Intersect • Physical Depth (m)     │\n"
        "│  • 3D Drainage Network Corridors • AI Siltation Choke Points (+15% Surge Penalty)      │\n"
        "└──────────────────────────────────────────┬─────────────────────────────────────────────┘\n"
        "                                           │\n"
        "                                           ▼\n"
        "┌────────────────────────────────────────────────────────────────────────────────────────┐\n"
        "│                     STAGE 4: JRC DEPTH-DAMAGE VULNERABILITY MODEL                      │\n"
        "│  • Structural Typology Matching (Mabati, Semi-Perm, Masonry, Concrete RCC Grade A+)    │\n"
        "│  • Threshold Resistance Evaluation (0.00m to 0.30m) • Continuous Sigmoid Damage Ratio  │\n"
        "└──────────────────────────────────────────┬─────────────────────────────────────────────┘\n"
        "                                           │\n"
        "                                           ▼\n"
        "┌────────────────────────────────────────────────────────────────────────────────────────┐\n"
        "│                        STAGE 5: ACTUARIAL FINANCIAL ENGINE                             │\n"
        "│  • Event Loss Table (ELT)   • Exceedance Probability Curve   • Trapezoidal AAL Integral│\n"
        "│  • 100-Year Modeled PML     • Excess of Loss (XoL) Pricing   • Single-Risk Fac Quotes  │\n"
        "└──────────────────────────────────────────┬─────────────────────────────────────────────┘\n"
        "                                           │\n"
        "                                           ▼\n"
        "┌────────────────────────────────────────────────────────────────────────────────────────┐\n"
        "│                      STAGE 6: PRESENTATION, 3D DIGITAL TWIN & EXPORTS                  │\n"
        "│  • Mapbox / MapLibre 3D Terrain • Volumetric Surge Towers • Animated Water Currents   │\n"
        "│  • Kenya Re Letterhead PDF Slips • Executive Briefings • Full Building Dossiers       │\n"
        "└────────────────────────────────────────────────────────────────────────────────────────┘"
    )
    
    tbl_diag = doc.add_table(rows=1, cols=1)
    tbl_diag.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_diag = tbl_diag.cell(0, 0)
    set_cell_background(c_diag, "0F172A") # Dark slate
    set_cell_margins(c_diag, top=140, bottom=140, left=180, right=180)
    p_code = c_diag.paragraphs[0]
    p_code.paragraph_format.space_before = Pt(0)
    p_code.paragraph_format.space_after = Pt(0)
    r_code = p_code.add_run(wf_diagram)
    r_code.font.name = "Consolas"
    r_code.font.size = Pt(7.5)
    r_code.font.color.rgb = RGBColor(56, 189, 248) # Neon sky blue
    
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Underwriter Workflow Table
    doc.add_heading("Underwriter Operational User Journeys", level=2).runs[0].font.color.rgb = RGBColor(0, 38, 77)
    tbl_journeys = doc.add_table(rows=1, cols=3)
    tbl_journeys.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_w_j = [Inches(1.5), Inches(2.5), Inches(3.0)]
    format_table_headers(tbl_journeys, col_w_j, ["User Journey", "Underwriting Action", "Platform Mechanism & Output"])
    
    j_data = [
        [
            "1. Portfolio Overview & Accumulation",
            "Analyze consolidated or single-file portfolio risk concentration.",
            "Navigates to Overview & Hazard panels. Inspects TIV (KES), 25y Event Loss, AAL, and 100-Yr PML. Observes spatial clustering across Industrial Area and South C."
        ],
        [
            "2. Interactive 3D Geospatial Audit",
            "Audit flood hazard and drainage bottlenecks around high-value buildings.",
            "Switches between Mapbox 3D and MapLibre GL. Toggles 3D terrain tilt (60°). Clicks 3D water ribbons to fly along river corridors and trigger 150m proximity exposure scans."
        ],
        [
            "3. Single-Risk Facultative Quoting",
            "Price an incoming single-risk commercial property submission.",
            "Enters location, floor area, construction class, cost/m², and deductible into Quoting Desk. System computes pure burn rate, technical premium, and generates an official Kenya Re Quote Slip PDF."
        ],
        [
            "4. XoL Treaty Reinsurance Structuring",
            "Price and stress-test treaty layers for cedant flood portfolios.",
            "Defines Attachment Point (e.g. KES 50M) and Layer Limit (e.g. KES 100M). System evaluates layer attachment probabilities, layer AAL, Rate on Line (ROL), and AI drainage stress factors."
        ],
        [
            "5. Ad-Hoc File Ingestion & Custom Runs",
            "Upload new broker test files (DOCX, PDF, CSV) without database pollution.",
            "Opens Ingest Modal. Uploads document. System parses assets, runs DEM hazard sampling, evaluates JRC vulnerability, and spawns an isolated custom run."
        ]
    ]
    format_data_rows(tbl_journeys, j_data, col_w_j)
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # =========================================================================
    # SECTION 4: THE PLATFORM TOOLS & CORE MODULES
    # =========================================================================
    h4 = doc.add_heading("4. Comprehensive Tools & Module Specifications", level=1)
    h4.runs[0].font.color.rgb = RGBColor(0, 38, 77)
    
    p_tools = doc.add_paragraph(
        "The platform provides nine integrated modules designed for reinsurance executives, treaty actuaries, and underwriters:"
    )
    p_tools.paragraph_format.space_after = Pt(8)
    
    tools_list = [
        ("1. 3D Geospatial Digital Twin (Mapbox GL & MapLibre GL)", 
         "Features 60° tilt, 3D extruded building models up to 100m, and raster flood inundation overlays. Equipped with MapProviderSwitcher for offline / MapLibre fallback."),
        
        ("2. 3D Volumetric Water Corridors & Animated Currents", 
         "Translates 14 natural river stems and municipal canals into physical polygonal 3D ribbons (6m to 15m wide) with water depth extrusions. Animated WebGL photon currents visibly demonstrate downstream flow velocity toward insured assets."),
        
        ("3. 3D Bottleneck Surge Towers (Hydraulic Choke Points)", 
         "Renders 35m–48m volumetric translucent beacon columns at critical AI-detected choke points (Gikomba Bridge, Nyayo Stadium, South C Outfall, Lunga Lunga). Clicking displays siltation capacity loss % and backwater overtopping surge head."),
        
        ("4. 150m Hydrological Proximity Exposure Scanner", 
         "Clicking any drainage canal calculates the river heading, flies the 3D camera along the channel, illuminates a 150m danger corridor buffer, and aggregates all exposed portfolio buildings and TIV at risk."),
        
        ("5. Continuous JRC Depth-Damage Vulnerability Engine", 
         "Evaluates physical damage ratios based on JRC Huizinga (2017) sigmoid formulations with calibrated structural doorstep resistance thresholds (0.00m to 0.30m) and physical damage caps."),
        
        ("6. Actuarial Financial Engine & Trapezoidal AAL Integrator", 
         "Constructs 5-point Exceedance Probability (EP) Curves and integrates Average Annual Loss (AAL) using exact numerical trapezoidal integration. Computes 100-Year Probable Maximum Loss (PML)."),
        
        ("7. Excess-of-Loss (XoL) Treaty Structuring Desk", 
         "Simulates multi-layer non-proportional reinsurance treaties. Computes attachment frequencies, Layer AAL, Pure Risk Premium, Rate on Line (ROL), and AI drainage stress testing."),
        
        ("8. Single-Risk Facultative Pricing Engine", 
         "Evaluates replacement values, pure flood burn rates, commercial risk loadings, and deductible retentions. Auto-populates from map assets or manual broker slips."),
        
        ("9. Official Kenya Re PDF Document Export Suite", 
         "Generates print-ready executive documents branded with the official Kenya Re logo, corporate letterheads, and actuarial schedules: Facultative Quote Slips, Executive Briefings, and Asset Dossiers.")
    ]
    
    for tool_name, tool_desc in tools_list:
        p_t = doc.add_paragraph()
        p_t.paragraph_format.space_before = Pt(4)
        p_t.paragraph_format.space_after = Pt(4)
        r_name = p_t.add_run(f"•  {tool_name}: ")
        r_name.font.name = "Calibri"
        r_name.font.bold = True
        r_name.font.color.rgb = RGBColor(0, 38, 77)
        r_desc = p_t.add_run(tool_desc)
        r_desc.font.name = "Calibri"
        r_desc.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # =========================================================================
    # SECTION 5: MATHEMATICAL & ACTUARIAL FORMULATIONS
    # =========================================================================
    h5 = doc.add_heading("5. Mathematical & Actuarial Formulations", level=1)
    h5.runs[0].font.color.rgb = RGBColor(0, 38, 77)
    
    p_math = doc.add_paragraph(
        "To ensure complete transparency and defensibility during treaty negotiations, all formulas implemented in the "
        "Python backend financial and vulnerability engines are mathematically formalized below:"
    )
    p_math.paragraph_format.space_after = Pt(8)
    
    math_boxes = [
        ("1. Vulnerability Damage Ratio (Continuous Sigmoid Formulation)",
         "For flood depth d and construction resistance threshold d_threshold:\n"
         "If d <= d_threshold: Damage Ratio = 0.000\n"
         "If d > d_threshold: Damage Ratio = min(Cap, Cap / (1 + exp(-k * ((d - d_threshold) - d_midpoint))))\n"
         "Where Cap = 0.65 for Concrete RCC (65% ceiling), k = 1.8 slope, midpoint = 1.50m."),
        
        ("2. Asset-Level Financial Gross & Insured Loss",
         "Gross Loss (KES) = TIV_kes * Damage_Ratio(depth_m, class)\n"
         "Deductible Amount = TIV_kes * Deductible_%\n"
         "Insured Loss (KES) = min(TIV_kes * Policy_Limit_%, max(0.0, Gross_Loss - Deductible_Amount))"),
        
        ("3. Actuarial Average Annual Loss (AAL) - Trapezoidal Numerical Integration",
         "AAL = Sum_{i=1}^{N-1} [ 0.5 * (Loss_i + Loss_{i+1}) * (AEP_i - AEP_{i+1}) ] + [ AEP_last * Loss_last * 0.5 ]\n"
         "Where AEP is the Annual Exceedance Probability (5y=0.20, 10y=0.10, 25y=0.04, 50y=0.02, 100y=0.01)."),
        
        ("4. Excess of Loss (XoL) Layer Financial Payout",
         "For treaty layer with Attachment Point (Att) and Limit (Lim):\n"
         "Layer Loss = min(Lim, max(0.0, Event_Loss - Att)) * Share_%\n"
         "Rate on Line (ROL) = (Layer_AAL / Lim) * 100.0\n"
         "Recommended Treaty Premium = Layer_AAL * Expense_Loading * Profit_Margin")
    ]
    
    for m_title, m_formula in math_boxes:
        create_callout_box(doc, [m_formula], title=m_title)

    # =========================================================================
    # SECTION 6: TECHNICAL ARCHITECTURE & STACK
    # =========================================================================
    h6 = doc.add_heading("6. Technical Architecture & Technology Stack", level=1)
    h6.runs[0].font.color.rgb = RGBColor(0, 38, 77)
    
    tbl_tech = doc.add_table(rows=1, cols=3)
    tbl_tech.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_w_t = [Inches(1.8), Inches(2.2), Inches(3.0)]
    format_table_headers(tbl_tech, col_w_t, ["Layer / Component", "Technology / Framework", "Core Responsibility"])
    
    tech_data = [
        ["Frontend UI & Dashboard", "Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS", "Executive UI, responsive dashboard panels, real-time KPI animations, and state orchestration."],
        ["3D Geospatial Engine", "Mapbox GL JS (v3) & MapLibre GL", "3D terrain extrusion, volumetric water ribbons, animated flow current loops, and interactive popups."],
        ["Charts & Data Viz", "Recharts, D3 Hexbin, Lucide React", "Exceedance probability curves, vulnerability curves, loss breakdown charts, and spatial clustering."],
        ["Document & PDF Generation", "jsPDF, jsPDF-AutoTable, python-docx", "Client-side and server-side branded PDF and DOCX generation with embedded vector letterheads."],
        ["Backend API Gateway", "FastAPI (Python 3.12), Uvicorn", "High-performance async REST API, automated OpenAPI/Swagger documentation, and validation schemas."],
        ["Hydrological Cat Engine", "NumPy, tifffile (GeoTIFF Affine), Shapely", "Raster tiepoint parsing, spatial coordinate sampling, matrix calculations, and CLIMADA compliance."],
        ["AI Ingestion Engine", "Custom NLP Entity Recognition, Pydantic", "Unstructured text parsing, contract extraction, and synthetic portfolio parameterization."]
    ]
    format_data_rows(tbl_tech, tech_data, col_w_t)
    doc.add_paragraph().paragraph_format.space_after = Pt(16)
    
    # Document Sign-off Footer
    sign_p = doc.add_paragraph()
    sign_p.paragraph_format.space_before = Pt(20)
    sign_run = sign_p.add_run("APPROVED FOR DEPLOYMENT: Kenya Reinsurance Corporation Catastrophe Underwriting Division © 2026")
    sign_run.font.name = "Calibri"
    sign_run.font.size = Pt(9.5)
    sign_run.font.bold = True
    sign_run.font.color.rgb = RGBColor(0, 38, 77)

    # Save to workspace root
    output_path = r"c:\Users\musiliandrew\OneDrive\Desktop\KenyaRE\Kenya_Re_Cat_System_Architecture_and_Workflow.docx"
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

    # Also save copy to user Downloads directory
    downloads_path = os.path.expanduser(r"~\Downloads\Kenya_Re_Cat_System_Architecture_and_Workflow.docx")
    try:
        doc.save(downloads_path)
        print(f"Also saved copy to: {downloads_path}")
    except Exception as e:
        print(f"Could not copy to Downloads: {e}")

if __name__ == "__main__":
    build_document()
