"""
PDF Report Service — generates a multi-page PDF using ReportLab.
"""
import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# Colour palette
DARK    = colors.HexColor("#0a0f1a")
BLUE    = colors.HexColor("#00b3b3")
CYAN    = colors.HexColor("#00d4ff")
GREEN   = colors.HexColor("#10b981")
RED     = colors.HexColor("#ef4444")
AMBER   = colors.HexColor("#f59e0b")
GRAY    = colors.HexColor("#64748b")
LIGHT   = colors.HexColor("#f1f5f9")
WHITE   = colors.white

def _styles():
    base = getSampleStyleSheet()
    return {
        "h1":     ParagraphStyle("h1",     fontSize=22, textColor=DARK,  fontName="Helvetica-Bold", spaceAfter=6),
        "h2":     ParagraphStyle("h2",     fontSize=15, textColor=DARK,  fontName="Helvetica-Bold", spaceAfter=4, spaceBefore=12),
        "h3":     ParagraphStyle("h3",     fontSize=12, textColor=BLUE,  fontName="Helvetica-Bold", spaceAfter=4, spaceBefore=8),
        "body":   ParagraphStyle("body",   fontSize=10, textColor=colors.HexColor("#374151"), leading=15, spaceAfter=4),
        "small":  ParagraphStyle("small",  fontSize=9,  textColor=GRAY,  leading=13),
        "quote":  ParagraphStyle("quote",  fontSize=10, textColor=colors.HexColor("#374151"), leftIndent=18, borderPad=6, leading=14, fontName="Helvetica-Oblique"),
        "label":  ParagraphStyle("label",  fontSize=8,  textColor=GRAY,  fontName="Helvetica-Bold", spaceBefore=6),
        "center": ParagraphStyle("center", fontSize=11, textColor=DARK,  alignment=TA_CENTER),
    }

