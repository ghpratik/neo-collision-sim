# 🚀 NEO Collision Forecasting & Orbital Simulation

A scientific visualization and forecasting platform for analyzing **Near-Earth Objects (NEOs)**, predicting close approaches, estimating impact probabilities, and visualizing orbital trajectories in a real-time 3D solar system.

The project combines **orbital mechanics**, **Monte Carlo uncertainty propagation**, **machine learning forecasting**, and **interactive 3D visualization** to provide an end-to-end workflow for studying potentially hazardous asteroids.

---

## ✨ Features

### Orbital Mechanics

- Fetch real NEO orbital data from NASA databases
- Propagate asteroid trajectories using Keplerian dynamics
- Model orbital perturbations:
  - J2 gravitational effects
  - Solar radiation pressure
  - Yarkovsky effect

- Calculate Minimum Orbit Intersection Distance (MOID)

### Uncertainty Analysis

- Monte Carlo orbit propagation
- Covariance-based trajectory sampling
- Probability distribution of future close approaches
- Impact corridor and uncertainty cone generation

### Machine Learning Forecasting

- Miss-distance prediction
- Long-term orbital trend forecasting
- Impact probability estimation
- Risk classification using engineered orbital features

### Risk Assessment

- Palermo Scale calculation
- Torino Scale calculation
- Custom risk scoring model
- Hazard ranking and visualization

### Interactive 3D Visualization

- Real-time solar system rendering
- Animated planetary orbits
- NEO trajectory visualization
- Timeline-based simulation playback
- Risk heatmap visualization
- Detailed asteroid inspection panel

---

# 🏗 Architecture

```text
┌─────────────────────────────┐
│      NASA Data Sources      │
│  SBDB • Horizons • CNEOS    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      Data Processing        │
│ Cleaning • Validation       │
│ Feature Engineering         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   Orbital Propagation       │
│ Poliastro • Astropy         │
│ Perturbation Models         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Monte Carlo Simulations     │
│ Orbit Uncertainty Analysis  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  ML Forecasting Models      │
│ LSTM • Prophet • XGBoost    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ JSON Export Layer           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Next.js Visualization App   │
│ React Three Fiber + Charts  │
└─────────────────────────────┘
```

---

# 📂 Project Structure

```text
neo-forecasting/
│
├── python/
│   ├── data/
│   │   ├── raw/
│   │   ├── processed/
│   │   └── exports/
│   │
│   ├── notebooks/
│   │   ├── 01_data_ingestion.ipynb
│   │   ├── 02_eda_orbital_elements.ipynb
│   │   ├── 03_feature_engineering.ipynb
│   │   ├── 04_monte_carlo_simulation.ipynb
│   │   ├── 05_ml_forecasting.ipynb
│   │   └── 06_risk_scoring.ipynb
│   │
│   └── src/
│       ├── data/
│       ├── orbital/
│       ├── simulation/
│       ├── models/
│       ├── export/
│       └── api/
│
└── web/
    ├── app/
    ├── components/
    ├── lib/
    └── public/data/
```

---

# 🔬 Data Sources

The project uses publicly available datasets and APIs from NASA and related astronomical services.

| Source                  | Purpose                                |
| ----------------------- | -------------------------------------- |
| NASA SBDB               | Orbital elements and asteroid metadata |
| NASA CNEOS              | Close approach records                 |
| NASA Horizons           | High-precision ephemerides             |
| JPL Small-Body Database | Object characteristics                 |

---

# ⚙️ Technology Stack

## Backend (Scientific Computing)

| Technology      | Purpose                   |
| --------------- | ------------------------- |
| Python          | Data processing           |
| Astropy         | Astronomical calculations |
| Poliastro       | Orbit propagation         |
| Rebound         | N-body simulation         |
| NumPy           | Numerical computing       |
| Pandas / Polars | Data manipulation         |
| PyTorch         | Deep learning             |
| Prophet         | Time-series forecasting   |
| XGBoost         | Risk classification       |
| FastAPI         | Optional API layer        |

---

## Frontend

| Technology        | Purpose            |
| ----------------- | ------------------ |
| Next.js           | Web framework      |
| TypeScript        | Type safety        |
| Three.js          | 3D rendering       |
| React Three Fiber | Declarative 3D     |
| Drei              | R3F utilities      |
| Zustand           | State management   |
| Recharts          | Data visualization |
| Framer Motion     | Animations         |

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/ghpratik/neo-collision-sim.git

cd neo-collision-sim
```

---

## Python Setup

Create a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Or manually:

```bash
pip install \
poliastro \
astropy \
astroquery \
rebound \
numpy \
pandas \
polars \
torch \
prophet \
darts \
xgboost \
fastapi \
uvicorn \
pyarrow
```

---

## Frontend Setup

```bash
cd web

pnpm install
```

Run development server:

```bash
pnpm run dev
```

---

# 📈 Workflow

### Phase 1: Data Acquisition

- Fetch orbital elements
- Fetch close-approach records
- Normalize units
- Validate datasets

### Phase 2: Orbit Propagation

- Generate future trajectories
- Calculate MOID
- Apply perturbation models

### Phase 3: Monte Carlo Simulation

- Sample orbital uncertainties
- Propagate clones
- Estimate impact probabilities

### Phase 4: Forecasting

- Train prediction models
- Forecast miss distances
- Predict risk categories

### Phase 5: Visualization

- Export trajectories to JSON
- Render orbits in 3D
- Animate future close approaches

---

# 📊 Output Data Format

Example asteroid metadata:

```typescript
interface AsteroidSummary {
  id: string;
  name: string;
  type: string;
  pha: boolean;
  diameter_km: number | null;
  color: string;
  risk_score: number;
  predicted_hazard_probability: number | null;
  close_approach_date: string | null;
}
```

---

# 🎯 Future Enhancements

- Real-time orbit propagation API
- WebAssembly orbital calculations
- GPU-accelerated N-body simulations
- AI anomaly detection
- Earth impact visualization
- Space mission planning tools
- Multi-object collision analysis
- Live NASA data synchronization

---

# 📜 License

MIT License

---

# ⚠️ Disclaimer

This project is intended for educational, research, and visualization purposes.

Official impact assessments should always be obtained from NASA's Sentry System and other authoritative astronomical organizations.
