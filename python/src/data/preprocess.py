"""
src/data/preprocess.py

STATUS: TESTED. This is the validated merge/clean/feature-engineering
logic from the project's earlier (working, verified) iteration, adapted to
this module structure and to use the central path config + parquet output
as specified in the architecture.

Run directly (python -m src.data.preprocess) or import clean_and_merge()
from a notebook.
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # allow `from src...` imports
from src.config.paths import (ASTEROID_CATALOG_CSV, CLOSE_APPROACH_CSV,
                                MERGED_PARQUET, MERGED_CSV, ensure_directories)


def load_raw(asteroid_csv: Path = ASTEROID_CATALOG_CSV,
             approach_csv: Path = CLOSE_APPROACH_CSV) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load the two raw source CSVs."""
    asteroids = pd.read_csv(asteroid_csv, low_memory=False)
    approaches = pd.read_csv(approach_csv, low_memory=False)
    return asteroids, approaches


def clean_and_merge(asteroids: pd.DataFrame, approaches: pd.DataFrame) -> pd.DataFrame:
    """
    Merge the asteroid orbital/physical catalog with close-approach events,
    clean keys, and engineer features.

    IMPORTANT (data leakage note, carried over from validation in the prior
    project iteration): 'moid_au' and 'H' together almost perfectly
    determine the 'pha' label (NASA's PHA definition IS moid_au<0.05 AND
    H<=22). Any model using 'pha' as a target should use TWO feature sets
    (with vs without moid_au/H) -- see src/models/risk_classifier.py.
    """
    asteroids = asteroids.copy()
    approaches = approaches.copy()

    asteroids["full_name"] = asteroids["full_name"].astype(str).str.strip()
    approaches["full_name"] = approaches["full_name"].astype(str).str.strip()

    approaches["close_approach_date"] = pd.to_datetime(approaches["close_approach_date"], errors="coerce")
    approaches["year"] = approaches["close_approach_date"].dt.year
    approaches["month"] = approaches["close_approach_date"].dt.month

    merged = approaches.merge(asteroids, on="full_name", how="inner")

    # Feature engineering (orbit shape + size/kinematic composites)
    merged["orbit_stretch"] = merged["ad"] - merged["q"]
    merged["interaction_index"] = 1 / (merged["moid_au"] + 1e-6)  # leakage-prone (derived from moid_au)
    merged["size_energy_index"] = merged["diameter_km"] ** 2
    merged["diameter_velocity_proxy"] = merged["diameter_km"] * merged["velocity_km_s"]
    merged["log_diameter"] = np.log10(merged["diameter_km"].clip(lower=1e-6))
    merged["log_distance_au"] = np.log10(merged["distance_au"].clip(lower=1e-9))

    return merged


def integrity_report(merged: pd.DataFrame) -> dict:
    """Print & return key integrity/leakage checks for the merged dataset."""
    report = {
        "n_rows": len(merged),
        "n_train_is_future_false": int((merged["is_future"] == False).sum()),
        "n_test_is_future_true": int((merged["is_future"] == True).sum()),
        "train_hazardous_rate": float(merged.loc[~merged["is_future"], "pha"].mean()),
        "test_hazardous_rate": float(merged.loc[merged["is_future"], "pha"].mean()),
        "leakage_rule_match_rate": float(
            ((merged["moid_au"] < 0.05) & (merged["H"] <= 22.0)).eq(merged["pha"]).mean()
        ),
    }
    print("=== Data integrity report ===")
    for k, v in report.items():
        print(f"  {k}: {v}")
    return report


def run(save_csv_fallback: bool = True) -> pd.DataFrame:
    ensure_directories()
    asteroids, approaches = load_raw()
    print(f"Loaded asteroids catalog: {asteroids.shape}, close approaches: {approaches.shape}")

    merged = clean_and_merge(asteroids, approaches)
    print(f"Merged dataset: {merged.shape}")
    integrity_report(merged)

    try:
        merged.to_parquet(MERGED_PARQUET, index=False)
        print(f"Saved: {MERGED_PARQUET}")
    except Exception as e:
        print(f"[WARN] Parquet save failed ({e}); falling back to CSV only. "
              f"Install 'pyarrow' or 'fastparquet' for parquet support: "
              f"pip install pyarrow")
    if save_csv_fallback:
        merged.to_csv(MERGED_CSV, index=False)
        print(f"Saved: {MERGED_CSV}")

    return merged


if __name__ == "__main__":
    run()
