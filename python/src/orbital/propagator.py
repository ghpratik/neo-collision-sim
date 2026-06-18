"""
src/orbital/propagator.py

STATUS: NOT EXECUTED IN THIS ENVIRONMENT -- poliastro could not be
installed here (no network access in this sandbox). This module is
written against poliastro's documented public API (poliastro >= 0.17 /
the newer 'poliastro' successor 'hapsira' package -- poliastro itself was
archived/unmaintained as of late 2023; if 'import poliastro' fails on your
machine, install 'hapsira' instead, which is a maintained fork with a
near-identical API, and check its docs for any renamed classes/imports).

TEST LOCALLY BEFORE USE: run the __main__ block at the bottom against a
known object (Apophis) and compare its output to the validated, manually-
implemented propagator in kepler_propagator.py (this project's tested
two-body solver) -- they should agree closely for an unperturbed two-body
case, since poliastro's `propagate()` without perturbation forces is also
solving the same underlying Kepler equation, just through a different
(well-tested, widely-used) library implementation.

WHY USE POLIASTRO AT ALL, GIVEN WE HAVE A VALIDATED PROPAGATOR ALREADY:
  - kepler_propagator.py (this project's own code) is two-body only.
  - poliastro provides ready-made perturbation force models (J2, solar
    radiation pressure, third-body) that would otherwise need to be
    hand-derived -- see perturbations.py, which builds on this module.
  - poliastro also provides Lambert-problem solvers, orbit plotting, and
    unit-safe (astropy.units) calculations, useful if this project grows.
"""
import numpy as np

try:
    from astropy import units as u
    from astropy.time import Time
    from poliastro.bodies import Sun, Earth
    from poliastro.twobody import Orbit
    POLIASTRO_AVAILABLE = True
except ImportError:
    try:
        # hapsira is the maintained fork of poliastro (same API surface
        # for the classes used here, as of hapsira's 2024 releases)
        from astropy import units as u
        from astropy.time import Time
        from hapsira.bodies import Sun, Earth
        from hapsira.twobody import Orbit
        POLIASTRO_AVAILABLE = True
    except ImportError:
        POLIASTRO_AVAILABLE = False


def orbit_from_elements(a_au: float, e: float, i_deg: float, raan_deg: float,
                          argp_deg: float, nu_deg: float, epoch_jd: float):
    """
    Build a poliastro Orbit object from classical orbital elements.

    Parameters
    ----------
    a_au : semi-major axis, AU
    e : eccentricity
    i_deg, raan_deg, argp_deg, nu_deg : inclination, RAAN, argument of
        perihelion, true anomaly -- all in DEGREES (poliastro/astropy
        convention differs from this project's internal radians convention
        used in kepler_propagator.py -- be careful when porting values
        between the two modules).
    epoch_jd : epoch as a Julian Date.

    Returns
    -------
    poliastro.twobody.Orbit
    """
    if not POLIASTRO_AVAILABLE:
        raise ImportError(
            "poliastro (or hapsira) is not installed. Run: pip install poliastro "
            "(or, if that fails due to poliastro being archived: pip install hapsira)"
        )

    epoch = Time(epoch_jd, format="jd", scale="tdb")
    orb = Orbit.from_classical(
        Sun,
        a_au * u.AU,
        e * u.one,
        i_deg * u.deg,
        raan_deg * u.deg,
        argp_deg * u.deg,
        nu_deg * u.deg,
        epoch=epoch,
    )
    return orb


def propagate_to(orbit, target_jd: float):
    """Propagate a poliastro Orbit forward/backward to a target epoch (JD)."""
    if not POLIASTRO_AVAILABLE:
        raise ImportError("poliastro (or hapsira) is not installed.")
    target_epoch = Time(target_jd, format="jd", scale="tdb")
    dt = (target_epoch - orbit.epoch).to(u.day)
    return orbit.propagate(dt)


def get_state_vector(orbit):
    """Return (r, v) as numpy arrays in AU and AU/day, for compatibility
    with this project's kepler_propagator.py conventions."""
    r = orbit.r.to(u.AU).value
    v = orbit.v.to(u.AU / u.day).value
    return np.array(r), np.array(v)


if __name__ == "__main__":
    if not POLIASTRO_AVAILABLE:
        print("poliastro/hapsira not installed -- install it to run this test:")
        print("  pip install poliastro    (or)    pip install hapsira")
    else:
        print("Testing poliastro propagation for Apophis-like elements...")
        # Apophis osculating elements (validated values, from this project's
        # kepler_propagator.py testing against real JPL Horizons data)
        orb = orbit_from_elements(
            a_au=0.922507, e=0.191522, i_deg=3.3367,
            raan_deg=204.0390, argp_deg=126.6520, nu_deg=151.0,  # nu approx from M0 for this quick test
            epoch_jd=2459215.5,
        )
        print(orb)
        propagated = propagate_to(orb, 2459215.5 + 365.25)
        r, v = get_state_vector(propagated)
        print(f"Position after 1 year (AU): {r}")
        print(f"Velocity after 1 year (AU/day): {v}")
        print("\nCompare this r,v to kepler_propagator.propagate() with the same")
        print("inputs -- they should match closely for this unperturbed case.")
