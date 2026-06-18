"""
src/data/export_3d_scene.py

STATUS: WRITTEN TO SPEC, NOT EXECUTED HERE (no internet access in this build
environment). This is meant to be run on YOUR machine, where you now have
internet access and all dependencies installed.

PURPOSE
-------
Fetches REAL orbital elements (including Omega/omega, which the bulk catalog
CSV lacks) for a list of asteroids via JPL's Small-Body Database, propagates
every object + Earth through a shared time window using the project's
validated Kepler propagator, and exports the resulting 3D trajectories as
clean JSON files into data/exports/ for a Three.js frontend to consume
directly (no Python needed at render time).

WHAT THIS FIXES vs. the earlier notebooks: notebooks 04/05 could only place
Apophis correctly in 3D (it has a real state vector with full orientation),
while other catalog asteroids only had a, e, i, q (no Omega/omega), so their
true 3D tilt was unknown. This script closes that gap by fetching the missing
angles directly from JPL for every object you actually want to render.

BULK MODE (ALL is_future=True asteroids, ~3,885 objects as of this project's
dataset): set N_TOP_RISK_TO_INCLUDE = None below. At ~0.5s/request this takes
roughly 30-35 minutes. Two things added specifically for a run this size:
  - Progress is printed every 25 objects so you can see it's still running.
  - Results are checkpointed to disk every CHECKPOINT_EVERY objects, so a
    crash or interrupted connection near the end doesn't lose everything --
    re-running will pick up from the checkpoint rather than the full scene
    (see resume behavior in run() below).
  - Simple retry-with-backoff on network errors, since a single flaky
    request shouldn't lose you that object after a 30-minute run.

USAGE
-----
    cd python
    python -m src.data.export_3d_scene
"""
import sys
import json
import time
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from src.config.paths import EXPORTS_DIR, RESULTS_DIR, ensure_directories
from src.data.fetch_jpl import fetch_sbdb_record, sbdb_elements_to_dict
from src.orbital.kepler_propagator import propagate, julian_date, AU_KM

# -------------------------------------------------------------------------
# Configuration -- edit these
# -------------------------------------------------------------------------
ASTEROID_DESIGNATIONS = ["99942"]  # Apophis always included; add more SBDB
                                     # designations/names here, e.g. "101955"
                                     # (Bennu), or pull from your top-risk list below

AUTO_LOAD_TOP_RISK_FROM_RESULTS = True   # if True, also pulls designations
                                           # from results/asteroid_predictions_for_simulation.csv

# Set to an integer (e.g. 6) to limit to the top-N highest-risk objects, or
# to None to fetch ALL is_future=True asteroids in the results file
# (~3,885 objects -- expect ~30-35 minutes given the 0.5s polite-delay below).
N_TOP_RISK_TO_INCLUDE = None

SCENE_START_DATE = datetime(2024, 1, 1)
SCENE_END_DATE = datetime(2031, 1, 1)
N_FRAMES = 180  # reduced from 730 for bulk runs -- with thousands of bodies,
                 # 730 frames each would produce a very large JSON file.
                 # 180 frames over ~7 years is roughly 2-week resolution,
                 # still smooth for an animated view. Raise back to 730 if
                 # you go back to a small N_TOP_RISK_TO_INCLUDE.

REQUEST_PAUSE_SEC = 0.5       # politeness delay between API calls
MAX_RETRIES = 3                # retry attempts per object on network error
PROGRESS_EVERY = 25             # print a progress line every N objects
CHECKPOINT_EVERY = 200          # save partial progress to disk every N objects
CHECKPOINT_PATH = None          # set below in run(), inside EXPORTS_DIR

# EARTH_ELEMENTS = {  # standard J2000 elements (radians, AU)
#     "a": 1.00000011, "e": 0.01671022, "i": 0.0, "Omega": 0.0,
#     "omega": np.radians(102.94719), "M0": np.radians(357.51716),
#     "epoch_jd": 2451545.0,
# }

