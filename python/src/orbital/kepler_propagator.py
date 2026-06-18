"""
Orbital mechanics utilities - two-body (Keplerian) propagation
Part of: Asteroid Collision Risk - Simulation & Forecasting Project

All distances in AU, time in days, angles in radians internally.
MU_SUN is the Sun's gravitational parameter in AU^3/day^2 (Gaussian
gravitational constant squared, k^2).
"""
import numpy as np
from datetime import datetime

MU_SUN = 0.00029591220828559  # AU^3 / day^2
AU_KM = 1.495978707e8          # km per AU


def julian_date(dt: datetime) -> float:
    """Convert a UTC datetime to Julian Date."""
    y, m = dt.year, dt.month
    d = dt.day + (dt.hour + dt.minute / 60 + dt.second / 3600) / 24
    if m <= 2:
        y -= 1
        m += 12
    A = y // 100
    B = 2 - A + A // 4
    jd = int(365.25 * (y + 4716)) + int(30.6001 * (m + 1)) + d + B - 1524.5
    return jd


def solve_kepler(M, e, tol=1e-12, max_iter=100):
    """Solve Kepler's equation M = E - e*sin(E) for E (Newton-Raphson). M, E in radians."""
    M = np.atleast_1d(M).astype(float)
    E = np.where(np.abs(M) < np.pi, M, np.pi * np.sign(M))  # initial guess
    # better initial guess
    E = M + e * np.sin(M)
    for _ in range(max_iter):
        f = E - e * np.sin(E) - M
        fp = 1 - e * np.cos(E)
        dE = -f / fp
        E += dE
        if np.all(np.abs(dE) < tol):
            break
    return E


def cartesian_to_elements(r, v, mu=MU_SUN):
    """Convert heliocentric Cartesian state vector (AU, AU/day) to classical
    orbital elements: a, e, i, Omega, omega, M (angles in radians)."""
    r = np.asarray(r, dtype=float)
    v = np.asarray(v, dtype=float)
    r_norm = np.linalg.norm(r)
    v_norm = np.linalg.norm(v)

    h = np.cross(r, v)
    h_norm = np.linalg.norm(h)

    k_hat = np.array([0.0, 0.0, 1.0])
    n_vec = np.cross(k_hat, h)
    n_norm = np.linalg.norm(n_vec)

    e_vec = (np.cross(v, h) / mu) - r / r_norm
    e = np.linalg.norm(e_vec)

    energy = v_norm ** 2 / 2 - mu / r_norm
    a = -mu / (2 * energy)

    i = np.arccos(np.clip(h[2] / h_norm, -1, 1))

    if n_norm > 1e-12:
        Omega = np.arctan2(n_vec[1], n_vec[0])
        cos_omega = np.dot(n_vec, e_vec) / (n_norm * e)
        omega = np.arccos(np.clip(cos_omega, -1, 1))
        if e_vec[2] < 0:
            omega = 2 * np.pi - omega
    else:  # equatorial orbit
        Omega = 0.0
        omega = np.arctan2(e_vec[1], e_vec[0])

    cos_nu = np.dot(e_vec, r) / (e * r_norm)
    nu = np.arccos(np.clip(cos_nu, -1, 1))
    if np.dot(r, v) < 0:
        nu = 2 * np.pi - nu

    # true anomaly -> eccentric anomaly -> mean anomaly
    E = 2 * np.arctan2(np.sqrt(1 - e) * np.sin(nu / 2), np.sqrt(1 + e) * np.cos(nu / 2))
    M = E - e * np.sin(E)
    M = M % (2 * np.pi)

    return a, e, i, Omega % (2 * np.pi), omega % (2 * np.pi), M


def elements_to_cartesian(a, e, i, Omega, omega, M, mu=MU_SUN):
    """Convert classical orbital elements (angles in radians) to heliocentric
    Cartesian state vector (AU, AU/day)."""
    E = solve_kepler(M, e)
    nu = 2 * np.arctan2(np.sqrt(1 + e) * np.sin(E / 2), np.sqrt(1 - e) * np.cos(E / 2))

    r_mag = a * (1 - e * np.cos(E))

    # position & velocity in the orbital (perifocal) plane
    p = a * (1 - e ** 2)
    r_pf = r_mag * np.array([np.cos(nu), np.sin(nu), np.zeros_like(nu)])
    h = np.sqrt(mu * p)
    v_pf = (mu / h) * np.array([-np.sin(nu), e + np.cos(nu), np.zeros_like(nu)])

    if r_pf.ndim == 1:
        r_pf = r_pf.reshape(3, 1)
        v_pf = v_pf.reshape(3, 1)

    cO, sO = np.cos(Omega), np.sin(Omega)
    co, so = np.cos(omega), np.sin(omega)
    ci, si = np.cos(i), np.sin(i)

    # Rotation matrix: perifocal -> heliocentric ecliptic
    R = np.array([
        [cO * co - sO * si * 0 - sO * so * ci, -(cO * so + sO * co * ci), sO * si],
        [sO * co + cO * co * 0 + cO * so * ci, -(sO * so - cO * co * ci), -cO * si],
        [so * si, co * si, ci],
    ])
    # The rotation above uses the standard 3-1-3 (Omega, i, omega) Euler sequence:
    R = np.array([
        [cO * co - sO * so * ci, -cO * so - sO * co * ci, sO * si],
        [sO * co + cO * so * ci, -sO * so + cO * co * ci, -cO * si],
        [so * si, co * si, ci],
    ])

    r_xyz = R @ r_pf
    v_xyz = R @ v_pf

    if r_xyz.shape[1] == 1:
        return r_xyz.flatten(), v_xyz.flatten()
    return r_xyz, v_xyz


def propagate(a, e, i, Omega, omega, M0, epoch_jd, target_jd, mu=MU_SUN):
    """Propagate orbital elements from epoch_jd to target_jd (two-body Kepler)."""
    n = np.sqrt(mu / a ** 3)  # mean motion, rad/day
    dt = target_jd - epoch_jd
    M = (M0 + n * dt) % (2 * np.pi)
    return elements_to_cartesian(a, e, i, Omega, omega, M, mu)
