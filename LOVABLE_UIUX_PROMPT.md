# Prompt for Lovable: Kenya Re AI Flood CAT Modeling Platform (Progressive Disclosure Edition)

Copy and paste the exact prompt below into **Lovable**:

```markdown
Create a world-class, minimalist, institutional-grade Catastrophe (CAT) Risk Modeling and Underwriting Platform for Kenya Re (Kenya Reinsurance Corporation). 

### CORE DESIGN PHILOSOPHY: "PROGRESSIVE DISCLOSURE"
Think: Apple Human Interface Guidelines meets Linear.app and Stripe Dashboard.
- STRICT RULE: NEVER overwhelm the user with walls of data or cluttered multi-panel grids at once.
- Practice radical minimalism and Progressive Disclosure: Serve only high-level, calm, glanceable insights on the main view. 
- Use focused Modals, Slide-over Drawers (Sheets), and intentional Action Triggers to reveal deeper analytical layers only when the user asks for them.
- Typography: Clean, refined font (Inter or Geist). 
- Generous whitespace, razor-sharp 1px subtle borders, smooth micro-transitions.
- Brand Color Palette:
  * Primary / Brand Identity: Kenya Re Navy Blue (`#00264D`)
  * Accent / Critical Risk / Call-to-Action: Kenya Re Red (`#D21245`)
  * Neutral / Borders / Muted Meta: Kenya Re Grey (`#A6A7AB`)
  * Surfaces: Clean Slate Canvas (`#F8F9FA`), pure White card surfaces (`#FFFFFF`), subtle borders (`#E5E7EB`). Dark navy accents (`#001833`).

---

### USER MENTAL FLOW OF THOUGHT (The Executive Journey):

1. **Step 1: The Executive Glance (First 15 Seconds)**:
   "What is Kenya Re's total flood exposure in Nairobi, and what is our 100-year peak disaster loss?"
2. **Step 2: Spatial & Scenario Inspection (On Demand)**:
   "Where are the danger zones? Let me click into a hotspot or property without cluttering the screen."
3. **Step 3: Actionable AI Underwriting (Task-Driven)**:
   "I have a new submission to price" or "I want the AI to audit our drainage blind spots."
4. **Step 4: Governance & Compliance (On Demand Drawer)**:
   "Show me the model assumptions, JRC curves, and synthetic data disclaimer when the auditor/judge asks."

---

### ARCHITECTURE & COMPONENT SPECIFICATION:

#### 1. Calm Top Navigation (Minimalist Header)
- Left: Kenya Re Mark + "KENYA RE · CAT INTELLIGENCE" (Navy Blue `#00264D`).
- Center: Segmented Scenario Pills [5-Yr (Common) | 10-Yr | 25-Yr | 50-Yr | 100-Yr (Extreme)]. Smooth active indicator.
- Right Action Buttons:
  * "+ Price New Policy" (Primary button in Kenya Re Red `#D21245` - opens Intake Modal)
  * "AI Drainage Audit" (Ghost button with glowing AI sparkle icon)
  * "Assumptions & Audit" (Minimal icon button - opens slide-over drawer)

#### 2. Main Executive View (Zero Clutter — Just 3 Hero Metrics + Primary Canvas)
A. **The 3-Metric Horizon (Glanceable Hero Cards)**:
   - **Total Exposure (TIV)**: `KES 4.82 Billion` (600 properties · Subtitle: "Nairobi County Boundary").
   - **1-in-100 Year PML**: `KES 842.6 Million` (`17.5%` portfolio loss · Red badge tag: "Extreme Scenario").
   - **Average Annual Loss (AAL)**: `KES 94.2 Million / yr` (Pure annual baseline premium).
   *(Each card has a subtle "Drill down →" hover action).*

B. **The Focused Hero Canvas (Dual View Toggle)**:
   A clean segment control at the top-right of the main canvas: `[ 🗺️ Spatial Risk Map ]` | `[ 📈 Exceedance Probability (EP) ]`.
   
   - **When "Spatial Risk Map" is selected**:
     * Full-width, high-contrast, clean map of Nairobi.
     * 600 building locations plotted with clean minimalist dots (Green for low hazard, Amber for moderate, Kenya Re Red `#D21245` for high hazard).
     * Filter chip overlay on map: [All (600)] [Informal Iron Sheet] [Semi-Permanent] [Permanent Masonry] [Toggle 24 Official Hotspots].
     * *NO popups blocking the map*: Clicking ANY building or hotspot opens the **Right Slide-over Sheet (Asset Dossier)**.

   - **When "Exceedance Probability (EP)" is selected**:
     * Full-width, ultra-clean interactive curve showing Return Period vs. Financial Loss.
     * Hovering scrubs an interactive crosshair showing exact Return Period, Exceedance %, and Loss in KES.
     * Clean toggle below chart: "Compare Baseline DEM vs. AI-Augmented Model".