# # Standard J2000 heliocentric ecliptic orbital elements for the remaining
# # planets (NASA JPL planetary fact sheet values), in the same format as
# # EARTH_ELEMENTS above, for inclusion in the 3D scene.
# OTHER_PLANETS_ELEMENTS = {
#     "mercury": {"a": 0.38709893, "e": 0.20563069, "i": np.radians(7.00487),
#                  "Omega": np.radians(48.33167), "omega": np.radians(77.45645),
#                  "M0": np.radians(252.25084), "epoch_jd": 2451545.0, "color": "#9C9C9C"},
#     "venus": {"a": 0.72333199, "e": 0.00677323, "i": np.radians(3.39471),
#                "Omega": np.radians(76.68069), "omega": np.radians(131.53298),
#                "M0": np.radians(181.97973), "epoch_jd": 2451545.0, "color": "#E6C27A"},
#     "mars": {"a": 1.52366231, "e": 0.09341233, "i": np.radians(1.85061),
#               "Omega": np.radians(49.57854), "omega": np.radians(336.04084),
#               "M0": np.radians(355.45332), "epoch_jd": 2451545.0, "color": "#C1440E"},
#     "jupiter": {"a": 5.20336301, "e": 0.04839266, "i": np.radians(1.30530),
#                  "Omega": np.radians(100.55615), "omega": np.radians(14.75385),
#                  "M0": np.radians(34.40438), "epoch_jd": 2451545.0, "color": "#D8A66F"},
#     "saturn": {"a": 9.53707032, "e": 0.05415060, "i": np.radians(2.48446),
#                 "Omega": np.radians(113.71504), "omega": np.radians(92.43194),
#                 "M0": np.radians(49.94432), "epoch_jd": 2451545.0, "color": "#E3CFA9"},
#     "uranus": {"a": 19.19126393, "e": 0.04716771, "i": np.radians(0.76986),
#                 "Omega": np.radians(74.22988), "omega": np.radians(170.96424),
#                 "M0": np.radians(313.23218), "epoch_jd": 2451545.0, "color": "#A9D6E5"},
#     "neptune": {"a": 30.06896348, "e": 0.00858587, "i": np.radians(1.76917),
#                  "Omega": np.radians(131.72169), "omega": np.radians(44.97135),
#                  "M0": np.radians(304.88003), "epoch_jd": 2451545.0, "color": "#5B7FE3"},
# }


def get_designations() -> list:
    designations = list(ASTEROID_DESIGNATIONS)
    if AUTO_LOAD_TOP_RISK_FROM_RESULTS:
        preds_path = RESULTS_DIR / "asteroid_predictions_for_simulation.csv"
        if preds_path.exists():
            preds = pd.read_csv(preds_path).drop_duplicates(subset="full_name", keep="first")
            preds_sorted = preds.sort_values("risk_score", ascending=False)
            top = preds_sorted if N_TOP_RISK_TO_INCLUDE is None else preds_sorted.head(N_TOP_RISK_TO_INCLUDE)
            # designation column should hold the JPL-queryable string (e.g. "2003 QQ47")
            for d in top["designation"].dropna().tolist():
                if d not in designations:
                    designations.append(d)
            print(f"[INFO] Loaded {len(top)} designations from {preds_path.name} "
                  f"({'ALL is_future=True objects' if N_TOP_RISK_TO_INCLUDE is None else f'top {N_TOP_RISK_TO_INCLUDE}'})")
        else:
            print(f"[INFO] {preds_path} not found -- skipping auto top-risk load. "
                  f"Run notebook 06 first if you want this, or just edit "
                  f"ASTEROID_DESIGNATIONS manually above.")
    return designations


