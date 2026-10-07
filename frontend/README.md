# Kenya Re · CAT Risk Intelligence Platform (Frontend)

**Hackathon Track:** Team A · Nairobi Urban Surface-Water (Pluvial) Flood Challenge  
**Organization:** Kenya Reinsurance Corporation  
**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Mapbox GL 3D, Recharts, Radix UI

---

## Architecture & Folder Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router (Routes)
│   │   ├── page.tsx            # Executive Landing & Methodology Walkthrough (/)
│   │   ├── console/            # Multi-Stakeholder Catastrophe Modeling Console (/console)
│   │   │   └── page.tsx
│   │   ├── layout.tsx          # Root Layout (Fonts, Metadata, Toaster)
│   │   └── globals.css         # Kenya Re Brand Palette & Layer Constraints
│   │
│   ├── components/             # Reusable UI & Domain Components
│   │   ├── cat/                # Catastrophe Modeling Widgets
│   │   │   ├── RiskMap.tsx     # 3D Mapbox GL Engine (600 pins, 24 hotspots, 3D extrusions)
│   │   │   ├── EPChart.tsx     # Exceedance Probability Loss Curve (Baseline vs AI)
│   │   │   ├── AnimatedNumber.tsx # Smooth KPI Number Counters
│   │   │   └── Overlays.tsx    # Progressive Disclosure Drawers & Modals:
│   │   │                       #   - AssetSheet (Risk dossier per property)
│   │   │                       #   - HotspotSheet (County flood zone drill-down)
│   │   │                       #   - PolicyModal (AI NLP Policy Ingestion & Pricing)
│   │   │                       #   - DrainageModal (AI 12-hotspot diagnostic)
│   │   │                       #   - VulnLab (Interactive JRC S-curve simulator)
│   │   │                       #   - GovernanceSheet (Actuarial & Synthetic data audit)
│   │   │                       #   - BriefDialog (Executive Underwriting Brief generator)
│   │   └── ui/                 # Accessible UI Primitives (Radix UI)
│   │       ├── button.tsx, badge.tsx, sheet.tsx, dialog.tsx, tabs.tsx,
│   │       ├── slider.tsx, switch.tsx, textarea.tsx, card.tsx, table.tsx,
│   │       └── ... (48 modular components)
│   │
│   ├── lib/                    # Core Models & Domain Logic
│   │   ├── cat-model.ts        # Catastrophe engine, JRC curves, 24 hotspots, NLP parser
│   │   └── utils.ts            # Class merging utility
│   │
│   ├── utils/                  # Helper Utilities
│   │   └── index.ts            # Formatting functions (formatKES, cn)
│   │
│   └── styles/                 # Global Styles & Animations
│       └── globals.css         # Kenya Re corporate tokens (#00264D, #D21245, #A6A7AB)
│
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
├── package.json
└── tsconfig.json
```

---

## Stakeholder Portals (Console Sidebar)

The interactive console at `/console` features dedicated workflow entrypoints separated by role:
1. **Underwriters**: AI Free-Text Policy Quoting, Property Risk Lookup, Rate & Deductible Calculator.
2. **Risk Analysts**: Exceedance Probability (EP) Curve, JRC Vulnerability S-Curves Lab, AAL Parameters.
3. **Portfolio Managers**: 3D Spatial Accumulation Map, 1-in-100 Yr PML Stress Test, Informal Stock Sub-Limits.
4. **County & Disaster Agencies**: 24 Official Hotspot Validation, AI Drainage Bottleneck Diagnostic.
5. **Cedants & Brokers**: XOL Treaty Attachment (1-in-10y), Reinsurance Placement Memorandum (.TXT).

---

## Setup & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) for the landing page or [http://localhost:3000/console](http://localhost:3000/console) for the risk console.