---

### ON-DEMAND MODALS & SLIDE-OVER SHEETS (Preventing Clutter):

#### A. Right Slide-Over Sheet: "Asset Risk Dossier" (Trigger: Click any map pin)
- Slides out smoothly from the right edge without leaving the map.
- Header: Building ID (e.g. `NBO-0042`), Ward/Location, and Construction Badge.
- Key Specs: Floor Area (`120 m²`), Unit Cost (`KES 45,000/m²`), Total Insured Value (`KES 5.4M`).
- Hazard Breakdown: Flood depth estimate across 5-Yr, 25-Yr, and 100-Yr tiers.
- Calculated Financial Loss: Expected damage ratio (e.g. `48%`) and payout figure (`KES 2.59M`).
- Close button (`Esc` or `X`).

#### B. Focused Modal: "AI Policy Ingestion & Instant Pricing" (Trigger: "+ Price New Policy" button)
- Clean, distraction-free modal dialog (Stripe-checkout style).
- Textbox: "Describe the policy or portfolio in natural English..."
  * Pre-filled quick prompt chips:
    - `"3 permanent masonry warehouses in Westlands, 200m² each, KES 50,000/m²"`
    - `"15 informal iron sheet structures along Mathare riverbank"`
- Action: "Analyze & Quote with AI" button.
- Instant Result Card:
  * Auto-extracted structured fields (Class, Coordinates, Total Value).
  * Instant Hazard Lookup at location.
  * Recommended Flood Deductible & Pure Risk Premium in KES.
  * "Add to Portfolio Simulation" button.

#### C. Dedicated Modal: "AI Drainage-Gap Diagnostic" (Trigger: "AI Drainage Audit" button)
- High-impact modal demonstrating the hackathon's AI differentiator.
- Visual headline: "Addressing Nairobi's 12 Drainage Blind Spots".
- Side-by-side comparison:
  * **Traditional DEM Terrain Proxy**: Only detected 12 of 24 county hotspots (Missed: Kibera, Westlands, Lavington due to infrastructure blockage).
  * **AI Drainage-Augmented Layer**: Detects 22 of 24 hotspots (+83% accuracy).
- Impact on Solvency: Highlights `+KES 115M` in under-reserved capital that the standard model misses.
- Interactive toggle: "Apply AI Recalibration to Portfolio".

#### D. Interactive Modal: "Vulnerability & Depth-Damage Lab" (Trigger: "Inspect Vulnerability Curves" button)
- Clean interactive chart showing the S-curves (Sigmoid) based on **JRC / Huizinga et al.**
- Curves for `Informal Iron Sheet`, `Semi-Permanent`, and `Permanent Masonry`.
- Interactive Depth Slider: Drag from `0.0m` to `3.5m` to see live damage % update for all 3 classes simultaneously.

#### E. Slide-over Sheet: "Governance, Data Sources & Audit Trail" (Trigger: Top-right icon)
- Accessible anytime for judges and compliance officers.
- Tab 1: **Data Transparency**: Explains OSM Rivers, DEM terrain proxy, and Nairobi County 2026 hotspots.
- Tab 2: **Synthetic Portfolio Disclosure**: Explicit verification that the 600 properties are synthetic.
- Tab 3: **Actuarial Assumptions**: Return period mappings and 90% physical damage caps.

---

### VISUAL POLISH & REFINEMENT:
- Smooth Framer-Motion / Tailwind animations for modal pop-ins and sheet slide-overs.
- Lucide React icons (`ShieldAlert`, `Layers`, `Bot`, `Sparkles`, `SlidersHorizontal`, `ExternalLink`).
- Elegant number formatting (e.g., `KES 842.6M`).
- Clean pill tags and subtle micro-shadows (`shadow-sm`).
```
