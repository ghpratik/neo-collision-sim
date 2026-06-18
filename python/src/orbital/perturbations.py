"""
src/orbital/perturbations.py

STATUS: PARTIALLY TESTED.
  - The ANALYTIC J2 secular-rate formulas (analytic_j2_secular_rates) are
    standard, well-known closed-form equations (Vallado, "Fundamentals of
    Astrodynamics", widely published) -- verified by hand/dimensional
    analysis here, but not cross-checked against a live ephemeris in this
    environment.
  - The poliastro-based numerical perturbation propagation (propagate_with_
    perturbations) follows poliastro's documented cowell()/J2_perturbation
    API but COULD NOT BE EXECUTED (no network access to install poliastro
    in this sandbox). Test locally before trusting its output.
  - The Yarkovsky effect model is a simplified, illustrative parametrization
    (NOT a full thermophysical model) -- real Yarkovsky modeling requires
    detailed thermal/rotational/material properties per object. This is
    explicitly a teaching/sensitivity-analysis tool, not a precision
    correction. Treat its output qualitatively, not as a precise force.

These functions are meant to extend kepler_propagator.py's pure two-body
model for the project's "why does our simplified model disagree with JPL's
full-perturbation value" discussion (see notebooks/04_monte_carlo_simulation
and the existing Apophis simulation write-up).
"""
import numpy as np

EARTH_J2 = 1.08263e-3        # Earth's J2 oblateness coefficient (dimensionless)
EARTH_RADIUS_KM = 6378.137    # equatorial radius, km
SUN_RADIUS_AU = 0.00465047    # solar radius in AU (for SRP shadow checks)
AU_KM = 1.495978707e8


def analytic_j2_secular_rates(a_km: float, e: float, i_rad: float, mu_km3_s2: float, j2: float = EARTH_J2,
                                 body_radius_km: float = EARTH_RADIUS_KM) -> dict:
    """
    Standard closed-form J2 secular precession rates (rad/s) for the
    longitude of ascending node (RAAN) and argument of perigee, valid for
    a body orbiting an oblate primary (e.g. a satellite around Earth).

    NOTE: this is the right tool for EARTH-ORBITING objects (e.g. modeling
    a satellite's nodal precession). For ASTEROID heliocentric orbits, the
    SUN's J2 is negligible (~2.2e-7, ~5000x smaller relative effect than
    Earth's J2 on a LEO satellite) -- J2 effects matter far more for the
    "satellite orbital decay" style project than for NEO heliocentric
    dynamics. Included here for completeness / if this project is extended
    to Earth-orbit objects (e.g. modeling debris alongside NEOs).

    Returns
    -------
    dict with 'raan_dot_rad_s' and 'argp_dot_rad_s' (secular precession rates).
    """
    n = np.sqrt(mu_km3_s2 / a_km ** 3)  # mean motion, rad/s
    p = a_km * (1 - e ** 2)              # semi-latus rectum, km

    raan_dot = -1.5 * n * j2 * (body_radius_km / p) ** 2 * np.cos(i_rad)
    argp_dot = 0.75 * n * j2 * (body_radius_km / p) ** 2 * (5 * np.cos(i_rad) ** 2 - 1)

    return {"raan_dot_rad_s": raan_dot, "argp_dot_rad_s": argp_dot,
            "raan_dot_deg_per_day": np.degrees(raan_dot) * 86400,
            "argp_dot_deg_per_day": np.degrees(argp_dot) * 86400}


def solar_radiation_pressure_accel(area_to_mass_m2_kg: float, distance_au: float,
                                     reflectivity: float = 1.3, in_shadow: bool = False) -> float:
    """
    Magnitude of solar radiation pressure acceleration on a small body,
    in AU/day^2 (for direct use alongside kepler_propagator.py's units).

    Parameters
    ----------
    area_to_mass_m2_kg : cross-sectional area / mass ratio (m^2/kg) -- the
        key unknown for any real asteroid; larger for smaller/lighter
        objects (more susceptible to SRP), smaller for large dense bodies.
    distance_au : heliocentric distance, AU.
    reflectivity : dimensionless reflectivity coefficient (Cr), typically
        1.0 (perfect absorber) to ~2.0 (perfect reflector); 1.3 is a common
        illustrative default for a "typical" asteroid surface.
    in_shadow : if True, returns 0 (simplified eclipse model -- a real
        model would taper smoothly through penumbra, not switch sharply).

    Returns
    -------
    float : acceleration magnitude, AU/day^2 (direction is radially outward
    from the Sun -- caller must apply this along the Sun-to-body unit vector).
    """
    if in_shadow:
        return 0.0
    SOLAR_CONSTANT_W_M2 = 1361.0  # at 1 AU
    C_LIGHT_M_S = 2.998e8

    flux_at_distance = SOLAR_CONSTANT_W_M2 / distance_au ** 2
    accel_m_s2 = reflectivity * flux_at_distance * area_to_mass_m2_kg / C_LIGHT_M_S

    AU_M = AU_KM * 1000
    SEC_PER_DAY = 86400
    accel_au_day2 = accel_m_s2 * (SEC_PER_DAY ** 2) / AU_M
    return accel_au_day2


