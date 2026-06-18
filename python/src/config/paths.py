"""
src/config/paths.py

CENTRAL PATH CONFIGURATION
---------------------------
Every script and notebook in this project imports BASE_DIR (and the
derived paths below) from here. Edit ONLY the line marked "EDIT THIS"
to point at your local project folder -- everything else is computed
relative to it automatically.

This file replaces hardcoded absolute paths like '/home/claude/...'
(used during initial development/testing in a sandboxed environment)
with a single, portable configuration point.
"""
import os
from pathlib import Path

# =========================================================================
# EDIT THIS -- set to the absolute path of your local 'neo-forecasting'
# folder. Examples:
#   Windows:  r"C:\Users\YourName\Documents\neo-forecasting"
#   Mac/Linux: "/Users/yourname/Documents/neo-forecasting"
#
# Leave as-is (the os.environ fallback) if you'd rather set it via an
# environment variable NEO_PROJECT_ROOT instead of editing this file.
# =========================================================================
BASE_DIR = Path(os.environ.get("NEO_PROJECT_ROOT", r"C:\Users\SATYAM\Desktop\ISM_Assignments\neo-forecasting"))

# -------------------------------------------------------------------------
# Derived paths (do not need editing)
# -------------------------------------------------------------------------
PYTHON_DIR = BASE_DIR / "python"

DATA_DIR = PYTHON_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
EXPORTS_DIR = DATA_DIR / "exports"

FIGURES_DIR = PYTHON_DIR / "figures"
RESULTS_DIR = PYTHON_DIR / "results"
MODELS_DIR = PYTHON_DIR / "models"

# Raw input files (place your downloaded CSVs here)
ASTEROID_CATALOG_CSV = RAW_DIR / "near_earth_asteroids_2025.csv"
CLOSE_APPROACH_CSV = RAW_DIR / "asteroid_close_approaches_2015_2035.csv"

# Processed file produced by 01_data_ingestion / preprocess.py
MERGED_PARQUET = PROCESSED_DIR / "merged_dataset.parquet"
MERGED_CSV = PROCESSED_DIR / "merged_dataset.csv"  # CSV fallback if parquet engine unavailable


def ensure_directories():
    """Create all expected directories if they don't already exist."""
    for d in [RAW_DIR, PROCESSED_DIR, EXPORTS_DIR, FIGURES_DIR, RESULTS_DIR, MODELS_DIR]:
        d.mkdir(parents=True, exist_ok=True)


def check_setup():
    """Quick sanity check -- run this first to confirm paths are configured
    correctly before running anything else."""
    print(f"BASE_DIR: {BASE_DIR}")
    if "PUT_YOUR_PROJECT_PATH_HERE" in str(BASE_DIR):
        print("\n*** WARNING: BASE_DIR has not been configured yet! ***")
        print("Edit src/config/paths.py (or set the NEO_PROJECT_ROOT environment")
        print("variable) to point at your local project folder before proceeding.\n")
        return False
    ensure_directories()
    print("\nChecking for raw data files:")
    for f in [ASTEROID_CATALOG_CSV, CLOSE_APPROACH_CSV]:
        status = "FOUND" if f.exists() else "MISSING -- place this file here"
        print(f"  [{status}] {f}")
    return True


if __name__ == "__main__":
    check_setup()
