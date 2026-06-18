from fastapi import FastAPI
from pathlib import Path
import json

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

YEARLY_NEO_COUNTS_PATH = "../../data/exports/time-series/yearly_neo_counts.json"
FORECAST_RESULTS_PATH = "../../data/exports/time-series/neo_forecast_results.json"

ASTEROIDS_DATA_PATH = "../../data/exports/asteroid_predictions.json"


def get_json_file(file_path: str | Path):
    path = Path(file_path)

    if not path.exists():
        return {"error": "File not found"}

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/")
def root():
    return {"message": "FastAPI is running"}


@app.get("/neo-counts")
def get_neo_counts():
    yearly_counts = get_json_file(YEARLY_NEO_COUNTS_PATH)
    forcast_results = get_json_file(FORECAST_RESULTS_PATH)
    return {
        "yearly_counts": yearly_counts,
        "forecast_results": forcast_results,
    }

@app.get("/asteroids")
def get_asteroids():
    return get_json_file(ASTEROIDS_DATA_PATH)