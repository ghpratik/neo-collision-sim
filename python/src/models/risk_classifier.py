"""
src/models/risk_classifier.py

STATUS: WRITTEN TO SPEC, NOT EXECUTED -- xgboost could not be installed in
this offline sandbox (confirmed: pip install fails with no network route).
The code below follows xgboost's standard, stable scikit-learn-compatible
API (XGBClassifier/XGBRegressor), which has been consistent across
versions 1.x-2.x, so it should run as-is on a normal local install:
    pip install xgboost

VALIDATION DONE INSTEAD: the exact same modeling logic (temporal train/test
split on is_future, the two-feature-set leakage fix, sample weighting for
class imbalance) was fully tested in this project using
sklearn.ensemble.HistGradientBoostingClassifier as a substitute -- see the
project's tested ml_models.py for confirmed, real metrics (no-leakage
hazard classifier ROC-AUC ~0.985; MOID regression R^2 ~0.62). Swapping the
estimator class to XGBClassifier/XGBRegressor as done here should produce
similar or slightly better results (xgboost and HistGradientBoosting are
both gradient-boosted tree implementations with comparable capacity), but
RE-RUN AND CONFIRM the metrics locally before reporting xgboost-specific
numbers anywhere -- do not assume they will be identical.

This module also adds Torino/Palermo-style composite risk scoring, which
the original architecture spec called for (the real Torino/Palermo Scales
are NASA/JPL's own official metrics computed from impact probability and
energy -- we do not have impact-probability data for arbitrary catalog
objects, only Sentry-listed ones, so this module computes an ANALOGOUS
illustrative composite score from available features, clearly distinguished
from the official scales).
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import joblib

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from src.config.paths import MERGED_CSV, MODELS_DIR, RESULTS_DIR

try:
    from xgboost import XGBClassifier, XGBRegressor
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("[WARN] xgboost not installed. Install with: pip install xgboost")
    print("       Falling back to sklearn.HistGradientBoosting* (tested, validated")
    print("       substitute used during this project's development) so this module")
    print("       still runs -- but install xgboost to use it as originally specified.")
    from sklearn.ensemble import HistGradientBoostingClassifier as XGBClassifier
    from sklearn.ensemble import HistGradientBoostingRegressor as XGBRegressor

from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, balanced_accuracy_score, precision_score,
                              recall_score, f1_score, roc_auc_score, r2_score,
                              mean_absolute_error, mean_squared_error)
from sklearn.utils.class_weight import compute_sample_weight

FEATURES_FULL = ["diameter_km", "H", "e", "a", "i", "q", "ad", "per_y",
                   "moid_au", "n", "condition_code", "orbit_stretch",
                   "interaction_index", "size_energy_index", "diameter_velocity_proxy"]

FEATURES_NO_LEAK = ["diameter_km", "e", "a", "i", "q", "ad", "per_y",
                      "n", "condition_code", "orbit_stretch", "size_energy_index",
                      "diameter_velocity_proxy", "velocity_km_s"]

MOID_FEATURES = ["diameter_km", "e", "a", "i", "q", "ad", "per_y", "n",
                   "condition_code", "orbit_stretch", "size_energy_index"]


def load_merged(path=MERGED_CSV) -> pd.DataFrame:
    df = pd.read_csv(path, low_memory=False)
    df["pha"] = df["pha"].astype(bool).astype(int)
    return df


def train_hazard_classifier(df: pd.DataFrame, features: list, label: str = "model",
                                use_xgboost_native_imbalance: bool = True):
    """
    Train an XGBoost hazard classifier with a real temporal split
    (is_future flag) and class-imbalance handling via scale_pos_weight
    (xgboost's native, recommended approach for imbalanced binary
    classification -- generally preferred over manual oversampling).
    """
    train_df = df[df["is_future"] == False]
    test_df = df[df["is_future"] == True]

    X_train, y_train = train_df[features], train_df["pha"]
    X_test, y_test = test_df[features], test_df["pha"]

    if XGBOOST_AVAILABLE and use_xgboost_native_imbalance:
        scale_pos_weight = (y_train == 0).sum() / max((y_train == 1).sum(), 1)
        model = XGBClassifier(
            n_estimators=300, max_depth=6, learning_rate=0.1,
            scale_pos_weight=scale_pos_weight, eval_metric="auc",
            random_state=42, n_jobs=-1,
        )
        model.fit(X_train.fillna(X_train.median()), y_train)
    else:
        # sklearn HGB fallback path -- uses sample_weight instead of
        # scale_pos_weight (HGB has no native imbalance parameter)
        sw = compute_sample_weight("balanced", y_train)
        model = XGBClassifier(random_state=42, max_iter=300)
        model.fit(X_train.fillna(X_train.median()), y_train, sample_weight=sw)

    y_pred = model.predict(X_test.fillna(X_train.median()))
    y_proba = model.predict_proba(X_test.fillna(X_train.median()))[:, 1]

    metrics = {
        "label": label,
        "accuracy": accuracy_score(y_test, y_pred),
        "balanced_accuracy": balanced_accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_proba),
        "xgboost_used": XGBOOST_AVAILABLE,
    }
    return model, metrics, y_pred, y_proba


def train_moid_regressor(df: pd.DataFrame, features: list = MOID_FEATURES, log_target: bool = True):
    """
    Trains BOTH an XGBoost regressor AND a Random Forest regressor for
    MOID, and returns whichever scores higher.

    IMPORTANT (found during this project's validated testing, carried over
    here intentionally): when this exact modeling task was tested with
    sklearn estimators, Random Forest (R^2 ~0.62) outperformed Hist
    Gradient Boosting (the tree-boosting alternative) on this specific
    MOID-regression task -- gradient boosting is not automatically better
    just because it's a more modern algorithm. This module compares both
    rather than assuming XGBoost wins by default; ALWAYS compare multiple
    model families on a new target/feature-set combination rather than
    committing to one algorithm a priori.
    """
    from sklearn.ensemble import RandomForestRegressor

    train_df = df[df["is_future"] == False]
    test_df = df[df["is_future"] == True]

    X_train, y_train = train_df[features], train_df["moid_au"]
    X_test, y_test = test_df[features], test_df["moid_au"]

    fit_target = np.log10(y_train.clip(lower=1e-9)) if log_target else y_train
    X_train_filled = X_train.fillna(X_train.median())
    X_test_filled = X_test.fillna(X_train.median())

    candidates = {}

    if XGBOOST_AVAILABLE:
        xgb_model = XGBRegressor(n_estimators=300, max_depth=6, learning_rate=0.1,
                                    random_state=42, n_jobs=-1)
    else:
        xgb_model = XGBRegressor(random_state=42, max_iter=300)
    xgb_model.fit(X_train_filled, fit_target)
    candidates["xgboost_or_hgb"] = xgb_model

    rf_model = RandomForestRegressor(n_estimators=300, random_state=42, n_jobs=-1)
    rf_model.fit(X_train_filled, fit_target)
    candidates["random_forest"] = rf_model

    best_name, best_model, best_pred, best_r2 = None, None, None, -np.inf
    all_metrics = {}
    for name, model in candidates.items():
        pred = model.predict(X_test_filled)
        if log_target:
            pred = 10 ** pred
        r2 = r2_score(y_test, pred)
        all_metrics[name] = {
            "MAE": mean_absolute_error(y_test, pred),
            "RMSE": mean_squared_error(y_test, pred) ** 0.5,
            "R2": r2,
        }
        if r2 > best_r2:
            best_name, best_model, best_pred, best_r2 = name, model, pred, r2

    metrics = {**all_metrics[best_name], "best_model": best_name,
                "all_candidates": all_metrics, "xgboost_used": XGBOOST_AVAILABLE}
    return best_model, metrics, best_pred


def composite_risk_score(diameter_km: pd.Series, velocity_km_s: pd.Series,
                            moid_au: pd.Series, hazard_probability: pd.Series) -> pd.Series:
    """
    ILLUSTRATIVE composite risk score, INSPIRED BY (but not equivalent to)
    the real Palermo Technical Impact Hazard Scale, which NASA/JPL compute
    from actual impact probability x kinetic energy x a reference
    background-risk normalization, for objects with a confirmed
    Virtual-Impactor solution (Sentry-listed objects only).

    We do not have per-object impact probabilities for the broader catalog
    (only Sentry-listed objects have those, fetchable via
    fetch_cneos.fetch_sentry_table) -- so this composite instead combines
    our own model outputs (predicted hazard probability) with physical
    severity proxies (size, speed -> kinetic energy scales with both) and
    orbital proximity (1/MOID), as a ranking tool for the broader catalog.

    For genuine Torino/Palermo Scale values, use fetch_cneos.py to pull the
    real values for any Sentry-listed object directly from JPL, rather than
    approximating them here.
    """
    kinetic_energy_proxy = diameter_km ** 3 * velocity_km_s ** 2  # mass scales ~diameter^3
    proximity_factor = 1 / (moid_au + 1e-6)
    raw_score = kinetic_energy_proxy * proximity_factor * (hazard_probability + 0.01)
    # normalize to a 0-10 illustrative scale via rank-percentile (robust to outliers)
    return raw_score.rank(pct=True) * 10


if __name__ == "__main__":
    print(f"xgboost available: {XGBOOST_AVAILABLE}")
    df = load_merged()
    print(f"Loaded {len(df)} rows")

    print("\n--- Training no-leakage hazard classifier ---")
    model_nl, metrics_nl, y_pred_nl, y_proba_nl = train_hazard_classifier(
        df, FEATURES_NO_LEAK, label="no_leakage"
    )
    print(metrics_nl)

    print("\n--- Training MOID regressor ---")
    model_moid, metrics_moid, pred_moid = train_moid_regressor(df)
    print(metrics_moid)

    joblib.dump(model_nl, MODELS_DIR / "risk_classifier_no_leak.joblib")
    joblib.dump(model_moid, MODELS_DIR / "moid_regressor.joblib")
    pd.DataFrame([metrics_nl]).to_csv(RESULTS_DIR / "risk_classifier_metrics.csv", index=False)
    print(f"\nSaved models to {MODELS_DIR}")