def generate_pdf(call: dict, analysis: dict) -> bytes:
    """Generate a full PDF report and return as bytes."""
    buf    = io.BytesIO()
    doc    = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=2.5*cm, bottomMargin=2*cm)
    S      = _styles()
    story  = []

    c = call or {}
    a = analysis or {}
    cls  = a.get("classification") or {}
    sent = a.get("sentiment_data") or {}
    fps  = a.get("failure_points") or []
    crs  = a.get("coaching_responses") or []
    brf  = a.get("pre_call_briefing") or {}

    verdict_color = {"Strong": GREEN, "Neutral": AMBER, "Weak": AMBER, "Lost": RED}.get(a.get("verdict", "Neutral"), AMBER)

    # ── COVER ─────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph("SalesIQ", ParagraphStyle("brand", fontSize=28, textColor=CYAN, fontName="Helvetica-Bold", alignment=TA_CENTER)))
    story.append(Paragraph("AI Sales Intelligence Report", ParagraphStyle("subtitle", fontSize=14, textColor=GRAY, alignment=TA_CENTER, spaceAfter=20)))
    story.append(HRFlowable(width="100%", thickness=1, color=BLUE, spaceAfter=20))

    # Cover table
    cover_data = [
        ["Prospect",     c.get("prospect_name") or "—"],
        ["Company",      c.get("company") or "—"],
        ["Rep",          c.get("rep_name") or "—"],
        ["Call Date",    c.get("call_date") or "—"],
        ["Call Type",    cls.get("call_type") or "—"],
        ["Duration",     f"{cls.get('duration_minutes', 0):.0f} min"],
        ["Score",        f"{a.get('overall_score', 0):.0f}/100"],
        ["Verdict",      a.get("verdict") or "—"],
    ]
    t = Table(cover_data, colWidths=[4*cm, 12*cm])
    t.setStyle(TableStyle([
        ("FONTNAME",     (0,0),(-1,-1), "Helvetica"),
        ("FONTNAME",     (0,0),(0,-1),  "Helvetica-Bold"),
        ("FONTSIZE",     (0,0),(-1,-1), 10),
        ("TEXTCOLOR",    (0,0),(0,-1),  GRAY),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[LIGHT, WHITE]),
        ("GRID",         (0,0),(-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ("PADDING",      (0,0),(-1,-1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}", S["small"]))
    story.append(PageBreak())

    # ── CALL SUMMARY ──────────────────────────────────────────────────────────
    story.append(Paragraph("Call Summary & Classification", S["h2"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=8))
    story.append(Paragraph(cls.get("summary") or "No summary available.", S["body"]))

    if cls.get("key_topics"):
        story.append(Paragraph("Key Topics", S["label"]))
        story.append(Paragraph(", ".join(cls["key_topics"]), S["body"]))

    story.append(Spacer(1, 0.5*cm))

    # Sentiment overview
    story.append(Paragraph("Sentiment Overview", S["h3"]))
    sent_data = [
        ["Engagement Level",    sent.get("engagement_level") or "—"],
        ["Prospect Final Mood", sent.get("prospect_final_sentiment") or "—"],
        ["Mood Shifts",         str(len(sent.get("mood_shifts") or []))],
        ["Emotional Triggers",  ", ".join(sent.get("emotional_triggers") or []) or "—"],
    ]
    st = Table(sent_data, colWidths=[5*cm, 11*cm])
    st.setStyle(TableStyle([
        ("FONTNAME",   (0,0),(-1,-1), "Helvetica"),
        ("FONTNAME",   (0,0),(0,-1),  "Helvetica-Bold"),
        ("FONTSIZE",   (0,0),(-1,-1), 10),
        ("TEXTCOLOR",  (0,0),(0,-1),  GRAY),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[LIGHT, WHITE]),
        ("GRID",       (0,0),(-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ("PADDING",    (0,0),(-1,-1), 6),
    ]))
    story.append(st)
    story.append(PageBreak())

    # ── FAILURE ANALYSIS ──────────────────────────────────────────────────────
    story.append(Paragraph("Failure Analysis & Coaching", S["h2"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=8))

    if not fps:
        story.append(Paragraph("No significant failure points detected.", S["body"]))
    else:
        for i, fp in enumerate(fps):
            cr = crs[i] if i < len(crs) else {}
            sev_color = {"critical": RED, "major": AMBER, "minor": BLUE}.get(fp.get("severity",""), GRAY)

            block = []
            block.append(Paragraph(f"Failure #{i+1} — {fp.get('root_cause_category','Unknown')} [{fp.get('timestamp','')}]", S["h3"]))
            block.append(Paragraph(fp.get("what_happened",""), S["body"]))

            if fp.get("transcript_excerpt"):
                block.append(Paragraph(f'"{fp["transcript_excerpt"]}"', S["quote"]))

            if cr.get("alternative_phrasing"):
                block.append(Paragraph("Better approach:", ParagraphStyle("green_label", fontSize=9, textColor=GREEN, fontName="Helvetica-Bold", spaceBefore=6)))
                block.append(Paragraph(cr["alternative_phrasing"], S["body"]))

            if cr.get("why_it_works"):
                block.append(Paragraph("Why it works:", ParagraphStyle("blue_label", fontSize=9, textColor=BLUE, fontName="Helvetica-Bold")))
                block.append(Paragraph(cr["why_it_works"], S["small"]))

            block.append(Spacer(1, 0.3*cm))
            story.append(KeepTogether(block))

    story.append(PageBreak())

    # ── PRE-CALL BRIEFING ────────────────────────────────────────────────────
    story.append(Paragraph("Pre-Call Briefing Sheet", S["h2"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=8))

    if brf.get("recommended_approach"):
        story.append(Paragraph("Recommended Approach", S["h3"]))
        story.append(Paragraph(brf["recommended_approach"], S["body"]))

    if brf.get("prospect_triggers"):
        story.append(Paragraph("Prospect Triggers", S["h3"]))
        for t in brf["prospect_triggers"]:
            story.append(Paragraph(f"• {t}", S["body"]))

    if brf.get("objections_to_expect"):
        story.append(Paragraph("Objections to Expect", S["h3"]))
        for obj in brf["objections_to_expect"]:
            story.append(Paragraph(f"Objection: {obj.get('objection','')}", S["body"]))
            story.append(Paragraph(f"Response: {obj.get('suggested_response','')}", S["small"]))
            story.append(Spacer(1, 0.2*cm))

    if brf.get("opening_lines"):
        story.append(Paragraph("Opening Lines", S["h3"]))
        for line in brf["opening_lines"]:
            story.append(Paragraph(f'"{line}"', S["quote"]))

    if brf.get("questions_to_ask"):
        story.append(Paragraph("Questions to Ask", S["h3"]))
        for q in brf["questions_to_ask"]:
            story.append(Paragraph(f"• {q}", S["body"]))

    story.append(PageBreak())

    # ── TRANSCRIPT APPENDIX ────────────────────────────────────────────────────
    story.append(Paragraph("Appendix: Full Transcript", S["h2"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=8))
    transcript = a.get("transcript") or "Transcript not available."
    # Split into paragraphs to avoid one massive block
    for para in transcript.split("\n"):
        if para.strip():
            story.append(Paragraph(para.strip()[:500], S["small"]))

    doc.build(story)
    return buf.getvalue()
