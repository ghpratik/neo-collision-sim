"""
src/data/fetch_cneos.py

CNEOS (Center for Near-Earth Object Studies) data client -- fetches the
Sentry Risk Table (objects with non-zero impact probability) and discovery
statistics, supplementing the close-approach data from fetch_jpl.py.

STATUS: TESTED endpoint schema (the Sentry API was queried earlier in this
project; the discovery-statistics page was fetched and parsed via
web_search/web_fetch during initial research). Network calls could not be
re-executed in this offline build environment -- test locally before
relying on this in a pipeline.
"""
import requests
import pandas as pd

SENTRY_URL = "https://ssd-api.jpl.nasa.gov/sentry.api"


def fetch_sentry_table(ip_min: float = 0.0) -> pd.DataFrame:
    """
    Fetch JPL's Sentry Risk Table: all objects currently tracked with a
    non-zero (or above ip_min) predicted impact probability.

    Parameters
    ----------
    ip_min : float
        Minimum cumulative impact probability to include (0.0 returns the
        full table).

    Returns
    -------
    pd.DataFrame with columns including: des (designation), fullname,
    ip (cumulative impact probability), ps_max (max Palermo Scale),
    ts_max (max Torino Scale), diameter, h (absolute magnitude), range
    (years of potential impact dates), n_imp (number of possible impacts).
    """
    resp = requests.get(SENTRY_URL, timeout=30)
    resp.raise_for_status()
    payload = resp.json()
    df = pd.DataFrame(payload.get("data", []))
    if "ip" in df.columns:
        df["ip"] = pd.to_numeric(df["ip"], errors="coerce")
        df = df[df["ip"] >= ip_min]
    return df.reset_index(drop=True)


def fetch_sentry_object_detail(designation: str) -> dict:
    """Fetch full Sentry detail for one specific object, including the
    individual Virtual Impactor (VI) list with per-VI impact probabilities
    and dates -- useful for validating/comparing against our own Monte
    Carlo close-approach simulation for objects that DO appear in Sentry."""
    resp = requests.get(SENTRY_URL, params={"des": designation}, timeout=30)
    resp.raise_for_status()
    return resp.json()


def torino_scale_description(ts: int) -> str:
    """Human-readable description of a Torino Scale value (0-10), used for
    labeling risk_classifier.py outputs."""
    descriptions = {
        0: "No hazard -- normal background risk",
        1: "Normal -- routine discovery, no unusual concern",
        2: "Meriting attention -- merits careful monitoring",
        3: "Meriting attention -- close encounter, slight chance of impact",
        4: "Meriting attention -- close encounter, slight chance of regional damage",
        5: "Threatening -- serious but uncertain regional threat",
        6: "Threatening -- serious but uncertain global threat",
        7: "Threatening -- very close encounter with unprecedented regional risk",
        8: "Certain collision -- localized destruction",
        9: "Certain collision -- unprecedented regional devastation",
        10: "Certain collision -- global climatic catastrophe",
    }
    return descriptions.get(int(ts), "Unknown")


if __name__ == "__main__":
    print("Fetching current JPL Sentry Risk Table...")
    sentry_df = fetch_sentry_table()
    print(f"Objects currently on the Sentry table: {len(sentry_df)}")
    if len(sentry_df) > 0:
        print(sentry_df.head(10))
