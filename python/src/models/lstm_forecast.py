"""
src/models/lstm_forecast.py

STATUS: WRITTEN TO SPEC, NOT EXECUTED -- PyTorch could not be installed in
this offline sandbox. Written against the standard, stable
torch.nn.LSTM + torch.optim API (consistent across PyTorch 1.x-2.x).
Install with: pip install torch  (CPU-only is fine for a series this short;
no GPU/CUDA required for a project at this scale).

WHY AN LSTM HERE, AND AN HONEST CAVEAT: the architecture spec calls for an
LSTM on "trajectory sequences". Two real applications fit naturally:
  1. Forecasting the yearly close-approach COUNT series (the same target
     this project's tested Holt's-method/naive-baseline forecasting
     already covers in 03_ml_forecasting -- see that notebook for the
     important finding that ALL smooth trend methods, presumably including
     an LSTM, would fail to anticipate the 2026+ structural break in this
     particular dataset, since neural sequence models still only learn
     patterns present in their training window).
  2. Forecasting a single object's heliocentric distance-over-time curve
     (e.g. learning the shape of an orbit's distance profile from a
     sequence of propagated points) -- more of a curve-fitting/sequence-
     learning demonstration than a genuine forecasting need, since we
     already have an exact Kepler-equation solution for this (see
     kepler_propagator.py) and a neural network has no business
     approximating a problem we can already solve exactly. We include this
     mainly as the "trajectory sequence" demonstration the architecture
     calls for, with this limitation noted explicitly.

GIVEN ONLY 11 YEARS OF TRAINING DATA (2015-2025) for use case (1): an LSTM
is a LOT of parameters for so little data and will likely overfit badly
without heavy regularization/very small hidden size. This is flagged
in-code below. Consider this module primarily a template/demonstration
rather than a recommended production approach for this specific dataset
size -- the classical methods (Holt's, naive) tested elsewhere in this
project are more appropriate for an 11-point series.
"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("[WARN] PyTorch not installed. Install with: pip install torch")


if TORCH_AVAILABLE:
    class LSTMForecaster(nn.Module):
        """
        Minimal LSTM sequence forecaster: takes a window of past values,
        predicts the next value. hidden_size is kept SMALL by default
        (8-16) specifically because this project's real time series
        (close-approach counts, 11 yearly points) is far too short to
        support a large-capacity model without severe overfitting.
        """
        def __init__(self, input_size: int = 1, hidden_size: int = 8, num_layers: int = 1):
            super().__init__()
            self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
            self.fc = nn.Linear(hidden_size, 1)

        def forward(self, x):
            out, _ = self.lstm(x)
            return self.fc(out[:, -1, :])  # use last timestep's hidden state


def make_sequences(series: np.ndarray, window: int) -> tuple:
    """Convert a 1D series into (X, y) sliding-window supervised pairs."""
    X, y = [], []
    for i in range(len(series) - window):
        X.append(series[i:i + window])
        y.append(series[i + window])
    return np.array(X), np.array(y)


def train_lstm_forecaster(series: np.ndarray, window: int = 3, hidden_size: int = 8,
                              epochs: int = 200, lr: float = 0.01, val_split: float = 0.2):
    """
    Train an LSTMForecaster on a 1D series (e.g. yearly close-approach
    counts). Normalizes the series internally (LSTMs train far more
    reliably on standardized inputs).

    CAVEAT (repeated from the module docstring -- important): with only
    ~11 historical points in this project's real series, a held-out
    validation split leaves very few points to train OR validate on.
    Expect high variance in results between random seeds. This is a
    genuine, structural data-size limitation, not a bug to fix by tuning.
    """
    if not TORCH_AVAILABLE:
        raise ImportError("PyTorch is not installed. Run: pip install torch")

    series = np.asarray(series, dtype=np.float32)
    mean, std = series.mean(), series.std() + 1e-8
    norm_series = (series - mean) / std

    X, y = make_sequences(norm_series, window)
    X = X.reshape(-1, window, 1)

    n_val = max(1, int(len(X) * val_split))
    X_train, y_train = X[:-n_val], y[:-n_val]
    X_val, y_val = X[-n_val:], y[-n_val:]

    model = LSTMForecaster(input_size=1, hidden_size=hidden_size)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    loss_fn = nn.MSELoss()

    X_train_t = torch.tensor(X_train, dtype=torch.float32)
    y_train_t = torch.tensor(y_train, dtype=torch.float32).unsqueeze(-1)
    X_val_t = torch.tensor(X_val, dtype=torch.float32)
    y_val_t = torch.tensor(y_val, dtype=torch.float32).unsqueeze(-1)

    history = {"train_loss": [], "val_loss": []}
    for epoch in range(epochs):
        model.train()
        optimizer.zero_grad()
        pred = model(X_train_t)
        loss = loss_fn(pred, y_train_t)
        loss.backward()
        optimizer.step()

        model.eval()
        with torch.no_grad():
            val_pred = model(X_val_t)
            val_loss = loss_fn(val_pred, y_val_t)

        history["train_loss"].append(loss.item())
        history["val_loss"].append(val_loss.item())

    return model, {"mean": mean, "std": std, "window": window}, history


def forecast_future(model, norm_params: dict, series: np.ndarray, n_steps: int) -> np.ndarray:
    """Iteratively forecast n_steps ahead using a trained LSTMForecaster."""
    if not TORCH_AVAILABLE:
        raise ImportError("PyTorch is not installed.")

    mean, std, window = norm_params["mean"], norm_params["std"], norm_params["window"]
    norm_series = (np.asarray(series, dtype=np.float32) - mean) / std
    buffer = list(norm_series[-window:])

    model.eval()
    forecasts = []
    with torch.no_grad():
        for _ in range(n_steps):
            x = torch.tensor(np.array(buffer[-window:]).reshape(1, window, 1), dtype=torch.float32)
            pred_norm = model(x).item()
            forecasts.append(pred_norm)
            buffer.append(pred_norm)

    return np.array(forecasts) * std + mean


if __name__ == "__main__":
    if not TORCH_AVAILABLE:
        print("PyTorch not installed -- install it to run this test: pip install torch")
    else:
        print("Smoke-testing LSTMForecaster on a synthetic series (NOT the real")
        print("close-approach data -- run this against real data via the")
        print("05_ml_forecasting.ipynb notebook once PyTorch is installed locally).")
        synthetic = np.array([10, 12, 15, 14, 18, 22, 25, 24, 28, 30, 33], dtype=np.float32)
        model, norm_params, history = train_lstm_forecaster(synthetic, window=3, epochs=100)
        print(f"Final train loss: {history['train_loss'][-1]:.4f}, "
              f"val loss: {history['val_loss'][-1]:.4f}")
        future = forecast_future(model, norm_params, synthetic, n_steps=5)
        print(f"5-step forecast: {future}")
        print("\nIMPORTANT: re-run this against REAL data and inspect train vs val loss")
        print("carefully -- with only 11 real data points, overfitting is the expected")
        print("default outcome, not an edge case.")