def extract_diameter_km(sbdb_response: dict) -> float:
    """
    JPL SBDB returns 'phys_par' as a LIST of records (same shape as
    'orbit.elements'), e.g. [{'name': 'H', 'value': '19.09', ...},
    {'name': 'diameter', 'value': '0.34', 'units': 'km', ...}, ...] --
    NOT a flat dict. Find the 'diameter' record and pull its value.

    Returns None if no diameter is published for this object (common for
    smaller/less-studied objects -- not every NEO has a measured diameter).
    """
    phys_par = sbdb_response.get("phys_par", [])
    if not isinstance(phys_par, list):
        return None
    for record in phys_par:
        if record.get("name") == "diameter" and record.get("value") is not None:
            try:
                return float(record["value"])
            except (TypeError, ValueError):
                return None
    return None


def fetch_real_elements(designation: str, max_retries: int = MAX_RETRIES) -> dict:
    """
    Fetch and parse real orbital elements for one object from JPL SBDB.
    Returns a dict ready for propagate(): a, e, i, Omega, omega, M0 (radians,
    AU), plus epoch_jd, full_name, and pha flag.

    Retries on transient network errors (timeouts, connection resets) with
    a short linear backoff -- worth having for a bulk run of thousands of
    requests, where hitting at least one flaky connection is likely.
    """
    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            resp = fetch_sbdb_record(designation, covariance=False, phys_par=True)
            break
        except (requests.exceptions.RequestException, requests.exceptions.Timeout) as e:
            last_error = e
            if attempt < max_retries:
                time.sleep(1.5 * attempt)  # linear backoff: 1.5s, 3s, ...
            continue
    else:
        raise RuntimeError(f"Network error after {max_retries} attempts: {last_error}")

    flat = sbdb_elements_to_dict(resp)
    v = flat["values"]

    required = ["a", "e", "i", "om", "w", "ma"]
    missing = [k for k in required if v.get(k) is None]
    if missing:
        raise ValueError(f"SBDB response for '{designation}' is missing elements: {missing}")

    return {
        "designation": designation,
        "full_name": resp.get("object", {}).get("fullname", designation),
        "pha": resp.get("object", {}).get("pha"),
        "diameter_km": extract_diameter_km(resp),
        "a": v["a"], "e": v["e"], "i": np.radians(v["i"]),
        "Omega": np.radians(v["om"]), "omega": np.radians(v["w"]),
        "M0": np.radians(v["ma"]),
        "epoch_jd": float(flat["epoch_jd"]),
    }


def propagate_object(elements: dict, time_window_jd: np.ndarray) -> dict:
    """Propagate one object across the shared time window, return positions
    in AU (suitable for direct use in a Three.js scene -- 1 unit = 1 AU is a
    common, convenient convention; scale in the frontend as needed)."""
    r, v = propagate(elements["a"], elements["e"], elements["i"],
                       elements["Omega"], elements["omega"], elements["M0"],
                       elements["epoch_jd"], time_window_jd)
    return {"x": r[0].tolist(), "y": r[1].tolist(), "z": r[2].tolist()}


