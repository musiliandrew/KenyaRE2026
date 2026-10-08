"""
Converts backend/CAT_MODEL_ARCHITECTURE.md into an executive, publication-grade PDF
for Kenya Reinsurance Corporation using ReportLab.
Outputs to:
  - backend/CAT_MODEL_ARCHITECTURE.pdf
  - frontend/public/CAT_MODEL_ARCHITECTURE.pdf
"""

import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Preformatted,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

SRC_MD = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "CAT_MODEL_ARCHITECTURE.md"))
OUT_PDF_BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "CAT_MODEL_ARCHITECTURE.pdf"))
OUT_PDF_PUBLIC = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "CAT_MODEL_ARCHITECTURE.pdf"))


class NumberedCanvas(canvas.Canvas):
    """Adds running headers and 'Page X of Y' footers to all pages."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        page_w, page_h = letter
        
        # Suppress header and footer on cover page if page 1
        if self._pageNumber > 1:
            # Running Header
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(colors.HexColor("#00264D"))
            self.drawString(36, page_h - 26, "KENYA REINSURANCE CORPORATION")
            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawString(185, page_h - 26, "· CAT Risk Intelligence Platform — Architecture Blueprint")
            
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.6)
            self.line(36, page_h - 30, page_w - 36, page_h - 30)

        # Running Footer
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.6)
        self.line(36, 32, page_w - 36, 32)
        
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(36, 22, "CONFIDENTIAL · Kenya Re Catastrophe Modeling Blueprint · Team A (Nairobi Pluvial Flood)")
        
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(page_w - 36, 22, page_str)
        self.restoreState()


def format_inline_markdown(text: str) -> str:
    """Converts basic markdown bold, italic, code, and LaTeX math into ReportLab XML."""
    # LaTeX formulas conversion to readable text
    text = re.sub(r"\$\$(.*?)\$\$", r"<b>[\1]</b>", text)
    text = re.sub(r"\$(.*?)\$", r"<b>\1</b>", text)
    
    # Inline code
    text = re.sub(r"`([^`]+)`", r'<font face="Courier" color="#00264D"><b>\1</b></font>', text)
    
    # Bold **text**
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    
    # Italic *text*
    text = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", text)
    
    # Clean XML entity ampersands
    text = text.replace("& ", "&amp; ")
    return text


def build_pdf():
    with open(SRC_MD, "r", encoding="utf-8") as f:
        md_content = f.read()

    # Create document
    doc = SimpleDocTemplate(
        OUT_PDF_BACKEND,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=42,
        bottomMargin=42,
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#00264D"),
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#D21245"),
        spaceAfter=8,
    )

    meta_style = ParagraphStyle(
        "CoverMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12,
    )

    h1_style = ParagraphStyle(
        "H1Style",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#00264D"),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "H2Style",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "BodyStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=5,
    )

    bullet_style = ParagraphStyle(
        "BulletStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1E293B"),
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3,
    )

    code_style = ParagraphStyle(
        "CodeStyle",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor("#0F172A"),
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#1E293B"),
    )

    table_hdr_style = ParagraphStyle(
        "TableHdr",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10,
        textColor=colors.white,
    )

    flowables = []

    # Banner Block
    flowables.append(Paragraph("KENYA REINSURANCE CORPORATION", title_style))
    flowables.append(Paragraph("CAT MODELING ENGINEERING BLUEPRINT · NAIROBI FLOOD MODEL", subtitle_style))
    flowables.append(Paragraph(
        "<b>Event:</b> Kenya Re AI4I Hackathon 2026 &nbsp;|&nbsp; "
        "<b>Track:</b> Team A — Nairobi Urban Surface-Water (Pluvial) Flood &nbsp;|&nbsp; "
        "<b>Date:</b> October 2026",
        meta_style
    ))
    flowables.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#00264D"), spaceAfter=10))

    lines = md_content.split("\n")
    i = 0
    in_code_block = False
    code_lines = []

    while i < len(lines):
        line = lines[i]

        # Fenced code blocks
        if line.strip().startswith("```"):
            if not in_code_block:
                in_code_block = True
                code_lines = []
            else:
                in_code_block = False
                code_text = "\n".join(code_lines)
                
                # Wrap in styled table box
                p_code = Preformatted(code_text, code_style)
                code_table = Table([[p_code]], colWidths=[540])
                code_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ]))
                flowables.append(code_table)
                flowables.append(Spacer(1, 6))
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        stripped = line.strip()

        # Empty lines
        if not stripped:
            i += 1
            continue

        # Horizontal Rule
        if stripped in ["---", "***", "___"]:
            flowables.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceBefore=6, spaceAfter=8))
            i += 1
            continue

        # Markdown Tables
        if "|" in stripped and i + 1 < len(lines) and ("|---" in lines[i + 1] or "|:--" in lines[i + 1]):
            # Collect table rows
            table_raw_rows = []
            while i < len(lines) and "|" in lines[i].strip():
                row_line = lines[i].strip()
                if not ("|---" in row_line or "|:--" in row_line or "| ---" in row_line):
                    cells = [c.strip() for c in row_line.split("|")]
                    # remove empty edges from leading/trailing pipe
                    if cells and cells[0] == "":
                        cells = cells[1:]
                    if cells and cells[-1] == "":
                        cells = cells[:-1]
                    if cells:
                        table_raw_rows.append(cells)
                i += 1

            if table_raw_rows:
                # Format into ReportLab table cells
                col_count = max(len(r) for r in table_raw_rows)
                formatted_data = []
                for row_idx, r in enumerate(table_raw_rows):
                    row_cells = []
                    for c_idx in range(col_count):
                        raw_c = r[c_idx] if c_idx < len(r) else ""
                        fmt_c = format_inline_markdown(raw_c)
                        # Replace line breaks in table cells
                        fmt_c = fmt_c.replace("<br>", "<br/>")
                        style_to_use = table_hdr_style if row_idx == 0 else table_cell_style
                        row_cells.append(Paragraph(fmt_c, style_to_use))
                    formatted_data.append(row_cells)

                # Determine colWidths based on col_count
                if col_count == 3:
                    widths = [110, 150, 280]
                elif col_count == 2:
                    widths = [160, 380]
                elif col_count == 4:
                    widths = [80, 140, 160, 160]
                else:
                    widths = [540 / col_count] * col_count

                t = Table(formatted_data, colWidths=widths, repeatRows=1)
                t.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#00264D")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ]))
                flowables.append(Spacer(1, 4))
                flowables.append(t)
                flowables.append(Spacer(1, 6))
            continue

        # Headings
        if stripped.startswith("# ") and not stripped.startswith("## "):
            h_text = format_inline_markdown(stripped[2:].strip())
            flowables.append(Paragraph(h_text, h1_style))
            i += 1
            continue

        if stripped.startswith("## "):
            h_text = format_inline_markdown(stripped[3:].strip())
            flowables.append(Paragraph(h_text, h1_style))
            i += 1
            continue

        if stripped.startswith("### "):
            h_text = format_inline_markdown(stripped[4:].strip())
            flowables.append(Paragraph(h_text, h2_style))
            i += 1
            continue

        # Bullet points
        if stripped.startswith("- ") or stripped.startswith("* "):
            b_text = "&bull; " + format_inline_markdown(stripped[2:].strip())
            flowables.append(Paragraph(b_text, bullet_style))
            i += 1
            continue

        # Numbered lists
        num_match = re.match(r"^(\d+)\.\s+(.*)", stripped)
        if num_match:
            n_num, n_body = num_match.groups()
            b_text = f"<b>{n_num}.</b> " + format_inline_markdown(n_body)
            flowables.append(Paragraph(b_text, bullet_style))
            i += 1
            continue

        # Standard paragraph
        p_text = format_inline_markdown(stripped)
        flowables.append(Paragraph(p_text, body_style))
        i += 1

    # Build the document
    doc.build(flowables, canvasmaker=NumberedCanvas)
    print(f"Generated: {OUT_PDF_BACKEND}")

    # Copy to public folder
    import shutil
    shutil.copyfile(OUT_PDF_BACKEND, OUT_PDF_PUBLIC)
    print(f"Copied to: {OUT_PDF_PUBLIC}")


if __name__ == "__main__":
    build_pdf()