def yarkovsky_drift_simplified(diameter_m: float, albedo: float, rotation_period_hr: float,
                                  obliquity_deg: float, a_au: float) -> float:
    """
    SIMPLIFIED, ILLUSTRATIVE Yarkovsky semi-major-axis drift rate
    (da/dt, in AU per million years).

    This is a rough parametrization for teaching/sensitivity-analysis
    purposes ONLY -- it captures the correct qualitative dependencies
    (drift scales roughly as 1/diameter; prograde rotators [obliquity<90deg]
    drift outward, retrograde [obliquity>90deg] drift inward) but is NOT a
    substitute for a real thermophysical model (which requires thermal
    inertia, conductivity, and detailed shape/spin-state data that aren't
    available for most catalog objects). Real Yarkovsky drift rates for
    well-studied objects like Apophis or Bennu (measured directly via radar
    astrometry) should be used instead whenever available, for any
    analysis where the result matters.

    Returns
    -------
    float : da/dt in AU/Myr, signed (positive = outward drift, prograde-like).
    """
    direction = 1.0 if obliquity_deg < 90 else -1.0
    # illustrative scaling: smaller objects drift faster; closer to the Sun
    # (more insolation) drift faster; this is NOT a derived physical formula,
    # it is a deliberately simple proportionality for illustration.
    magnitude = 2.0e-4 * (1.0 / max(diameter_m, 1.0)) * (1.0 / a_au ** 2) * (1 - albedo)
    return direction * magnitude


def propagate_with_perturbations(a_au, e, i_deg, raan_deg, argp_deg, nu_deg, epoch_jd,
                                    target_jd, include_j2=False, include_srp=False,
                                    area_to_mass_m2_kg=1e-3):
    """
    STATUS: NOT EXECUTED HERE (requires poliastro/hapsira -- see
    propagator.py). Numerically integrates the orbit including selected
    perturbation forces using poliastro's Cowell propagator.

    Test locally:
        pip install poliastro   # or: pip install hapsira
    then run this function and compare against kepler_propagator.propagate()
    (the pure two-body case) to see the perturbation's effect size.
    """
    try:
        from astropy import units as u
        from astropy.time import Time
        from poliastro.bodies import Sun
        from poliastro.twobody import Orbit
        from poliastro.core.perturbations import J2_perturbation, radiation_pressure
        from poliastro.twobody.propagation import CowellPropagator
    except ImportError:
        raise ImportError(
            "This function requires poliastro (or hapsira) for numerical "
            "perturbation propagation. Install with: pip install poliastro"
        )

    epoch = Time(epoch_jd, format="jd", scale="tdb")
    orb = Orbit.from_classical(
        Sun, a_au * u.AU, e * u.one, i_deg * u.deg,
        raan_deg * u.deg, argp_deg * u.deg, nu_deg * u.deg, epoch=epoch,
    )

    def accel(t0, state, k):
        total = np.zeros(3)
        if include_j2:
            total = total + J2_perturbation(t0, state, k, J2=EARTH_J2, R=EARTH_RADIUS_KM)
        # SRP and other forces would be added here similarly using
        # poliastro.core.perturbations helpers, or a custom function
        # following the same (t0, state, k) -> accel[3] signature.
        return total

    target_epoch = Time(target_jd, format="jd", scale="tdb")
    dt = (target_epoch - epoch).to(u.day)
    propagated = orb.propagate(dt, method=CowellPropagator(f=accel))
    return propagated


if __name__ == "__main__":
    print("J2 secular rates for a LEO-like orbit (illustrative test):")
    rates = analytic_j2_secular_rates(a_km=7000, e=0.001, i_rad=np.radians(51.6),
                                        mu_km3_s2=398600.4418)
    print(f"  RAAN drift: {rates['raan_dot_deg_per_day']:.4f} deg/day")
    print(f"  Argp drift: {rates['argp_dot_deg_per_day']:.4f} deg/day")

    print("\nSRP acceleration for a small (1 m^2/kg) object at 1 AU:")
    a_srp = solar_radiation_pressure_accel(area_to_mass_m2_kg=1.0, distance_au=1.0)
    print(f"  {a_srp:.3e} AU/day^2")

    print("\nIllustrative Yarkovsky drift for a 300m, prograde-rotating object at 1 AU:")
    drift = yarkovsky_drift_simplified(diameter_m=300, albedo=0.15, rotation_period_hr=10,
                                          obliquity_deg=30, a_au=1.0)
    print(f"  {drift:.3e} AU/Myr (NOTE: illustrative model, not a precision estimate)")