def run():
    ensure_directories()
    checkpoint_path = EXPORTS_DIR / "scene_3d_checkpoint.json"
    out_path = EXPORTS_DIR / "scene_3d.json"

    designations = get_designations()
    n_total = len(designations)
    print(f"Fetching real orbital elements for {n_total} object(s)...")
    if n_total > 100:
        est_minutes = n_total * REQUEST_PAUSE_SEC / 60
        print(f"[INFO] This is a bulk run -- estimated minimum time: ~{est_minutes:.0f} minutes "
              f"(longer if any retries occur).")

    time_window_jd = np.linspace(
        julian_date(SCENE_START_DATE), julian_date(SCENE_END_DATE), N_FRAMES
    )
    time_window_iso = pd.date_range(SCENE_START_DATE, SCENE_END_DATE, periods=N_FRAMES)

    # Resume from a checkpoint if one exists from a previous interrupted run
    bodies = {}
    already_done = set()
    if checkpoint_path.exists():
        with open(checkpoint_path) as f:
            checkpoint = json.load(f)
        bodies = checkpoint.get("bodies", {})
        already_done = set(bodies.keys())
        print(f"[INFO] Resuming from checkpoint: {len(already_done)} bodies already fetched.")

    scene = {
        "metadata": {
            "generated": datetime.now().isoformat(),
            "start_date": SCENE_START_DATE.isoformat(),
            "end_date": SCENE_END_DATE.isoformat(),
            "n_frames": N_FRAMES,
            "units": "AU (1 unit = 1 astronomical unit); positions are heliocentric ecliptic",
        },
        "time_jd": time_window_jd.tolist(),
        "time_iso": [t.isoformat() for t in time_window_iso],
        "bodies": bodies,
    }

    # if "earth" not in scene["bodies"]:
    #     scene["bodies"]["earth"] = {
    #         "name": "Earth", "type": "planet", "color": "#4C72B0",
    #         "positions": propagate_object(EARTH_ELEMENTS, time_window_jd),
    #     }
    # if "sun" not in scene["bodies"]:
    #     scene["bodies"]["sun"] = {
    #         "name": "Sun", "type": "star", "color": "#FDB813",
    #         "positions": {"x": [0.0] * N_FRAMES, "y": [0.0] * N_FRAMES, "z": [0.0] * N_FRAMES},
    #     }
    # for planet_name, planet_elements in OTHER_PLANETS_ELEMENTS.items():
    #     if planet_name not in scene["bodies"]:
    #         scene["bodies"][planet_name] = {
    #             "name": planet_name.capitalize(), "type": "planet",
    #             "color": planet_elements["color"],
    #             "positions": propagate_object(planet_elements, time_window_jd),
    #         }

    n_ok, n_failed = 0, 0
    failed_designations = []

    for idx, des in enumerate(designations, start=1):
        body_key_guess = des.replace(" ", "_")
        if body_key_guess in already_done:
            continue  # already fetched in a prior run, skip re-fetching

        try:
            elements = fetch_real_elements(des)
            positions = propagate_object(elements, time_window_jd)
            body_key = elements["designation"].replace(" ", "_")
            scene["bodies"][body_key] = {
                "name": elements["full_name"],
                "type": "asteroid",
                "pha": elements["pha"],
                "diameter_km": elements["diameter_km"],
                "color": "#C44E52" if elements["pha"] else "#55A868",
                "orbital_elements": {
                    "a_au": elements["a"], "e": elements["e"],
                    "i_deg": np.degrees(elements["i"]),
                    "Omega_deg": np.degrees(elements["Omega"]),
                    "omega_deg": np.degrees(elements["omega"]),
                    "epoch_jd": elements["epoch_jd"],
                },
                "positions": positions,
            }
            n_ok += 1
        except Exception as e:
            n_failed += 1
            failed_designations.append((des, str(e)))
            print(f"  [WARN] Failed to fetch/propagate '{des}': {e}")

        if idx % PROGRESS_EVERY == 0 or idx == n_total:
            print(f"  Progress: {idx}/{n_total} processed "
                  f"({n_ok} ok, {n_failed} failed)")

        if idx % CHECKPOINT_EVERY == 0:
            with open(checkpoint_path, "w") as f:
                json.dump(scene, f)
            print(f"  [checkpoint saved at {idx}/{n_total}]")

        time.sleep(REQUEST_PAUSE_SEC)

    with open(out_path, "w") as f:
        json.dump(scene, f)
    if checkpoint_path.exists():
        checkpoint_path.unlink()  # clean up checkpoint once the full run succeeds

    size_mb = out_path.stat().st_size / 1e6
    print(f"\nSaved {out_path} ({size_mb:.1f} MB, {len(scene['bodies'])} bodies, {N_FRAMES} frames)")
    print(f"Succeeded: {n_ok}, Failed: {n_failed}")
    if failed_designations:
        print(f"Failed designations (first 10 of {len(failed_designations)}):")
        for des, err in failed_designations[:10]:
            print(f"  {des}: {err}")
    if size_mb > 50:
        print("[INFO] File is large for a web page to load directly. Consider serving it")
        print("       from an API route with pagination, or reducing N_FRAMES further,")
        print("       rather than bundling it as a single static asset.")


if __name__ == "__main__":
    run()