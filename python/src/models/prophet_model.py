"""
src/models/prophet_model.py

STATUS: WRITTEN TO SPEC, NOT EXECUTED -- Prophet could not be installed in
this offline sandbox. Written against Prophet's standard API (the modern
package is named 'prophet' on PyPI; the older name 'fbprophet' is
deprecated -- install with: pip install prophet). Prophet's own
installation can be finicky (it depends on pystan/cmdstanpy under the
hood) -- if `pip install prophet` fails, consult Prophet's official
installation docs for platform-specific instructions (conda is often
more reliable than pip for this package on Windows).

WHY PROPHET HERE, AND AN IMPORTANT CAVEAT CARRIED OVER FROM TESTED WORK:
Prophet is designed for series with strong seasonality + holiday effects
and at least daily/weekly granularity -- it is generally NOT a great fit
for an 11-point YEARLY series (this project's real close-approach count
series), since Prophet's strength (modeling sub-annual seasonality) simply
doesn't apply to yearly-aggregated data. We include this module because
the architecture spec calls for it, but the TESTED Holt's-method/naive-
baseline comparison already in this project (notebooks/05_ml_forecasting,
ported from the validated forecasting.py) is the more appropriate tool for
that specific series, and already produced the project's most interesting
finding: a real structural break in 2026+ that no smooth-trend method
anticipated. Prophet would face exactly the same fundamental limitation --
no method can forecast a regime change from historical trend data alone.

A MORE NATURALLY PROPHET-SHAPED USE CASE, if extending this project: a
DAILY or MONTHLY close-approach-event count series (rather than yearly),
which has enough sub-annual structure for Prophet's seasonality components
to add real value. A scaffold for that is included below as
fit_prophet_daily_counts().
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("[WARN] Prophet not installed. Install with: pip install prophet")


def fit_prophet_yearly_counts(yearly_series: pd.Series, n_forecast_years: int = 10) -> dict:
    """
    Fit Prophet to a yearly count series (Prophet's expected input format:
    a DataFrame with columns 'ds' (datestamp) and 'y' (value)).

    CAVEAT (see module docstring): yearly data has no sub-annual
    seasonality for Prophet to model, so this largely degenerates to
    Prophet's trend component alone -- similar in spirit to Holt's linear
    trend method (already tested elsewhere in this project), but without
    the benefit of Prophet's actual strengths. Included for architecture
    completeness; compare its output against the tested Holt's/naive
    baseline results before treating it as an improvement.

    Returns
    -------
    dict with 'model', 'forecast' (Prophet's full forecast DataFrame,
    including yhat, yhat_lower, yhat_upper uncertainty bounds).
    """
    if not PROPHET_AVAILABLE:
        raise ImportError("Prophet is not installed. Run: pip install prophet")

    df = pd.DataFrame({
        "ds": pd.to_datetime(yearly_series.index.astype(str) + "-01-01"),
        "y": yearly_series.values,
    })

    model = Prophet(yearly_seasonality=False, weekly_seasonality=False, daily_seasonality=False,
                      growth="linear")
    model.fit(df)

    future = model.make_future_dataframe(periods=n_forecast_years, freq="YS")
    forecast = model.predict(future)

    return {"model": model, "forecast": forecast, "input_df": df}


def fit_prophet_daily_counts(approach_dates: pd.Series, n_forecast_days: int = 365) -> dict:
    """
    A more naturally Prophet-shaped use case: aggregate close-approach
    EVENTS to a daily count series and fit Prophet, which can then
    legitimately model weekly/yearly seasonality patterns if any exist in
    when close approaches are recorded/announced (note: this would mostly
    reflect OBSERVATIONAL/REPORTING patterns, e.g. survey schedules, rather
    than true astronomical seasonality, since asteroid encounters
    themselves have no calendar-seasonal physical cause).

    Parameters
    ----------
    approach_dates : pd.Series of datetime64 values (one row per
        close-approach event) -- e.g. df['close_approach_date'] from the
        project's merged dataset.
    """
    if not PROPHET_AVAILABLE:
        raise ImportError("Prophet is not installed. Run: pip install prophet")

    daily_counts = approach_dates.dt.floor("D").value_counts().sort_index()
    full_range = pd.date_range(daily_counts.index.min(), daily_counts.index.max(), freq="D")
    daily_counts = daily_counts.reindex(full_range, fill_value=0)

    df = pd.DataFrame({"ds": daily_counts.index, "y": daily_counts.values})

    model = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False)
    model.fit(df)

    future = model.make_future_dataframe(periods=n_forecast_days, freq="D")
    forecast = model.predict(future)

    return {"model": model, "forecast": forecast, "input_df": df}


if __name__ == "__main__":
    if not PROPHET_AVAILABLE:
        print("Prophet not installed -- install it to run this test: pip install prophet")
    else:
        print("Smoke-testing fit_prophet_yearly_counts on a synthetic series...")
        synthetic = pd.Series([1127, 1421, 1570, 1657, 1938, 2337, 2501, 2607, 2521, 2504, 2661],
                                index=range(2015, 2026))
        result = fit_prophet_yearly_counts(synthetic, n_forecast_years=10)
        print(result["forecast"][["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(10))
        print("\nCompare this forecast against the project's TESTED Holt's-method /")
        print("naive-baseline results (notebooks/05_ml_forecasting) -- on the REAL")
        print("series, smooth trend extrapolation (which is fundamentally what")
        print("Prophet's linear-growth trend does here) was shown to fail badly")
        print("against actual 2026+ values due to a structural break in the data.")
