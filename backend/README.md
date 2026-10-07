# Kenya Re Catastrophe Risk Intelligence Platform · Backend

FastAPI Catastrophe Modeling API powering the Kenya Re AI4I Hackathon 2026 platform.

---

## Architecture

- **Pillar 1: Hazard Engine:** Spatial raster processing & pluvial susceptibility lookups.
- **Pillar 2: Vulnerability Engine:** Continuous JRC (Huizinga 2017) sigmoid depth-damage curves with building typology caps.
- **Pillar 3: Exposure Engine:** Ingestion and management of geocoded Nairobi building footprints.
- **Pillar 4: Financial Engine:** Loss aggregation, Exceedance Probability (EP) curve generation, AAL, and PML.
- **AI Layer:** Natural language exposure slip ingestion and underwriter risk briefing generator.

---

## Getting Started

### 1. Create and Activate Virtual Environment

```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate

# macOS / Linux:
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Copy the example environment file and set your keys:

```bash
cp .env.example .env
```

### 4. Run Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
