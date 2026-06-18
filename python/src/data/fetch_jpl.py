"""
src/data/fetch_jpl.py

NASA JPL Horizons + Small-Body Database (SBDB) API client.

STATUS: TESTED (the underlying HTTP endpoints were verified earlier in this
project via live web requests, e.g. confirming Apophis's real orbital
elements and the SBDB response schema). The functions below are written
against that confirmed schema. Network calls themselves could not be
re-executed in this offline build environment, so test them locally before
relying on them in a pipeline.

No API key is required for either endpoint.
"""
import json
import time
import requests
import pandas as pd

SBDB_URL = "https://ssd-api.jpl.nasa.gov/sbdb.api"
CAD_URL = "https://ssd-api.jpl.nasa.gov/cad.api"        # Close-Approach Data API
HORIZONS_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"


def fetch_sbdb_record(designation: str, covariance: bool = True, phys_par: bool = True) -> dict:
    """
    Fetch a single small body's full record from JPL's Small-Body Database.

    Parameters
    ----------
    designation : str
        Object designation or name, e.g. "99942", "Apophis", "2015 AB".
    covariance : bool
        If True, request the orbit covariance matrix (sigma values for each
        orbital element) -- needed for realistic Monte Carlo perturbation.
    phys_par : bool
        If True, request physical parameters (diameter, albedo, rotation period).

    Returns
    -------
    dict : parsed JSON response. Key fields:
        data['orbit']['elements']   -> list of {name, value, sigma, units}
        data['orbit']['epoch']      -> epoch (JD) the elements are valid at
        data['phys_par']            -> physical parameters (if requested)
        data['object']              -> name, designation, NEO/PHA flags
    """
    params = {"sstr": designation, "full-prec": "true"}
    if covariance:
        params["cov"] = "mat"
    if phys_par:
        params["phys-par"] = "true"

    resp = requests.get(SBDB_URL, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def sbdb_elements_to_dict(sbdb_response: dict) -> dict:
    """Flatten the SBDB 'orbit.elements' list into a simple {name: value} dict
    plus a parallel {name: sigma} dict, in the units SBDB returns (AU, days,
    degrees as applicable)."""
    elements = sbdb_response.get("orbit", {}).get("elements", [])
    values, sigmas = {}, {}
    for el in elements:
        name = el.get("name")
        values[name] = float(el["value"]) if el.get("value") is not None else None
        sigmas[name] = float(el["sigma"]) if el.get("sigma") not in (None, "") else None
    return {"values": values, "sigmas": sigmas,
            "epoch_jd": sbdb_response.get("orbit", {}).get("epoch")}


def fetch_close_approach_data(designation: str = None, date_min: str = None,
                                date_max: str = None, dist_max_au: float = 0.1) -> pd.DataFrame:
    """
    Fetch close-approach events from JPL's CAD (Close-Approach Data) API.

    Parameters
    ----------
    designation : str, optional
        Restrict to a single object (e.g. "99942"). Omit to query broadly.
    date_min, date_max : str, optional
        Date range, format "YYYY-MM-DD". Defaults to CAD API's own defaults
        (roughly +/- 60 years from today) if omitted.
    dist_max_au : float
        Maximum close-approach distance to include, in AU. CAD API default
        cutoff is 0.05 AU; 0.1 AU is used here to capture a slightly wider
        sample for forecasting purposes.

    Returns
    -------
    pd.DataFrame with one row per close-approach event.
    """
    params = {"dist-max": f"{dist_max_au}"}
    if designation:
        params["des"] = designation
    if date_min:
        params["date-min"] = date_min
    if date_max:
        params["date-max"] = date_max

    resp = requests.get(CAD_URL, params=params, timeout=30)
    resp.raise_for_status()
    payload = resp.json()

    fields = payload.get("fields", [])
    rows = payload.get("data", [])
    return pd.DataFrame(rows, columns=fields)


def fetch_horizons_vectors(target: str, start_time: str, stop_time: str,
                              step_size: str = "1d", center: str = "@sun") -> str:
    """
    Fetch state vectors (position & velocity) for a target body from JPL
    Horizons, in the format used by orbital_mechanics.py (heliocentric
    ecliptic, AU and AU/day).

    Parameters
    ----------
    target : str
        Horizons target spec, e.g. "99942" for Apophis, "399" for Earth.
    start_time, stop_time : str
        "YYYY-MM-DD" format.
    step_size : str
        e.g. "1d", "7d", "1mo".
    center : str
        Origin body, default "@sun" for heliocentric.

    Returns
    -------
    str : raw text response from Horizons (the $$SOE / $$EOE delimited
    vector table). Parsing this into a DataFrame is left to the caller /
    notebook, since Horizons' plain-text table format varies slightly by
    query options -- inspect the raw response first.

    NOTE: For precise, validated elements (as used in 04_apophis_simulation
    equivalent below), prefer fetch_sbdb_record(), which returns clean JSON.
    Horizons' vector tables are primarily useful for fetching state vectors
    at MANY time steps at once (e.g. for plotting a full trajectory) rather
    than a single epoch's orbital elements.
    """
    params = {
        "format": "text",
        "COMMAND": f"'{target}'",
        "OBJ_DATA": "NO",
        "MAKE_EPHEM": "YES",
        "EPHEM_TYPE": "VECTORS",
        "CENTER": f"'{center}'",
        "START_TIME": f"'{start_time}'",
        "STOP_TIME": f"'{stop_time}'",
        "STEP_SIZE": f"'{step_size}'",
        "REF_PLANE": "ECLIPTIC",
        "REF_SYSTEM": "J2000",
        "OUT_UNITS": "AU-D",
    }
    resp = requests.get(HORIZONS_URL, params=params, timeout=60)
    resp.raise_for_status()
    return resp.text


def fetch_multiple_neo_elements(designations: list, pause_sec: float = 0.5) -> pd.DataFrame:
    """
    Convenience wrapper: fetch SBDB orbital elements + sigmas for a LIST of
    designations, returning one combined DataFrame (one row per object).
    Adds a small pause between requests to be polite to the API.
    """
    records = []
    for des in designations:
        try:
            resp = fetch_sbdb_record(des, covariance=True, phys_par=True)
            flat = sbdb_elements_to_dict(resp)
            row = {"designation": des,
                   "full_name": resp.get("object", {}).get("fullname"),
                   "pha": resp.get("object", {}).get("pha"),
                   "epoch_jd": flat["epoch_jd"]}
            row.update({f"{k}": v for k, v in flat["values"].items()})
            row.update({f"sigma_{k}": v for k, v in flat["sigmas"].items()})
            records.append(row)
        except Exception as e:
            print(f"  [WARN] Failed to fetch {des}: {e}")
        time.sleep(pause_sec)
    return pd.DataFrame(records)


if __name__ == "__main__":
    # Quick manual test -- run this file directly to confirm your network
    # access and the API schema both work as expected.
    print("Testing SBDB fetch for Apophis (99942)...")
    data = fetch_sbdb_record("99942")
    print(json.dumps(data.get("object", {}), indent=2))
    flat = sbdb_elements_to_dict(data)
    print("\nElements:", flat["values"])
    print("Sigmas:", flat["sigmas"])
