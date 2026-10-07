# Kenya Re · AI4I Hackathon 2026 (Team A · Nairobi Urban Flood Model)

**Organization:** Kenya Reinsurance Corporation  
**Challenge:** Team A · Nairobi Urban Surface-Water (Pluvial) Flood Catastrophe Model  
**Date:** 7th–9th October 2026  

---

## Overview

This repository contains the end-to-end Catastrophe (CAT) Risk Intelligence Platform developed for the **Kenya Re AI4I Hackathon 2026**. 

The platform bridges the African catastrophe risk modeling gap by translating open geospatial data, adapted JRC vulnerability curves, and machine-learning drainage diagnostics into actuarial loss curves, spatial accumulation analytics, and capital solvency intelligence for underwriters, risk analysts, exposure managers, county disaster bodies, and reinsurance brokers.

---

## Repository Structure

```
KenyaRE2026/
├── frontend/                     # Next.js 16 (App Router) + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── app/                  # Application Routes
│   │   │   ├── page.tsx          # Executive Landing & Methodology Page (/)
│   │   │   ├── console/          # Multi-Stakeholder Catastrophe Modeling Console (/console)
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx        # Root layout with fonts & metadata
│   │   ├── components/           # Components Library
│   │   │   ├── cat/              # Domain-Specific Modeling Widgets:
│   │   │   │   ├── RiskMap.tsx   # 3D Mapbox GL Engine (600 pins, 24 hotspots, 3D extrusions)
│   │   │   │   ├── EPChart.tsx   # Interactive Exceedance Probability Loss Curve
│   │   │   │   ├── AnimatedNumber.tsx # Smooth KPI number counters
│   │   │   │   └── Overlays.tsx  # Progressive disclosure Modals & Slide-over Sheets
│   │   │   └── ui/               # 48 Modular Radix UI Primitives (buttons, sheets, tabs, etc.)
│   │   ├── lib/                  # Core Modeling Engine
│   │   │   └── cat-model.ts      # 5 RP Tiers, adapted JRC S-Curves, 24 Hotspots, NLP Ingestion
│   │   ├── utils/                # Utility helpers
│   │   │   └── index.ts          # Formatting functions (formatKES, cn)
│   │   └── styles/               # Styling
│   │       └── globals.css       # Kenya Re Brand Tokens (#00264D, #D21245, #A6A7AB)
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── MUST_HAVES.md                 # Mandatory Deliverables & Evaluation Checklist
├── STAKEHOLDER_USER_FLOWS.md     # Stakeholder Journey Maps & Architecture
├── whatsAsked.md                 # Official Hackathon Problem Statement & Rubric
└── README.md                     # Root Project Documentation
```

---

## Key Features & Highlights

1. **4 Classic Modeling Pillars:**
   - **Hazard:** 5 calibrated event tiers (`5-Yr` Common to `100-Yr` Extreme) mapped to flood depths.
   - **Vulnerability:** Continuous sigmoidal S-curves adapted from **JRC / Huizinga (2017)** for 3 housing classes (`informal_iron_sheet`, `semi_permanent`, `permanent_masonry`) with 85%–90% physical caps.
   - **Exposure:** 600 geocoded Nairobi buildings totaling **KES 4.82B TIV** (verified synthetic).
   - **Financial Engine:** Individual damage calculations aggregated into an Exceedance Probability (EP) curve, **KES 842.6M PML**, and **KES 94.2M/yr AAL**.

2. **The AI Differentiator:**
   - **Drainage-Gap Recalibration:** Machine learning model that recovers 10 of the 12 hotspots missed by terrain proxies (Kibera, Westlands, etc.), revealing **+KES 115M** in unmodeled solvency risk.
   - **Natural Language Exposure Ingestion:** Instant AI parser that turns free-text policy slips into structured exposure rows and quotes flood pricing in 1.2s.

3. **5 Dedicated Stakeholder Portals:**
   - **👔 Underwriters:** Free-text policy intake, single asset dossier, technical rate/deductible calculation.
   - **📊 Risk Analysts:** Exceedance curve, JRC depth-damage lab, AAL and model parameter audit trail.
   - **🏢 Portfolio Managers:** 3D spatial accumulation map, 1-in-100 PML stress testing, housing sub-limits.
   - **🏛️ County & Disaster Agencies:** 24 official county flood hotspots validation, drainage bottleneck diagnostic.
   - **🤝 Cedants & Brokers:** XOL treaty layer attachment (1-in-10y), executive reinsurance brief (.TXT).

---

## Quickstart

```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the landing page or [http://localhost:3000/console](http://localhost:3000/console) for the risk console.

